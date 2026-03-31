import { NextRequest, NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe/server";
import { PLAN_LIMITS } from "@/lib/stripe/planLimits";
import { createServiceClient } from "@/lib/supabase/server";
import type Stripe from "stripe";
import { logError, logWarn } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const stripe = getStripeServer();
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    logError("stripe-webhook/signature", err, { route: "/api/stripe/webhook" });
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  const admin = createServiceClient();

  try {
    // Idempotency check: skip already-processed events
    if (event.type === "checkout.session.completed") {
      const { data: existing } = await admin
        .from("stripe_events")
        .select("event_id")
        .eq("event_id", event.id)
        .maybeSingle();

      if (existing) {
        console.log(`Skipping already-processed event ${event.id}`);
        return NextResponse.json({ received: true });
      }

      // Record this event as processed
      await admin
        .from("stripe_events")
        .insert({ event_id: event.id, processed_at: new Date().toISOString() });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const role = session.metadata?.role;
        const reportId = session.metadata?.reportId;

        if (!userId || !role) {
          console.error("Missing metadata in checkout session", session.id);
          logWarn("stripe-webhook/metadata", `Missing metadata in session ${session.id}`, { route: "/api/stripe/webhook" });
          break;
        }

        const planConfig = PLAN_LIMITS[role];
        if (!planConfig) {
          console.error(`Unknown role in webhook: ${role}`);
          logWarn("stripe-webhook/unknown-role", `Unknown role: ${role}`, { route: "/api/stripe/webhook" });
          break;
        }

        // If upgrading a specific existing report, just unlock it
        if (reportId) {
          try {
            if (role.startsWith("home_")) {
              // Unlock home report
              await admin
                .from("home_reports")
                .update({ plan_tier_at_generation: role })
                .eq("id", reportId)
                .eq("user_id", userId);
              console.log(`Home report ${reportId} unlocked to ${role}`);
            } else {
              // Unlock vehicle report
              const { data: reportRow } = await admin
                .from("reports")
                .select("report_data, sections_included")
                .eq("id", reportId)
                .eq("user_id", userId)
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
                  .eq("user_id", userId);

                console.log(`Vehicle report ${reportId} unlocked to ${role}`);
              }
            }
          } catch (err) {
            console.error(`Failed to unlock report ${reportId}:`, err);
            logError("stripe-webhook/unlock-report", err, { route: "/api/stripe/webhook" });
          }
          break;
        }

        // Determine which vertical to update
        if (role.startsWith("car_")) {
          await admin
            .from("profiles")
            .update({
              vehicle_plan_tier: role,
              vehicle_reports_used: 0,
              vehicle_max_reports: planConfig.maxReports,
            })
            .eq("id", userId);
        } else if (role.startsWith("home_")) {
          await admin
            .from("profiles")
            .update({
              home_plan_tier: role,
              home_reports_used: 0,
              home_max_reports: planConfig.maxReports,
            })
            .eq("id", userId);
        }

        // Clear any payment_failed flag on successful payment
        await admin
          .from("profiles")
          .update({ payment_failed: false, payment_failed_at: null })
          .eq("id", userId);

        console.log(`User ${userId} upgraded to ${role}`);
        break;
      }

      // Subscription events are no longer used (all plans are one-time),
      // but keep handlers for graceful handling of any legacy subscriptions
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (userId) {
          console.log(`User ${userId} subscription cancelled (legacy)`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (customerId) {
          console.warn(`Payment failed for customer ${customerId}`);
          await admin
            .from("profiles")
            .update({
              payment_failed: true,
              payment_failed_at: new Date().toISOString(),
            })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    logError("stripe-webhook/handler", err, { route: "/api/stripe/webhook" });
  }

  return NextResponse.json({ received: true });
}
