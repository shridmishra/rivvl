import Anthropic from "@anthropic-ai/sdk";
import type { RawHomeListing } from "./listingFetcher";
import type { HomeRiskProfile, CensusTractData, NearbySchool, CrimeData } from "./dataFetcher";

/* ═══════════════════════════════════════════════════════════════════════ */
/*                            TYPES                                      */
/* ═══════════════════════════════════════════════════════════════════════ */

export interface PropertyAnalysis {
  address: string;
  priceScore: number;
  locationScore: number;
  valueScore: number;
  riskScore: number | null;
  overallScore: number;
  pros: string[];
  cons: string[];
  riskSummary: string;
  estimatedMonthlyOwnership: string;
  keyFacts: { label: string; value: string }[];
  riskProfile: HomeRiskProfile | null;
}

export interface NegotiationIntelligence {
  marketPosition: string;
  daysOnMarketAnalysis: string;
  suggestedOfferRange: string;
  concessionOpportunities: string;
  redFlags: string;
  negotiationStrength: "strong_buyer" | "balanced" | "sellers_market";
}

export interface MaintenanceItem {
  system: string;
  typicalLifespan: string;
  riskLevel: "green" | "yellow" | "red";
  estimatedCost: string;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                    SPRINT 1 FEATURE TYPES                             */
/* ═══════════════════════════════════════════════════════════════════════ */

export interface ClosingCostEstimate {
  loanOriginationFee: number;
  titleInsurance: number;
  appraisalFee: number;
  homeInspection: number;
  attorneyFee: number;
  prepaidPropertyTax: number;
  firstYearInsurance: number;
  escrowSetup: number;
  downPayment: number;
  totalCashToClose: number;
}

export interface InsuranceEstimate {
  baseAnnualPremium: number;
  adjustedAnnualPremium: number;
  annualRangeLow: number;
  annualRangeHigh: number;
  monthlyEstimate: number;
  floodInsuranceRequired: boolean;
  floodInsuranceEstimateLow: number | null;
  floodInsuranceEstimateHigh: number | null;
  totalAnnualInsuranceLow: number;
  totalAnnualInsuranceHigh: number;
  multipliers: string[];
}

export interface TaxReassessment {
  assessedValue: number | null;
  listingPrice: number;
  assessmentGap: number | null;
  gapPercentage: number | null;
  isReassessmentRisk: boolean;
  estimatedCurrentAnnualTax: number | null;
  estimatedPostPurchaseAnnualTax: number;
  estimatedAnnualTaxIncrease: number | null;
}

export interface HoaRiskData {
  riskLevel: "low" | "medium" | "high";
  riskObservations: string[];
  agentQuestions: string[];
  monthlyFee: number;
}

export interface RedFlagItem {
  text: string;
  severity: "amber" | "red";
}

export interface RedFlagsData {
  rulesFlags: RedFlagItem[];
  aiRedFlags: string[];
  noFlagsDetected: boolean;
}

export interface LoanProgram {
  name: string;
  minDownPayment: string;
  estimatedMonthlyPayment: string;
  keyRequirement: string;
}

export interface LoanProgramEligibility {
  programs: LoanProgram[];
  stateProgram: string;
  state: string;
}

export interface FloodInsuranceEstimate {
  floodZone: string;
  required: boolean;
  estimateLow: number | null;
  estimateHigh: number | null;
  note: string;
  nfipCoverageNote: string | null;
}

export interface HomeComparisonReport {
  summary: string;
  property1Summary?: string;
  property2Summary?: string;
  properties: PropertyAnalysis[];
  ourPick: {
    winner: number;
    reasoning: string;
    address?: string;
    bullets?: string[];
    narrative?: string;
    caveat?: string;
  } | null;
  finalVerdict?: string | null;
  generatedAt: string;
  dataQuality: "complete" | "partial";
  isPremium?: boolean;
  // Paid report sections
  scoreAnalysis?: Record<string, string>;
  fullFinancialAnalysis?: string;
  neighborhoodIntelligence?: string;
  neighborhoodIntelligenceStructured?: { bullets: string[]; verdict: string }[];
  commuteAnalysis?: string;
  investmentPerspective?: string;
  investmentOutlookStructured?: { bullets: string[]; verdict: string }[];
  comparableContext?: string;
  detailedComparison?: { label: string; values: string[] }[];
  // New paid sections
  negotiationIntelligence?: NegotiationIntelligence[];
  schoolDistrictContext?: string;
  schoolDistrictContextStructured?: { bullets: string[]; verdict: string }[];
  maintenanceAnalysis?: MaintenanceItem[][];
  investmentOutlook?: string;
  buyerProtectionChecklist?: { item: string; why: string; howToFind: string }[][];
  questionsToAskAgent?: { property: string; category: string; question: string; whyItMatters: string }[];
  priceHistoryInsights?: string[][];
  priceHistoryComparison?: string;
  // Sprint 1 features (per-property arrays, nulls preserve index alignment)
  closingCosts?: (ClosingCostEstimate | null)[];
  insuranceEstimate?: (InsuranceEstimate | null)[];
  taxReassessment?: (TaxReassessment | null)[];
  hoaRisk?: (HoaRiskData | null)[];
  redFlags?: RedFlagsData[];
  loanPrograms?: (LoanProgramEligibility | null)[];
  floodInsurance?: FloodInsuranceEstimate[];
}

interface PropertyInput {
  listing: RawHomeListing;
  riskProfile: HomeRiskProfile | null;
}

export interface PaidEnrichmentData {
  censusTract: (CensusTractData | null)[];
  schools: NearbySchool[][];
  crimeData?: (CrimeData | null)[];
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                       SYSTEM PROMPT                                   */
/* ═══════════════════════════════════════════════════════════════════════ */

const SYSTEM_PROMPT = `You are an expert real estate analyst. Return ONLY valid JSON (no markdown, no fences). No em dashes, use commas/periods.

CORE RULES:
- Never fabricate data. Label AI inferences as "AI Analysis:".
- Scores: 1-10 integers. riskScore 10 = safest. Set riskScore to null if no risk data.
- scoreAnalysis property_risk: MUST reference the actual RISK PROFILE data provided (flood zone, radon zone, wildfire risk, earthquake risk, lead/asbestos flags). Explain WHY the risk score was assigned by citing specific risk factors from the RISK PROFILE section. Never say "risk data is unavailable" or "No risk profile data was provided" when a RISK PROFILE section exists for the property.
- Specific pros/cons referencing actual data. Never list missing data as a pro/con.
- estimatedMonthlyOwnership: 30yr fixed at 7%, 20% down, plus HOA and insurance.
- If buyer preferences given, weight ourPick toward them explicitly.
- If limited data, focus on what IS available. Reframe gaps as agent questions.
- HOA RULE: Only list "no HOA" as pro if confirmed "None". If "Not listed", note as unknown needing verification.

SECTION RULES:
- negotiationIntelligence: DOM <14 = seller strong, 15-45 = balanced, 46-90 = buyer leverage, >90 = strong buyer. Suggest offer % below asking.
- maintenanceAnalysis: Use year built for system risk (green/yellow/red). Industry-standard cost ranges only.
- schoolDistrictContext: Reference actual school data provided. If none: "School data temporarily unavailable."
- neighborhoodIntelligence: REQUIRED when Census data is provided in the property data. Use the actual median household income, owner-occupancy rate, and median home value from the NEIGHBORHOOD CENSUS DATA section. Always cite the actual numbers — do not say "Census data was not provided" if NEIGHBORHOOD CENSUS DATA is present in the property data above. Label source level (tract/ZIP/state). Include specific numbers. Max 2-3 concise sentences per data point. If no Census data was provided: "Census data temporarily unavailable."
- neighborhoodIntelligenceStructured: REQUIRED when Census data is provided. Each entry must include 2-3 bullets citing specific Census numbers (max 1 sentence each). Use the actual numbers from NEIGHBORHOOD CENSUS DATA — never generate placeholder or estimated values.
- CRIME DATA RULE: When CRIME DATA is provided for a property, reference the actual violent crime rate and property crime rate in neighborhoodIntelligence and the safety-related portions of the analysis. Never say "Crime statistics could not be retrieved" when CRIME DATA is present in the property data.
- investmentOutlook: DOM <30 = seller's market, >60 = buyer's market.
- ourPick: include ourPickAddress, ourPickBullets (3-4 with specific data), ourPickNarrative (4-5 sentences), ourPickCaveat.
- buyerProtectionChecklist: Include standard 10 items (inspection, disclosure, title, flood zone, schools, HOA financials, permits, utilities, insurance quotes, final walkthrough). Add property-specific items for: pre-1978 (lead), pre-1980 (asbestos), 1985-2000 (aging systems), flood zones A/V, HOA >$300/mo, DOM >60, price reductions.`;

/* ═══════════════════════════════════════════════════════════════════════ */
/*                      BUILD USER PROMPT                                */
/* ═══════════════════════════════════════════════════════════════════════ */

function buildUserPrompt(properties: PropertyInput[], preferences?: { priorities?: string[]; buyerSituation?: string; mustHaves?: string[] }, paidEnrichment?: PaidEnrichmentData): string {
  const propertyDescriptions = properties
    .map((p, i) => {
      const l = p.listing;
      const r = p.riskProfile;

      let riskInfo = "Risk data unavailable.";
      if (r) {
        riskInfo = `Flood Zone: ${r.floodZone.code ?? "Unknown"} (SFHA: ${r.floodZone.isSFHA}, Risk: ${r.floodZone.riskLevel})
Superfund Sites: ${r.superfundSites.count1mile} within 1 mile, ${r.superfundSites.count3mile} within 3 miles
Earthquake Risk: ${r.earthquakeRisk.riskLevel} (${r.earthquakeRisk.eventCount} events, max magnitude: ${r.earthquakeRisk.maxMagnitude ?? "N/A"})
Wildfire Risk: ${r.wildfireRisk.riskLevel}
Air Quality Score: ${r.airQuality.score ?? "N/A"} (${r.airQuality.description ?? "Unknown"})
Radon Zone: ${r.radonZone.zone ?? "Unknown"} (${r.radonZone.riskLabel})
Lead Paint Risk: ${r.leadPaintRisk ? "Yes (pre-1978)" : "No"}
Asbestos Risk: ${r.asbestosRisk ? "Yes (pre-1980)" : "No"}`;
      }

      return `PROPERTY ${i + 1}:
Address: ${l.fullAddress ?? l.address ?? "Unknown"}
Price: ${l.price ? `$${l.price.toLocaleString()}` : "Unknown"}
Beds: ${l.beds ?? "Unknown"} | Baths: ${l.baths ?? "Unknown"} | Sqft: ${l.sqft?.toLocaleString() ?? "Unknown"}
Lot Size: ${l.lotSize ?? "Unknown"}
Year Built: ${l.yearBuilt ?? "Unknown"}
Property Type: ${l.propertyType ?? "Unknown"}
HOA Fee: ${l.hoaFee ? `$${l.hoaFee}/month (confirmed)` : (l as unknown as Record<string, unknown>).hoaStatus === 'confirmed_none' ? "None (confirmed)" : "Not listed in listing. Verify with agent"}
Days on Market: ${l.daysOnMarket ?? "Unknown"}
Price/Sqft: ${l.pricePerSqft ? `$${l.pricePerSqft}` : "Unknown"}
Parking Spaces: ${l.parkingSpaces ?? "Unknown"} | Garage: ${l.hasGarage ?? "Unknown"} | Pool: ${l.hasPool ?? "Unknown"} | Basement: ${l.hasBasement ?? "Unknown"}
Description: ${l.description ? l.description.slice(0, 300) : "Not available"}
Data Quality: ${l.dataQuality}

RISK PROFILE:
${riskInfo}

PRICE HISTORY:
${l.priceHistory && l.priceHistory.length > 0 ? l.priceHistory.slice(0, 5).map(ph => `${ph.date}: ${ph.event}: ${ph.price ? '$' + ph.price.toLocaleString() : 'N/A'}${ph.priceChange ? ' (change: $' + ph.priceChange.toLocaleString() + ')' : ''}`).join('\n') : 'No price history available'}
Last Sale: ${l.lastSalePrice ? '$' + l.lastSalePrice.toLocaleString() + (l.lastSaleDate ? ' on ' + l.lastSaleDate : '') : 'Not available'}${(() => {
        // Add Census tract data if available
        const census = paidEnrichment?.censusTract?.[i];
        console.log(`[AI-PROMPT] Property ${i + 1} census: ${census ? census.source + ' (income: ' + census.medianHouseholdIncome + ')' : 'none'}`);
        if (census) {
          const sourceNote = census.source === "tract" ? "(Census tract-level)" : census.source === "zip" ? "(ZIP code-level)" : "(State-level data, neighborhood data unavailable for this address)";
          return `

NEIGHBORHOOD CENSUS DATA ${sourceNote}:
Median Household Income: ${census.medianHouseholdIncome ? '$' + census.medianHouseholdIncome.toLocaleString() : 'Not available'}
Owner-Occupancy Rate: ${census.ownerOccupiedPct !== null ? census.ownerOccupiedPct + '%' : 'Not available'}
Median Home Value (Census): ${census.medianHomeValue ? '$' + census.medianHomeValue.toLocaleString() : 'Not available'}
Data Source: ${census.geoLabel}`;
        }
        return '';
      })()}${(() => {
        // Add nearby schools data if available
        const schools = paidEnrichment?.schools?.[i];
        console.log(`[AI-PROMPT] Property ${i + 1} schools: ${schools ? schools.length + ' schools' : 'none'}`);
        if (schools && schools.length > 0) {
          const schoolLines = schools.slice(0, 5).map(s =>
            `  ${s.name} (${s.level}, ${s.distanceMiles} mi, ${s.enrollment ? s.enrollment.toLocaleString() + ' students' : 'enrollment N/A'}, district: ${s.district || 'N/A'})`
          ).join('\n');
          return `

NEARBY SCHOOLS (from NCES data):
${schoolLines}`;
        }
        return '';
      })()}${(() => {
        // Add crime data if available
        const crime = paidEnrichment?.crimeData?.[i];
        console.log(`[AI-PROMPT] Property ${i + 1} crime: ${crime ? 'violent=' + crime.violentCrimeRate + ', property=' + crime.propertyCrimeRate : 'none'}`);
        if (crime) {
          return `

CRIME DATA (FBI UCR, ${crime.jurisdiction}, ${crime.year}):
Violent Crime Rate: ${crime.violentCrimeRate.toLocaleString()} per 100,000 (national avg ~380; ${crime.vsNationalViolent === 'below' ? 'BELOW average' : crime.vsNationalViolent === 'above' ? 'ABOVE average' : 'near average'})
Property Crime Rate: ${crime.propertyCrimeRate.toLocaleString()} per 100,000 (national avg ~2,100; ${crime.vsNationalProperty === 'below' ? 'BELOW average' : crime.vsNationalProperty === 'above' ? 'ABOVE average' : 'near average'})
Source: ${crime.dataNote}`;
        }
        return '';
      })()}`;
    })
    .join("\n\n---\n\n");

  let preferencesSection = "";
  if (preferences) {
    const parts: string[] = [];
    if (preferences.priorities && preferences.priorities.length > 0) {
      parts.push(`BUYER PRIORITIES (what matters most): ${preferences.priorities.join(", ")}`);
    }
    if (preferences.buyerSituation) {
      parts.push(`BUYER SITUATION: ${preferences.buyerSituation}`);
    }
    if (preferences.mustHaves && preferences.mustHaves.length > 0) {
      parts.push(`MUST HAVES: ${preferences.mustHaves.join(", ")}`);
    }
    if (parts.length > 0) {
      preferencesSection = `\n\nBUYER PREFERENCES:\n${parts.join("\n")}\n\nIMPORTANT: The buyer has told us what matters most to them. Your "ourPick" recommendation MUST explicitly reference these preferences. For example: "The buyer prioritized [X] and [Y] - Property [N] scores significantly better on both dimensions." Weight your scoring and recommendation toward what the buyer told us matters.`;
    }
  }

  const isPaidReport = properties.some(p => (p as unknown as Record<string, unknown>).isPaidReport === true);

  const baseSchema = `{
  "summary": "2 concise sentences overview of the comparison",
  "property1Summary": "2 concise sentences about Property 1, strengths and key concerns",
  "property2Summary": "2 concise sentences about Property 2, strengths and key concerns",
  "properties": [
    {
      "address": "full address",
      "priceScore": 1-10,
      "locationScore": 1-10,
      "valueScore": 1-10,
      "riskScore": 1-10 or null if no risk data,
      "overallScore": 1-10,
      "pros": ["3-4 genuine pros max"],
      "cons": ["3-4 genuine cons max"],
      "riskSummary": "plain English summary of all risk flags",
      "estimatedMonthlyOwnership": "mortgage estimate + HOA + estimated insurance note",
      "keyFacts": [{"label": "...", "value": "..."}, ...] (8-10 key data points)
    }
  ],
  "ourPick": {"winner": 1, "reasoning": "2-3 concise sentences explaining why this property wins, referencing specific data points"},
  "ourPickAddress": "the full address of the winning property",
  "ourPickBullets": ["3 specific data comparison bullet strings, each referencing a concrete number, e.g. '$150/month lower total estimated cost'"],
  "ourPickNarrative": "2-3 concise sentence paragraph explaining the recommendation with specific data references",
  "ourPickCaveat": "one sentence honest caveat about the recommended property"`;

  const paidSchema = isPaidReport ? `,
  "scoreAnalysis": {"property1_price": "2-3 sentences", "property1_location": "...", "property1_value": "...", "property1_risk": "...", "property2_price": "...", "property2_location": "...", "property2_value": "...", "property2_risk": "..."},
  "negotiationIntelligence": [{"marketPosition": "1-2 sentences", "daysOnMarketAnalysis": "1-2 sentences", "suggestedOfferRange": "AI Estimate range", "concessionOpportunities": "1-2 sentences", "redFlags": "1 sentence or None", "negotiationStrength": "strong_buyer|balanced|sellers_market"}],
  "neighborhoodIntelligence": "Use actual Census data provided. 2-3 concise sentences per property max.",
  "neighborhoodIntelligenceStructured": [{"bullets": ["2-3 bullets with Census data, max 1 sentence each"], "verdict": "1 comparison sentence"}],
  "schoolDistrictContext": "Reference actual school data. 2-3 concise sentences per property max.",
  "schoolDistrictContextStructured": [{"bullets": ["2-3 bullets with school names/distances"], "verdict": "1 comparison sentence"}],
  "maintenanceAnalysis": [[{"system": "Roof|HVAC|Water Heater|Electrical|Windows|Plumbing", "typicalLifespan": "string", "riskLevel": "green|yellow|red", "estimatedCost": "range"}]],
  "investmentOutlook": "2-3 concise sentences per property on market conditions.",
  "investmentOutlookStructured": [{"bullets": ["2-3 bullets"], "verdict": "1 comparison sentence"}],
  "commuteAnalysis": "2-3 concise sentences total",
  "investmentPerspective": "2-3 concise sentences per property",
  "comparableContext": "1-2 concise sentences",
  "buyerProtectionChecklist": [[{"item": "string", "why": "1 sentence", "howToFind": "1 sentence"}]],
  "questionsToAskAgent": [{"property": "address", "category": "category", "question": "specific question", "whyItMatters": "1 sentence"}],
  "priceHistoryInsights": [["1 concise insight per property"]],
  "priceHistoryComparison": "1-2 sentence comparison. IMPORTANT: If a Last Sale price or date is provided in the PRICE HISTORY data, never say the property has no sale history or that sale data is unavailable. Reference the actual numbers."` : "";

  // Add instruction for questions generation
  const questionsInstruction = isPaidReport ? `

AGENT QUESTIONS: Generate 9 total maximum. 3 per property (by category: Financial, Condition, Disclosure) plus 3 shared (market, timing, offers). Each must reference actual data from this report. Trigger questions for: unknown year built, unlisted HOA, DOM >14, DOM >30, yearBuilt <1990, price reductions, price/sqft gaps, flood zones A/V. IMPORTANT: Questions in the shared/all-properties section must NOT repeat or rephrase any question already included in property-specific questions. Each question must appear exactly once across the entire output.` : "";

  return `Compare the following ${properties.length} properties and return a JSON object matching this exact schema:

${baseSchema}${paidSchema}
}${questionsInstruction}

PROPERTY DATA:

${propertyDescriptions}${preferencesSection}`;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                     GENERATE COMPARISON                               */
/* ═══════════════════════════════════════════════════════════════════════ */

export async function generateHomeComparison(
  properties: PropertyInput[],
  preferences?: { priorities?: string[]; buyerSituation?: string; mustHaves?: string[] },
  isPaidReport?: boolean,
  paidEnrichment?: PaidEnrichmentData
): Promise<HomeComparisonReport> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return makeErrorReport(properties, "ANTHROPIC_API_KEY is not configured");
  }

