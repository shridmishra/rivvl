import { createServiceClient } from "@/lib/supabase/server";
import {
  calculateFloodInsurance,
  calculateInsuranceEstimate,
  calculateClosingCosts,
  calculateTaxReassessment,
  calculateLoanPrograms,
  calculateRedFlags,
  calculateRiskScore,
  generateSprintAIFeatures,
} from "@/lib/homes/comparisonEngine";
import type { HomeComparisonReport } from "@/lib/homes/comparisonEngine";
import type { RawHomeListing } from "@/lib/homes/listingFetcher";
import type { HomeRiskProfile } from "@/lib/homes/dataFetcher";
import { logError, logWarn } from "@/lib/logger";

interface PropertyInput {
  listing: RawHomeListing;
  riskProfile: HomeRiskProfile | null;
}

/**
 * Recalculates Sprint 1 features for an existing report and updates the DB.
 * Call this when a saved report is missing Sprint 1 fields.
 *
 * report_data in DB is structured as: { report, listings, plan, paidData? }
 * We must preserve this wrapper when saving back.
 */
export async function recalculateSprintFeatures(reportId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();

    // Load the existing report — only report_data column exists
    const { data: row, error: fetchError } = await supabase
      .from("home_reports")
      .select("report_data")
      .eq("id", reportId)
      .single();

    if (fetchError || !row) {
      return { success: false, error: `Report not found: ${reportId}` };
    }

    // report_data is structured as { report, listings, plan, paidData? }
    const rd = row.report_data as Record<string, unknown>;
    const report = (rd.report ?? rd) as unknown as HomeComparisonReport;
    const listings = (rd.listings as unknown as RawHomeListing[]) ?? [];
    const paidData = rd.paidData as { priceHistory?: ({ assessedValue?: number | null } | null)[] } | null | undefined;

    if (!report || !report.properties || !listings || listings.length < 2) {
      return { success: false, error: "Invalid report data" };
    }

    // Build property inputs
    const enrichedProperties: PropertyInput[] = listings.map((listing, i) => ({
      listing,
      riskProfile: report.properties[i]?.riskProfile as unknown as HomeRiskProfile ?? null,
    }));

    // Calculate Sprint 1 features
    const floodInsuranceArr = enrichedProperties.map(ep => {
      const floodCode = ep.riskProfile?.floodZone?.code ?? null;
      return calculateFloodInsurance(floodCode);
    });

    const insuranceArr = enrichedProperties.map((ep) => {
      const l = ep.listing;
      const price = l.price ?? 0;
      if (price <= 0) return null;
      const crimeAbove = false; // Not available without re-fetching
      return calculateInsuranceEstimate(
        price,
        l.yearBuilt,
        ep.riskProfile?.floodZone?.code ?? null,
        ep.riskProfile?.wildfireRisk?.riskLevel ?? null,
        crimeAbove,
        l.sqft
      );
    });

    const closingCostsArr = enrichedProperties.map((ep, i) => {
      const price = ep.listing.price ?? 0;
      if (price <= 0) return null;
      const assessedVal = paidData?.priceHistory?.[i]?.assessedValue ?? null;
      const annualIns = insuranceArr[i]?.adjustedAnnualPremium ?? 0;
      return calculateClosingCosts(price, annualIns, assessedVal);
    });

    const taxReassessmentArr = enrichedProperties.map((ep, i) => {
      const price = ep.listing.price ?? 0;
      if (price <= 0) return null;
      const assessedVal = paidData?.priceHistory?.[i]?.assessedValue ?? null;
      return calculateTaxReassessment(price, assessedVal);
    });

    const loanProgramsArr = enrichedProperties.map(ep => {
      const price = ep.listing.price ?? 0;
      if (price <= 0) return null;
      return calculateLoanPrograms(price, ep.listing.state);
    });

    const rulesFlagsArr = enrichedProperties.map((ep, i) => {
      const assessedVal = paidData?.priceHistory?.[i]?.assessedValue ?? null;
      return calculateRedFlags(ep.listing, ep.riskProfile, assessedVal, floodInsuranceArr[i]);
    });

    // Recalculate risk scores
    for (let i = 0; i < enrichedProperties.length; i++) {
      const formulaScore = calculateRiskScore(enrichedProperties[i].riskProfile);
      if (report.properties[i]) {
        report.properties[i].riskScore = formulaScore;
      }
    }

    // AI-generated features
    let hoaRiskArr: (import("@/lib/homes/comparisonEngine").HoaRiskData | null)[] = enrichedProperties.map(() => null);
    let aiRedFlagsArr: string[][] = enrichedProperties.map(() => []);
    try {
      const aiFeatures = await generateSprintAIFeatures(enrichedProperties, rulesFlagsArr);
      hoaRiskArr = aiFeatures.hoaRisk;
      aiRedFlagsArr = aiFeatures.aiRedFlags;
    } catch (err) {
      logWarn("reportUtils/sprint-ai", `AI features failed for recalculation: ${err instanceof Error ? err.message : String(err)}`, { reportId });
    }

    // Update report with Sprint 1 data (preserve nulls for index alignment)
    report.floodInsurance = floodInsuranceArr;
    report.insuranceEstimate = insuranceArr;
    report.closingCosts = closingCostsArr;
    report.taxReassessment = taxReassessmentArr;
    report.loanPrograms = loanProgramsArr;
    report.hoaRisk = hoaRiskArr;
    report.redFlags = enrichedProperties.map((_, i) => ({
      rulesFlags: rulesFlagsArr[i],
      aiRedFlags: aiRedFlagsArr[i] ?? [],
      noFlagsDetected: rulesFlagsArr[i].length === 0 && (aiRedFlagsArr[i]?.length ?? 0) === 0,
    }));

    // Save back to DB — preserve the wrapper structure { report, listings, plan, paidData }
    const updatedReportData = {
      ...rd,
      report: report as unknown as Record<string, unknown>,
    };

    const { error: updateError } = await supabase
      .from("home_reports")
      .update({ report_data: updatedReportData })
      .eq("id", reportId);

    if (updateError) {
      logError("reportUtils/update", updateError, { reportId });
      return { success: false, error: `DB update failed: ${updateError.message}` };
    }

    return { success: true };
  } catch (err) {
    logError("reportUtils/recalculate", err, { reportId });
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
