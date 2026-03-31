/**
 * Shared section access logic.
 * Single source of truth for which report sections are unlocked per plan.
 * Used by: report API, generate-pdf API, report page, PDF renderer.
 */

export type SectionId =
  | "executiveSummary"
  | "vehicleSpecs"
  | "safety"
  | "fuelEconomy"
  | "priceAnalysis"
  | "costOfOwnership"
  | "depreciation"
  | "reliability"
  | "features"
  | "userPriorityMatch"
  | "finalVerdict";

const FREE_SECTIONS: SectionId[] = [
  "vehicleSpecs",
  "safety",
  "fuelEconomy",
];

const ALL_SECTIONS: SectionId[] = [
  "executiveSummary",
  "vehicleSpecs",
  "priceAnalysis",
  "costOfOwnership",
  "depreciation",
  "safety",
  "fuelEconomy",
  "reliability",
  "features",
  "userPriorityMatch",
  "finalVerdict",
];

/**
 * Returns the list of unlocked section IDs for a given report type.
 */
export function getUnlockedSections(reportType: "free" | "single" | "pro"): SectionId[] {
  return reportType === "free" ? FREE_SECTIONS : ALL_SECTIONS;
}

/**
 * Returns true if the given section is locked for the given report type.
 */
export function isSectionLocked(sectionId: SectionId, reportType: "free" | "single" | "pro"): boolean {
  return !getUnlockedSections(reportType).includes(sectionId);
}
