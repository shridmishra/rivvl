import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStripeServer } from "@/lib/stripe/server";
import type { EnrichedCar, UserPreferences } from "@/types";
import { getUnlockedSections } from "@/lib/section-access";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Missing report ID" }, { status: 400 });
  }

  // Require authentication
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to view reports.", code: "AUTH_REQUIRED" },
      { status: 401 }
    );
  }

  // Fetch report using the user's own client so RLS enforces ownership
  const { data: reportRow } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .single();

  if (!reportRow?.report_data) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const rd = reportRow.report_data as Record<string, unknown>;
  const report: import("@/types").StoredReport = {
    id: reportRow.id,
    createdAt: reportRow.created_at,
    cars: rd.cars as import("@/types").EnrichedCar[],
    analysis: rd.analysis as import("@/types").AIAnalysisReport,
    preferences: rd.preferences as import("@/types").UserPreferences,
    plan: rd.plan as string,
    enrichmentContext: rd.enrichmentContext as string,
    customName: reportRow.custom_name ?? null,
  };

  // ADMIN OVERRIDE
  const isAdmin = user.email === "admin@rivvl.com";
  if (isAdmin && report.analysis) {
    report.analysis.reportType = "pro";
  }

  // Server-side section gating: strip locked section content for free reports
  if (report.analysis?.reportType === "free") {
    const a = report.analysis;
    const unlocked = getUnlockedSections("free");

    if (!unlocked.includes("executiveSummary")) {
      a.executiveSummary = { overview: "", recommendation: "", quickVerdict: "" };
    }
    if (!unlocked.includes("priceAnalysis")) a.priceAnalysis = undefined;
    if (!unlocked.includes("costOfOwnership")) a.costOfOwnership = undefined;
    if (!unlocked.includes("depreciation")) a.depreciation = undefined;
    if (!unlocked.includes("fuelEconomy")) a.fuelEconomy = undefined;
    if (!unlocked.includes("reliability")) a.reliability = undefined;
    if (!unlocked.includes("features")) a.features = undefined;
    if (!unlocked.includes("userPriorityMatch")) a.userPriorityMatch = undefined;
    if (!unlocked.includes("finalVerdict")) {
      a.finalVerdict = { winner: "", scores: [], bestForScenarios: [], finalStatement: "" };
    }
  }

  return NextResponse.json(report);
}

/**
 * POST /api/report/[id]
 * Called by the report page after a successful Stripe payment redirect.
 * Verifies the payment via Stripe checkout session, then unlocks the report
 * directly — does NOT depend on the webhook having fired yet.
 *
 * Body: { sessionId: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const reportId = params.id;
  if (!reportId) {
    return NextResponse.json({ error: "Missing report ID" }, { status: 400 });
  }

  // Require authentication
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { sessionId } = body as { sessionId?: string };

  const admin = createServiceClient();

  // Strategy 1: If a Stripe session ID is provided, verify it directly
  if (sessionId) {
    try {
      const stripe = getStripeServer();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      // Verify this session belongs to this user and this report
      if (session.metadata?.userId !== user.id) {
        return NextResponse.json({ error: "Session mismatch" }, { status: 403 });
      }
      if (session.metadata?.reportId !== reportId) {
        return NextResponse.json({ error: "Report mismatch" }, { status: 403 });
      }
      if (session.payment_status !== "paid") {
        return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
      }

      const planTier = session.metadata?.role || session.metadata?.planTier || "single";
      await unlockReport(admin, reportId, user.id, planTier);

      return NextResponse.json({ unlocked: true, plan: planTier });
    } catch (err) {
      console.error("Failed to verify Stripe session:", err);
      // Fall through to strategy 2
    }
  }

  // Strategy 2: Check if the user has a recent successful payment for this report
  // by looking at their Stripe customer's checkout sessions
  try {
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (profile?.stripe_customer_id) {
      const stripe = getStripeServer();
      const sessions = await stripe.checkout.sessions.list({
        customer: profile.stripe_customer_id,
        limit: 10,
        status: "complete",
      });

      // Find a paid session for this report
      const matchingSession = sessions.data.find(
        (s) =>
          s.metadata?.reportId === reportId &&
          s.metadata?.userId === user.id &&
          s.payment_status === "paid"
      );

      if (matchingSession) {
        const planTier = matchingSession.metadata?.role || matchingSession.metadata?.planTier || "single";
        await unlockReport(admin, reportId, user.id, planTier);
        return NextResponse.json({ unlocked: true, plan: planTier });
      }
    }
  } catch (err) {
    console.error("Failed to check Stripe sessions:", err);
  }

  // Strategy 3: Check if the report is already unlocked (webhook may have already done it)
  try {
    const { data: reportRow } = await admin
      .from("reports")
      .select("report_data, plan_tier_at_generation")
      .eq("id", reportId)
      .eq("user_id", user.id)
      .single();

    if (reportRow?.report_data) {
      const rd = reportRow.report_data as Record<string, unknown>;
      const analysis = rd.analysis as Record<string, unknown> | undefined;
      if (analysis?.reportType && analysis.reportType !== "free") {
        // Already unlocked
        return NextResponse.json({
          unlocked: true,
          plan: reportRow.plan_tier_at_generation,
        });
      }
    }
  } catch {
    // ignore
  }

  return NextResponse.json(
    { error: "No valid payment found for this report", unlocked: false },
    { status: 404 }
  );
}

/**
 * Unlock a report: update report_data.plan, report_data.analysis.reportType,
 * plan_tier_at_generation, and sections_included in the database.
 */
