import { NextResponse } from "next/server";
import { loadStripePlans } from "@/lib/stripe/planLoader";

/**
 * GET /api/stripe/plans
 *
 * Returns live pricing data from Stripe.
 * Only exposes safe fields: role, displayPrice, productName.
 * Never exposes priceId or productId to the client.
 */
export async function GET() {
  try {
    const plans = await loadStripePlans();

    const safePlans = Object.values(plans).map((p) => ({
      role: p.role,
      displayPrice: p.displayPrice,
      productName: p.productName,
    }));

    return NextResponse.json({ plans: safePlans });
  } catch (err) {
    console.error("[stripe/plans] Failed to load plans:", err);
    return NextResponse.json(
      { error: "Failed to load pricing", plans: [] },
      { status: 500 }
    );
  }
}
