import type {
  StoredReport,
  EnrichedCar,
  AIAnalysisReport,
  UserPreferences,
} from "@/types";
import { logError } from "@/lib/logger";
/* ═══════════════════════════════════════════════════════════════════════ */
/*                    SUPABASE REPORT STORAGE                             */
/* ═══════════════════════════════════════════════════════════════════════ */

/**
 * Save a vehicle report to Supabase. Returns the report ID.
 * Retries once on failure before throwing.
 */
export async function saveReportWithSupabase(opts: {
  cars: EnrichedCar[];
  analysis: AIAnalysisReport;
  preferences: UserPreferences;
  plan: string;
  enrichmentContext: string;
  userId?: string;
}): Promise<string> {
  if (!opts.userId) {
    throw new Error("Authentication required to save reports.");
  }

  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = createServiceClient();

  const id = crypto.randomUUID();

  const carName = (i: number) => {
    const c = opts.cars[i];
    return c ? [c.year, c.make, c.model].filter(Boolean).join(" ") : null;
  };

  const car1Name = carName(0) || "Unknown Vehicle";
  const car2Name = carName(1) || "Unknown Vehicle";
  const car3Name = carName(2);
  const car4Name = carName(3);

  const sectionsIncluded = Object.keys(opts.analysis).filter(
    (k) => k !== "reportType"
  );

  const insertData = {
    id,
    user_id: opts.userId,
    car1_name: car1Name,
    car2_name: car2Name,
    car1_year: opts.cars[0]?.year?.toString() ?? null,
    car2_year: opts.cars[1]?.year?.toString() ?? null,
    car3_name: car3Name,
    car4_name: car4Name,
    report_data: {
      cars: opts.cars,
      analysis: opts.analysis,
      preferences: opts.preferences,
      plan: opts.plan,
      enrichmentContext: opts.enrichmentContext,
    },
    plan_tier_at_generation: opts.plan,
    sections_included: sectionsIncluded,
  };

  // Attempt 1
  const { error: firstError } = await supabase.from("reports").insert(insertData);

  if (firstError) {
    // Retry once after a short delay
    await new Promise((r) => setTimeout(r, 1000));
    const { error: retryError } = await supabase.from("reports").insert(insertData);

    if (retryError) {
      console.error("Supabase report save failed after retry:", retryError);
      logError("report-storage/vehicle-save", retryError, { vertical: "vehicles" });
      // Don't block report delivery on save failure
      return id;
    }
  }

  // Increment vehicle_reports_used and check if plan should revert to free
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("vehicle_reports_used, vehicle_max_reports, vehicle_plan_tier")
      .eq("id", opts.userId)
      .single();

    const newUsed = (profile?.vehicle_reports_used ?? 0) + 1;
    const maxReports = profile?.vehicle_max_reports ?? 0;

    const updateData: Record<string, unknown> = {
      vehicle_reports_used: newUsed,
    };

    // If usage has reached the limit, revert to free
    if (maxReports > 0 && newUsed >= maxReports) {
      updateData.vehicle_plan_tier = "free";
      updateData.vehicle_reports_used = 0;
    }

    await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", opts.userId);
  } catch (err) {
    console.error("Failed to increment vehicle_reports_used:", err);
    logError("report-storage/vehicle-usage", err, { vertical: "vehicles" });
  }

  return id;
}

/**
 * Save a home report to Supabase. Returns the report ID.
 * Never blocks report delivery on DB errors.
 */
export async function saveHomeReportWithSupabase(opts: {
  report: Record<string, unknown>;
  listings: Array<{ address?: string | null; fullAddress?: string | null }>;
  plan: string;
  userId: string;
  paidData?: unknown;
}): Promise<string | null> {
  try {
    const { createServiceClient } = await import("@/lib/supabase/server");
    const supabase = createServiceClient();

    const id = crypto.randomUUID();

    const insertData = {
      id,
      user_id: opts.userId,
      property1_address: opts.listings[0]?.fullAddress || opts.listings[0]?.address || "Unknown Property",
      property2_address: opts.listings[1]?.fullAddress || opts.listings[1]?.address || "Unknown Property",
      property3_address: opts.listings[2]?.fullAddress || opts.listings[2]?.address || null,
      report_data: {
        report: opts.report,
        listings: opts.listings,
        plan: opts.plan,
        ...(opts.paidData ? { paidData: opts.paidData } : {}),
      },
      plan_tier_at_generation: opts.plan,
    };

    const { error } = await supabase.from("home_reports").insert(insertData);

    if (error) {
      // Retry once
      await new Promise((r) => setTimeout(r, 1000));
      const { error: retryError } = await supabase.from("home_reports").insert(insertData);
      if (retryError) {
        console.error("Home report save failed after retry:", retryError);
        logError("report-storage/home-save", retryError, { vertical: "homes" });
        return null; // Don't block report delivery
      }
    }

    // Increment home_reports_used and check if plan should revert to free
    const { data: profile } = await supabase
      .from("profiles")
      .select("home_reports_used, home_max_reports, home_plan_tier")
      .eq("id", opts.userId)
      .single();

    const newUsed = (profile?.home_reports_used ?? 0) + 1;
    const maxReports = profile?.home_max_reports ?? 0;

    const updateData: Record<string, unknown> = {
      home_reports_used: newUsed,
    };

    // If usage has reached the limit, revert to free
    if (maxReports > 0 && newUsed >= maxReports) {
      updateData.home_plan_tier = "free";
      updateData.home_reports_used = 0;
    }

    await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", opts.userId);

    return id;
  } catch (err) {
    console.error("Home report save error (non-blocking):", err);
    logError("report-storage/home-save-error", err, { vertical: "homes" });
    return null;
  }
}

/**
 * Get a vehicle report from Supabase by ID.
 */
export async function getReportWithSupabase(
  id: string
): Promise<StoredReport | null> {
  try {
    const { createServiceClient } = await import("@/lib/supabase/server");
    const supabase = createServiceClient();

    const { data } = await supabase
      .from("reports")
      .select("*")
      .eq("id", id)
      .single();

    if (data?.report_data) {
      const rd = data.report_data as Record<string, unknown>;
      return {
        id: data.id,
        createdAt: data.created_at,
        cars: rd.cars as EnrichedCar[],
        analysis: rd.analysis as AIAnalysisReport,
        preferences: rd.preferences as UserPreferences,
        plan: rd.plan as string,
        enrichmentContext: rd.enrichmentContext as string,
        customName: data.custom_name ?? null,
      };
    }
  } catch {
    // Supabase unavailable
  }

  return null;
}
