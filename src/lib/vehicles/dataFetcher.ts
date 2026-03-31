/**
 * Unified Vehicle Data Fetcher
 *
 * Connects to all free government and public APIs for vehicle data.
 * Designed as a waterfall: Firecrawl listing data first, then enrich
 * with NHTSA + EPA data matched by VIN or make/model/year.
 *
 * Sources:
 * 1. NHTSA VPIC API (VIN decode) — no key required
 * 2. NHTSA Safety Ratings API — no key required
 * 3. NHTSA Complaints API — no key required
 * 4. NHTSA Recalls API — no key required
 * 5. EPA FuelEconomy.gov API — no key required
 * 6. CarQuery API — no key required
 * 7. Firecrawl (existing pipeline) — primary listing data source
 */

const API_TIMEOUT = 8000;

/* ═══════════════════════════════════════════════════════════════════════ */
/*                         TIMEOUT FETCH HELPER                          */
/* ═══════════════════════════════════════════════════════════════════════ */

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = API_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                              TYPES                                    */
/* ═══════════════════════════════════════════════════════════════════════ */

export interface VehicleIdentity {
  vin?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
}

export interface NHTSAVinDecodeResult {
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
}

export interface NHTSASafetyRating {
  overallRating: number | null;
  frontalCrashRating: number | null;
  sideCrashRating: number | null;
  rolloverRating: number | null;
  vehicleDescription: string | null;
}

export interface NHTSARecall {
  nhtsaCampaignNumber: string;
  component: string;
  summary: string;
  consequence: string;
  remedy: string;
  reportDate: string;
  manufacturer: string;
}

export interface NHTSAComplaint {
  component: string;
  summary: string;
  crash: boolean;
  fire: boolean;
  injury: boolean;
  dateReceived: string;
  odiNumber: string;
}

export interface EPAFuelEconomy {
  vehicleId: number | null;
  cityMpg: number | null;
  highwayMpg: number | null;
  combinedMpg: number | null;
  annualFuelCost: number | null;
  co2TailpipeGpm: number | null;
  fuelType: string | null;
  isElectric: boolean;
  rangeElectric: number | null;
  vehicleClass: string | null;
}

export interface CarQuerySpecs {
  modelTrim: string | null;
  modelBody: string | null;
  modelWeight: string | null;
  modelTopSpeed: string | null;
  modelHorsepower: string | null;
  modelTorque: string | null;
  modelZeroToSixty: string | null;
}