  const client = new Anthropic({ apiKey });
  const taggedProperties = isPaidReport
    ? properties.map(p => ({ ...p, isPaidReport: true }))
    : properties;
  const userPrompt = buildUserPrompt(taggedProperties as unknown as PropertyInput[], preferences, paidEnrichment);

  const maxAttempts = 1;
  let lastError: string = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[homes-comparison] Starting AI call (attempt ${attempt}/${maxAttempts}, model claude-sonnet-4-6, max_tokens 16384)`);
      console.log('[HOMES AI] Prompt character count:', userPrompt.length, 'Estimated tokens:', Math.round(userPrompt.length / 4));
      const startTime = Date.now();

      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 16384,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });

      console.log(`[homes-comparison] AI call succeeded in ${Date.now() - startTime}ms, stop_reason: ${message.stop_reason}`);

      const textBlock = message.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("No text response from AI");
      }

      const rawText = textBlock.text;
      if (message.stop_reason === 'max_tokens') {
        console.warn('[HOMES AI] Response hit token limit at', rawText.length, 'chars — attempting partial parse');
        // fall through to safeParseJSON — do NOT throw here
      }

      let parsed: Record<string, unknown>;
      try {
        parsed = safeParseJSON(rawText) as Record<string, unknown>;
      } catch (parseErr) {
        if (message.stop_reason === 'max_tokens') {
          console.error('[HOMES AI] Truncated response could not be parsed:', parseErr instanceof Error ? parseErr.message : String(parseErr));
          throw new Error('AI response was truncated and could not be parsed');
        }
        throw parseErr;
      }

      // Validate and build report
      const report: HomeComparisonReport = {
        summary:
          typeof parsed.summary === "string"
            ? parsed.summary
            : "Comparison analysis completed.",
        ...(typeof parsed.property1Summary === "string"
          ? { property1Summary: parsed.property1Summary }
          : {}),
        ...(typeof parsed.property2Summary === "string"
          ? { property2Summary: parsed.property2Summary }
          : {}),
        properties: mapProperties(
          parsed.properties as Record<string, unknown>[],
          properties
        ),
        ourPick: parsed.ourPick
          ? {
              winner:
                (parsed.ourPick as Record<string, unknown>).winner as number,
              reasoning: (parsed.ourPick as Record<string, unknown>)
                .reasoning as string,
              address: parsed.ourPickAddress as string,
              bullets: parsed.ourPickBullets as string[],
              narrative: parsed.ourPickNarrative as string,
              caveat: parsed.ourPickCaveat as string,
            }
          : null,
        finalVerdict:
          typeof parsed.finalVerdict === "string"
            ? parsed.finalVerdict
            : null,
        generatedAt: new Date().toISOString(),
        dataQuality: properties.some(
          (p) => p.listing.dataQuality === "insufficient"
        )
          ? "partial"
          : "complete",
        // Paid report sections
        ...(typeof parsed.scoreAnalysis === "object" && parsed.scoreAnalysis
          ? { scoreAnalysis: parsed.scoreAnalysis as Record<string, string> }
          : {}),
        ...(typeof parsed.neighborhoodIntelligence === "string"
          ? { neighborhoodIntelligence: parsed.neighborhoodIntelligence }
          : {}),
        ...(Array.isArray(parsed.neighborhoodIntelligenceStructured)
          ? { neighborhoodIntelligenceStructured: parsed.neighborhoodIntelligenceStructured as { bullets: string[]; verdict: string }[] }
          : {}),
        ...(typeof parsed.commuteAnalysis === "string"
          ? { commuteAnalysis: parsed.commuteAnalysis }
          : {}),
        ...(typeof parsed.investmentPerspective === "string"
          ? { investmentPerspective: parsed.investmentPerspective }
          : {}),
        ...(typeof parsed.comparableContext === "string"
          ? { comparableContext: parsed.comparableContext }
          : {}),
        ...(Array.isArray(parsed.negotiationIntelligence)
          ? { negotiationIntelligence: parsed.negotiationIntelligence as NegotiationIntelligence[] }
          : {}),
        ...(typeof parsed.schoolDistrictContext === "string"
          ? { schoolDistrictContext: parsed.schoolDistrictContext }
          : {}),
        ...(Array.isArray(parsed.schoolDistrictContextStructured)
          ? { schoolDistrictContextStructured: parsed.schoolDistrictContextStructured as { bullets: string[]; verdict: string }[] }
          : {}),
        ...(Array.isArray(parsed.maintenanceAnalysis)
          ? { maintenanceAnalysis: parsed.maintenanceAnalysis as MaintenanceItem[][] }
          : {}),
        ...(typeof parsed.investmentOutlook === "string"
          ? { investmentOutlook: parsed.investmentOutlook }
          : {}),
        ...(Array.isArray(parsed.investmentOutlookStructured)
          ? { investmentOutlookStructured: parsed.investmentOutlookStructured as { bullets: string[]; verdict: string }[] }
          : {}),
        ...(Array.isArray(parsed.buyerProtectionChecklist)
          ? { buyerProtectionChecklist: parsed.buyerProtectionChecklist as { item: string; why: string; howToFind: string }[][] }
          : {}),
        ...(Array.isArray(parsed.questionsToAskAgent)
          ? { questionsToAskAgent: parsed.questionsToAskAgent as { property: string; category: string; question: string; whyItMatters: string }[] }
          : {}),
        ...(Array.isArray(parsed.priceHistoryInsights)
          ? { priceHistoryInsights: parsed.priceHistoryInsights as string[][] }
          : {}),
        ...(typeof parsed.priceHistoryComparison === "string"
          ? { priceHistoryComparison: parsed.priceHistoryComparison }
          : {}),
      };

      return report;
    } catch (err) {
      const isTimeout = err instanceof Error && (err.message.includes("timeout") || err.message.includes("ETIMEDOUT"));
      lastError = isTimeout
        ? `AI request timed out: ${err instanceof Error ? err.message : String(err)}`
        : err instanceof Error ? err.message : "Unknown error during AI analysis";
      console.error(
        `[homes-comparison] Attempt ${attempt}/${maxAttempts} failed (timeout=${isTimeout}):`,
        lastError,
        err
      );

      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  return makeErrorReport(properties, lastError);
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                          HELPERS                                      */
/* ═══════════════════════════════════════════════════════════════════════ */

function mapProperties(
  parsed: Record<string, unknown>[] | undefined,
  inputs: PropertyInput[]
): PropertyAnalysis[] {
  if (!Array.isArray(parsed)) {
    return inputs.map((p) => makeDefaultAnalysis(p));
  }

  return inputs.map((input, i) => {
    const p = parsed[i] as Record<string, unknown> | undefined;
    if (!p) return makeDefaultAnalysis(input);

    return {
      address:
        typeof p.address === "string"
          ? p.address
          : input.listing.fullAddress ?? "Unknown",
      priceScore: clampScore(p.priceScore),
      locationScore: clampScore(p.locationScore),
      valueScore: clampScore(p.valueScore),
      riskScore: p.riskScore === null ? null : clampScore(p.riskScore),
      overallScore: clampScore(p.overallScore),
      pros: Array.isArray(p.pros)
        ? p.pros.filter((x): x is string => typeof x === "string").slice(0, 5)
        : [],
      cons: Array.isArray(p.cons)
        ? p.cons.filter((x): x is string => typeof x === "string").slice(0, 5)
        : [],
      riskSummary:
        typeof p.riskSummary === "string"
          ? p.riskSummary
          : "Risk data analysis unavailable.",
      estimatedMonthlyOwnership:
        typeof p.estimatedMonthlyOwnership === "string"
          ? p.estimatedMonthlyOwnership
          : "Estimate unavailable",
      keyFacts: Array.isArray(p.keyFacts)
        ? p.keyFacts
            .filter(
              (
                f
              ): f is { label: string; value: string } =>
                typeof f === "object" &&
                f !== null &&
                typeof (f as Record<string, unknown>).label === "string" &&
                typeof (f as Record<string, unknown>).value === "string"
            )
            .slice(0, 10)
        : [],
      riskProfile: input.riskProfile,
    };
  });
}

function makeDefaultAnalysis(input: PropertyInput): PropertyAnalysis {
  return {
    address: input.listing.fullAddress ?? "Unknown",
    priceScore: 5,
    locationScore: 5,
    valueScore: 5,
    riskScore: input.riskProfile ? 5 : null,
    overallScore: 5,
    pros: ["Data was limited for this property"],
    cons: ["Unable to generate full analysis due to limited data"],
    riskSummary: "Risk assessment unavailable due to limited data.",
    estimatedMonthlyOwnership: "Estimate unavailable",
    keyFacts: [],
    riskProfile: input.riskProfile,
  };
}

function makeErrorReport(
  properties: PropertyInput[],
  error: string
): HomeComparisonReport {
  console.error("[homes-comparison] Returning error report:", error);
  return {
    summary: `We were able to gather property data but the AI comparison could not be completed. Error: ${error}`,
    properties: properties.map((p) => makeDefaultAnalysis(p)),
    ourPick: null,
    finalVerdict: null,
    generatedAt: new Date().toISOString(),
    dataQuality: "partial",
  };
}

function clampScore(v: unknown): number {
  if (typeof v !== "number" || isNaN(v)) return 5;
  return Math.max(1, Math.min(10, Math.round(v)));
}

function safeParseJSON(raw: string): unknown {
  if (!raw || !raw.trim()) {
    throw new Error("AI returned an empty response — no JSON to parse");
  }

  // Strip markdown code fences first (AI sometimes wraps JSON in ```json ... ```)
  let text = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  if (!text) {
    throw new Error("AI response was only whitespace or code fences — no JSON content");
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  // Remove trailing commas
  text = text.replace(/,(\s*[}\]])/g, "$1");

  return JSON.parse(text);
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*             SPRINT 1: FORMULA-BASED FEATURE CALCULATIONS              */
/* ═══════════════════════════════════════════════════════════════════════ */

// Feature 7: Flood Insurance Estimate (NFIP rate lookup)
export function calculateFloodInsurance(
  floodZoneCode: string | null
): FloodInsuranceEstimate {
  const zone = (floodZoneCode ?? "").toUpperCase().trim();

  if (zone.startsWith("VE") || zone === "V") {
    return {
      floodZone: zone || "V",
      required: true,
      estimateLow: 2000,
      estimateHigh: 4500,
      note: "Coastal high velocity zone. Flood insurance required by lender.",
      nfipCoverageNote: "NFIP coverage maximum is $250,000 for structure and $100,000 for contents. Properties above this value may need private flood insurance.",
    };
  }
  if (zone === "AE") {
    return {
      floodZone: zone,
      required: true,
      estimateLow: 800,
      estimateHigh: 1800,
      note: "Detailed study flood zone with base flood elevation known. Flood insurance required.",
      nfipCoverageNote: "NFIP coverage maximum is $250,000 for structure and $100,000 for contents. Properties above this value may need private flood insurance.",
    };
  }
  if (zone === "A" || (zone.startsWith("A") && zone !== "AO" && zone !== "AH" && zone !== "AE")) {
    return {
      floodZone: zone || "A",
      required: true,
      estimateLow: 1000,
      estimateHigh: 2400,
      note: "Approximate flood zone, no base flood elevation. Flood insurance required.",
      nfipCoverageNote: "NFIP coverage maximum is $250,000 for structure and $100,000 for contents. Properties above this value may need private flood insurance.",
    };
  }
  if (zone === "AO") {
    return {
      floodZone: zone,
      required: true,
      estimateLow: 900,
      estimateHigh: 1600,
      note: "Shallow flooding zone (sheet flow). Flood insurance required.",
      nfipCoverageNote: "NFIP coverage maximum is $250,000 for structure and $100,000 for contents. Properties above this value may need private flood insurance.",
    };
  }
  if (zone === "AH") {
    return {
      floodZone: zone,
      required: true,
      estimateLow: 900,
      estimateHigh: 1600,
      note: "Shallow flooding zone (ponding). Flood insurance required.",
      nfipCoverageNote: "NFIP coverage maximum is $250,000 for structure and $100,000 for contents. Properties above this value may need private flood insurance.",
    };
  }
  if (zone === "D") {
    return {
      floodZone: zone,
      required: false,
      estimateLow: null,
      estimateHigh: null,
      note: "Flood risk not determined. Request a flood zone determination from your lender.",
      nfipCoverageNote: null,
    };
  }
  // Zone X or unknown (minimal risk)
  return {
    floodZone: zone || "X",
    required: false,
    estimateLow: 400,
    estimateHigh: 700,
    note: "Minimal flood risk zone. Optional flood insurance available, typically $400 to $700 per year.",
    nfipCoverageNote: null,
  };
}

// Feature 2: Insurance Cost Estimator
export function calculateInsuranceEstimate(
  price: number,
  yearBuilt: number | null,
  floodZoneCode: string | null,
  wildfireRiskLevel: string | null,
  crimeAboveNational: boolean,
  sqft: number | null
): InsuranceEstimate {
  let baseAnnual = price * 0.0035;
  const multipliers: string[] = [];

  if (yearBuilt && yearBuilt < 1970) {
    baseAnnual *= 1.3;
    multipliers.push("Pre-1970 construction (+30%)");
  } else if (yearBuilt && yearBuilt >= 1970 && yearBuilt <= 1990) {
    baseAnnual *= 1.15;
    multipliers.push("1970 to 1990 construction (+15%)");
  }

  if (wildfireRiskLevel === "High" || wildfireRiskLevel === "Very High") {
    baseAnnual *= 1.25;
    multipliers.push("High wildfire risk area (+25%)");
  }

  if (crimeAboveNational) {
    baseAnnual *= 1.1;
    multipliers.push("Above average crime area (+10%)");
  }

  if (sqft && sqft > 3000) {
    baseAnnual *= 1.15;
    multipliers.push("Large property over 3,000 sq ft (+15%)");
  }

  const adjustedAnnual = Math.round(baseAnnual);
  const rangeLow = Math.round(adjustedAnnual * 0.9);
  const rangeHigh = Math.round(adjustedAnnual * 1.15);

  const flood = calculateFloodInsurance(floodZoneCode);

  return {
    baseAnnualPremium: Math.round(price * 0.0035),
    adjustedAnnualPremium: adjustedAnnual,
    annualRangeLow: rangeLow,
    annualRangeHigh: rangeHigh,
    monthlyEstimate: Math.round(adjustedAnnual / 12),
    floodInsuranceRequired: flood.required,
    floodInsuranceEstimateLow: flood.required ? flood.estimateLow : null,
    floodInsuranceEstimateHigh: flood.required ? flood.estimateHigh : null,
    totalAnnualInsuranceLow: rangeLow + (flood.required && flood.estimateLow ? flood.estimateLow : 0),
    totalAnnualInsuranceHigh: rangeHigh + (flood.required && flood.estimateHigh ? flood.estimateHigh : 0),
    multipliers,
  };
}

// Feature 1: Closing Cost Estimator
export function calculateClosingCosts(
  price: number,
  annualInsuranceEstimate: number,
  assessedValue: number | null
): ClosingCostEstimate {
  const downPayment = Math.round(price * 0.2);
  const loanAmount = price - downPayment;
  const loanOriginationFee = Math.round(loanAmount * 0.01);
  const titleInsurance = Math.round(price * 0.005);
  const appraisalFee = 500;
  const homeInspection = 400;
  const attorneyFee = 750;

  const annualTaxEstimate = assessedValue && assessedValue > 0
    ? assessedValue * 0.011
    : price * 0.011;
  const prepaidPropertyTax = Math.round((annualTaxEstimate / 12) * 2);

  const firstYearInsurance = annualInsuranceEstimate > 0
    ? annualInsuranceEstimate
    : Math.round(price * 0.005);

  const monthlyInsurance = Math.round(firstYearInsurance / 12);
  const monthlyTax = Math.round(annualTaxEstimate / 12);
  const escrowSetup = (monthlyInsurance * 2) + (monthlyTax * 2);

  const totalCashToClose = downPayment + loanOriginationFee + titleInsurance +
    appraisalFee + homeInspection + attorneyFee + prepaidPropertyTax +
    firstYearInsurance + escrowSetup;

  return {
    loanOriginationFee,
    titleInsurance,
    appraisalFee,
    homeInspection,
    attorneyFee,
    prepaidPropertyTax,
    firstYearInsurance,
    escrowSetup,
    downPayment,
    totalCashToClose,
  };
}

// Feature 3: Tax Reassessment Risk
export function calculateTaxReassessment(
  listingPrice: number,
  assessedValue: number | null
): TaxReassessment {
  if (assessedValue === null || assessedValue <= 0) {
    return {
      assessedValue: null,
      listingPrice,
      assessmentGap: null,
      gapPercentage: null,
      isReassessmentRisk: false,
      estimatedCurrentAnnualTax: null,
      estimatedPostPurchaseAnnualTax: Math.round(listingPrice * 0.011),
      estimatedAnnualTaxIncrease: null,
    };
  }

  const gap = listingPrice - assessedValue;
  const gapPct = (gap / assessedValue) * 100;
  const currentTax = Math.round(assessedValue * 0.011);
  const postPurchaseTax = Math.round(listingPrice * 0.011);

  return {
    assessedValue,
    listingPrice,
    assessmentGap: gap,
    gapPercentage: Math.round(gapPct * 10) / 10,
    isReassessmentRisk: gapPct > 15,
    estimatedCurrentAnnualTax: currentTax,
    estimatedPostPurchaseAnnualTax: postPurchaseTax,
    estimatedAnnualTaxIncrease: postPurchaseTax - currentTax,
  };
}

// Feature 6: Loan Program Eligibility
function calcMonthlyPayment(loanAmount: number, rate: number, years: number): number {
  const monthlyRate = rate / 12;
  const n = years * 12;
  if (monthlyRate === 0) return Math.round(loanAmount / n);
  return Math.round(loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1));
}

const STATE_PROGRAMS: Record<string, string> = {
  CA: "CalHFA down payment assistance, up to 3.5% of the purchase price.",
  TX: "TDHCA My First Texas Home program, up to 5% down payment assistance.",
  FL: "Florida Housing First Time Homebuyer Program with down payment and closing cost assistance.",
  NY: "SONYMA (State of New York Mortgage Agency) low interest rate program for first-time buyers.",
  WA: "Washington State Housing Finance Commission programs with down payment assistance.",
};

const STATE_NAME_MAP: Record<string, string> = {
  CALIFORNIA: "CA", TEXAS: "TX", FLORIDA: "FL", "NEW YORK": "NY",
  WASHINGTON: "WA", ILLINOIS: "IL", PENNSYLVANIA: "PA", OHIO: "OH",
  GEORGIA: "GA", "NORTH CAROLINA": "NC", MICHIGAN: "MI", "NEW JERSEY": "NJ",
  VIRGINIA: "VA", ARIZONA: "AZ", MASSACHUSETTS: "MA", TENNESSEE: "TN",
  INDIANA: "IN", MISSOURI: "MO", MARYLAND: "MD", WISCONSIN: "WI",
  COLORADO: "CO", MINNESOTA: "MN", "SOUTH CAROLINA": "SC", ALABAMA: "AL",
  LOUISIANA: "LA", KENTUCKY: "KY", OREGON: "OR", OKLAHOMA: "OK",
  CONNECTICUT: "CT", UTAH: "UT", IOWA: "IA", NEVADA: "NV",
  ARKANSAS: "AR", MISSISSIPPI: "MS", KANSAS: "KS", "NEW MEXICO": "NM",
  NEBRASKA: "NE", IDAHO: "ID", "WEST VIRGINIA": "WV", HAWAII: "HI",
  "NEW HAMPSHIRE": "NH", MAINE: "ME", MONTANA: "MT", "RHODE ISLAND": "RI",
  DELAWARE: "DE", "SOUTH DAKOTA": "SD", "NORTH DAKOTA": "ND",
  ALASKA: "AK", VERMONT: "VT", WYOMING: "WY",
};

export function calculateLoanPrograms(
  price: number,
  state: string | null
): LoanProgramEligibility {
  const rate = 0.07;
  const programs: LoanProgram[] = [];

  // FHA Loan — with conforming limit check
  const FHA_STANDARD_LIMIT = 498257;
  const FHA_HIGH_COST_LIMIT = 1149825;
  const fhaDown = Math.round(price * 0.035);
  const fhaLoan = price - fhaDown;
  const fhaMonthly = calcMonthlyPayment(fhaLoan, rate, 30);
  if (price > FHA_HIGH_COST_LIMIT) {
    programs.push({
      name: "FHA Loan",
      minDownPayment: "N/A",
      estimatedMonthlyPayment: "N/A",
      keyRequirement: "FHA Not Available. Purchase price exceeds FHA loan limits for this area ($1,149,825 high-cost ceiling). Conventional or jumbo financing required.",
    });
  } else if (price > FHA_STANDARD_LIMIT) {
    programs.push({
      name: "FHA Loan",
      minDownPayment: `3.5% ($${fhaDown.toLocaleString()})`,
      estimatedMonthlyPayment: `$${fhaMonthly.toLocaleString()}`,
      keyRequirement: "FHA Jumbo, available in high-cost areas like Northern VA and DC Metro. Confirm eligibility with your lender.",
    });
  } else {
    programs.push({
      name: "FHA Loan",
      minDownPayment: `3.5% ($${fhaDown.toLocaleString()})`,
      estimatedMonthlyPayment: `$${fhaMonthly.toLocaleString()}`,
      keyRequirement: "Available in all states. Requires mortgage insurance premium (MIP).",
    });
  }

  // VA Loan
  const vaMonthly = calcMonthlyPayment(price, rate, 30);
  programs.push({
    name: "VA Loan",
    minDownPayment: "0% ($0)",
    estimatedMonthlyPayment: `$${vaMonthly.toLocaleString()}`,
    keyRequirement: "Potentially eligible. Requires Certificate of Eligibility and military service verification.",
  });

  // Conventional 97
  const conv97Down = Math.round(price * 0.03);
  const conv97Loan = price - conv97Down;
  const conv97Monthly = calcMonthlyPayment(conv97Loan, rate, 30);
  const isNorthernVA = (state ?? "").toUpperCase().includes("VA") || (state ?? "").toUpperCase().includes("VIRGINIA");
  programs.push({
    name: "Conventional 97",
    minDownPayment: `3% ($${conv97Down.toLocaleString()})`,
    estimatedMonthlyPayment: `$${conv97Monthly.toLocaleString()}`,
    keyRequirement: isNorthernVA
      ? "First-time buyers (no home owned in last 3 years). Income limits apply. Northern VA income limits for this program may affect eligibility. Verify with lender."
      : "First-time buyers (no home owned in last 3 years). Income limits may apply.",
  });

  // Standard 20% down for comparison
  const stdDown = Math.round(price * 0.2);
  const stdLoan = price - stdDown;
  const stdMonthly = calcMonthlyPayment(stdLoan, rate, 30);
  programs.push({
    name: "Conventional (20% Down)",
    minDownPayment: `20% ($${stdDown.toLocaleString()})`,
    estimatedMonthlyPayment: `$${stdMonthly.toLocaleString()}`,
    keyRequirement: "No PMI required. Best monthly payment but highest upfront cost.",
  });

  const stateUpper = (state ?? "").toUpperCase().trim();
  const stateCode = stateUpper.length === 2
    ? stateUpper
    : (STATE_NAME_MAP[stateUpper] ?? "");

  const stateProgram = STATE_PROGRAMS[stateCode]
    ?? "Your state likely has a down payment assistance program. Visit hud.gov/buying/localbuying for state-specific programs.";

  return { programs, stateProgram, state: stateCode || state || "Unknown" };
}

// Feature 5: Red Flags (rules-based detection)
export function calculateRedFlags(
  listing: RawHomeListing,
  riskProfile: HomeRiskProfile | null,
  assessedValue: number | null,
  floodInsurance: FloodInsuranceEstimate
): RedFlagItem[] {
  const flags: RedFlagItem[] = [];
  const price = listing.price;

  // Days on market
  if (listing.daysOnMarket !== null && listing.daysOnMarket > 120) {
    flags.push({
      text: `${listing.daysOnMarket} days on market, significantly above average. This property may have undisclosed issues, pricing problems, or failed prior contracts. Request full history.`,
      severity: "red",
    });
  } else if (listing.daysOnMarket !== null && listing.daysOnMarket > 90) {
    flags.push({
      text: `${listing.daysOnMarket} days on market, significantly above average. This property may have undisclosed issues, pricing problems, or failed prior contracts. Request full history.`,
      severity: "red",
    });
  } else if (listing.daysOnMarket !== null && listing.daysOnMarket > 60) {
    flags.push({
      text: `${listing.daysOnMarket} days on market, ask seller why it has not sold and request any inspection reports from prior buyers.`,
      severity: "amber",
    });
  } else if (listing.daysOnMarket !== null && listing.daysOnMarket > 30) {
    flags.push({
      text: `${listing.daysOnMarket} days on market, slightly above average. Ask agent about buyer feedback.`,
      severity: "amber",
    });
  }

  // Price reductions
  const reductions = (listing.priceHistory ?? []).filter(e => e.event === "Price Reduced");
  if (reductions.length >= 3) {
    const totalReduction = reductions.reduce((s, e) => s + Math.abs(e.priceChange ?? 0), 0);
    flags.push({
      text: `Price reduced ${reductions.length} times (total: $${totalReduction.toLocaleString()}). This signals seller motivation, use as leverage in negotiations.`,
      severity: "amber",
    });
  } else if (reductions.length > 0) {
    const totalReduction = reductions.reduce((s, e) => s + Math.abs(e.priceChange ?? 0), 0);
    if (totalReduction > 0) {
      flags.push({
        text: `Price reduced ${reductions.length} time${reductions.length > 1 ? "s" : ""} (total: $${totalReduction.toLocaleString()}).`,
        severity: "amber",
      });
    }
  }

  // Price per sqft vs area median (use assessed value as proxy)
  if (price && listing.pricePerSqft && assessedValue && listing.sqft) {
    const assessedPpSqft = Math.round(assessedValue / listing.sqft);
    if (assessedPpSqft > 0) {
      const pctAbove = ((listing.pricePerSqft - assessedPpSqft) / assessedPpSqft) * 100;
      if (pctAbove > 20) {
        flags.push({
          text: `Price per sq ft ($${listing.pricePerSqft}) is ${Math.round(pctAbove)}% above the assessed value per sq ft ($${assessedPpSqft}). Request an independent appraisal.`,
          severity: "amber",
        });
      }
    }
  }

  // Assessed value gap
  if (price && assessedValue && assessedValue > 0) {
    const gapPct = ((price - assessedValue) / assessedValue) * 100;
    if (gapPct > 20) {
      flags.push({
        text: `Listed $${(price - assessedValue).toLocaleString()} above assessed value (${Math.round(gapPct)}% gap). Property tax reassessment likely after purchase.`,
        severity: "amber",
      });
    }
  }

  // Flood zone
  if (riskProfile) {
    const floodCode = (riskProfile.floodZone.code ?? "").toUpperCase();
    if (riskProfile.floodZone.isSFHA || floodCode.startsWith("A") || floodCode.startsWith("V")) {
      const costRange = floodInsurance.estimateLow && floodInsurance.estimateHigh
        ? `, estimated $${floodInsurance.estimateLow.toLocaleString()} to $${floodInsurance.estimateHigh.toLocaleString()} annually`
        : "";
      flags.push({
        text: `High flood risk zone (${floodCode || "SFHA"}). Flood insurance required${costRange}.`,
        severity: "red",
      });
    }

    // Wildfire
    if (riskProfile.wildfireRisk.riskLevel === "High" || riskProfile.wildfireRisk.riskLevel === "Very High") {
      flags.push({
        text: `${riskProfile.wildfireRisk.riskLevel} wildfire risk area. May face higher insurance rates and evacuation risk.`,
        severity: "red",
      });
    }
  }

  // Pre-1978 lead paint
  if (listing.yearBuilt && listing.yearBuilt < 1978) {
    flags.push({
      text: `Pre-1978 construction (built ${listing.yearBuilt}). Federal law requires lead paint disclosure. Request a lead paint inspection.`,
      severity: "amber",
    });
  }

  // HOA unknown
  if (listing.hoaStatus === "not_listed") {
    flags.push({
      text: "HOA status unknown. Confirm with the listing agent before making an offer.",
      severity: "amber",
    });
  }

  return flags;
}

// Risk score calculator - uses available data only
export function calculateRiskScore(riskProfile: HomeRiskProfile | null): number | null {
  if (!riskProfile) return null;

  let score = 10;
  let dataPointCount = 0;

  // Flood zone
  const floodCode = (riskProfile.floodZone.code ?? "").toUpperCase();
  if (floodCode && floodCode !== "UNKNOWN") {
    dataPointCount++;
    if (floodCode.startsWith("V") || floodCode === "A") {
      score -= 2.5;
    } else if (floodCode === "AE") {
      score -= 1.5;
    }
    // Zone X: subtract 0
  }

  // Wildfire
  const wfLevel = riskProfile.wildfireRisk.riskLevel;
  if (wfLevel && wfLevel !== "Unknown") {
    dataPointCount++;
    if (wfLevel === "High" || wfLevel === "Very High") {
      score -= 2;
    } else if (wfLevel === "Moderate") {
      score -= 1;
    }
  }

  // Earthquake
  const eqLevel = riskProfile.earthquakeRisk.riskLevel;
  if (eqLevel) {
    dataPointCount++;
    if (eqLevel === "Moderate" || eqLevel === "High") {
      score -= 1;
    }
  }

  // Radon
  const radonZone = riskProfile.radonZone.zone;
  if (radonZone !== null && radonZone !== undefined) {
    dataPointCount++;
    if (radonZone === 1) {
      score -= 1;
    } else if (radonZone === 2) {
      score -= 0.5;
    }
  }

  // Superfund sites
  if (riskProfile.superfundSites) {
    dataPointCount++;
    const count1mi = riskProfile.superfundSites.count1mile ?? 0;
    score -= Math.min(count1mi, 2); // max subtract 2
  }

  // Lead paint
  if (riskProfile.leadPaintRisk !== null && riskProfile.leadPaintRisk !== undefined) {
    dataPointCount++;
    if (riskProfile.leadPaintRisk) {
      score -= 0.5;
    }
  }

  // Air quality
  const aqScore = riskProfile.airQuality?.score;
  if (aqScore !== null && aqScore !== undefined) {
    dataPointCount++;
    // Note: in this system, lower score = worse air quality
    // The EJScreen score is an index where lower is better for air quality
    // AQI above 100 means unhealthy
    if (aqScore < 50) {
      score -= 1; // Poor air quality (low EJScreen score = more pollution)
    }
  }

  // If zero data points available, return null
  if (dataPointCount === 0) return null;

  // Clamp between 1 and 10, round to nearest 0.5
  score = Math.max(1, Math.min(10, score));
  score = Math.round(score * 2) / 2;

  return score;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*            SPRINT 1: AI-GENERATED FEATURES (4 + 5 synthesis)          */
/* ═══════════════════════════════════════════════════════════════════════ */

export async function generateSprintAIFeatures(
  properties: PropertyInput[],
  rulesFlags: RedFlagItem[][]
): Promise<{ hoaRisk: (HoaRiskData | null)[]; aiRedFlags: string[][] }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      hoaRisk: properties.map(() => null),
      aiRedFlags: properties.map(() => []),
    };
  }

  const client = new Anthropic({ apiKey });

  const propertyContexts = properties.map((p, i) => {
    const l = p.listing;
    const hasHoa = l.hoaStatus === "confirmed" && l.hoaFee;

    return `Property ${i + 1}: ${l.fullAddress ?? l.address ?? "Unknown"}
Price: ${l.price ? `$${l.price.toLocaleString()}` : "Unknown"}
Year Built: ${l.yearBuilt ?? "Unknown"}
Property Type: ${l.propertyType ?? "Unknown"}
HOA: ${hasHoa ? `$${l.hoaFee}/month (confirmed)` : l.hoaStatus === "confirmed_none" ? "None confirmed" : "Not listed"}
Days on Market: ${l.daysOnMarket ?? "Unknown"}
Description excerpt: ${l.description ? l.description.slice(0, 400) : "Not available"}

Rules-based flags detected:
${rulesFlags[i].length > 0 ? rulesFlags[i].map(f => `- [${f.severity}] ${f.text}`).join("\n") : "None detected"}`;
  });

  const prompt = `Analyze these properties and return JSON with two fields:

1. "hoaRisk": array with one entry per property.
   - For properties WITH a confirmed HOA fee: return {"riskLevel": "low" or "medium" or "high", "riskObservations": [2 to 3 specific observations about HOA risk], "agentQuestions": [4 to 7 specific questions the buyer should ask the HOA], "monthlyFee": the confirmed fee amount}.
   - For properties where HOA is "Not listed" (unknown): return {"riskLevel": "medium", "riskObservations": ["HOA status is not disclosed in the listing, which is unusual and warrants investigation", "Undisclosed HOA fees are common for townhomes and some single-family communities and could add $100 to $400 per month to ownership costs"], "agentQuestions": ["Does this property have an HOA? If so, what is the monthly fee?", "Are there any community association fees, maintenance fees, or shared amenity costs?", "Are there any upcoming assessments or neighborhood improvement fees planned?", "What are the deed restrictions or CC&Rs for this property?", "Are there any required memberships (pool, recreation center, etc.) with separate fees?"], "monthlyFee": 0}.
   - For properties with confirmed no HOA: return null.

2. "aiRedFlags": array with one entry per property. Each entry is an array of 3 to 5 strings. Each string is a specific red flag observation a smart buyer should investigate before making an offer. Be direct and specific. Use actual numbers from the data. Do not use dashes as sentence separators, use commas or colons instead.

PROPERTIES:

${propertyContexts.join("\n\n---\n\n")}

Return ONLY valid JSON. No markdown fences.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: "You are a real estate analyst. Return only valid JSON. No markdown fences. Never use em dashes or en dashes. Use commas and periods instead.",
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find(b => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("No text response");

    const parsed = safeParseJSON(textBlock.text) as Record<string, unknown>;

    const hoaRisk: (HoaRiskData | null)[] = Array.isArray(parsed.hoaRisk)
      ? parsed.hoaRisk.map((h: unknown, i: number) => {
          if (!h || typeof h !== "object") return null;
          const hr = h as Record<string, unknown>;
          const listing = properties[i]?.listing;
          if (!listing) return null;
          // For confirmed_none, skip HOA risk
          if (listing.hoaStatus === "confirmed_none") return null;
          // For confirmed HOA or not_listed HOA, generate risk data
          if (listing.hoaStatus === "confirmed" && listing.hoaFee) {
            return {
              riskLevel: (["low", "medium", "high"].includes(hr.riskLevel as string) ? hr.riskLevel : "medium") as "low" | "medium" | "high",
              riskObservations: Array.isArray(hr.riskObservations) ? hr.riskObservations.filter((s: unknown): s is string => typeof s === "string").slice(0, 5) : [],
              agentQuestions: Array.isArray(hr.agentQuestions) ? hr.agentQuestions.filter((s: unknown): s is string => typeof s === "string").slice(0, 7) : [],
              monthlyFee: listing.hoaFee,
            };
          }
          // not_listed: show discovery questions
          if (listing.hoaStatus === "not_listed" || !listing.hoaStatus) {
            return {
              riskLevel: (["low", "medium", "high"].includes(hr.riskLevel as string) ? hr.riskLevel : "medium") as "low" | "medium" | "high",
              riskObservations: Array.isArray(hr.riskObservations) ? hr.riskObservations.filter((s: unknown): s is string => typeof s === "string").slice(0, 5) : [
                "HOA status is not disclosed in the listing, which warrants investigation before making an offer",
                "Undisclosed HOA fees are common for townhomes and some single-family communities and could add $100 to $400 per month to ownership costs",
              ],
              agentQuestions: Array.isArray(hr.agentQuestions) ? hr.agentQuestions.filter((s: unknown): s is string => typeof s === "string").slice(0, 7) : [
                "Does this property have an HOA? If so, what is the monthly fee?",
                "Are there any community association fees, maintenance fees, or shared amenity costs?",
                "Are there any upcoming assessments or neighborhood improvement fees planned?",
                "What are the deed restrictions or CC&Rs for this property?",
                "Are there any required memberships (pool, recreation center, etc.) with separate fees?",
              ],
              monthlyFee: 0,
            };
          }
          return null;
        })
      : properties.map(() => null);

    const aiRedFlags: string[][] = Array.isArray(parsed.aiRedFlags)
      ? parsed.aiRedFlags.map((flags: unknown) =>
          Array.isArray(flags) ? flags.filter((s: unknown): s is string => typeof s === "string").slice(0, 7) : []
        )
      : properties.map(() => []);

    return { hoaRisk, aiRedFlags };
  } catch (err) {
    console.error("[homes-sprint1] AI features generation failed:", err);
    return {
      hoaRisk: properties.map(() => null),
      aiRedFlags: properties.map(() => []),
    };
  }
}
