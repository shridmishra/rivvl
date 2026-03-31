import Stripe from "stripe";

let stripe: Stripe;

export function getStripeServer(): Stripe {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    });
  }
  return stripe;
}