export interface UnifiedVehicleData {
  identity: VehicleIdentity;
  vinDecode: NHTSAVinDecodeResult | null;
  safetyRating: NHTSASafetyRating | null;
  recalls: NHTSARecall[];
  recallCount: number;
  complaints: NHTSAComplaint[];
  complaintCount: number;
  fuelEconomy: EPAFuelEconomy | null;
  carQuerySpecs: CarQuerySpecs | null;
  sources: string[];
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                  1. NHTSA VPIC — VIN DECODE                           */
/* ═══════════════════════════════════════════════════════════════════════ */

export async function fetchNHTSAVinDecode(
  vin: string
): Promise<NHTSAVinDecodeResult | null> {
  try {
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${encodeURIComponent(vin)}?format=json`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;

    const data = await res.json();
    const r = data.Results?.[0];
    if (!r) return null;

    // Check NHTSA error code — "0" means success
    const errorCode = String(r.ErrorCode ?? "0").trim();
    if (errorCode !== "0") {
      console.error(`NHTSA VIN decode failed for VIN ${vin}: ErrorCode ${errorCode}`);
      return null;
    }

    return {
      vin,
      year: toInt(r.ModelYear),
      make: clean(r.Make),
      model: clean(r.Model),
      trim: clean(r.Trim),
      bodyClass: clean(r.BodyClass),
      driveType: clean(r.DriveType),
      engineCylinders: toInt(r.EngineCylinders),
      engineDisplacement: clean(r.DisplacementL),
      engineHP: toFloat(r.EngineHP),
      fuelType: clean(r.FuelTypePrimary),
      transmission: clean(r.TransmissionStyle),
      doors: toInt(r.Doors),
      manufacturer: clean(r.Manufacturer),
      plantCity: clean(r.PlantCity),
      plantCountry: clean(r.PlantCountry),
      vehicleType: clean(r.VehicleType),
      gvwr: clean(r.GVWR),
      electrificationLevel: clean(r.ElectrificationLevel),
    };
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                 2. NHTSA SAFETY RATINGS                               */
/* ═══════════════════════════════════════════════════════════════════════ */

export async function fetchNHTSASafetyRating(
  year: number,
  make: string,
  model: string
): Promise<NHTSASafetyRating | null> {
  try {
    const listUrl = `https://api.nhtsa.gov/SafetyRatings/modelyear/${year}/make/${enc(make)}/model/${enc(model)}`;
    const listRes = await fetchWithTimeout(listUrl);
    if (!listRes.ok) return null;

    const listData = await listRes.json();
    const vehicleId = listData.Results?.[0]?.VehicleId;
    if (!vehicleId) return null;

    const ratingRes = await fetchWithTimeout(
      `https://api.nhtsa.gov/SafetyRatings/VehicleId/${vehicleId}`
    );
    if (!ratingRes.ok) return null;

    const r = (await ratingRes.json()).Results?.[0];
    if (!r) return null;

    return {
      overallRating: toRating(r.OverallRating),
      frontalCrashRating: toRating(r.OverallFrontCrashRating),
      sideCrashRating: toRating(r.OverallSideCrashRating),
      rolloverRating: toRating(r.RolloverRating),
      vehicleDescription: clean(r.VehicleDescription),
    };
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                   3. NHTSA COMPLAINTS                                 */
/* ═══════════════════════════════════════════════════════════════════════ */

export async function fetchNHTSAComplaints(
  year: number,
  make: string,
  model: string
): Promise<{ complaints: NHTSAComplaint[]; total: number }> {
  try {
    const url = `https://api.nhtsa.gov/complaints/complaintsByVehicle?make=${enc(make)}&model=${enc(model)}&modelYear=${year}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return { complaints: [], total: 0 };

    const results = (await res.json()).results || [];

    const complaints: NHTSAComplaint[] = results.map(
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

    return { complaints, total: complaints.length };
  } catch {
    return { complaints: [], total: 0 };
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                     4. NHTSA RECALLS                                  */
/* ═══════════════════════════════════════════════════════════════════════ */

export async function fetchNHTSARecalls(
  year: number,
  make: string,
  model: string
): Promise<{ recalls: NHTSARecall[]; total: number }> {
  try {
    const url = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${enc(make)}&model=${enc(model)}&modelYear=${year}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return { recalls: [], total: 0 };

    const results = (await res.json()).results || [];

    const recalls: NHTSARecall[] = results.map(
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

    return { recalls, total: recalls.length };
  } catch {
    return { recalls: [], total: 0 };
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                   5. EPA FUELECONOMY.GOV                              */
/* ═══════════════════════════════════════════════════════════════════════ */

export async function fetchEPAFuelEconomy(
  year: number,
  make: string,
  model: string,
  trim?: string | null
): Promise<EPAFuelEconomy | null> {
  try {
    // Step 1: Get trim/options list
    const optionsUrl = `https://www.fueleconomy.gov/ws/rest/vehicle/menu/options?year=${year}&make=${enc(make)}&model=${enc(model)}`;
    const optRes = await fetchWithTimeout(optionsUrl, {
      headers: { Accept: "application/json" },
    });

    let items: { text: string; value: string }[] | null = null;

    if (optRes.ok) {
      const data = await optRes.json();
      let rawItems = data.menuItem;
      if (rawItems) {
        if (!Array.isArray(rawItems)) rawItems = [rawItems];
        if (rawItems.length > 0) items = rawItems;
      }
    }

    // Step 1b: Fuzzy match if exact failed
    if (!items) {
      const fuzzyModel = await fuzzyMatchEPAModel(year, make, model);
      if (fuzzyModel) {
        const fuzzyUrl = `https://www.fueleconomy.gov/ws/rest/vehicle/menu/options?year=${year}&make=${enc(make)}&model=${enc(fuzzyModel)}`;
        const fuzzyRes = await fetchWithTimeout(fuzzyUrl, {
          headers: { Accept: "application/json" },
        });
        if (fuzzyRes.ok) {
          const data = await fuzzyRes.json();
          let rawItems = data.menuItem;
          if (rawItems) {
            if (!Array.isArray(rawItems)) rawItems = [rawItems];
            if (rawItems.length > 0) items = rawItems;
          }
        }
      }
    }

    if (!items) return null;

    // Step 2: Pick best matching option by trim
    let bestMatch = items[0];
    if (trim) {
      const trimLower = trim.toLowerCase();
      const match = items.find(
        (item) => item.text?.toLowerCase().includes(trimLower)
      );
      if (match) bestMatch = match;
    }

    const vehicleId = bestMatch.value;
    if (!vehicleId) return null;

    // Step 3: Get detailed fuel economy
    const detailRes = await fetchWithTimeout(
      `https://www.fueleconomy.gov/ws/rest/vehicle/${vehicleId}`,
      { headers: { Accept: "application/json" } }
    );
    if (!detailRes.ok) return null;

    const d = await detailRes.json();

    return {
      vehicleId: toInt(vehicleId),
      cityMpg: toFloat(d.city08),
      highwayMpg: toFloat(d.highway08),
      combinedMpg: toFloat(d.comb08),
      annualFuelCost: toFloat(d.fuelCost08),
      co2TailpipeGpm: toFloat(d.co2TailpipeGpm),
      fuelType: clean(d.fuelType),
      isElectric: d.atvType === "EV" || d.fuelType === "Electricity",
      rangeElectric: toFloat(d.rangeA) || toFloat(d.range),
      vehicleClass: clean(d.VClass),
    };
  } catch {
    return null;
  }
}

async function fuzzyMatchEPAModel(
  year: number,
  make: string,
  carModel: string
): Promise<string | null> {
  try {
    const modelListUrl = `https://www.fueleconomy.gov/ws/rest/vehicle/menu/model?year=${year}&make=${enc(make)}`;
    const res = await fetchWithTimeout(modelListUrl, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;

    const data = await res.json();
    let epaModels: { text: string; value: string }[] = data.menuItem;
    if (!epaModels) return null;
    if (!Array.isArray(epaModels)) epaModels = [epaModels];

    const modelNames = epaModels.map((m) => m.text).filter(Boolean);
    const carLower = carModel.toLowerCase().trim();

    // Exact match
    const exact = modelNames.find((m) => m.toLowerCase() === carLower);
    if (exact) return exact;

    // Contains match
    const contains = modelNames.find((m) => {
      const mLower = m.toLowerCase();
      return mLower.includes(carLower) || carLower.includes(mLower);
    });
    if (contains) return contains;

    // First token match
    const tokens = carLower.split(/[\s\-\/]+/).filter(Boolean);
    if (tokens.length > 0) {
      const prefix = modelNames.find((m) =>
        m.toLowerCase().startsWith(tokens[0])
      );
      if (prefix) return prefix;
    }

    return null;
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                     6. CARQUERY API                                   */
/* ═══════════════════════════════════════════════════════════════════════ */

export async function fetchCarQuerySpecs(
  year: number,
  make: string,
  model: string
): Promise<CarQuerySpecs | null> {
  try {
    const url = `https://www.carqueryapi.com/api/0.3/?cmd=getTrims&make=${enc(make.toLowerCase())}&model=${enc(model.toLowerCase())}&year=${year}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;

    // CarQuery returns JSONP, strip callback wrapper
    let text = await res.text();
    text = text.replace(/^[^(]*\(/, "").replace(/\);?\s*$/, "");

    const data = JSON.parse(text);
    const trims = data.Trims;
    if (!trims || !Array.isArray(trims) || trims.length === 0) return null;

    const t = trims[0];
    return {
      modelTrim: clean(t.model_trim),
      modelBody: clean(t.model_body),
      modelWeight: clean(t.model_weight_kg),
      modelTopSpeed: clean(t.model_top_speed_kph),
      modelHorsepower: clean(t.model_engine_power_ps),
      modelTorque: clean(t.model_engine_torque_nm),
      modelZeroToSixty: clean(t.model_0_to_100_kph),
    };
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                  UNIFIED DATA FETCHER                                 */
/* ═══════════════════════════════════════════════════════════════════════ */

/**
 * Fetches and merges data from all available free vehicle data sources.
 * Follows a waterfall pattern:
 * 1. VIN decode (if VIN available) to establish identity
 * 2. Parallel calls to safety, recalls, complaints, fuel economy, CarQuery
 * 3. Returns unified result with source tracking
 */
export async function fetchUnifiedVehicleData(
  identity: VehicleIdentity
): Promise<UnifiedVehicleData> {
  const sources: string[] = [];
  let vinDecode: NHTSAVinDecodeResult | null = null;

  // Phase 1: VIN decode for authoritative identity
  if (identity.vin) {
    vinDecode = await fetchNHTSAVinDecode(identity.vin);
    if (vinDecode) sources.push("nhtsa-vin-decoder");
  }

  // Resolve best identity from VIN decode + provided data
  const year = vinDecode?.year ?? identity.year;
  const make = vinDecode?.make ?? identity.make;
  const model = vinDecode?.model ?? identity.model;
  const trim = vinDecode?.trim ?? identity.trim;

  // Phase 2: Parallel enrichment
  let safetyRating: NHTSASafetyRating | null = null;
  let recallResult = { recalls: [] as NHTSARecall[], total: 0 };
  let complaintResult = { complaints: [] as NHTSAComplaint[], total: 0 };
  let fuelEconomy: EPAFuelEconomy | null = null;
  let carQuerySpecs: CarQuerySpecs | null = null;

  if (year && make && model) {
    const [safetyRes, recallRes, complaintRes, fuelRes, carQueryRes] =
      await Promise.allSettled([
        fetchNHTSASafetyRating(year, make, model),
        fetchNHTSARecalls(year, make, model),
        fetchNHTSAComplaints(year, make, model),
        fetchEPAFuelEconomy(year, make, model, trim),
        fetchCarQuerySpecs(year, make, model),
      ]);

    if (safetyRes.status === "fulfilled" && safetyRes.value) {
      safetyRating = safetyRes.value;
      sources.push("nhtsa-safety-ratings");
    }
    if (recallRes.status === "fulfilled") {
      recallResult = recallRes.value;
      if (recallResult.total > 0) sources.push("nhtsa-recalls");
    }
    if (complaintRes.status === "fulfilled") {
      complaintResult = complaintRes.value;
      if (complaintResult.total > 0) sources.push("nhtsa-complaints");
    }
    if (fuelRes.status === "fulfilled" && fuelRes.value) {
      fuelEconomy = fuelRes.value;
      sources.push("fueleconomy-gov");
    }
    if (carQueryRes.status === "fulfilled" && carQueryRes.value) {
      carQuerySpecs = carQueryRes.value;
      sources.push("carquery-api");
    }
  }

  return {
    identity: { vin: identity.vin, year, make, model, trim },
    vinDecode,
    safetyRating,
    recalls: recallResult.recalls,
    recallCount: recallResult.total,
    complaints: complaintResult.complaints,
    complaintCount: complaintResult.total,
    fuelEconomy,
    carQuerySpecs,
    sources,
  };
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                         HELPERS                                       */
/* ═══════════════════════════════════════════════════════════════════════ */

function clean(value: unknown): string | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed === "" || trimmed === "Not Applicable" || trimmed === "N/A")
    return null;
  return trimmed;
}

function toInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = parseInt(String(value), 10);
  return isNaN(n) ? null : n;
}

function toFloat(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = parseFloat(String(value));
  return isNaN(n) ? null : n;
}

function toRating(value: unknown): number | null {
  if (!value || value === "Not Rated") return null;
  const n = parseInt(String(value), 10);
  return isNaN(n) ? null : n;
}

function enc(value: string): string {
  return encodeURIComponent(value);
}
