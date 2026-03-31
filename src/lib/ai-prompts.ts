import type { EnrichedCar, UserPreferences } from "@/types";

/* ═══════════════════════════════════════════════════════════════════════ */
/*                          SYSTEM PROMPT                                 */
/* ═══════════════════════════════════════════════════════════════════════ */

export const SYSTEM_PROMPT = `You are an expert automotive analyst with 20 years of experience helping buyers make smart car purchasing decisions. You analyze vehicles using verified government data, market intelligence, and deep industry knowledge. You always provide specific numbers, honest assessments, and clear recommendations.

CRITICAL OUTPUT FORMAT RULES:
- Return ONLY valid JSON. No markdown, no code blocks, no explanation before or after.
- Your entire response must start with { and end with }. Nothing else.
- All strings must use double quotes. Escape any double quotes inside string values with backslash.
- No trailing commas after the last item in arrays or objects.
- Do NOT use em dashes (\u2014) or en dashes (\u2013) in your writing. Use commas, periods, colons, or semicolons instead.
- Do NOT use literal newlines inside JSON string values. Use a single space instead.
- Do NOT use special Unicode characters like curly quotes, bullet points, or non-ASCII punctuation.

IMPORTANT WRITING RULES:
- Avoid any writing patterns that look AI-generated. Write in a natural, professional tone as if written by an experienced automotive analyst.
- Never use phrases like "it is worth noting", "it should be noted", "in terms of", "when it comes to", "represents a", "stands out as", "it's important to note", "at the end of the day". Write directly and concisely.
- Use active voice. Be specific. State facts, not filler.`;

/* ═══════════════════════════════════════════════════════════════════════ */
/*                  JSON SCHEMA: FULL 11-SECTION REPORT                  */
/* ═══════════════════════════════════════════════════════════════════════ */

const PAID_REPORT_SCHEMA = `{
  "reportType": "free" | "single" | "pro",
  "executiveSummary": {
    "overview": "2-3 SENTENCES maximum. State the winner, the key reason, and briefly mention the runner-up. Be direct and punchy.",
    "recommendation": "Which car is the better choice and why, with specific reasoning (2-3 sentences max)",
    "confidenceScore": <number 0-100 representing how confident you are in your recommendation>,
    "quickVerdict": "The [Car] is the better buy because..."
  },
  "vehicleSpecs": {
    "comparisonTable": [
      { "category": "<spec category>", "values": ["<car1 value>", "<car2 value>", ...], "advantage": "car1" | "car2" | "car3" | "car4" | "tie" }
    ]
  },
  "priceAnalysis": {
    "cars": [
      {
        "name": "<year make model>",
        "listedPrice": <number>,
        "estimatedMarketValue": <number>,
        "priceVerdict": "Fair price" | "Good deal" | "Overpriced" | "Great deal",
        "priceVsMarket": "below" | "at" | "slightly above" | "above",
        "negotiationRoom": "$X-Y"
      }
    ],
    "summary": "Analysis of pricing relative to market..."
  },
  "costOfOwnership": {
    "threeYear": {
      "cars": [
        { "name": "...", "depreciation": <number>, "fuel": <number>, "insurance": <number>, "maintenance": <number>, "repairs": <number>, "total": <number> }
      ]
    },
    "fiveYear": {
      "cars": [
        { "name": "...", "depreciation": <number>, "fuel": <number>, "insurance": <number>, "maintenance": <number>, "repairs": <number>, "total": <number> }
      ]
    },
    "summary": "Cost comparison analysis..."
  },
  "depreciation": {
    "cars": [
      {
        "name": "...",
        "currentValue": <number>,
        "year1Value": <number>,
        "year3Value": <number>,
        "year5Value": <number>,
        "retentionRate5Year": "<percentage as string>"
      }
    ],
    "summary": "Depreciation analysis..."
  },
  "safety": {
    "cars": [
      {
        "name": "...",
        "overallRating": <1-5 or 0 if not rated>,
        "frontalCrash": <1-5 or 0 if not rated>,
        "sideCrash": <1-5 or 0 if not rated>,
        "rollover": <1-5 or 0 if not rated>,
        "recallCount": <number>,
        "majorRecalls": ["recall description 1", "recall description 2"],
        "safetyFeatures": ["feature 1", "feature 2", ...]
      }
    ],
    "summary": "Safety comparison analysis..."
  },
  "fuelEconomy": {
    "cars": [
      {
        "name": "...",
        "cityMPG": <number>,
        "highwayMPG": <number>,
        "combinedMPG": <number>,
        "annualFuelCost": <number>,
        "co2Emissions": <number>,
        "fuelType": "<fuel type>"
      }
    ],
    "summary": "Fuel economy analysis..."
  },
  "reliability": {
    "cars": [
      {
        "name": "...",
        "complaintCount": <number>,
        "topProblems": [
          { "component": "<component name>", "count": <number> }
        ],
        "reliabilityScore": <number 1-10>,
        "commonIssues": "Description of known issues..."
      }
    ],
    "summary": "Reliability comparison..."
  },
  "features": {
    "comparisonTable": [
      { "feature": "<feature name>", "hasFeature": ["yes" | "no" | "unverified" | "ai_enriched", ...] }
    ],
    "summary": "Features comparison..."
  },
  "userPriorityMatch": {
    "cars": [
      {
        "name": "...",
        "scores": {
          "safety": <1-10>,
          "fuelEconomy": <1-10>,
          "reliability": <1-10>,
          "resaleValue": <1-10>,
          "performance": <1-10>,
          "technology": <1-10>,
          "comfort": <1-10>,
          "maintenanceCost": <1-10>
        },
        "overallMatch": <0-100>,
        "bestFor": "Best use case for this vehicle"
      }
    ]
  },
  "finalVerdict": {
    "winner": "<year make model>",
    "scores": [
      { "name": "<year make model>", "overall": <number 1-10> }
    ],
    "bestForScenarios": [
      { "scenario": "Best for <use case>", "winner": "<make model>" }
    ],
    "finalStatement": "Detailed final recommendation..."
  }
}`;

