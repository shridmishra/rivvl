import { NextRequest, NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe/server";
import { PLAN_LIMITS } from "@/lib/stripe/planLimits";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logger";

/**
 * POST /api/stripe/verify-session
 *
 * Verifies a Stripe checkout session and SYNCHRONOUSLY updates the user's
 * plan tier in the database. Called before report generation to guarantee
 * the correct plan is in the DB without waiting for the webhook.
 */
export async function POST(req: NextRequest) {
  try {
    const { sessionId } = (await req.json()) as { sessionId?: string };

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // Require authentication
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stripe = getStripeServer();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Security: verify the session belongs to this user
    if (session.metadata?.userId !== user.id) {
      return NextResponse.json(
        { error: "Session does not belong to this user" },
        { status: 403 }
      );
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { verified: false, error: "Payment has not been completed" },
        { status: 402 }
      );
    }

    const role = session.metadata?.role;
    if (!role) {
      return NextResponse.json(
        { error: "Missing role in session metadata" },
        { status: 400 }
      );
    }

    // Report-upgrade: unlock the specific report directly
    const reportId = session.metadata?.reportId;
    if (reportId) {
      const admin = createServiceClient();

      if (role.startsWith("home_")) {
        // Unlock home report: update plan_tier_at_generation
        const { error: unlockErr } = await admin
          .from("home_reports")
          .update({ plan_tier_at_generation: role })
          .eq("id", reportId)
          .eq("user_id", user.id);

        if (unlockErr) {
          console.error('[VERIFY-SESSION] Failed to unlock home report:', unlockErr);
          return NextResponse.json(
            { error: "Failed to unlock report", verified: false },
            { status: 500 }
          );
        }

        // Also store isFullReport and unlockedAt in report_data for auditability
        const { data: reportRow } = await admin
          .from("home_reports")
          .select("report_data")
          .eq("id", reportId)
          .eq("user_id", user.id)
          .single();

        if (reportRow?.report_data) {
          const rd = reportRow.report_data as Record<string, unknown>;
          rd.isFullReport = true;
          rd.unlockedAt = new Date().toISOString();
          rd.plan = role;
          await admin
            .from("home_reports")
            .update({ report_data: rd })
            .eq("id", reportId)
            .eq("user_id", user.id);
        }
      } else {
        // Unlock vehicle report: update report_data and plan_tier
        const { data: reportRow } = await admin
          .from("reports")
          .select("report_data, sections_included")
          .eq("id", reportId)
          .eq("user_id", user.id)
          .single();

        if (reportRow?.report_data) {
          const rd = reportRow.report_data as Record<string, unknown>;
          const analysis = rd.analysis as Record<string, unknown> | undefined;
          const reportType = role.includes("pro") ? "pro" : "single";

          const updatedReportData = {
            ...rd,
            plan: role,
            ...(analysis ? { analysis: { ...analysis, reportType } } : {}),
          };

          const allSections = analysis
            ? Object.keys(analysis).filter((k) => k !== "reportType")
            : reportRow.sections_included;

          await admin
            .from("reports")
            .update({
              report_data: updatedReportData,
              plan_tier_at_generation: role,
              sections_included: allSections,
            })
            .eq("id", reportId)
            .eq("user_id", user.id);
        }
      }

      return NextResponse.json({ verified: true, role, reportId });
    }

    const planConfig = PLAN_LIMITS[role];
    if (!planConfig) {
      return NextResponse.json(
        { error: `Unknown plan role: ${role}` },
        { status: 400 }
      );
    }

    const admin = createServiceClient();

    // Idempotent: only update if we haven't processed this session yet
    const { data: existing } = await admin
      .from("stripe_events")
      .select("event_id")
      .eq("event_id", `session_${session.id}`)
      .maybeSingle();

    if (!existing) {
      // Update the correct vertical
      if (role.startsWith("car_")) {
        await admin
          .from("profiles")
          .update({
            vehicle_plan_tier: role,
            vehicle_reports_used: 0,
            vehicle_max_reports: planConfig.maxReports,
          })
          .eq("id", user.id);
      } else if (role.startsWith("home_")) {
        await admin
          .from("profiles")
          .update({
            home_plan_tier: role,
            home_reports_used: 0,
            home_max_reports: planConfig.maxReports,
          })
          .eq("id", user.id);
      }

      // Mark as processed
      await admin.from("stripe_events").insert({
        event_id: `session_${session.id}`,
        processed_at: new Date().toISOString(),
      }).then(({ error }) => {
        if (error) {
          // Duplicate key — already processed
        }
      });
    }

    return NextResponse.json({ verified: true, role });
  } catch (err) {
    console.error("verify-session error:", err);
    logError("stripe-verify-session", err, { route: "/api/stripe/verify-session" });
    return NextResponse.json(
      {
        verified: false,
        error: err instanceof Error ? err.message : "Verification failed",
      },
      { status: 500 }
    );
  }
}
