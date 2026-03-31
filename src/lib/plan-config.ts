import { PLAN_LIMITS } from "@/lib/stripe/planLimits";

/**
 * Returns the maximum number of items (cars or properties) this plan can
 * compare in one report, based on PLAN_LIMITS.
 */
export function getMaxCarsForPlan(plan: string): number {
  return PLAN_LIMITS[plan]?.maxProperties ?? 2;
}

/** Returns true if the plan allows comparing more than 2 items. */
export function isMultiCarPlan(plan: string): boolean {
  return getMaxCarsForPlan(plan) > 2;
}
