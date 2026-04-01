import type {
  ScrapedCar,
  EnrichedCar,
  VINData,
  SafetyRating,
  Recall,
  RecallData,
  Complaint,
  ComplaintData,
  FuelEconomy,
  DataQuality,
} from "@/types";

const API_TIMEOUT = 8000; // 8 seconds per API call

/* ═══════════════════════════════════════════════════════════════════════ */
/*                        TIMEOUT FETCH HELPER                            */
/* ═══════════════════════════════════════════════════════════════════════ */

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = API_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                          VIN EXTRACTION                                */
/* ═══════════════════════════════════════════════════════════════════════ */

const VIN_REGEX = /\b[A-HJ-NPR-Z0-9]{17}\b/;
// Pattern that looks for VIN near identifying keywords (case-insensitive)
const VIN_KEYWORD_REGEX = /(?:vin|vehicle\s*identification|stock)[^A-HJ-NPR-Z0-9]*([A-HJ-NPR-Z0-9]{17})\b/i;

export function extractVIN(scrapedData: ScrapedCar): string | null {
  // 1. Check explicit VIN field
  if (scrapedData.vin && VIN_REGEX.test(scrapedData.vin.toUpperCase())) {
    return scrapedData.vin.toUpperCase();
  }

  // 2. Try to parse VIN from URL path or query params
  if (scrapedData.url) {
    const urlUpper = scrapedData.url.toUpperCase();
    const urlMatch = urlUpper.match(VIN_REGEX);
    if (urlMatch) return urlMatch[0];
  }

  // 3. Check listing title for VIN
  if (scrapedData.listingTitle) {
    const titleUpper = scrapedData.listingTitle.toUpperCase();
    const titleMatch = titleUpper.match(VIN_REGEX);
    if (titleMatch) return titleMatch[0];
  }

  // 4. Search raw markdown: prefer VIN near a keyword, fall back to any 17-char match
  if (scrapedData.rawMarkdown) {
    // First try keyword-adjacent VIN (more reliable)
    const kwMatch = scrapedData.rawMarkdown.match(VIN_KEYWORD_REGEX);
    if (kwMatch?.[1]) return kwMatch[1].toUpperCase();

    // Fall back to first standalone 17-char match
    const mdUpper = scrapedData.rawMarkdown.toUpperCase();
    const mdMatch = mdUpper.match(VIN_REGEX);
    if (mdMatch) return mdMatch[0];
  }

  return null;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                    API 1: NHTSA VIN DECODER                            */
/* ═══════════════════════════════════════════════════════════════════════ */

async function fetchVINData(vin: string): Promise<VINData | null> {
  try {
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;

    const data = await res.json();
    const result = data.Results?.[0];
    if (!result) return null;

    // Check NHTSA error code — "0" means success
    const errorCode = String(result.ErrorCode ?? "0").trim();
    if (errorCode !== "0") {
      console.error(`NHTSA VIN decode failed for VIN ${vin}: ErrorCode ${errorCode}`);
      return null;
    }

    const rawAttributes: Record<string, string> = {};
    for (const [key, value] of Object.entries(result)) {
      if (value && typeof value === "string" && value.trim() !== "") {
        rawAttributes[key] = value.trim();
      }
    }

    return {
      vin,
      year: parseIntSafe(result.ModelYear),
      make: cleanString(result.Make),
      model: cleanString(result.Model),
      trim: cleanString(result.Trim),
      bodyClass: cleanString(result.BodyClass),
      driveType: cleanString(result.DriveType),
      engineCylinders: parseIntSafe(result.EngineCylinders),
      engineDisplacement: cleanString(result.DisplacementL),
      engineHP: parseFloatSafe(result.EngineHP),
      fuelType: cleanString(result.FuelTypePrimary),
      transmission: cleanString(result.TransmissionStyle),
      doors: parseIntSafe(result.Doors),
      manufacturer: cleanString(result.Manufacturer),
      plantCity: cleanString(result.PlantCity),
      plantCountry: cleanString(result.PlantCountry),
      vehicleType: cleanString(result.VehicleType),
      gvwr: cleanString(result.GVWR),
      electrificationLevel: cleanString(result.ElectrificationLevel),
      rawAttributes,
    };
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                   API 2: NHTSA SAFETY RATINGS                          */
/* ═══════════════════════════════════════════════════════════════════════ */

async function fetchSafetyRating(
  year: number,
  make: string,
  model: string
): Promise<SafetyRating | null> {
  try {
    // Step 1: Get vehicle IDs for year/make/model
    const encodedMake = encodeURIComponent(make);
    const encodedModel = encodeURIComponent(model);
    const listUrl = `https://api.nhtsa.gov/SafetyRatings/modelyear/${year}/make/${encodedMake}/model/${encodedModel}`;
    const listRes = await fetchWithTimeout(listUrl);
    if (!listRes.ok) return null;

    const listData = await listRes.json();
    const vehicles = listData.Results;
    if (!vehicles || vehicles.length === 0) return null;

    // Use the first matching vehicle
    const vehicleId = vehicles[0].VehicleId;
    if (!vehicleId) return null;

    // Step 2: Get full ratings for that vehicle
    const ratingUrl = `https://api.nhtsa.gov/SafetyRatings/VehicleId/${vehicleId}`;
    const ratingRes = await fetchWithTimeout(ratingUrl);
    if (!ratingRes.ok) return null;

    const ratingData = await ratingRes.json();
    const r = ratingData.Results?.[0];
    if (!r) return null;

    return {
      overallRating: parseRating(r.OverallRating),
      frontalCrashRating: parseRating(r.OverallFrontCrashRating),
      sideCrashRating: parseRating(r.OverallSideCrashRating),
      rolloverRating: parseRating(r.RolloverRating),
      frontalCrashDriverRating: parseRating(r.FrontCrashDriversideRating),
      frontalCrashPassengerRating: parseRating(r.FrontCrashPassengersideRating),
      sideCrashDriverRating: parseRating(r.SideCrashDriversideRating),
      sideCrashPassengerRating: parseRating(r.SideCrashPassengersideRating),
      sidePoleCrashRating: parseRating(r.SidePoleCrashRating),
      vehicleId,
      vehicleDescription: cleanString(r.VehicleDescription),
    };
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                      API 3: NHTSA RECALLS                              */
/* ═══════════════════════════════════════════════════════════════════════ */

async function fetchRecalls(
  year: number,
  make: string,
  model: string
): Promise<RecallData | null> {
  try {
    const encodedMake = encodeURIComponent(make);
    const encodedModel = encodeURIComponent(model);
    const url = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodedMake}&model=${encodedModel}&modelYear=${year}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;

    const data = await res.json();
    const results = data.results || [];

    const recalls: Recall[] = results.map(
      (r: Record<string, string>) => ({
        nhtsaCampaignNumber: r.NHTSACampaignNumber || "",
        component: r.Component || "",
        summary: r.Summary || "",
        consequence: r.Consequence || "",
        remedy: r.Remedy || "",
        reportDate: r.ReportReceivedDate || "",
        manufacturer: r.Manufacturer || "",
      })
    );

    return {
      totalRecalls: recalls.length,
      recalls,
    };
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                    API 4: NHTSA COMPLAINTS                             */
/* ═══════════════════════════════════════════════════════════════════════ */

async function fetchComplaints(
  year: number,
  make: string,
  model: string
): Promise<ComplaintData | null> {
  try {
    const encodedMake = encodeURIComponent(make);
    const encodedModel = encodeURIComponent(model);
    const url = `https://api.nhtsa.gov/complaints/complaintsByVehicle?make=${encodedMake}&model=${encodedModel}&modelYear=${year}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;

    const data = await res.json();
    const results = data.results || [];

    const complaints: Complaint[] = results.map(
      (c: Record<string, string | boolean>) => ({
        component: (c.components as string) || "",
        summary: (c.summary as string) || "",
        crash: c.crash === true || c.crash === "Yes",
        fire: c.fire === true || c.fire === "Yes",
        injury: c.injuries === true || c.injuries === "Yes",
        dateReceived: (c.dateComplaintFiled as string) || "",
        odiNumber: (c.odiNumber as string) || "",
      })
    );

    // Group complaints by component
    const componentCounts: Record<string, number> = {};
    for (const c of complaints) {
      const comp = c.component || "Unknown";
      componentCounts[comp] = (componentCounts[comp] || 0) + 1;
    }
    const topComponents = Object.entries(componentCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([component, count]) => ({ component, count }));

    return {
      totalComplaints: complaints.length,
      complaints,
      topComponents,
    };
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                   API 5: FUELECONOMY.GOV                               */
/* ═══════════════════════════════════════════════════════════════════════ */

/**
 * Attempt to fuzzy-match a car model against the EPA's model list for a
 * given year/make. Returns the best matching EPA model name, or null.
 */
async function findFuzzyEpaModel(
  year: number,
  make: string,
  carModel: string
): Promise<string | null> {
  try {
    const encodedMake = encodeURIComponent(make);
    const modelListUrl = `https://www.fueleconomy.gov/ws/rest/vehicle/menu/model?year=${year}&make=${encodedMake}`;
    const res = await fetchWithTimeout(modelListUrl, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;

    const data = await res.json();
    let epaModels: { text: string; value: string }[] = data.menuItem;
    if (!epaModels) return null;
    if (!Array.isArray(epaModels)) epaModels = [epaModels];
    if (epaModels.length === 0) return null;

    const modelNames = epaModels.map((m) => m.text).filter(Boolean);
    const carLower = carModel.toLowerCase().trim();

    // Strategy 1: case-insensitive exact match
    const exact = modelNames.find((m) => m.toLowerCase() === carLower);
    if (exact) return exact;

    // Strategy 2: car model is contained in EPA model, or EPA model is contained in car model
    const contains = modelNames.find((m) => {
      const mLower = m.toLowerCase();
      return mLower.includes(carLower) || carLower.includes(mLower);
    });
    if (contains) return contains;

    // Strategy 3: match on the first token of the car model (e.g., "230i" → "2" prefix)
    const carTokens = carLower.split(/[\s\-\/]+/).filter(Boolean);
    if (carTokens.length > 0) {
      const firstToken = carTokens[0];
      const prefixMatch = modelNames.find((m) =>
        m.toLowerCase().startsWith(firstToken)
      );
      if (prefixMatch) return prefixMatch;
    }

    // Strategy 4: strip the last token and retry (remove suffix like "i", "xDrive")
    if (carTokens.length > 1) {
      const baseModel = carTokens.slice(0, -1).join(" ");
      const baseMatch = modelNames.find((m) => {
        const mLower = m.toLowerCase();
        return mLower.includes(baseModel) || baseModel.includes(mLower);
      });
      if (baseMatch) return baseMatch;
    }

    // Strategy 5: numeric prefix match (e.g., "230i" → find models starting with "2")
    const numericPrefix = carLower.match(/^(\d+)/)?.[1];
    if (numericPrefix && numericPrefix.length >= 1) {
      const numMatch = modelNames.find((m) =>
        m.toLowerCase().replace(/\s+/g, "").startsWith(numericPrefix)
      );
      if (numMatch) return numMatch;
    }

    return null;
  } catch {
    return null;
  }
}

async function fetchFuelEconomy(
  year: number,
  make: string,
  model: string,
  trim?: string | null
): Promise<FuelEconomy | null> {
  try {
    // Step 1a: Try exact model match
    const encodedMake = encodeURIComponent(make);
    const encodedModel = encodeURIComponent(model);
    const exactOptionsUrl = `https://www.fueleconomy.gov/ws/rest/vehicle/menu/options?year=${year}&make=${encodedMake}&model=${encodedModel}`;
    const exactRes = await fetchWithTimeout(exactOptionsUrl, {
      headers: { Accept: "application/json" },
    });

    let items: { text: string; value: string }[] | null = null;

    if (exactRes.ok) {
      const exactData = await exactRes.json();
      let rawItems = exactData.menuItem;
      if (rawItems) {
        if (!Array.isArray(rawItems)) rawItems = [rawItems];
        if (rawItems.length > 0) items = rawItems;
      }
    }

    // Step 1b: If exact model returned nothing, try fuzzy matching
    if (!items) {
      const fuzzyModel = await findFuzzyEpaModel(year, make, model);
      if (fuzzyModel) {
        const encodedFuzzy = encodeURIComponent(fuzzyModel);
        const fuzzyOptionsUrl = `https://www.fueleconomy.gov/ws/rest/vehicle/menu/options?year=${year}&make=${encodedMake}&model=${encodedFuzzy}`;
        const fuzzyRes = await fetchWithTimeout(fuzzyOptionsUrl, {
          headers: { Accept: "application/json" },
        });
        if (fuzzyRes.ok) {
          const fuzzyData = await fuzzyRes.json();
          let rawItems = fuzzyData.menuItem;
          if (rawItems) {
            if (!Array.isArray(rawItems)) rawItems = [rawItems];
            if (rawItems.length > 0) items = rawItems;
          }
        }
      }
    }

    if (!items) return null;

    // Step 2: Pick the best matching option by trim
    let bestMatch = items[0];
    if (trim) {
      const trimLower = trim.toLowerCase();
      const exactMatch = items.find(
        (item) => item.text && item.text.toLowerCase().includes(trimLower)
      );
      if (exactMatch) bestMatch = exactMatch;
    } else {
      // No trim specified — select the base/entry-level trim using multi-criteria ranking.
      // EPA option text format is typically: "engine, cylinders, transmission, fuel, drivetrain"
      // e.g. "2.5L, 4 cyl, Automatic (S8), Regular Gasoline, Front-Wheel Drive"
      const premiumTrimPatterns = /\b(AWD|4WD|All.Wheel|xDrive|Quattro|SH-AWD|4MATIC|XSE|TRD|Sport|Touring|Limited|Platinum|Premium|Prestige|GT|Type.R|Nismo|Si|V6|V8|Turbo)\b/i;
      const fwdPatterns = /\b(FWD|Front.Wheel|2WD|Two.Wheel)\b/i;

      // Parse engine displacement from option text (e.g. "2.5L" → 2.5)
      const getDisplacement = (text: string): number => {
        const m = text.match(/(\d+\.?\d*)\s*L\b/i);
        return m ? parseFloat(m[1]) : 999;
      };

      // Score each option: lower score = more likely base trim
      const scored = items.map((item) => {
        const t = item.text || "";
        let score = 0;

        // Priority 1: Prefer FWD/2WD (penalize AWD/4WD heavily)
        if (/\b(AWD|4WD|All.Wheel|xDrive|Quattro|SH-AWD|4MATIC)\b/i.test(t)) score += 1000;
        if (fwdPatterns.test(t)) score -= 50;

        // Priority 2: Penalize premium/sport trim names
        if (premiumTrimPatterns.test(t)) score += 500;

        // Priority 3: Prefer smallest engine displacement
        score += getDisplacement(t) * 100;

        // Bonus: prefer common base trim names
        if (/\b(LE|LX|Base|S|SE|L|EX|CE)\b/i.test(t) && !/\b(XSE|Sport|Si)\b/i.test(t)) score -= 25;

        return { item, score };
      });

      scored.sort((a, b) => a.score - b.score);

      if (scored.length > 0) {
        bestMatch = scored[0].item;
      }

      // Fallback: if the top-scored option still looks premium (very high score),
      // use the option with median MPG instead. We fetch the first and last options'
      // data to approximate this, but for now the scoring should handle most cases.
    }

    const vehicleId = bestMatch.value;
    if (!vehicleId) return null;

    // Step 3: Get detailed fuel economy data
    const detailUrl = `https://www.fueleconomy.gov/ws/rest/vehicle/${vehicleId}`;
    const detailRes = await fetchWithTimeout(detailUrl, {
      headers: { Accept: "application/json" },
    });
    if (!detailRes.ok) return null;

    const d = await detailRes.json();

    return {
      vehicleId: parseIntSafe(vehicleId),
      cityMpg: parseFloatSafe(d.city08),
      highwayMpg: parseFloatSafe(d.highway08),
      combinedMpg: parseFloatSafe(d.comb08),
      annualFuelCost: parseFloatSafe(d.fuelCost08),
      co2TailpipeGpm: parseFloatSafe(d.co2TailpipeGpm),
      fuelType: cleanString(d.fuelType),
      fuelType2: cleanString(d.fuelType2),
      cityMpgFuel2: parseFloatSafe(d.cityA08),
      highwayMpgFuel2: parseFloatSafe(d.highwayA08),
      combinedMpgFuel2: parseFloatSafe(d.combA08),
      isElectric: d.atvType === "EV" || d.fuelType === "Electricity",
      rangeElectric: parseFloatSafe(d.rangeA) || parseFloatSafe(d.range),
      rangeCity: parseFloatSafe(d.rangeCityA) || parseFloatSafe(d.rangeCity),
      rangeHighway: parseFloatSafe(d.rangeHwyA) || parseFloatSafe(d.rangeHwy),
      barrels08: parseFloatSafe(d.barrels08),
      youSaveSpend: parseFloatSafe(d.youSaveSpend),
      vehicleClass: cleanString(d.VClass),
    };
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*               AI STANDARD EQUIPMENT ENRICHMENT (STEP 4)                */
/* ═══════════════════════════════════════════════════════════════════════ */

/**
 * Ask Claude Haiku for the standard factory features of a specific vehicle.
 * Used as a last-resort enrichment when the listing scrape returned very few features.
 * Returns an empty array on any failure.
 */
async function enrichWithAIFeatures(
  year: number,
  make: string,
  model: string,
  trim?: string | null
): Promise<string[]> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return [];

    // Dynamic import to avoid build-time issues in edge contexts
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });

    const vehicleName = `${year} ${make} ${model}${trim ? ` ${trim}` : ""}`;
    const prompt = `For a ${vehicleName}, list the standard features included from the factory. Only include features you are highly confident are standard on this exact trim level. Return ONLY a JSON array of short feature name strings (no descriptions, no explanations). Example: ["Bluetooth Audio", "Backup Camera", "Lane Departure Warning"]. Return between 10 and 25 features.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return [];

    // Strip markdown fences if present and parse
    const text = textBlock.text
      .trim()
      .replace(/^```(?:json)?/, "")
      .replace(/```$/, "")
      .trim();
    const features = JSON.parse(text);
    if (!Array.isArray(features)) return [];
    return features.filter((f): f is string => typeof f === "string").slice(0, 25);
  } catch {
    return [];
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                     MAIN ENRICHMENT FUNCTION                           */
/* ═══════════════════════════════════════════════════════════════════════ */

export async function enrichAllCars(
  cars: ScrapedCar[]
): Promise<EnrichedCar[]> {
  return Promise.all(cars.map((car) => enrichSingleCar(car)));
}

async function enrichSingleCar(car: ScrapedCar): Promise<EnrichedCar> {
  const isManualEntry = car.url.startsWith("manual://");
  const vin = extractVIN(car);
  const enrichmentSources: string[] = ["scraping"];

  // ── Phase 1: VIN decode first (provides authoritative year/make/model) ──
  let vinData: VINData | null = null;
  if (vin) {
    vinData = await fetchVINData(vin).catch(() => null);
    if (vinData) enrichmentSources.push("nhtsa-vin-decoder");
  }

  // Determine best year/make/model: VIN-decoded data is authoritative,
  // scraped data fills in what VIN decoding missed
  const year = vinData?.year ?? car.year;
  const make = vinData?.make ?? car.make;
  const model = vinData?.model ?? car.model;
  const trim = vinData?.trim ?? car.trim;

  // ── Phase 2: Parallel NHTSA + fuel economy lookups using best identity ──
  let safetyRating: SafetyRating | null = null;
  let recallData: RecallData | null = null;
  let complaintData: ComplaintData | null = null;
  let fuelEconomy: FuelEconomy | null = null;

  if (year && make && model) {
    const apiCalls: Promise<
      | { type: "safety"; data: SafetyRating | null }
      | { type: "recalls"; data: RecallData | null }
      | { type: "complaints"; data: ComplaintData | null }
      | { type: "fuel"; data: FuelEconomy | null }
    >[] = [
      fetchSafetyRating(year, make, model).then((data) => ({
        type: "safety" as const,
        data,
      })),
      fetchRecalls(year, make, model).then((data) => ({
        type: "recalls" as const,
        data,
      })),
      fetchComplaints(year, make, model).then((data) => ({
        type: "complaints" as const,
        data,
      })),
      fetchFuelEconomy(year, make, model, trim).then((data) => ({
        type: "fuel" as const,
        data,
      })),
    ];

    const results = await Promise.allSettled(apiCalls);

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.data) {
        switch (result.value.type) {
          case "safety":
            safetyRating = result.value.data;
            enrichmentSources.push("nhtsa-safety-ratings");
            break;
          case "recalls":
            recallData = result.value.data;
            enrichmentSources.push("nhtsa-recalls");
            break;
          case "complaints":
            complaintData = result.value.data;
            enrichmentSources.push("nhtsa-complaints");
            break;
          case "fuel":
            fuelEconomy = result.value.data;
            enrichmentSources.push("fueleconomy-gov");
            break;
        }
      }
    }
  }

  // ── Merge: VIN-decoded specs are authoritative, scraped data fills gaps ──
  const mergedEngine = formatEngine(vinData) ?? car.engine ?? null;
  const mergedTransmission = vinData?.transmission ?? car.transmission ?? null;
  const mergedDriveType = vinData?.driveType ?? car.driveType ?? null;
  const mergedBodyStyle = vinData?.bodyClass ?? car.bodyStyle ?? null;

  // ── Phase 3: Data completeness check + AI enrichment waterfall ──
  const confirmedFeatures = car.features.length;
  const basicSpecCount = [mergedEngine, mergedTransmission, mergedDriveType, mergedBodyStyle].filter(Boolean).length;
  const hasEnoughFeatures = confirmedFeatures >= 5;
  const hasBasicSpecs = basicSpecCount >= 3;
  const hasPrice = car.price !== null && car.price > 0;

  const needsEnrichment = !isManualEntry && (!hasEnoughFeatures || !hasBasicSpecs);

  let aiEnrichedFeatures: string[] | undefined;

  if (needsEnrichment && year && make && model) {
    // Step 4: AI standard equipment enrichment (20s timeout per vehicle)
    try {
      const aiFeatures = await Promise.race([
        enrichWithAIFeatures(year, make, model, trim),
        new Promise<string[]>((_, reject) =>
          setTimeout(() => reject(new Error("AI enrichment timeout")), 20_000)
        ),
      ]);
      if (aiFeatures.length > 0) {
        aiEnrichedFeatures = aiFeatures;
        enrichmentSources.push("ai-standard-equipment");
      }
    } catch {
      // AI enrichment failed or timed out — continue without it
    }
  }

  // Step 5: Final completeness assessment
  const finalBasicSpecCount = basicSpecCount; // specs won't change from AI enrichment
  const isCriticallyIncomplete = !isManualEntry && finalBasicSpecCount < 3;

  const dataQuality: DataQuality = {
    confirmedFeatures,
    hasBasicSpecs,
    hasPrice,
    isAIEnriched: (aiEnrichedFeatures?.length ?? 0) > 0,
    isCriticallyIncomplete,
    isManualEntry,
  };

  return {
    url: car.url,
    year: vinData?.year ?? car.year ?? null,
    make: vinData?.make ?? car.make ?? null,
    model: vinData?.model ?? car.model ?? null,
    trim: vinData?.trim ?? car.trim ?? null,
    vin: vin,

    listingTitle: car.listingTitle,
    price: car.price,
    mileage: car.mileage,
    exteriorColor: car.exteriorColor,
    interiorColor: car.interiorColor,
    features: car.features,
    dealerName: car.dealerName,
    dealerLocation: car.dealerLocation,
    photoCount: car.photoCount,
    photoUrl: car.photoUrl,

    engine: mergedEngine,
    engineCylinders: vinData?.engineCylinders ?? null,
    engineDisplacement: vinData?.engineDisplacement ?? null,
    engineHP: vinData?.engineHP ?? null,
    transmission: mergedTransmission,
    driveType: mergedDriveType,
    fuelType: vinData?.fuelType ?? car.fuelType ?? fuelEconomy?.fuelType ?? null,
    bodyStyle: mergedBodyStyle,
    doors: vinData?.doors ?? null,
    manufacturer: vinData?.manufacturer ?? null,
    vehicleType: vinData?.vehicleType ?? null,

    safetyRating,
    recallData,
    complaintData,
    fuelEconomy,

    aiEnrichedFeatures,
    dataQuality,

    enrichmentSources,
    scrapedAt: car.scrapedAt,
    error: car.error,
  };
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                  BUILD ENRICHMENT CONTEXT FOR AI                       */
/* ═══════════════════════════════════════════════════════════════════════ */

export function buildEnrichmentContext(cars: EnrichedCar[]): string {
  const sections: string[] = [];

  for (let i = 0; i < cars.length; i++) {
    const car = cars[i];
    const label = `Car ${i + 1}: ${car.year || "?"} ${car.make || "?"} ${car.model || ""} ${car.trim || ""}`.trim();
    const lines: string[] = [`=== ${label} ===`];

    // Basic info
    lines.push(`URL: ${car.url}`);
    if (car.vin) lines.push(`VIN: ${car.vin}`);
    
    // Ensure numeric formatting for Price and Mileage
    const numPrice = typeof car.price === 'number' ? car.price : parseFloat(String(car.price || '').replace(/[^0-9.]/g, ''));
    if (!isNaN(numPrice) && numPrice > 0) {
      lines.push(`Listing Price: $${numPrice.toLocaleString()}`);
    }
    
    const numMileage = typeof car.mileage === 'number' ? car.mileage : parseInt(String(car.mileage || '').replace(/[^0-9]/g, ''), 10);
    if (!isNaN(numMileage) && numMileage > 0) {
      lines.push(`Mileage: ${numMileage.toLocaleString()} miles`);
    }
    if (car.exteriorColor) lines.push(`Exterior Color: ${car.exteriorColor}`);
    if (car.interiorColor) lines.push(`Interior Color: ${car.interiorColor}`);
    if (car.dealerName) lines.push(`Dealer: ${car.dealerName}`);
    if (car.dealerLocation) lines.push(`Location: ${car.dealerLocation}`);

    // Specs
    lines.push("\n-- Specifications --");
    if (car.engine) lines.push(`Engine: ${car.engine}`);
    if (car.engineHP) lines.push(`Horsepower: ${car.engineHP} HP`);
    if (car.engineCylinders) lines.push(`Cylinders: ${car.engineCylinders}`);
    if (car.engineDisplacement) lines.push(`Displacement: ${car.engineDisplacement}L`);
    if (car.transmission) lines.push(`Transmission: ${car.transmission}`);
    if (car.driveType) lines.push(`Drive Type: ${car.driveType}`);
    if (car.fuelType) lines.push(`Fuel Type: ${car.fuelType}`);
    if (car.bodyStyle) lines.push(`Body Style: ${car.bodyStyle}`);
    if (car.doors) lines.push(`Doors: ${car.doors}`);

    // Fuel Economy
    if (car.fuelEconomy) {
      lines.push("\n-- Fuel Economy (Source: fueleconomy.gov/EPA) --");
      const fe = car.fuelEconomy;
      if (fe.cityMpg) lines.push(`City: ${fe.cityMpg} MPG`);
      if (fe.highwayMpg) lines.push(`Highway: ${fe.highwayMpg} MPG`);
      if (fe.combinedMpg) lines.push(`Combined: ${fe.combinedMpg} MPG`);
      if (fe.annualFuelCost) lines.push(`Annual Fuel Cost: $${fe.annualFuelCost}`);
      if (fe.co2TailpipeGpm) lines.push(`CO2 Emissions: ${fe.co2TailpipeGpm} g/mi`);
      if (fe.isElectric && fe.rangeElectric) lines.push(`Electric Range: ${fe.rangeElectric} miles`);
      if (fe.vehicleClass) lines.push(`Vehicle Class: ${fe.vehicleClass}`);
    }

    // Safety
    if (car.safetyRating) {
      lines.push("\n-- Safety Ratings (Source: NHTSA API) --");
      const sr = car.safetyRating;
      if (sr.overallRating) lines.push(`Overall: ${sr.overallRating}/5 stars`);
      if (sr.frontalCrashRating) lines.push(`Frontal Crash: ${sr.frontalCrashRating}/5`);
      if (sr.sideCrashRating) lines.push(`Side Crash: ${sr.sideCrashRating}/5`);
      if (sr.rolloverRating) lines.push(`Rollover: ${sr.rolloverRating}/5`);
    }

    // Recalls
    if (car.recallData) {
      lines.push(`\n-- Recalls (Source: NHTSA API): ${car.recallData.totalRecalls} total --`);
      for (const recall of car.recallData.recalls.slice(0, 5)) {
        lines.push(`- [${recall.component}] ${recall.summary.slice(0, 150)}`);
      }
      if (car.recallData.totalRecalls > 5) {
        lines.push(`  ... and ${car.recallData.totalRecalls - 5} more recalls`);
      }
    }

    // Complaints
    if (car.complaintData) {
      lines.push(`\n-- Complaints (Source: NHTSA API): ${car.complaintData.totalComplaints} total --`);
      if (car.complaintData.topComponents.length > 0) {
        lines.push("Top problem areas:");
        for (const tc of car.complaintData.topComponents.slice(0, 5)) {
          lines.push(`  - ${tc.component}: ${tc.count} complaints`);
        }
      }
      const crashes = car.complaintData.complaints.filter((c) => c.crash).length;
      const fires = car.complaintData.complaints.filter((c) => c.fire).length;
      const injuries = car.complaintData.complaints.filter((c) => c.injury).length;
      if (crashes || fires || injuries) {
        lines.push(`Serious incidents: ${crashes} crashes, ${fires} fires, ${injuries} injuries`);
      }
    }

    // Features
    if (car.features.length > 0) {
      lines.push("\n-- Features (confirmed from listing) --");
      lines.push(car.features.join(", "));
    }

    // AI-enriched standard equipment (labeled — not from the specific listing)
    if (car.aiEnrichedFeatures && car.aiEnrichedFeatures.length > 0) {
      lines.push("\n-- Standard Equipment (AI ESTIMATE — not verified from this specific listing) --");
      lines.push("The following are AI-estimated factory standard features for this trim. Use as background knowledge only:");
      lines.push(car.aiEnrichedFeatures.join(", "));
    }

    lines.push(`\nEnrichment sources: ${car.enrichmentSources.join(", ")}`);
    sections.push(lines.join("\n"));
  }

  return sections.join("\n\n");
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                          HELPER FUNCTIONS                              */
/* ═══════════════════════════════════════════════════════════════════════ */

function cleanString(value: unknown): string | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed === "" || trimmed === "Not Applicable" || trimmed === "N/A") {
    return null;
  }
  return trimmed;
}

function parseIntSafe(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = parseInt(String(value), 10);
  return isNaN(n) ? null : n;
}

function parseFloatSafe(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = parseFloat(String(value));
  return isNaN(n) ? null : n;
}

function parseRating(value: unknown): number | null {
  if (!value || value === "Not Rated") return null;
  const n = parseInt(String(value), 10);
  return isNaN(n) ? null : n;
}

function formatEngine(vinData: VINData | null): string | null {
  if (!vinData) return null;
  const parts: string[] = [];
  if (vinData.engineDisplacement) parts.push(`${vinData.engineDisplacement}L`);
  if (vinData.engineCylinders) parts.push(`${vinData.engineCylinders}-Cylinder`);
  if (vinData.engineHP) parts.push(`${vinData.engineHP} HP`);
  return parts.length > 0 ? parts.join(" ") : null;
}
