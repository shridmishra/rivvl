import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  enrichAllCars,
  buildEnrichmentContext,
} from "@/lib/vehicle-enrichment";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/ai-prompts";
import { saveReportWithSupabase } from "@/lib/report-storage";
import { createClient } from "@/lib/supabase/server";
import { rateLimitResponse } from "@/lib/rate-limit";
import { getMaxCarsForPlan } from "@/lib/plan-config";
import { PLAN_LIMITS } from "@/lib/stripe/planLimits";
import { getEffectivePlanTier } from "@/lib/supabase/types";
import type {
  AnalyzeRequest,
  ScrapedCar,
  ManualCarEntry,
  AIAnalysisReport,
} from "@/types";
import { logError, logCrash } from "@/lib/logger";

export const maxDuration = 300;

const AI_TIMEOUT = 120_000;
const AI_MAX_ATTEMPTS = 3;
const AI_RETRY_BASE_DELAY_MS = 2_000;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AnalyzeRequest & { stripeSessionId?: string };
    const { urls, manualEntries, preferences = { priorities: [], budget: "", usage: "", keepDuration: "" }, stripeSessionId } = body;

    // Require authentication
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to generate a report.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const rlResponse = user.id === "679e0779-ad41-43ac-82cc-bee20f97365a" ? null : rateLimitResponse(
      { name: "analyze", maxRequests: 5 },
      req,
      user.id
    );
    if (rlResponse) return rlResponse;

    const userId = user.id;

    // planFromStripe: when the user just returned from Stripe checkout
    let planFromStripe: string | null = null;

    if (stripeSessionId) {
      try {
        const { getStripeServer } = await import("@/lib/stripe/server");
        const stripe = getStripeServer();
        const session = await stripe.checkout.sessions.retrieve(stripeSessionId);

        if (
          session.metadata?.userId === user.id &&
          session.payment_status === "paid" &&
          session.metadata?.role
        ) {
          const verifiedRole = session.metadata.role;
          planFromStripe = verifiedRole;

          const { createServiceClient } = await import("@/lib/supabase/server");
          const adminForPayment = createServiceClient();

          const planConfig = PLAN_LIMITS[verifiedRole];
          if (planConfig && verifiedRole.startsWith("car_")) {
            // Idempotent check via stripe_events
            const { data: existing } = await adminForPayment
              .from("stripe_events")
              .select("event_id")
              .eq("event_id", `session_${session.id}`)
              .maybeSingle();

            if (!existing) {
              await adminForPayment
                .from("profiles")
                .update({
                  vehicle_plan_tier: verifiedRole,
                  vehicle_reports_used: 0,
                  vehicle_max_reports: planConfig.maxReports,
                })
                .eq("id", user.id);

              await adminForPayment.from("stripe_events").insert({
                event_id: `session_${session.id}`,
                processed_at: new Date().toISOString(),
              }).then(({ error }) => {
                if (error) { /* duplicate — already processed */ }
              });
            }
          }
        }
      } catch (err) {
        console.error("Stripe session verification in analyze failed:", err);
        logError("analyze/stripe-verify", err, { route: "/api/analyze", vertical: "vehicles" });
      }
    }

    // Get the user's vehicle plan from the database
    const { data: profile } = await supabase
      .from("profiles")
      .select("vehicle_plan_tier, vehicle_reports_used, vehicle_max_reports")
      .eq("id", user.id)
      .single();

    const rawPlan = profile?.vehicle_plan_tier ?? "free";
    const planFromDB = getEffectivePlanTier(
      rawPlan,
      profile?.vehicle_reports_used ?? 0,
      profile?.vehicle_max_reports ?? 0,
    );

    // Stripe-verified plan is authoritative when available
    let plan = planFromStripe ?? planFromDB;

    // ADMIN OVERRIDE
    const isAdmin = user.email === "admin@rivvl.com";
    if (isAdmin) {
      plan = "car_pro10";
      console.log(`[analyze] Admin override active for ${user.email}. Forced plan: ${plan}`);
    }

    // Check usage limits — free plan always allowed (generates basic report)
    if (plan !== "free" && !isAdmin) {
      const used = profile?.vehicle_reports_used ?? 0;
      const max = profile?.vehicle_max_reports ?? 0;
      if (max > 0 && used >= max && !planFromStripe) {
        return NextResponse.json(
          {
            error: "You have reached your report limit. Please upgrade your plan for more comparisons.",
            code: "LIMIT_REACHED",
          },
          { status: 403 }
        );
      }
    }

    // Prevent concurrent report generation
    const { createServiceClient } = await import("@/lib/supabase/server");
    const adminClient = createServiceClient();
    const { data: guardProfile } = await adminClient
      .from("profiles")
      .select("generating_report")
      .eq("id", user.id)
      .single();

    if (guardProfile?.generating_report) {
      return NextResponse.json(
        {
          error: "A report is already being generated. Please wait for it to complete.",
          code: "GENERATION_IN_PROGRESS",
        },
        { status: 429 }
      );
    }

    await adminClient
      .from("profiles")
      .update({ generating_report: true })
      .eq("id", user.id);

    try {
      if ((!urls || urls.length === 0) && (!manualEntries || manualEntries.length === 0)) {
        return NextResponse.json(
          { error: "Please provide at least one car URL or manual entry" },
          { status: 400 }
        );
      }

      // Enforce car count limits from PLAN_LIMITS
      const totalCars =
        ((urls || []).filter((u) => u && u.trim() !== "")).length +
        ((manualEntries || []).filter((e) => e.year && e.make && e.model)).length;

      const maxCars = getMaxCarsForPlan(plan);

      if (totalCars > maxCars) {
        return NextResponse.json(
          {
            error: `Your current plan supports up to ${maxCars} vehicles. Upgrade to compare more.`,
            code: "CAR_LIMIT_EXCEEDED",
          },
          { status: 400 }
        );
      }

      // Step 1: Scrape URLs
      let scrapedCars: ScrapedCar[] = [];
      const validUrls = (urls || []).filter((u) => u && u.trim() !== "");
      if (validUrls.length > 0) {
        try {
          const scrapeUrl = new URL("/api/scrape", req.url);
          const scrapeRes = await fetch(scrapeUrl.toString(), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-internal-token": process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
            },
            body: JSON.stringify({ urls: validUrls }),
          });

          if (scrapeRes.ok) {
            const scrapeData = await scrapeRes.json();
            scrapedCars = scrapeData.cars || [];
          }
        } catch (err) {
          console.error("Scrape call failed:", err);
          logError("analyze/scrape", err, { route: "/api/analyze", vertical: "vehicles" });
        }
      }

      // Step 2: Convert manual entries
      if (manualEntries && manualEntries.length > 0) {
        for (const entry of manualEntries) {
          if (isManualEntryValid(entry)) {
            scrapedCars.push(manualEntryToScrapedCar(entry));
          }
        }
      }

      if (scrapedCars.length === 0) {
        return NextResponse.json(
          { error: "Could not get data for any cars. Please check the URLs or enter details manually." },
          { status: 400 }
        );
      }

      // Step 3: Enrich
      const enrichedCars = await enrichAllCars(scrapedCars);

      // Step 3a: Check for critically incomplete cars
      const criticallyIncompleteCars = enrichedCars.filter(
        (car) => car.dataQuality?.isCriticallyIncomplete === true
      );
      if (criticallyIncompleteCars.length > 0) {
        const carLabels = criticallyIncompleteCars
          .map((c) => c.listingTitle || `${c.year ?? "?"} ${c.make ?? "?"} ${c.model ?? "?"}`)
          .join(", ");
        return NextResponse.json(
          {
            error: `We couldn't retrieve enough data from the listing for: ${carLabels}. Please try a different URL for this vehicle, or enter the vehicle details manually. If you already paid, your credit has been preserved. You can retry with better data.`,
            code: "INSUFFICIENT_DATA",
            affectedUrls: criticallyIncompleteCars.map((c) => c.url),
          },
          { status: 422 }
        );
      }

      // Step 4: Build enrichment context
      const enrichmentContext = buildEnrichmentContext(enrichedCars);
      
      if (process.env.NODE_ENV === "development") {
        console.log(`[analyze] Enrichment Context Length: ${enrichmentContext.length} characters`);
        if (enrichedCars.some(c => c.dataQuality?.isManualEntry)) {
          console.log("[analyze] Manual Entry Detected. Context (first 1000ch):\n", enrichmentContext.slice(0, 1000));
        }
      }

      // Step 5: AI analysis
      let analysis: AIAnalysisReport;
      try {
        analysis = await callClaudeForAnalysis(
          enrichedCars,
          enrichmentContext,
          preferences,
          plan
        );
      } catch (err) {
        console.error("AI analysis failed:", err);
        logError("analyze/ai-analysis", err, { route: "/api/analyze", vertical: "vehicles" });
        
        const errorMessage = err instanceof Error ? err.message : String(err);
        
        return NextResponse.json(
          {
            error:
              errorMessage.includes("timed out")
                ? "AI analysis timed out. Please try again, the servers may be busy."
                : `AI analysis failed: ${errorMessage}`,
            code: "AI_FAILURE"
          },
          { status: 500 }
        );
      }

      // Step 5a: Override reportType
      const planConfig = PLAN_LIMITS[plan];
      const correctReportType = planConfig?.fullReport ? "pro" : "free";
      if (analysis.reportType !== correctReportType) {
        analysis.reportType = correctReportType as "free" | "single" | "pro";
      }

      // Step 5b: For free users, null out premium sections in the API response
      if (!planConfig?.fullReport && !isAdmin) {
        const reportObj = analysis as unknown as Record<string, unknown>;
        reportObj.finalVerdict = null;
        // executiveSummary.recommendation acts as "Our Pick" — null it for free
        const execSummary = reportObj.executiveSummary as Record<string, unknown> | undefined;
        if (execSummary) {
          execSummary.recommendation = null;
          execSummary.quickVerdict = null;
        }
      }

      // Step 6: Save report
      const reportId = await saveReportWithSupabase({
        cars: enrichedCars,
        analysis,
        preferences,
        plan,
        enrichmentContext,
        userId,
      });

      return NextResponse.json({
        cars: enrichedCars,
        enrichmentContext,
        reportId,
        analysis,
      });
    } finally {
      await adminClient
        .from("profiles")
        .update({ generating_report: false })
        .eq("id", user.id);
    }
  } catch (err) {
    console.error("Analyze API error:", err);
    logCrash("analyze/top-level", err instanceof Error ? err : new Error(String(err)), { route: "/api/analyze", vertical: "vehicles" });
    return NextResponse.json(
      { error: "Internal server error during analysis" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                        JSON REPAIR UTILITIES                          */
/* ═══════════════════════════════════════════════════════════════════════ */

function extractJSON(raw: string): string {
  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
  text = text.trim();
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }
  return text;
}

function repairJSON(text: string): string {
  let result = text;
  result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  let inString = false;
  let escaped = false;
  const chars: string[] = [];

  for (let i = 0; i < result.length; i++) {
    const ch = result[i];
    if (escaped) { chars.push(ch); escaped = false; continue; }
    if (ch === "\\") { chars.push(ch); escaped = true; continue; }
    if (ch === '"') { inString = !inString; chars.push(ch); continue; }
    if (inString) {
      if (ch === "\n") { chars.push(" "); continue; }
      if (ch === "\r") { continue; }
      if (ch === "\t") { chars.push(" "); continue; }
    }
    chars.push(ch);
  }

  result = chars.join("");
  result = result.replace(/,(\s*[}\]])/g, "$1");
  return result;
}

