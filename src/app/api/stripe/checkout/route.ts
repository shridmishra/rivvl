import { NextRequest, NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe/server";
import { getPlanByRole } from "@/lib/stripe/planLoader";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const { role, reportId, source } = (await req.json()) as {
      role: string;
      reportId?: string;
      source?: "compare" | "report" | "pricing";
    };

    // Validate role and get live price from Stripe
    if (!role) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    let plan;
    try {
      plan = await getPlanByRole(role);
    } catch {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    // Require authentication
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in first", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    // Get or create Stripe customer
    const admin = createServiceClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id, email")
      .eq("id", user.id)
      .single();

    const stripe = getStripeServer();
    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? profile?.email ?? undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;

      await admin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // Build redirect URLs
    const origin = req.headers.get("origin") || "http://localhost:3000";
    let successUrl: string;
    let cancelUrl: string;

    const isHomePlan = role.startsWith("home_");

    if (source === "compare" && isHomePlan) {
      successUrl = `${origin}/compare/homes?payment=success&plan=${role}&session_id={CHECKOUT_SESSION_ID}`;
      cancelUrl = `${origin}/compare/homes?payment=cancelled`;
    } else if (source === "compare") {
      successUrl = `${origin}/compare?payment=success&plan=${role}&session_id={CHECKOUT_SESSION_ID}`;
      cancelUrl = `${origin}/compare?payment=cancelled`;
    } else if (reportId && isHomePlan) {
      // Home report upgrade — redirect to homes report page
      successUrl = `${origin}/homes/report?id=${reportId}&session_id={CHECKOUT_SESSION_ID}&upgraded=true`;
      cancelUrl = `${origin}/homes/report`;
    } else if (reportId) {
      // Vehicle report upgrade
      successUrl = `${origin}/report/${reportId}?payment=success&plan=${role}&session_id={CHECKOUT_SESSION_ID}`;
      cancelUrl = `${origin}/report/${reportId}`;
    } else {
      successUrl = `${origin}/dashboard?payment=success&plan=${role}`;
      cancelUrl = `${origin}/pricing?payment=cancelled`;
    }

    // Create checkout session — always payment mode, never subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: plan.priceId, quantity: 1 }],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
        role: plan.role,
        source: source || "pricing",
        vertical: isHomePlan ? 'homes' : 'vehicles',
        ...(reportId ? { reportId } : {}),
      },
      payment_intent_data: {
        metadata: {
          userId: user.id,
          role: plan.role,
          vertical: isHomePlan ? 'homes' : 'vehicles',
          ...(reportId ? { reportId } : {}),
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    logError("stripe-checkout", err, { route: "/api/stripe/checkout" });
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to create checkout session",
      },
      { status: 500 }
    );
  }
}
