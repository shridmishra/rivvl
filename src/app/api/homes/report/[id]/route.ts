import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStripeServer } from "@/lib/stripe/server";
import { recalculateSprintFeatures } from "@/lib/homes/reportUtils";
import { generateHomeComparison } from "@/lib/homes/comparisonEngine";

import { logWarn, logError } from "@/lib/logger";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Missing report ID" }, { status: 400 });
  }

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

  // Use service client to fetch the report (home_reports may not have RLS for user read)
  const admin = createServiceClient();
  const { data: reportRow } = await admin
    .from("home_reports")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!reportRow?.report_data) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  let rd = reportRow.report_data as Record<string, unknown>;
  const plan = reportRow.plan_tier_at_generation || "free";
  console.log('[REPORT-GET] id:', id, 'report.plan:', plan, 'report.isFullReport:', !!(rd as Record<string,unknown>).isFullReport);
  const isFree = plan === "free";

  // Auto-recalculate Sprint 1 features if a paid report is missing them (legacy reports only).
  // New reports pre-compute Sprint 1 at generation time for instant unlock.
  if (!isFree) {
    const reportObj = (rd.report ?? rd) as Record<string, unknown>;
    const missingSprintFields =
      !reportObj.floodInsurance &&
      !reportObj.insuranceEstimate &&
      !reportObj.closingCosts;

    if (missingSprintFields) {
      logWarn("home-report/recalc", `Legacy report ${id} missing Sprint 1 fields — recalculating`, { plan });
      const result = await recalculateSprintFeatures(id);
      if (result.success) {
        const { data: refreshed } = await admin
          .from("home_reports")
          .select("report_data")
          .eq("id", id)
          .single();
        if (refreshed?.report_data) {
          rd = refreshed.report_data as Record<string, unknown>;
        }
      }
    }
  }

  // If free tier, hide premium sections from the stored report data
  const report = rd.report as Record<string, unknown> | undefined;
  if (isFree && report) {
    report.ourPick = null;
    report.finalVerdict = null;
    report.isPremium = true;
    // Strip paid-only AI sections
    delete report.scoreAnalysis;
    delete report.neighborhoodIntelligence;
    delete report.neighborhoodIntelligenceStructured;
    delete report.schoolDistrictContext;
    delete report.schoolDistrictContextStructured;
    delete report.negotiationIntelligence;
    delete report.maintenanceAnalysis;
    delete report.investmentOutlook;
    delete report.investmentOutlookStructured;
    delete report.questionsToAskAgent;
    delete report.priceHistoryInsights;
    delete report.priceHistoryComparison;
    delete report.buyerProtectionChecklist;
    delete report.commuteAnalysis;
    delete report.investmentPerspective;
    delete report.comparableContext;
    delete report.detailedComparison;
    // Strip Sprint 1 paid sections
    delete report.closingCosts;
    delete report.insuranceEstimate;
    delete report.taxReassessment;
    delete report.hoaRisk;
    delete report.redFlags;
    delete report.loanPrograms;
    delete report.floodInsurance;
    // Limit pros/cons to 3 each for free
    const props = report.properties as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(props)) {
      for (const prop of props) {
        if (Array.isArray(prop.pros)) prop.pros = (prop.pros as string[]).slice(0, 3);
        if (Array.isArray(prop.cons)) prop.cons = (prop.cons as string[]).slice(0, 3);
      }
    }
  }

  return NextResponse.json({
    id: reportRow.id,
    report: report || rd,
    listings: rd.listings || [],
    plan,
    reportId: reportRow.id,
    createdAt: reportRow.created_at,
    ...(rd.paidData && !isFree ? { paidData: rd.paidData } : {}),
  });
}

/**
 * POST /api/homes/report/[id]
 * Called by the homes report page after a successful Stripe payment redirect.
 * Verifies the payment via Stripe, then unlocks the report.
 */