async function unlockReport(
  admin: ReturnType<typeof createServiceClient>,
  reportId: string,
  userId: string,
  planTier: string
) {
  const { data: reportRow } = await admin
    .from("reports")
    .select("report_data, sections_included")
    .eq("id", reportId)
    .eq("user_id", userId)
    .single();

  if (!reportRow?.report_data) {
    throw new Error("Report not found");
  }

  const rd = reportRow.report_data as Record<string, unknown>;
  const analysis = rd.analysis as Record<string, unknown> | undefined;

  // Already unlocked — skip
  if (analysis?.reportType && analysis.reportType !== "free") {
    return;
  }

  const reportType = planTier === "pro" ? "pro" : "single";

  // Check if the report was generated with reduced free sections (only vehicleSpecs + safety).
  // If so, we need to re-analyze with the full prompt to generate all 11 sections.
  const existingSections = analysis
    ? Object.keys(analysis).filter((k) => k !== "reportType")
    : [];
  const needsReanalysis = existingSections.length <= 3; // free reports have ~2 sections + reportType

  if (needsReanalysis && rd.cars && rd.enrichmentContext) {
    try {
      const { SYSTEM_PROMPT, buildUserPrompt } = await import("@/lib/ai-prompts");
      const Anthropic = (await import("@anthropic-ai/sdk")).default;

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (apiKey) {
        const client = new Anthropic({ apiKey });
        const cars = rd.cars as EnrichedCar[];
        const preferences = (rd.preferences || { priorities: [], budget: "", usage: "", keepDuration: "" }) as UserPreferences;
        const enrichmentContext = rd.enrichmentContext as string;

        const userPrompt = buildUserPrompt(cars, enrichmentContext, preferences, planTier);

        const message = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8192,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
        });

        const textBlock = message.content.find((b) => b.type === "text");
        if (textBlock && textBlock.type === "text") {
          const parsed = JSON.parse(textBlock.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim());
          const fullAnalysis = { ...parsed, reportType };
          const allSections = Object.keys(fullAnalysis).filter((k) => k !== "reportType");

          const updatedReportData = {
            ...rd,
            plan: planTier,
            analysis: fullAnalysis,
          };

          await admin
            .from("reports")
            .update({
              report_data: updatedReportData,
              plan_tier_at_generation: planTier,
              sections_included: allSections,
            })
            .eq("id", reportId)
            .eq("user_id", userId);

          console.log(`Report ${reportId} re-analyzed and unlocked to ${planTier}`);
          return;
        }
      }
    } catch (err) {
      console.error(`Re-analysis failed for report ${reportId}, falling back to simple unlock:`, err);
    }
  }

  // Simple unlock: just change reportType and plan (works when all sections were already generated)
  const updatedReportData = {
    ...rd,
    plan: planTier,
    ...(analysis ? { analysis: { ...analysis, reportType } } : {}),
  };

  const allSections = analysis
    ? Object.keys(analysis).filter((k) => k !== "reportType")
    : reportRow.sections_included;

  await admin
    .from("reports")
    .update({
      report_data: updatedReportData,
      plan_tier_at_generation: planTier,
      sections_included: allSections,
    })
    .eq("id", reportId)
    .eq("user_id", userId);

  console.log(`Report ${reportId} unlocked to ${planTier} (via direct API)`);
}

/**
 * PATCH /api/report/[id]
 * Rename a report (set custom_name). Requires authentication + ownership.
 *
 * Body: { custom_name: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const reportId = params.id;
  if (!reportId) {
    return NextResponse.json({ error: "Missing report ID" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { custom_name } = body as { custom_name?: string };

  if (typeof custom_name !== "string") {
    return NextResponse.json(
      { error: "custom_name is required" },
      { status: 400 }
    );
  }

  if (custom_name.length > 200) {
    return NextResponse.json(
      { error: "Report name must be under 200 characters" },
      { status: 400 }
    );
  }

  const admin = createServiceClient();
  const trimmed = custom_name.trim();
  const nameValue = trimmed || null; // empty string → clear custom name

  const { error } = await admin
    .from("reports")
    .update({ custom_name: nameValue })
    .eq("id", reportId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to rename" }, { status: 500 });
  }

  return NextResponse.json({ success: true, custom_name: nameValue });
}