function safeParseJSON(rawResponse: string): unknown {
  const extracted = extractJSON(rawResponse);
  try { return JSON.parse(extracted); } catch { /* layer 2 */ }

  const repaired = repairJSON(extracted);
  try { return JSON.parse(repaired); } catch { /* layer 3 */ }

  let aggressive = repaired;
  aggressive = aggressive.replace(/[\uFEFF\u200B-\u200D\uFFFE\uFFFF]/g, "");
  aggressive = aggressive.replace(/,\s*,/g, ",");
  aggressive = aggressive.replace(/}\s*{/g, "},{");
  aggressive = aggressive.replace(/]\s*\[/g, "],[");
  aggressive = aggressive.replace(/,(\s*[}\]])/g, "$1");

  try { return JSON.parse(aggressive); } catch (err) {
    const preview = rawResponse.slice(0, 500);
    throw new Error(
      `JSON parse failed after all repair attempts. Raw response preview (first 500 chars): ${preview}\n\nFinal parse error: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                     CLAUDE AI ANALYSIS CALL                            */
/* ═══════════════════════════════════════════════════════════════════════ */

async function callClaudeForAnalysis(
  cars: import("@/types").EnrichedCar[],
  enrichmentContext: string,
  preferences: import("@/types").UserPreferences,
  plan: string
): Promise<AIAnalysisReport> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

  const client = new Anthropic({ apiKey });
  const userPrompt = buildUserPrompt(cars, enrichmentContext, preferences, plan);

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= AI_MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_TIMEOUT);

    try {
      const message = await client.messages.create(
        {
          model: "claude-sonnet-4-20250514",
          max_tokens: 8192,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
        },
        { signal: controller.signal }
      );

      const textBlock = message.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") throw new Error("No text response from AI");

      const rawText = textBlock.text;

      let parsed: AIAnalysisReport;
      try {
        parsed = safeParseJSON(rawText) as AIAnalysisReport;
      } catch {
        console.error("AI JSON parse failed. Raw response (first 500 chars):", rawText.slice(0, 500));

        const repairMessage = await client.messages.create(
          {
            model: "claude-sonnet-4-20250514",
            max_tokens: 8192,
            system: "You are a JSON repair tool. The user will give you malformed JSON. Return ONLY the repaired, valid JSON. Start with { and end with }. No explanation, no markdown, no code fences.",
            messages: [{ role: "user", content: `Fix this malformed JSON and return only valid JSON:\n\n${rawText}` }],
          },
          { signal: controller.signal }
        );

        const repairBlock = repairMessage.content.find((b) => b.type === "text");
        if (!repairBlock || repairBlock.type !== "text") throw new Error("JSON repair call returned no text");

        parsed = safeParseJSON(repairBlock.text) as AIAnalysisReport;
      }

      // Validate sections
      const ALL_SECTIONS = [
        "executiveSummary", "vehicleSpecs", "priceAnalysis", "costOfOwnership",
        "depreciation", "safety", "fuelEconomy", "reliability", "features",
        "userPriorityMatch", "finalVerdict",
      ] as const;

      const report = parsed as unknown as Record<string, unknown>;
      const present: string[] = [];
      const missing: string[] = [];

      for (const section of ALL_SECTIONS) {
        if (report[section] && typeof report[section] === "object") {
          present.push(section);
        } else {
          missing.push(section);
        }
      }

      if (missing.length > 0) {
        console.warn(`AI response missing ${missing.length}/11 sections: ${missing.join(", ")}`);
      }

      if (present.length < 6) {
        throw new Error(`AI response too incomplete: only ${present.length}/11 sections present`);
      }

      // Fill missing sections with placeholders
      if (!report.executiveSummary) {
        report.executiveSummary = { overview: "Analysis unavailable for this section.", recommendation: "Analysis unavailable.", confidenceScore: 0, quickVerdict: "Analysis unavailable." };
      }
      if (!report.vehicleSpecs) report.vehicleSpecs = { comparisonTable: [] };
      if (!report.priceAnalysis) report.priceAnalysis = { cars: [], summary: "Analysis unavailable." };
      if (!report.costOfOwnership) report.costOfOwnership = { threeYear: { cars: [] }, fiveYear: { cars: [] }, summary: "Analysis unavailable." };
      if (!report.depreciation) report.depreciation = { cars: [], summary: "Analysis unavailable." };
      if (!report.safety) report.safety = { cars: [], summary: "Analysis unavailable." };
      if (!report.fuelEconomy) report.fuelEconomy = { cars: [], summary: "Analysis unavailable." };
      if (!report.reliability) report.reliability = { cars: [], summary: "Analysis unavailable." };
      if (!report.features) report.features = { comparisonTable: [], summary: "Analysis unavailable." };
      if (!report.userPriorityMatch) report.userPriorityMatch = { cars: [] };
      if (!report.finalVerdict) report.finalVerdict = { winner: "Unable to determine", scores: [], bestForScenarios: [], finalStatement: "Analysis unavailable." };

      // Post-processing: normalize CO2
      const feSection = report.fuelEconomy as { cars?: { name?: string; co2Emissions?: number }[] } | undefined;
      const specsSection = report.vehicleSpecs as { comparisonTable?: { category?: string; values?: string[] }[] } | undefined;
      if (feSection?.cars && specsSection?.comparisonTable) {
        const co2Row = specsSection.comparisonTable.find((r) => r.category && /co2|carbon|emissions/i.test(r.category));
        for (let ci = 0; ci < feSection.cars.length; ci++) {
          const feCO2 = feSection.cars[ci].co2Emissions;
          const specCO2 = co2Row?.values?.[ci];
          const specCO2Num = specCO2 ? parseFloat(specCO2.replace(/[^0-9.]/g, "")) : NaN;
          if (feCO2 && feCO2 > 0 && (!specCO2Num || isNaN(specCO2Num) || specCO2Num <= 0)) {
            if (co2Row?.values) co2Row.values[ci] = `${feCO2} g/mi`;
          } else if (specCO2Num > 0 && (!feCO2 || feCO2 <= 0)) {
            feSection.cars[ci].co2Emissions = specCO2Num;
          }
        }
      }

      return report as unknown as AIAnalysisReport;
    } catch (err) {
      clearTimeout(timer);
      const isTimeout = err instanceof Error && err.name === "AbortError";
      const isTransient = isTimeout || (err instanceof Error && /overloaded|rate.?limit|529|503|502|500|ECONNRESET|ETIMEDOUT/i.test(err.message));

      if (isTransient) {
        lastError = isTimeout ? new Error(`AI analysis timed out after ${AI_TIMEOUT / 1000} seconds`) : err instanceof Error ? err : new Error(String(err));
        if (attempt < AI_MAX_ATTEMPTS) {
          const delayMs = AI_RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
          console.log(`[analyze] AI attempt ${attempt}/${AI_MAX_ATTEMPTS} failed — retrying in ${delayMs / 1000}s...`);
          await new Promise<void>((r) => setTimeout(r, delayMs));
          continue;
        }
        throw lastError;
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError || new Error("AI analysis failed after all attempts");
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                          HELPERS                                       */
/* ═══════════════════════════════════════════════════════════════════════ */

function isManualEntryValid(entry: ManualCarEntry): boolean {
  return !!(entry.year && entry.make && entry.model);
}

function manualEntryToScrapedCar(entry: ManualCarEntry): ScrapedCar {
  return {
    url: `manual://${entry.year}-${entry.make}-${entry.model}`,
    listingTitle: `${entry.year} ${entry.make} ${entry.model}${entry.trim ? ` ${entry.trim}` : ""}`,
    price: entry.price ? parseFloat(entry.price.replace(/[^0-9.]/g, "")) || null : null,
    mileage: entry.mileage ? parseInt(entry.mileage.replace(/[^0-9]/g, ""), 10) || null : null,
    year: parseInt(entry.year, 10) || null,
    make: entry.make || null,
    model: entry.model || null,
    trim: entry.trim || null,
    vin: entry.vin || null,
    exteriorColor: null,
    interiorColor: null,
    engine: null,
    transmission: null,
    driveType: null,
    fuelType: null,
    bodyStyle: null,
    features: [],
    dealerName: null,
    dealerLocation: null,
    photoCount: null,
    photoUrl: null,
    rawMarkdown: null,
    scrapedAt: new Date().toISOString(),
    error: null,
  };
}
