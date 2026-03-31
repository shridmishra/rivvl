/* ═══════════════════════════════════════════════════════════════════════ */
/*                     DATABASE TABLE TYPES                               */
/* ═══════════════════════════════════════════════════════════════════════ */

export type PlanTier = "free" | "car_single" | "car_pro_report" | "car_pro10" | "home_standard" | "home_premium" | "home_pro10";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  /* ── Vehicle plan fields ── */
  vehicle_plan_tier: string;
  vehicle_reports_used: number;
  vehicle_max_reports: number;
  /* ── Home plan fields ── */
  home_plan_tier: string;
  home_reports_used: number;
  home_max_reports: number;
  /* ── Legacy (kept for migration, no longer used for access control) ── */
  plan_tier: string;
  reports_used: number;
  reports_limit: number;
  pro10_credits_remaining: number;
  /* ── Stripe ── */
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbReport {
  id: string;
  user_id: string;
  car1_name: string;
  car2_name: string;
  car1_year: string | null;
  car2_year: string | null;
  car3_name: string | null;
  car4_name: string | null;
  custom_name: string | null;
  report_data: Record<string, unknown>;
  plan_tier_at_generation: string;
  sections_included: string[];
  created_at: string;
}

export interface HomeReport {
  id: string;
  user_id: string;
  property1_address: string;
  property2_address: string;
  property3_address: string | null;
  custom_name: string | null;
  report_data: Record<string, unknown>;
  plan_tier_at_generation: string;
  created_at: string;
}

export interface ComparisonLog {
  id: string;
  user_id: string | null;
  car1_query: string;
  car2_query: string;
  status: "started" | "completed" | "failed";
  error_message: string | null;
  created_at: string;
}

/** Plan configuration — labels and badges per tier */
export const PLAN_CONFIG: Record<
  string,
  { label: string; limit: number; badge: string }
> = {
  free: { label: "Free", limit: 0, badge: "bg-slate-100 text-slate-600" },
  car_single: { label: "Single Report", limit: 1, badge: "gradient-bg text-white" },
  car_pro_report: { label: "Pro Report", limit: 1, badge: "gradient-bg text-white" },
  car_pro10: { label: "Pro 10", limit: 10, badge: "bg-amber-500 text-white" },
  home_standard: {
    label: "Home Standard",
    limit: 1,
    badge: "bg-[#00D2FF] text-[#0F0F1A]",
  },
  home_premium: {
    label: "Home Premium",
    limit: 1,
    badge: "bg-[#F59E0B] text-white",
  },
  home_pro10: {
    label: "Home Pro 10",
    limit: 10,
    badge: "bg-amber-500 text-white",
  },
};

/**
 * Compute the effective plan tier for a vertical.
 *
 * For one-time plans, the plan reverts to "free" when
 * reports_used >= max_reports.
 */
export function getEffectivePlanTier(
  planTier: string,
  reportsUsed: number,
  maxReports: number,
): string {
  if (planTier === "free") return "free";

  // If max_reports is 0, treat as free
  if (maxReports <= 0) return "free";

  // If usage has reached the limit, revert to free
  if (reportsUsed >= maxReports) return "free";

  return planTier;
}