/* NOTE: Free reports previously used an abbreviated 2-section schema.
   Now ALL plans generate all 11 sections so that upgrade-unlocking works
   instantly (sections are stored but filtered at the display layer). */

/* ═══════════════════════════════════════════════════════════════════════ */
/*                       BUILD USER PROMPT                                */
/* ═══════════════════════════════════════════════════════════════════════ */

export function buildUserPrompt(
  cars: EnrichedCar[],
  enrichmentContext: string,
  preferences: UserPreferences,
  plan: string
): string {
  const isFree = plan === "free";
  const reportType = isFree ? "free" : plan === "pro" ? "pro" : "single";

  // Build car names for reference
  const carNames = cars.map(
    (c, i) =>
      `Car ${i + 1}: ${c.year || "?"} ${c.make || "?"} ${c.model || ""} ${c.trim || ""}`.trim()
  );

  const sections: string[] = [];

  // Header
  sections.push(
    `Analyze the following ${cars.length} vehicles and generate a FULL comprehensive comparison report.`
  );

  // Car names
  sections.push(`\nVEHICLES BEING COMPARED:\n${carNames.join("\n")}`);

  // Enrichment data
  sections.push(`\n${"=".repeat(60)}\nENRICHED VEHICLE DATA (from government APIs & listings):\n${"=".repeat(60)}\n\n${enrichmentContext}`);

  // Structured data for each car
  sections.push(`\n${"=".repeat(60)}\nSTRUCTURED DATA:\n${"=".repeat(60)}`);

  for (const car of cars) {
    const name = `${car.year || "?"} ${car.make || "?"} ${car.model || ""} ${car.trim || ""}`.trim();
    const carData: Record<string, unknown> = {
      name,
      price: car.price,
      mileage: car.mileage,
      engine: car.engine,
      engineHP: car.engineHP,
      transmission: car.transmission,
      driveType: car.driveType,
      fuelType: car.fuelType,
      bodyStyle: car.bodyStyle,
      exteriorColor: car.exteriorColor,
      features: car.features,
    };

    // Source: fueleconomy.gov/EPA API
    if (car.fuelEconomy) {
      carData.fuelEconomy = {
        source: "EPA",
        cityMpg: car.fuelEconomy.cityMpg,
        highwayMpg: car.fuelEconomy.highwayMpg,
        combinedMpg: car.fuelEconomy.combinedMpg,
        annualFuelCost: car.fuelEconomy.annualFuelCost,
        co2: car.fuelEconomy.co2TailpipeGpm,
        fuelType: car.fuelEconomy.fuelType,
      };
    } else {
      carData.fuelEconomy = {
        source: "UNAVAILABLE",
        cityMpg: null,
        highwayMpg: null,
        combinedMpg: null,
        annualFuelCost: null,
        co2: null,
        fuelType: null,
        _instruction: "EPA data unavailable. Set all fuel economy fields to -1 to indicate data is unavailable.",
      };
    }

    // AI-enriched standard equipment (present when scraping returned sparse feature data)
    if (car.aiEnrichedFeatures && car.aiEnrichedFeatures.length > 0) {
      carData.aiEnrichedFeatures = {
        note: "AI-estimated standard features for this trim level, not verified from the specific listing",
        features: car.aiEnrichedFeatures,
      };
    }

    // Source: NHTSA Safety Ratings API
    if (car.safetyRating) {
      carData.safetyRating = {
        overall: car.safetyRating.overallRating,
        frontalCrash: car.safetyRating.frontalCrashRating,
        sideCrash: car.safetyRating.sideCrashRating,
        rollover: car.safetyRating.rolloverRating,
      };
    } else {
      carData.safetyRating = "DATA_UNAVAILABLE";
    }

    // Source: NHTSA Recalls API
    if (car.recallData) {
      carData.recalls = {
        total: car.recallData.totalRecalls,
        items: car.recallData.recalls.slice(0, 10).map((r) => ({
          component: r.component,
          summary: r.summary.slice(0, 200),
        })),
      };
    } else {
      carData.recalls = "DATA_UNAVAILABLE";
    }

    // Source: NHTSA Complaints API
    if (car.complaintData) {
      carData.complaints = {
        total: car.complaintData.totalComplaints,
        topComponents: car.complaintData.topComponents.slice(0, 8),
      };
    } else {
      carData.complaints = "DATA_UNAVAILABLE";
    }

    sections.push(`\n${name}:\n${JSON.stringify(carData, null, 2)}`);
  }

  // User preferences
  sections.push(`\n${"=".repeat(60)}\nUSER PREFERENCES:\n${"=".repeat(60)}`);
  if (preferences.priorities.length > 0) {
    sections.push(`What matters most: ${preferences.priorities.join(", ")}`);
  }
  if (preferences.budget) {
    sections.push(`Budget priority: ${preferences.budget}`);
  }
  if (preferences.usage) {
    sections.push(`Intended use: ${preferences.usage}`);
  }
  if (preferences.keepDuration) {
    sections.push(`How long keeping: ${preferences.keepDuration}`);
  }

  // Preference weighting instructions
  if (preferences.priorities.length > 0 || preferences.budget || preferences.usage || preferences.keepDuration) {
    sections.push(`\nPREFERENCE WEIGHTING INSTRUCTIONS:
Weight your entire analysis, scoring, and final recommendation heavily toward the user's stated priorities above.
- The Executive Summary must explicitly reference the user's top priorities and explain how they influenced the recommendation.
- The userPriorityMatch section must score each vehicle specifically against these priorities, with higher weight given to the user's selected categories.
- The Final Verdict winner and finalStatement must directly address how well each vehicle satisfies the user's stated priorities, budget preference, intended usage, and ownership timeline.
- When two vehicles are close overall, the one that better matches the user's priorities should win.
- In cost-related sections (priceAnalysis, costOfOwnership, depreciation), factor in the user's budget priority: "${preferences.budget || "not specified"}".
- In reliability and safety sections, give extra weight if the user listed these as priorities.`);
  } else {
    sections.push(`\nPREFERENCE WEIGHTING INSTRUCTIONS:
No specific priorities were set by the user. Weight all categories equally in your scoring and recommendation. Mention in the Executive Summary and Final Verdict that all categories were weighted equally since no specific priorities were provided.`);
  }

  // Instructions — always generate all 11 sections regardless of plan.
  // Section filtering (hiding locked sections) happens at the display layer,
  // NOT at generation time. This lets upgrade-unlocking work instantly.
  sections.push(`\n${"=".repeat(60)}\nINSTRUCTIONS:\n${"=".repeat(60)}`);

  sections.push(`Generate a FULL comprehensive report with ALL 11 sections:
- executiveSummary (3-4 sentences MAX for the overview. Be direct: state the winner, the key reason, and briefly mention alternatives. Save details for individual sections.)
- vehicleSpecs (10-15 spec comparison rows)
- priceAnalysis (market value estimates, negotiation advice)
- costOfOwnership (3-year and 5-year projections)
- depreciation (value projections over 5 years)
- safety (detailed safety analysis with features and recalls)
- fuelEconomy (detailed analysis with cost projections)
- reliability (complaint analysis, reliability scores)
- features (feature comparison table, 10-15 features)
- userPriorityMatch (scores for each priority; weight the user's selected priorities 2x when computing overallMatch; if no priorities selected, weight all equally)
- finalVerdict (comprehensive recommendation with scenarios)

Provide detailed, actionable analysis. Use actual data from enrichment where available.
Only report data that was explicitly provided to you in this request. If any data point is missing or unavailable, write exactly: Data unavailable. Never invent, estimate, or guess any numerical value including safety ratings, complaint counts, fuel economy figures, recall counts, or any vehicle specification.
Tailor the analysis to the user's stated preferences. The user's priorities MUST be the primary factor in determining the winner and scores. Explicitly state which priorities drove your recommendation.`);

  sections.push(`\nCRITICAL REQUIREMENTS:
- You are comparing ${cars.length} vehicles. EVERY section MUST include data for ALL ${cars.length} vehicles.
- The "values" array in vehicleSpecs must have exactly ${cars.length} entries (one per car, in order: ${carNames.join(", ")}).
- The "hasFeature" array in features must have exactly ${cars.length} entries (one per car, in order). Each value MUST be one of: "yes" (confirmed the car has this feature), "no" (confirmed the car does NOT have this feature), or "unverified" (cannot confirm from available data). Only use "yes" or "no" when you have strong evidence; default to "unverified" otherwise.
- The "cars" array in safety, fuelEconomy, priceAnalysis, costOfOwnership, depreciation, reliability, and userPriorityMatch must have exactly ${cars.length} entries.
- The "scores" array in finalVerdict must have exactly ${cars.length} entries.
- Do NOT skip or omit any vehicle from any section.
- Use the ACTUAL enrichment data provided above for safety ratings, fuel economy, recalls, and complaints. NEVER fabricate complaint counts, safety ratings, or fuel economy numbers when API data is unavailable.
- When structured data shows "DATA_UNAVAILABLE" for a field: set complaintCount to -1 (not 0) to distinguish "zero complaints found" from "could not retrieve data." Set reliabilityScore to -1 if complaint data was unavailable. For fuel economy: if EPA data is unavailable for a vehicle, provide your BEST ESTIMATE of city, highway, and combined MPG based on the vehicle's specifications and your knowledge, and set annualFuelCost based on that estimate. Do NOT set MPG values to -1; always provide positive numeric estimates so charts render correctly. In the fuelEconomy summary, note which vehicles used estimated vs EPA-verified data. Safety ratings: use 0 for all rating fields when safety data is unavailable (the existing convention for "Not Rated"). Note in commonIssues or summary text when data was not available from government APIs.
- CO2 emissions: if EPA co2TailpipeGpm data was provided in the enrichment data for a vehicle, use that EXACT value for co2Emissions in the fuelEconomy section AND in the vehicleSpecs comparisonTable. Both sections MUST show identical CO2 values for the same vehicle. If no EPA CO2 data was available, provide your best estimate in both places consistently.
- For the features comparisonTable "hasFeature" field: use "yes" for features confirmed from the listing scrape; use "no" for features confirmed absent; use "unverified" when you cannot confirm from available data; use "ai_enriched" ONLY for features that appear in the aiEnrichedFeatures data but NOT in the confirmed listing features (meaning they are AI-estimated standard equipment, not verified from this specific listing). Never use "ai_enriched" for features confirmed by the listing.
- Legally mandated features: All US vehicles manufactured after May 2018 (model year 2019+) are REQUIRED by federal law (FMVSS No. 111) to have a backup/rearview camera. For any vehicle with model year 2019 or later, always set backup camera / rearview camera to "yes", never "unverified".
- You have been provided with comprehensive data from government APIs and listing scraping. Use ALL available data to fill every section completely.
- For each vehicle, you MUST provide data for ALL report sections. Do not leave any section partially filled.
- If specific data is truly unavailable from any source, explicitly state why rather than leaving it blank.
- All monetary values should be numbers (not strings), e.g., 25000 not "$25,000".
- Safety ratings should be integers 1-5. Use 0 only if the vehicle has no NHTSA rating at all.
- Reliability scores should be numbers 1-10.
- The reportType field must be "${reportType}".
- Car names in the output should match the format: "<year> <make> <model>".
- For spec comparisons, the "advantage" field should be "car1", "car2", "car3", "car4", or "tie" (corresponding to vehicle order).
- Do NOT use em dashes or en dashes anywhere in your text. Use commas, periods, colons, or semicolons.
- The userPriorityMatch overallMatch score (0-100) must weight the user's selected priorities more heavily than non-selected ones. If a user selected "safety" and "reliability" as priorities, those scores should contribute disproportionately to the overallMatch.
- The Executive Summary recommendation and Final Verdict finalStatement MUST explicitly mention the user's priorities and how they influenced the outcome.
- Respond ONLY with the JSON object. No markdown, no code fences, no explanation.`);

  sections.push(`\nJSON SCHEMA TO FOLLOW:\n${PAID_REPORT_SCHEMA}`);

  return sections.join("\n");
}
