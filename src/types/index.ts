/* ═══════════════════════════════════════════════════════════════════════ */
/*                         SCRAPED DATA TYPES                             */
/* ═══════════════════════════════════════════════════════════════════════ */

export interface ScrapedCar {
  url: string;
  listingTitle: string | null;
  price: number | null;
  mileage: number | null;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  vin: string | null;
  exteriorColor: string | null;
  interiorColor: string | null;
  engine: string | null;
  transmission: string | null;
  driveType: string | null;
  fuelType: string | null;
  bodyStyle: string | null;
  features: string[];
  dealerName: string | null;
  dealerLocation: string | null;
  photoCount: number | null;
  photoUrl: string | null;
  rawMarkdown: string | null;
  scrapedAt: string;
  error: string | null;
}

export interface ManualCarEntry {
  year: string;
  make: string;
  model: string;
  trim: string;
  mileage: string;
  price: string;
  vin: string;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                       VIN DECODER TYPES                                */
/* ═══════════════════════════════════════════════════════════════════════ */

export interface VINData {
  vin: string;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  bodyClass: string | null;
  driveType: string | null;
  engineCylinders: number | null;
  engineDisplacement: string | null;
  engineHP: number | null;
  fuelType: string | null;
  transmission: string | null;
  doors: number | null;
  manufacturer: string | null;
  plantCity: string | null;
  plantCountry: string | null;
  vehicleType: string | null;
  gvwr: string | null;
  electrificationLevel: string | null;
  // Raw decoded values for AI context
  rawAttributes: Record<string, string>;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                       SAFETY RATING TYPES                              */
/* ═══════════════════════════════════════════════════════════════════════ */

export interface SafetyRating {
  overallRating: number | null;
  frontalCrashRating: number | null;
  sideCrashRating: number | null;
  rolloverRating: number | null;
  frontalCrashDriverRating: number | null;
  frontalCrashPassengerRating: number | null;
  sideCrashDriverRating: number | null;
  sideCrashPassengerRating: number | null;
  sidePoleCrashRating: number | null;
  vehicleId: number | null;
  vehicleDescription: string | null;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                          RECALL TYPES                                  */
/* ═══════════════════════════════════════════════════════════════════════ */

export interface Recall {
  nhtsaCampaignNumber: string;
  component: string;
  summary: string;
  consequence: string;
  remedy: string;
  reportDate: string;
  manufacturer: string;
}

export interface RecallData {
  totalRecalls: number;
  recalls: Recall[];
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                        COMPLAINT TYPES                                 */
/* ═══════════════════════════════════════════════════════════════════════ */

export interface Complaint {
  component: string;
  summary: string;
  crash: boolean;
  fire: boolean;
  injury: boolean;
  dateReceived: string;
  odiNumber: string;
}

export interface ComplaintData {
  totalComplaints: number;
  complaints: Complaint[];
  topComponents: { component: string; count: number }[];
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                       FUEL ECONOMY TYPES                               */
/* ═══════════════════════════════════════════════════════════════════════ */

export interface FuelEconomy {
  vehicleId: number | null;
  cityMpg: number | null;
  highwayMpg: number | null;
  combinedMpg: number | null;
  annualFuelCost: number | null;
  co2TailpipeGpm: number | null;
  fuelType: string | null;
  fuelType2: string | null;
  cityMpgFuel2: number | null;
  highwayMpgFuel2: number | null;
  combinedMpgFuel2: number | null;
  isElectric: boolean;
  rangeElectric: number | null;
  rangeCity: number | null;
  rangeHighway: number | null;
  barrels08: number | null;
  youSaveSpend: number | null;
  vehicleClass: string | null;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                     ENRICHMENT RESULT TYPES                            */
/* ═══════════════════════════════════════════════════════════════════════ */

export interface EnrichmentResult {
  vinData: VINData | null;
  safetyRating: SafetyRating | null;
  recallData: RecallData | null;
  complaintData: ComplaintData | null;
  fuelEconomy: FuelEconomy | null;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                       ENRICHED CAR TYPE                                */
/* ═══════════════════════════════════════════════════════════════════════ */

export interface EnrichedCar {
  // Core identity
  url: string;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  vin: string | null;