export async function POST(
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
  const { sessionId } = body as { sessionId?: string };

  const admin = createServiceClient();

  // Strategy 1: Verify Stripe session directly
  if (sessionId) {
    try {
      const stripe = getStripeServer();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.metadata?.userId !== user.id) {
        return NextResponse.json({ error: "Session mismatch" }, { status: 403 });
      }
      if (session.metadata?.reportId !== reportId) {
        return NextResponse.json({ error: "Report mismatch" }, { status: 403 });
      }
      if (session.payment_status !== "paid") {
        return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
      }

      const role = session.metadata?.role || "home_standard";
      const { error: updateErr } = await admin
        .from("home_reports")
        .update({ plan_tier_at_generation: role })
        .eq("id", reportId)
        .eq("user_id", user.id);

      if (updateErr) {
        console.error('[HOME-REPORT-POST] Failed to update plan_tier_at_generation:', updateErr);
      }

      // Also store isFullReport and unlockedAt in report_data
      const { data: currentRow } = await admin
        .from("home_reports")
        .select("report_data")
        .eq("id", reportId)
        .eq("user_id", user.id)
        .single();

      if (currentRow?.report_data) {
        const rd = currentRow.report_data as Record<string, unknown>;
        rd.isFullReport = true;
        rd.unlockedAt = new Date().toISOString();
        rd.plan = role;
        await admin
          .from("home_reports")
          .update({ report_data: rd })
          .eq("id", reportId)
          .eq("user_id", user.id);
      }

      // Check if AI data was missing from pre-generation and re-run if needed
      await rerunAIIfNeeded(admin, reportId, user.id);

      return NextResponse.json({ unlocked: true, plan: role });
    } catch (err) {
      console.error("Failed to verify Stripe session for home report:", err);
    }
  }

  // Strategy 2: Check if user has a recent successful payment for this report
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

      const matchingSession = sessions.data.find(
        (s) =>
          s.metadata?.reportId === reportId &&
          s.metadata?.userId === user.id &&
          s.payment_status === "paid"
      );

      if (matchingSession) {
        const role = matchingSession.metadata?.role || "home_standard";
        const { error: updateErr } = await admin
          .from("home_reports")
          .update({ plan_tier_at_generation: role })
          .eq("id", reportId)
          .eq("user_id", user.id);

        if (updateErr) {
          console.error('[HOME-REPORT-POST] Failed to update plan_tier_at_generation:', updateErr);
        }

        // Also store isFullReport and unlockedAt in report_data
        const { data: currentRow } = await admin
          .from("home_reports")
          .select("report_data")
          .eq("id", reportId)
          .eq("user_id", user.id)
          .single();

        if (currentRow?.report_data) {
          const rd = currentRow.report_data as Record<string, unknown>;
          rd.isFullReport = true;
          rd.unlockedAt = new Date().toISOString();
          rd.plan = role;
          await admin
            .from("home_reports")
            .update({ report_data: rd })
            .eq("id", reportId)
            .eq("user_id", user.id);
        }

        // Check if AI data was missing from pre-generation and re-run if needed
        await rerunAIIfNeeded(admin, reportId, user.id);

        return NextResponse.json({ unlocked: true, plan: role });
      }
    }
  } catch (err) {
    console.error("Failed to check Stripe sessions for home report:", err);
  }

  // Strategy 3: Check if already unlocked
  try {
    const { data: reportRow } = await admin
      .from("home_reports")
      .select("plan_tier_at_generation")
      .eq("id", reportId)
      .eq("user_id", user.id)
      .single();

    if (reportRow?.plan_tier_at_generation && reportRow.plan_tier_at_generation !== "free") {
      return NextResponse.json({
        unlocked: true,
        plan: reportRow.plan_tier_at_generation,
      });
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
 * If the pre-generated AI analysis failed (ourPick or finalVerdict is null),
 * re-run the AI comparison now so paying users always get the full analysis.
 */
async function rerunAIIfNeeded(
  admin: ReturnType<typeof createServiceClient>,
  reportId: string,
  userId: string
): Promise<void> {
  try {
    const { data: row } = await admin
      .from("home_reports")
      .select("report_data")
      .eq("id", reportId)
      .eq("user_id", userId)
      .single();

    if (!row?.report_data) return;

    const rd = row.report_data as Record<string, unknown>;
    const report = (rd.report ?? rd) as Record<string, unknown>;
    const listings = (rd.listings ?? []) as Record<string, unknown>[];

    // If ourPick and finalVerdict both exist, no re-run needed
    if (report.ourPick && report.finalVerdict) return;

    console.log('[RERUN-CHECK] ourPick is null:', report.ourPick === null, 'finalVerdict is null:', report.finalVerdict === null);
    console.log(`[home-report/rerun] ourPick or finalVerdict is null for report ${reportId} — re-running AI analysis`);

    // Rebuild property inputs from stored listings
    const properties = listings.map((l) => ({
      listing: l,
      riskProfile: (l as Record<string, unknown>).riskProfile ?? null,
    }));

    if (properties.length < 2) {
      console.warn(`[home-report/rerun] Not enough listings (${properties.length}) to re-run AI for report ${reportId}`);
      return;
    }

    // Extract census/school enrichment data if available
    const paidDataStored = rd.paidData as Record<string, unknown> | undefined;
    const paidEnrichment = paidDataStored ? {
      censusTract: (paidDataStored.censusTract ?? []) as (import("@/lib/homes/dataFetcher").CensusTractData | null)[],
      schools: (paidDataStored.schools ?? []) as import("@/lib/homes/dataFetcher").NearbySchool[][],
    } : undefined;

    const newReport = await generateHomeComparison(
      properties as unknown as Parameters<typeof generateHomeComparison>[0],
      undefined,
      true,
      paidEnrichment
    );

    // Merge re-generated AI fields into the existing stored report
    if (newReport.ourPick) report.ourPick = newReport.ourPick;
    if (newReport.finalVerdict) report.finalVerdict = newReport.finalVerdict;
    if (newReport.neighborhoodIntelligence) report.neighborhoodIntelligence = newReport.neighborhoodIntelligence;
    if (newReport.neighborhoodIntelligenceStructured) report.neighborhoodIntelligenceStructured = newReport.neighborhoodIntelligenceStructured;
    if (newReport.scoreAnalysis) report.scoreAnalysis = newReport.scoreAnalysis;
    if (newReport.negotiationIntelligence) report.negotiationIntelligence = newReport.negotiationIntelligence;
    if (newReport.investmentOutlook) report.investmentOutlook = newReport.investmentOutlook;

    rd.report = report;
    await admin
      .from("home_reports")
      .update({ report_data: rd })
      .eq("id", reportId)
      .eq("user_id", userId);

    console.log(`[home-report/rerun] AI re-run succeeded for report ${reportId}`);

    // Verify the re-run result
    const { data: verifyRow } = await admin
      .from("home_reports")
      .select("report_data")
      .eq("id", reportId)
      .single();
    const verifyReport = verifyRow?.report_data ? ((verifyRow.report_data as Record<string, unknown>).report as Record<string, unknown>) : null;
    console.log('[RERUN-RESULT] success: true, ourPick now present:', !!verifyReport?.ourPick);
  } catch (err) {
    // Don't crash the unlock flow — return the report as-is
    console.error(`[home-report/rerun] AI re-run failed for report ${reportId}:`, err);
    logError("home-report/rerun", err, { reportId });
  }
}
