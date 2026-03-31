import { getStripeServer } from "@/lib/stripe/server";
import type Stripe from "stripe";
import { logError } from "@/lib/logger";

/* ═══════════════════════════════════════════════════════════════════════ */
/*                     TYPES                                              */
/* ═══════════════════════════════════════════════════════════════════════ */

export interface StripePlan {
  role: string;
  productId: string;
  productName: string;
  priceId: string;
  unitAmount: number; // cents
  displayPrice: string; // e.g. "$9.99"
  currency: string;
}

export type StripePlanMap = Record<string, StripePlan>;

/* ═══════════════════════════════════════════════════════════════════════ */
/*                     MODULE CACHE                                       */
/* ═══════════════════════════════════════════════════════════════════════ */

let cachedPlans: StripePlanMap | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/* ═══════════════════════════════════════════════════════════════════════ */
/*                     LOADER                                             */
/* ═══════════════════════════════════════════════════════════════════════ */

/**
 * Fetches all active Stripe products with a `role` metadata key,
 * resolves their default price, and returns a map keyed by role.
 * Results are cached for 5 minutes.
 */
export async function loadStripePlans(): Promise<StripePlanMap> {
  if (typeof window !== "undefined") {
    throw new Error("planLoader must only run server-side");
  }

  const now = Date.now();
  if (cachedPlans && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedPlans;
  }

  let stripe: Stripe;
  try {
    stripe = getStripeServer();
  } catch {
    logError("planLoader/stripe-init", new Error("Failed to load Stripe plans"), {});
    throw new Error("Failed to load Stripe plans — check STRIPE_SECRET_KEY");
  }

  const products = await stripe.products.list({
    active: true,
    limit: 20,
    expand: ["data.default_price"],
  });

  const plans: StripePlanMap = {};

  for (const product of products.data) {
    const role = product.metadata?.role;
    if (!role) continue;

    const defaultPrice = product.default_price as Stripe.Price | null;
    if (!defaultPrice || typeof defaultPrice === "string") continue;

    const unitAmount = defaultPrice.unit_amount ?? 0;
    const currency = defaultPrice.currency ?? "usd";
    const displayPrice = `$${(unitAmount / 100).toFixed(2)}`;

    plans[role] = {
      role,
      productId: product.id,
      productName: product.name,
      priceId: defaultPrice.id,
      unitAmount,
      displayPrice,
      currency,
    };
  }

  cachedPlans = plans;
  cacheTimestamp = now;

  return plans;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                     HELPERS                                            */
/* ═══════════════════════════════════════════════════════════════════════ */

export async function getPlanByRole(role: string): Promise<StripePlan> {
  const plans = await loadStripePlans();
  const plan = plans[role];
  if (!plan) {
    logError("planLoader/role-not-found", new Error(`No Stripe product found for role "${role}"`), {});
    throw new Error(`No Stripe product found for role "${role}". Check that the product exists in Stripe and has metadata.role set.`);
  }
  return plan;
}

export async function getPriceId(role: string): Promise<string> {
  const plan = await getPlanByRole(role);
  return plan.priceId;
}

export async function getDisplayPrice(role: string): Promise<string> {
  const plan = await getPlanByRole(role);
  return plan.displayPrice;
}

export async function getAllCarPlans(): Promise<StripePlan[]> {
  const plans = await loadStripePlans();
  return Object.values(plans).filter((p) =>
    p.role.startsWith("car_")
  );
}

export async function getAllHomePlans(): Promise<StripePlan[]> {
  const plans = await loadStripePlans();
  return Object.values(plans).filter((p) =>
    p.role.startsWith("home_")
  );
}