  // Listing data
  listingTitle: string | null;
  price: number | null;
  mileage: number | null;
  exteriorColor: string | null;
  interiorColor: string | null;
  features: string[];
  dealerName: string | null;
  dealerLocation: string | null;
  photoCount: number | null;
  photoUrl: string | null;

  // Specs (merged from scraping + VIN decoder)
  engine: string | null;
  engineCylinders: number | null;
  engineDisplacement: string | null;
  engineHP: number | null;
  transmission: string | null;
  driveType: string | null;
  fuelType: string | null;
  bodyStyle: string | null;
  doors: number | null;
  manufacturer: string | null;
  vehicleType: string | null;

  // Safety
  safetyRating: SafetyRating | null;

  // Recalls
  recallData: RecallData | null;

  // Complaints
  complaintData: ComplaintData | null;

  // Fuel Economy
  fuelEconomy: FuelEconomy | null;

  // AI-enriched standard equipment (only present when scraping returned too few features)
  aiEnrichedFeatures?: string[];

  // Data quality flags set during the enrichment pipeline
  dataQuality?: DataQuality;

  // Metadata
  enrichmentSources: string[];
  scrapedAt: string;
  error: string | null;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                       DATA QUALITY TYPE                                */
/* ═══════════════════════════════════════════════════════════════════════ */

export interface DataQuality {
  /** Number of features confirmed from the listing scrape */
  confirmedFeatures: number;
  /** True if at least 3 of {engine, transmission, driveType, bodyStyle} are present */
  hasBasicSpecs: boolean;
  /** True if a listing price is present */
  hasPrice: boolean;
  /** True if AI was used to fill in standard equipment features */
  isAIEnriched: boolean;
  /** True when a URL-scraped car has fewer than 3 basic specs after all enrichment */
  isCriticallyIncomplete: boolean;
  /** True for cars entered manually (always exempt from completeness checks) */
  isManualEntry: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                      USER PREFERENCES TYPE                             */
/* ═══════════════════════════════════════════════════════════════════════ */

export interface UserPreferences {
  priorities: string[];
  budget: string;
  usage: string;
  keepDuration: string;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                       AI ANALYSIS REPORT TYPES                         */
/* ═══════════════════════════════════════════════════════════════════════ */

export interface AIExecutiveSummary {
  overview: string;
  recommendation: string;
  confidenceScore?: number;
  quickVerdict: string;
}

export interface AISpecComparison {
  category: string;
  /** New array format: values[0]=car1, values[1]=car2, etc. */
  values?: string[];
  advantage: string;
  /** @deprecated Legacy 2-car fields kept for backward compat */
  car1Value?: string;
  /** @deprecated Legacy 2-car fields kept for backward compat */
  car2Value?: string;
}

export interface AIVehicleSpecs {
  comparisonTable: AISpecComparison[];
}

export interface AIPriceCarAnalysis {
  name: string;
  listedPrice: number;
  estimatedMarketValue: number;
  priceVerdict: string;
  priceVsMarket: string;
  negotiationRoom: string;
}

export interface AIPriceAnalysis {
  cars: AIPriceCarAnalysis[];
  summary: string;
}

export interface AICostEntry {
  name: string;
  depreciation: number;
  fuel: number;
  insurance: number;
  maintenance: number;
  repairs: number;
  total: number;
}

export interface AICostOfOwnership {
  threeYear: { cars: AICostEntry[] };
  fiveYear: { cars: AICostEntry[] };
  summary: string;
}

export interface AIDepreciationCar {
  name: string;
  currentValue: number;
  year1Value: number;
  year3Value: number;
  year5Value: number;
  retentionRate5Year: string;
}

export interface AIDepreciation {
  cars: AIDepreciationCar[];
  summary: string;
}

export interface AISafetyCar {
  name: string;
  overallRating: number;
  frontalCrash: number;
  sideCrash: number;
  rollover: number;
  recallCount: number;
  majorRecalls: string[];
  safetyFeatures: string[];
}

export interface AISafety {
  cars: AISafetyCar[];
  summary: string;
}

export interface AIFuelEconomyCar {
  name: string;
  cityMPG: number;
  highwayMPG: number;
  combinedMPG: number;
  annualFuelCost: number;
  co2Emissions: number;
  fuelType: string;
}

export interface AIFuelEconomy {
  cars: AIFuelEconomyCar[];
  summary: string;
}

export interface AIReliabilityCar {
  name: string;
  complaintCount: number;
  topProblems: { component: string; count: number }[];
  reliabilityScore: number;
  commonIssues: string;
}

export interface AIReliability {
  cars: AIReliabilityCar[];
  summary: string;
}

export interface AIFeatureRow {
  feature: string;
  /** Array format: hasFeature[0]=car1, hasFeature[1]=car2, etc. Supports "yes"/"no"/"unverified" strings and legacy booleans */
  hasFeature?: (boolean | string | null)[];
  /** @deprecated Legacy 2-car fields kept for backward compat */
  car1?: boolean;
  /** @deprecated Legacy 2-car fields kept for backward compat */
  car2?: boolean;
}

export interface AIFeatures {
  comparisonTable: AIFeatureRow[];
  summary: string;
}

export interface AIPriorityScores {
  safety: number;
  fuelEconomy: number;
  reliability: number;
  resaleValue: number;
  performance: number;
  technology: number;
  comfort: number;
  maintenanceCost: number;
}

export interface AIUserPriorityMatchCar {
  name: string;
  scores: AIPriorityScores;
  overallMatch: number;
  bestFor: string;
}

export interface AIUserPriorityMatch {
  cars: AIUserPriorityMatchCar[];
}

export interface AIFinalVerdict {
  winner: string;
  scores: { name: string; overall: number }[];
  bestForScenarios: { scenario: string; winner: string }[];
  finalStatement: string;
}

export interface AIAnalysisReport {
  reportType: "free" | "single" | "pro";
  executiveSummary: AIExecutiveSummary;
  vehicleSpecs: AIVehicleSpecs;
  priceAnalysis?: AIPriceAnalysis;
  costOfOwnership?: AICostOfOwnership;
  depreciation?: AIDepreciation;
  safety: AISafety;
  fuelEconomy?: AIFuelEconomy;
  reliability?: AIReliability;
  features?: AIFeatures;
  userPriorityMatch?: AIUserPriorityMatch;
  finalVerdict: AIFinalVerdict;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                       STORED REPORT TYPE                               */
/* ═══════════════════════════════════════════════════════════════════════ */

export interface StoredReport {
  id: string;
  createdAt: string;
  cars: EnrichedCar[];
  analysis: AIAnalysisReport;
  preferences: UserPreferences;
  plan: string;
  enrichmentContext: string;
  /** User-set custom name (from dashboard rename). Undefined if not renamed. */
  customName?: string | null;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                        API REQUEST/RESPONSE                            */
/* ═══════════════════════════════════════════════════════════════════════ */

export interface ScrapeRequest {
  urls: string[];
}

export interface ScrapeResponse {
  cars: ScrapedCar[];
}

export interface AnalyzeRequest {
  urls: string[];
  manualEntries?: ManualCarEntry[];
  preferences: UserPreferences;
  plan: string;
}

export interface AnalyzeResponse {
  cars: EnrichedCar[];
  enrichmentContext: string;
  reportId?: string;
  analysis?: AIAnalysisReport;
}
