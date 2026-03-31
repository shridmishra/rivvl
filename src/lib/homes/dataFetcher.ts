import radonZonesData from "./radonZones.json";
import { logWarn, logAPIFail } from "@/lib/logger";

const radonZones: Record<string, number> = radonZonesData as Record<
  string,
  number
>;

/**
 * Unified Home/Property Data Fetcher
 *
 * Connects to free and freemium APIs for property and neighborhood data.
 * Designed as a waterfall: Firecrawl listing data first, then geocode the
 * address and enrich with neighborhood, environmental, and amenity data.
 *
 * Sources:
 *  1. OpenStreetMap Nominatim (geocoding) — free, no key
 *  2. Census Bureau ACS API — free, requires free API key
 *  3. HUD Fair Market Rents — free, no key
 *  4. Walk Score API — requires free API key
 *  5. OpenFEMA Flood Map API — free, no key
 *  6. EPA EJScreen API — free, no key
 *  7. OpenWeatherMap — free tier, requires free API key
 *  8. Google Maps Places API — free $200/month credit, requires API key
 *  9. Rentcast API — free tier, requires API key
 * 10. Estated API — free trial, requires API key
 *
 * Risk Profile Sources (all free, no key unless noted):
 * 11. FEMA NFHL ArcGIS REST — enhanced flood zone with SFHA, BFE
 * 12. EPA EnviroFacts RCRA + CERCLIS — Superfund/toxic site proximity
 * 13. USGS FDSNWS — earthquake history within 50km
 * 14. USFS Wildfire Hazard Potential ArcGIS REST — wildfire risk class
 * 15. EPA EJScreen — air quality composite score
 * 16. Census geocoder + EPA radon zone lookup — county-level radon risk
 * 17. Year-built flags for lead paint (<1978) and asbestos (<1980)
 */

const API_TIMEOUT = 10000;

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

export interface PropertyIdentity {
  address: string;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  lat?: number | null;
  lon?: number | null;
}

export interface GeocodingResult {
  lat: number;
  lon: number;
  displayName: string;
  city: string | null;
  state: string | null;
  county: string | null;
  zipCode: string | null;
  neighborhood: string | null;
}

export interface CensusData {
  medianHouseholdIncome: number | null;
  totalPopulation: number | null;
  medianAge: number | null;
  bachelorsDegreeOrHigherPct: number | null;
  medianCommuteMins: number | null;
  povertyRate: number | null;
  medianHomeValue: number | null;
  medianGrossRent: number | null;
}

export interface HUDFairMarketRent {
  efficiency: number | null;
  oneBedroom: number | null;
  twoBedroom: number | null;
  threeBedroom: number | null;
  fourBedroom: number | null;
  areaName: string | null;
  year: number | null;
}

export interface WalkScoreResult {
  walkScore: number | null;
  walkDescription: string | null;
  transitScore: number | null;
  transitDescription: string | null;
  bikeScore: number | null;
  bikeDescription: string | null;
}

export interface FloodZoneResult {
  floodZone: string | null;
  floodZoneDescription: string | null;
  isHighRisk: boolean;
  panelNumber: string | null;
}

export interface EnvironmentalData {
  airQualityIndex: number | null;
  particulateMatter25: number | null;
  ozone: number | null;
  dieselParticulateMatter: number | null;
  toxicReleases: number | null;
  superfundProximity: number | null;
  hazardousWasteProximity: number | null;
}

export interface WeatherData {
  currentTemp: number | null;
  feelsLike: number | null;
  humidity: number | null;
  description: string | null;
  windSpeed: number | null;
}

export interface NearbyAmenity {
  name: string;
  type: string;
  distance: number; // meters
  rating: number | null;
}

export interface AmenityProximity {
  schools: NearbyAmenity[];
  hospitals: NearbyAmenity[];
  groceryStores: NearbyAmenity[];
  transitStops: NearbyAmenity[];
}

export interface RentcastData {
  estimatedRent: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  propertyType: string | null;
  lastSalePrice: number | null;
  lastSaleDate: string | null;
}

export interface EstatedData {
  yearBuilt: number | null;
  lotSizeSqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  propertyType: string | null;
  assessedValue: number | null;
  taxAmount: number | null;
  ownerName: string | null;
}

/* ── Risk Profile Types ─────────────────────────────────────────────── */

export interface RiskFloodZone {
  code: string | null;
  isSFHA: boolean;
  elevation: number | null;
  riskLevel: "Low" | "Moderate" | "High" | "Very High" | "Unknown";
}

export interface SuperfundSite {
  name: string;
  distanceMiles: number;
  lat: number;
  lon: number;
}

export interface RiskSuperfundSites {
  count1mile: number;
  count3mile: number;
  sites: SuperfundSite[];
}

export interface RiskEarthquake {
  eventCount: number;
  maxMagnitude: number | null;
  riskLevel: "Low" | "Moderate" | "High";
}

export interface RiskWildfire {
  class: string | null;
  riskLevel: "Low" | "Moderate" | "High" | "Very High" | "Unknown";
}

export interface RiskAirQuality {
  score: number | null;
  description: string | null;
}

export interface RiskRadonZone {
  zone: number | null;
  riskLabel: "High" | "Moderate" | "Low" | "Unknown";
}

export interface HomeRiskProfile {
  floodZone: RiskFloodZone;
  superfundSites: RiskSuperfundSites;
  earthquakeRisk: RiskEarthquake;
  wildfireRisk: RiskWildfire;
  airQuality: RiskAirQuality;
  radonZone: RiskRadonZone;
  leadPaintRisk: boolean;
  asbestosRisk: boolean;
  // New community context fields
  crimeData?: {
    violentCrimeRate: number | null;
    propertyCrimeRate: number | null;
    jurisdiction: string | null;
    year: number | null;
    comparedToNational: "below" | "at" | "above" | null;
  } | null;
  locationAffordability?: {
    housingTransportPct: number | null;
    isAffordable: boolean | null;
    source: string;
  } | null;
  triFacilities?: {
    countWithin2Miles: number;
    facilities: { name: string; type: string }[];
  } | null;
}

export interface UnifiedHomeData {
  identity: PropertyIdentity;
  geocoding: GeocodingResult | null;
  census: CensusData | null;
  hudRent: HUDFairMarketRent | null;
  walkScore: WalkScoreResult | null;
  floodZone: FloodZoneResult | null;
  environmental: EnvironmentalData | null;
  weather: WeatherData | null;
  amenities: AmenityProximity | null;
  rentcast: RentcastData | null;
  estated: EstatedData | null;
  riskProfile: HomeRiskProfile | null;
  sources: string[];
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                 1. OPENSTREETMAP NOMINATIM (GEOCODING)                */
/* ═══════════════════════════════════════════════════════════════════════ */

export async function geocodeAddress(
  address: string,
  fallbackParts?: { city?: string | null; state?: string | null; zip?: string | null }
): Promise<GeocodingResult | null> {
  // Attempt 1: Nominatim with full address
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1&limit=1`;
    const res = await fetchWithTimeout(url, {
      headers: { "User-Agent": "rivvl-comparison-app/1.0" },
    });
    if (res.ok) {
      const results = await res.json();
      if (results && results.length > 0) {
        const r = results[0];
        const addr = r.address || {};
        console.log(`[geocoding] Nominatim succeeded for: ${address}`);
        return {
          lat: parseFloat(r.lat),
          lon: parseFloat(r.lon),
          displayName: r.display_name || address,
          city: addr.city || addr.town || addr.village || null,
          state: addr.state || null,
          county: addr.county || null,
          zipCode: addr.postcode || null,
          neighborhood: addr.suburb || addr.neighbourhood || null,
        };
      }
    }
  } catch {
    // Nominatim failed, try fallbacks
  }

  // Attempt 2: Nominatim with simplified address (City, State ZIP)
  if (fallbackParts) {
    const simpleParts = [fallbackParts.city, fallbackParts.state, fallbackParts.zip].filter(Boolean);
    if (simpleParts.length >= 2) {
      try {
        const simpleAddress = simpleParts.join(", ");
        console.log(`[geocoding] Trying simplified Nominatim: ${simpleAddress}`);
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(simpleAddress)}&format=json&addressdetails=1&limit=1`;
        const res = await fetchWithTimeout(url, {
          headers: { "User-Agent": "rivvl-comparison-app/1.0" },
        });
        if (res.ok) {
          const results = await res.json();
          if (results && results.length > 0) {
            const r = results[0];
            const addr = r.address || {};
            console.log(`[geocoding] Simplified Nominatim succeeded for: ${simpleAddress}`);
            return {
              lat: parseFloat(r.lat),
              lon: parseFloat(r.lon),
              displayName: r.display_name || simpleAddress,
              city: addr.city || addr.town || addr.village || null,
              state: addr.state || null,
              county: addr.county || null,
              zipCode: addr.postcode || null,
              neighborhood: addr.suburb || addr.neighbourhood || null,
            };
          }
        }
      } catch {
        // Simplified Nominatim failed too
      }
    }
  }

  // Attempt 3: Google Maps Geocoding API
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  if (googleKey) {
    try {
      console.log(`[geocoding] Trying Google Maps for: ${address}`);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleKey}`;
      const res = await fetchWithTimeout(url);
      if (res.ok) {
        const data = await res.json();
        if (data.status === "OK" && data.results && data.results.length > 0) {
          const result = data.results[0];
          const loc = result.geometry.location;
          const components = result.address_components || [];
          const getComponent = (type: string): string | null => {
            const c = components.find((c: { types: string[] }) => c.types.includes(type));
            return c ? (c as { long_name: string }).long_name : null;
          };
          console.log(`[geocoding] Google Maps succeeded for: ${address}`);
          return {
            lat: loc.lat,
            lon: loc.lng,
            displayName: result.formatted_address || address,
            city: getComponent("locality") || getComponent("sublocality") || null,
            state: getComponent("administrative_area_level_1") || null,
            county: getComponent("administrative_area_level_2") || null,
            zipCode: getComponent("postal_code") || null,
            neighborhood: getComponent("neighborhood") || null,
          };
        }
      }
    } catch {
      // Google geocoding failed
    }
  }

  console.warn(`[geocoding] All geocoding attempts failed for: ${address}`);
  logWarn("dataFetcher/geocoding", `All geocoding attempts failed for: ${address}`, { vertical: "homes" });
  return null;
}

export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<GeocodingResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const res = await fetchWithTimeout(url, {
      headers: { "User-Agent": "rivvl-comparison-app/1.0" },
    });
    if (!res.ok) return null;

    const r = await res.json();
    const addr = r.address || {};

    return {
      lat,
      lon,
      displayName: r.display_name || "",
      city: addr.city || addr.town || addr.village || null,
      state: addr.state || null,
      county: addr.county || null,
      zipCode: addr.postcode || null,
      neighborhood: addr.suburb || addr.neighbourhood || null,
    };
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*           2. CENSUS BUREAU ACS (American Community Survey)            */
/* ═══════════════════════════════════════════════════════════════════════ */

export async function fetchCensusData(
  zipCode: string
): Promise<CensusData | null> {
  const apiKey = process.env.CENSUS_API_KEY;
  if (!apiKey) {
    console.log("[homes] Census API key not configured (CENSUS_API_KEY)");
    return null;
  }

  try {
    // ACS 5-year estimates for ZIP Code Tabulation Areas (ZCTA)
    const variables = [
      "B19013_001E", // Median household income
      "B01003_001E", // Total population
      "B01002_001E", // Median age
      "B15003_022E", // Bachelor's degree count
      "B15003_001E", // Total population 25+
      "B08303_001E", // Total commuters
      "B08303_013E", // Commute 60+ mins
      "B17001_002E", // Below poverty level
      "B17001_001E", // Total for poverty calculation
      "B25077_001E", // Median home value
      "B25064_001E", // Median gross rent
    ].join(",");

    const url = `https://api.census.gov/data/2022/acs/acs5?get=${variables}&for=zip%20code%20tabulation%20area:${zipCode}&key=${apiKey}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data || data.length < 2) return null;

    const values = data[1]; // First row is headers, second is data

    const totalPop25Plus = toFloat(values[4]);
    const bachelorsCount = toFloat(values[3]);
    const bachelorsPct =
      totalPop25Plus && bachelorsCount
        ? Math.round((bachelorsCount / totalPop25Plus) * 100 * 10) / 10
        : null;

    const povertyBelow = toFloat(values[7]);
    const povertyTotal = toFloat(values[8]);
    const povertyRate =
      povertyTotal && povertyBelow
        ? Math.round((povertyBelow / povertyTotal) * 100 * 10) / 10
        : null;

    return {
      medianHouseholdIncome: toFloat(values[0]),
      totalPopulation: toFloat(values[1]),
      medianAge: toFloat(values[2]),
      bachelorsDegreeOrHigherPct: bachelorsPct,
      medianCommuteMins: null, // Would require a different variable set
      povertyRate,
      medianHomeValue: toFloat(values[9]),
      medianGrossRent: toFloat(values[10]),
    };
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*            2b. CENSUS TRACT-LEVEL DATA (via Census Geocoder)          */
/* ═══════════════════════════════════════════════════════════════════════ */

export interface CensusTractData {
  medianHouseholdIncome: number | null;
  ownerOccupiedPct: number | null;
  totalPopulation: number | null;
  medianHomeValue: number | null;
  source: "tract" | "zip" | "state";
  geoLabel: string;
}

/**
 * Fetch Census data at the tract level using lat/lon.
 * Falls back to ZIP-level, then state-level.
 */
export async function fetchCensusTractData(
  lat: number,
  lon: number,
  zipCode?: string | null,
  stateAbbr?: string | null
): Promise<CensusTractData | null> {
  const apiKey = process.env.CENSUS_API_KEY;
  if (!apiKey) {
    console.log("[homes] Census API key not configured (CENSUS_API_KEY)");
    return null;
  }

  // Strategy 1: Get FIPS codes from Census Geocoder, then fetch tract-level ACS data
  try {
    const geoUrl =
      `https://geocoding.geo.census.gov/geocoder/geographies/coordinates` +
      `?x=${lon}&y=${lat}&benchmark=Public_AR_Current` +
      `&vintage=Current_Current&format=json`;
    console.log(`[census] Fetching FIPS codes from Census Geocoder for ${lat}, ${lon}`);
    const geoRes = await fetchWithTimeout(geoUrl, {}, 10000);
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      const tracts = geoData?.result?.geographies?.["Census Tracts"];
      if (tracts && tracts.length > 0) {
        const tract = tracts[0];
        const stateFips = tract.STATE;
        const countyFips = tract.COUNTY;
        const tractCode = tract.TRACT;

        if (stateFips && countyFips && tractCode) {
          console.log(`[census] FIPS codes found: state=${stateFips}, county=${countyFips}, tract=${tractCode}`);
          // Fetch ACS 5-year: B19013 (median income), B25003 (tenure/owner-occupied), B01003 (pop), B25077 (home value)
          const variables = [
            "B19013_001E", // Median household income
            "B25003_001E", // Total occupied housing units
            "B25003_002E", // Owner-occupied housing units
            "B01003_001E", // Total population
            "B25077_001E", // Median home value
          ].join(",");

          const tractUrl = `https://api.census.gov/data/2022/acs/acs5?get=${variables}&for=tract:${tractCode}&in=state:${stateFips}+county:${countyFips}&key=${apiKey}`;
          const tractRes = await fetchWithTimeout(tractUrl, {}, 10000);
          if (tractRes.ok) {
            const tractData = await tractRes.json();
            if (tractData && tractData.length >= 2) {
              const values = tractData[1];
              const totalOccupied = toFloat(values[1]);
              const ownerOccupied = toFloat(values[2]);
              const ownerPct = totalOccupied && ownerOccupied
                ? Math.round((ownerOccupied / totalOccupied) * 100 * 10) / 10
                : null;

              console.log(`[census] Tract-level data found for ${stateFips}/${countyFips}/${tractCode}`);
              return {
                medianHouseholdIncome: toFloat(values[0]),
                ownerOccupiedPct: ownerPct,
                totalPopulation: toFloat(values[3]),
                medianHomeValue: toFloat(values[4]),
                source: "tract",
                geoLabel: `Census Tract ${tractCode}, ${stateFips}-${countyFips}`,
              };
            } else {
              console.warn(`[census] Tract ACS returned no data rows for ${stateFips}/${countyFips}/${tractCode}`);
            }
          } else {
            console.warn(`[census] Tract ACS HTTP ${tractRes.status} for ${stateFips}/${countyFips}/${tractCode}`);
          }
        } else {
          console.warn(`[census] Census Geocoder returned tract without complete FIPS codes:`, { stateFips, countyFips, tractCode });
        }
      } else {
        console.warn(`[census] Census Geocoder returned no tracts for ${lat}, ${lon}`);
      }
    } else {
      console.warn(`[census] Census Geocoder HTTP ${geoRes.status} for ${lat}, ${lon}`);
    }
  } catch (err) {
    console.warn("[census] Tract-level fetch failed:", err instanceof Error ? err.message : String(err));
  }

  // Strategy 2: Fall back to ZIP-level data
  if (zipCode) {
    try {
      const zipData = await fetchCensusData(zipCode);
      if (zipData && zipData.medianHouseholdIncome) {
        console.log(`[census] ZIP-level fallback for ${zipCode}`);
        return {
          medianHouseholdIncome: zipData.medianHouseholdIncome,
          ownerOccupiedPct: null, // Not available from ZIP query
          totalPopulation: zipData.totalPopulation,
          medianHomeValue: zipData.medianHomeValue,
          source: "zip",
          geoLabel: `ZIP ${zipCode}`,
        };
      }
    } catch {
      // ZIP fallback failed
    }
  }

  // Strategy 3: State-level fallback
  if (stateAbbr) {
    try {
      const stateMap: Record<string, string> = {
        AL: "01", AK: "02", AZ: "04", AR: "05", CA: "06", CO: "08", CT: "09",
        DE: "10", FL: "12", GA: "13", HI: "15", ID: "16", IL: "17", IN: "18",
        IA: "19", KS: "20", KY: "21", LA: "22", ME: "23", MD: "24", MA: "25",
        MI: "26", MN: "27", MS: "28", MO: "29", MT: "30", NE: "31", NV: "32",
        NH: "33", NJ: "34", NM: "35", NY: "36", NC: "37", ND: "38", OH: "39",
        OK: "40", OR: "41", PA: "42", RI: "44", SC: "45", SD: "46", TN: "47",
        TX: "48", UT: "49", VT: "50", VA: "51", WA: "53", WV: "54", WI: "55",
        WY: "56", DC: "11",
      };
      const stateFips = stateMap[stateAbbr.toUpperCase()];
      if (stateFips) {
        const variables = "B19013_001E,B25003_001E,B25003_002E,B01003_001E,B25077_001E";
        const stateUrl = `https://api.census.gov/data/2022/acs/acs5?get=${variables}&for=state:${stateFips}&key=${apiKey}`;
        const stateRes = await fetchWithTimeout(stateUrl, {}, 10000);
        if (stateRes.ok) {
          const stateData = await stateRes.json();
          if (stateData && stateData.length >= 2) {
            const values = stateData[1];
            const totalOccupied = toFloat(values[1]);
            const ownerOccupied = toFloat(values[2]);
            const ownerPct = totalOccupied && ownerOccupied
              ? Math.round((ownerOccupied / totalOccupied) * 100 * 10) / 10
              : null;

            console.log(`[census] State-level fallback for ${stateAbbr}`);
            return {
              medianHouseholdIncome: toFloat(values[0]),
              ownerOccupiedPct: ownerPct,
              totalPopulation: toFloat(values[3]),
              medianHomeValue: toFloat(values[4]),
              source: "state",
              geoLabel: `State-level estimate (${stateAbbr}), neighborhood data unavailable for this specific address`,
            };
          }
        }
      }
    } catch {
      // State fallback failed
    }
  }

  return null;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                   3. HUD FAIR MARKET RENTS                            */
/* ═══════════════════════════════════════════════════════════════════════ */

export async function fetchHUDFairMarketRent(
  zipCode: string
): Promise<HUDFairMarketRent | null> {
  try {
    const url = `https://www.huduser.gov/hudapi/public/fmr/data/${zipCode}`;
    const res = await fetchWithTimeout(url, {
      headers: { Authorization: `Bearer ${process.env.HUD_API_KEY || ""}` },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const fmr = data?.data?.basicdata;
    if (!fmr) return null;

    return {
      efficiency: toFloat(fmr.Efficiency),
      oneBedroom: toFloat(fmr.One_Bedroom),
      twoBedroom: toFloat(fmr.Two_Bedroom),
      threeBedroom: toFloat(fmr.Three_Bedroom),
      fourBedroom: toFloat(fmr.Four_Bedroom),
      areaName: clean(fmr.area_name),
      year: toInt(fmr.year),
    };
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                      4. WALK SCORE API                                */
/* ═══════════════════════════════════════════════════════════════════════ */

export async function fetchWalkScore(
  address: string,
  lat: number,
  lon: number
): Promise<WalkScoreResult | null> {
  const apiKey = process.env.WALKSCORE_API_KEY;
  if (!apiKey) {
    console.log("[homes] Walk Score API key not configured (WALKSCORE_API_KEY)");
    return null;
  }

  try {
    const url = `https://api.walkscore.com/score?format=json&address=${encodeURIComponent(address)}&lat=${lat}&lon=${lon}&transit=1&bike=1&wsapikey=${apiKey}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== 1) return null;

    return {
      walkScore: toInt(data.walkscore),
      walkDescription: clean(data.description),
      transitScore: data.transit ? toInt(data.transit.score) : null,
      transitDescription: data.transit ? clean(data.transit.description) : null,
      bikeScore: data.bike ? toInt(data.bike.score) : null,
      bikeDescription: data.bike ? clean(data.bike.description) : null,
    };
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                  5. OPENFEMA FLOOD MAP API                            */
/* ═══════════════════════════════════════════════════════════════════════ */

export async function fetchFloodZone(
  lat: number,
  lon: number
): Promise<FloodZoneResult | null> {
  try {
    const url =
      `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query` +
      `?geometry=${lon},${lat}&geometryType=esriGeometryPoint` +
      `&inSR=4326&spatialRel=esriSpatialRelIntersects` +
      `&outFields=FLD_ZONE,ZONE_SUBTY,DFIRM_ID&returnGeometry=false&f=json`;

    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;

    const data = await res.json();
    const features = data.features;
    if (!features || features.length === 0) {
      return {
        floodZone: "X",
        floodZoneDescription: "Area of minimal flood hazard",
        isHighRisk: false,
        panelNumber: null,
      };
    }

    const attr = features[0].attributes;
    const zone = attr.FLD_ZONE || "Unknown";

    const highRiskZones = ["A", "AE", "AH", "AO", "AR", "A99", "V", "VE"];
    const isHighRisk = highRiskZones.includes(zone);

    const descriptions: Record<string, string> = {
      A: "High risk flood zone (100-year floodplain)",
      AE: "High risk flood zone with base flood elevations determined",
      AH: "High risk flood zone (shallow flooding, 1-3 feet)",
      AO: "High risk flood zone (sheet flow, 1-3 feet)",
      V: "High risk coastal flood zone with wave action",
      VE: "High risk coastal flood zone with base flood elevations",
      X: "Area of minimal flood hazard",
      B: "Moderate flood hazard area (500-year floodplain)",
      C: "Area of minimal flood hazard",
      D: "Possible but undetermined flood hazard",
    };

    return {
      floodZone: zone,
      floodZoneDescription: descriptions[zone] || `Flood zone ${zone}`,
      isHighRisk,
      panelNumber: clean(attr.DFIRM_ID),
    };
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                  6. EPA EJSCREEN API                                  */
/* ═══════════════════════════════════════════════════════════════════════ */

export async function fetchEnvironmentalData(
  lat: number,
  lon: number
): Promise<EnvironmentalData | null> {
  try {
    const url =
      `https://ejscreen.epa.gov/mapper/ejscreenRESTbroker.aspx` +
      `?namestr=&geometry={"x":${lon},"y":${lat},"spatialReference":{"wkid":4326}}` +
      `&distance=1&unit=9035&aession=&f=json`;

    const res = await fetchWithTimeout(url, {}, 10000);
    if (!res.ok) return null;

    const data = await res.json();
    const raw = data?.data?.[0];
    if (!raw) return null;

    return {
      airQualityIndex: toFloat(raw.ACSTOTPOP) ? toFloat(raw.D_PM25_2) : null,
      particulateMatter25: toFloat(raw.D_PM25_2),
      ozone: toFloat(raw.D_OZONE_2),
      dieselParticulateMatter: toFloat(raw.D_DSLPM_2),
      toxicReleases: toFloat(raw.D_RSEI_2),
      superfundProximity: toFloat(raw.D_PNPL_2),
      hazardousWasteProximity: toFloat(raw.D_PRMP_2),
    };
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                  7. OPENWEATHERMAP API                                */
/* ═══════════════════════════════════════════════════════════════════════ */

export async function fetchWeather(
  lat: number,
  lon: number
): Promise<WeatherData | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.log(
      "[homes] OpenWeatherMap API key not configured (OPENWEATHER_API_KEY)"
    );
    return null;
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;

    const data = await res.json();

    return {
      currentTemp: toFloat(data.main?.temp),
      feelsLike: toFloat(data.main?.feels_like),
      humidity: toFloat(data.main?.humidity),
      description: data.weather?.[0]?.description || null,
      windSpeed: toFloat(data.wind?.speed),
    };
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                8. GOOGLE MAPS PLACES API                              */
/* ═══════════════════════════════════════════════════════════════════════ */

export async function fetchNearbyAmenities(
  lat: number,
  lon: number
): Promise<AmenityProximity | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.log(
      "[homes] Google Maps API key not configured (GOOGLE_MAPS_API_KEY)"
    );
    return null;
  }

  try {
    const searchTypes = [
      { key: "schools", type: "school", radius: 3000 },
      { key: "hospitals", type: "hospital", radius: 5000 },
      { key: "groceryStores", type: "supermarket", radius: 2000 },
      { key: "transitStops", type: "transit_station", radius: 2000 },
    ] as const;

    const results: Record<string, NearbyAmenity[]> = {
      schools: [],
      hospitals: [],
      groceryStores: [],
      transitStops: [],
    };

    const fetches = searchTypes.map(async ({ key, type, radius }) => {
      try {
        const res = await fetchWithTimeout(
          'https://places.googleapis.com/v1/places:searchNearby',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': apiKey,
              'X-Goog-FieldMask': 'places.displayName,places.location,places.rating',
            },
            body: JSON.stringify({
              includedTypes: [type],
              locationRestriction: {
                circle: {
                  center: { latitude: lat, longitude: lon },
                  radius,
                },
              },
              maxResultCount: 5,
            }),
          }
        );
        if (!res.ok) {
          console.warn(`[amenities] Google Places (New) HTTP ${res.status} for type=${type}`);
          return;
        }

        const data = await res.json();
        const places = (data.places || []).slice(0, 5);

        results[key] = places.map(
          (p: {
            displayName?: { text: string };
            location?: { latitude: number; longitude: number };
            rating?: number;
          }) => ({
            name: p.displayName?.text ?? 'Unknown',
            type,
            distance: haversineDistance(
              lat,
              lon,
              p.location?.latitude ?? lat,
              p.location?.longitude ?? lon
            ),
            rating: p.rating || null,
          })
        );
      } catch {
        // Individual search failed, continue
      }
    });

    await Promise.allSettled(fetches);

    return {
      schools: results.schools,
      hospitals: results.hospitals,
      groceryStores: results.groceryStores,
      transitStops: results.transitStops,
    };
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                     9. RENTCAST API                                   */
/* ═══════════════════════════════════════════════════════════════════════ */

export async function fetchRentcastData(
  address: string,
  zipCode: string
): Promise<RentcastData | null> {
  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey) {
    console.log("[homes] Rentcast API key not configured (RENTCAST_API_KEY)");
    return null;
  }

  try {
    const url = `https://api.rentcast.io/v1/properties?address=${encodeURIComponent(address)}&zipCode=${zipCode}`;
    const res = await fetchWithTimeout(url, {
      headers: { "X-Api-Key": apiKey, Accept: "application/json" },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const property = Array.isArray(data) ? data[0] : data;
    if (!property) return null;

    return {
      estimatedRent: toFloat(property.rentEstimate),
      bedrooms: toInt(property.bedrooms),
      bathrooms: toFloat(property.bathrooms),
      sqft: toInt(property.squareFootage),
      propertyType: clean(property.propertyType),
      lastSalePrice: toFloat(property.lastSalePrice),
      lastSaleDate: clean(property.lastSaleDate),
    };
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                     10. ESTATED API                                   */
/* ═══════════════════════════════════════════════════════════════════════ */

/**
 * Estated/ATTOM API — DISABLED.
 * The ESTATED_API_KEY placeholder remains in .env.local for future use,
 * but no active API calls are made. The app functions fully without it.
 * Property data is sourced from Rentcast and Firecrawl instead.
 */
export async function fetchEstatedData(
  streetAddress: string,
  zipCode: string
): Promise<EstatedData | null> {
  // Estated/ATTOM API disabled. Keeping function signature for compatibility.
  void streetAddress;
  void zipCode;
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*              RISK SOURCE 1: FEMA FLOOD ZONE (ENHANCED)                */
/* ═══════════════════════════════════════════════════════════════════════ */

async function fetchRiskFloodZone(
  lat: number,
  lon: number
): Promise<RiskFloodZone> {
  const fallback: RiskFloodZone = {
    code: null,
    isSFHA: false,
    elevation: null,
    riskLevel: "Unknown",
  };
  try {
    const url =
      `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query` +
      `?geometry=${lon},${lat}&geometryType=esriGeometryPoint` +
      `&inSR=4326&spatialRel=esriSpatialRelIntersects` +
      `&outFields=FLD_ZONE,ZONE_SUBTY,SFHA_TF,BFE_REVERT` +
      `&returnGeometry=false&f=json`;

    const res = await fetchWithTimeout(url, {}, 10000);
    if (!res.ok) return fallback;

    const data = await res.json();
    const features = data.features;
    if (!features || features.length === 0) {
      return { code: "X", isSFHA: false, elevation: null, riskLevel: "Low" };
    }

    const attr = features[0].attributes;
    const code = attr.FLD_ZONE || null;
    const isSFHA = attr.SFHA_TF === "T" || attr.SFHA_TF === true;
    const elevation = toFloat(attr.BFE_REVERT);

    const highRiskZones = ["A", "AE", "AH", "AO", "AR", "A99", "V", "VE"];
    const veryHighZones = ["V", "VE"];
    const moderateZones = ["B", "D"];

    let riskLevel: RiskFloodZone["riskLevel"] = "Low";
    if (code && veryHighZones.includes(code)) riskLevel = "Very High";
    else if (code && highRiskZones.includes(code)) riskLevel = "High";
    else if (code && moderateZones.includes(code)) riskLevel = "Moderate";

    return { code, isSFHA, elevation, riskLevel };
  } catch {
    return fallback;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*           RISK SOURCE 2: EPA SUPERFUND / TOXIC SITES                  */
/* ═══════════════════════════════════════════════════════════════════════ */

async function fetchRiskSuperfund(
  lat: number,
  lon: number
): Promise<RiskSuperfundSites> {
  const fallback: RiskSuperfundSites = {
    count1mile: 0,
    count3mile: 0,
    sites: [],
  };

  try {
    // Round coords to 2 decimals for the EPA REST API proximity search
    const latR = Math.round(lat * 100) / 100;
    const lonR = Math.round(lon * 100) / 100;

    const [rcraRes, cercRes] = await Promise.allSettled([
      fetchWithTimeout(
        `https://data.epa.gov/efservice/RCRA_FACILITIES/LATITUDE82/${latR}/LONGITUDE82/${lonR}/JSON`,
        {},
        15000
      ),
      fetchWithTimeout(
        `https://data.epa.gov/efservice/CERCLIS_PADS/SITE_LATITUDE/${latR}/SITE_LONGITUDE/${lonR}/JSON`,
        {},
        15000
      ),
    ]);

    const allSites: SuperfundSite[] = [];

    // Process RCRA facilities
    if (rcraRes.status === "fulfilled" && rcraRes.value.ok) {
      const rcraData = await rcraRes.value.json();
      if (Array.isArray(rcraData)) {
        for (const f of rcraData) {
          const fLat = parseFloat(f.LATITUDE83 || f.LATITUDE82);
          const fLon = parseFloat(f.LONGITUDE83 || f.LONGITUDE82);
          if (isNaN(fLat) || isNaN(fLon)) continue;
          const distMeters = haversineDistance(lat, lon, fLat, fLon);
          const distMiles = distMeters / 1609.34;
          if (distMiles <= 3) {
            allSites.push({
              name: f.HANDLER_NAME || f.EPA_ID || "RCRA Facility",
              distanceMiles: Math.round(distMiles * 100) / 100,
              lat: fLat,
              lon: fLon,
            });
          }
        }
      }
    }

    // Process Superfund NPL sites
    if (cercRes.status === "fulfilled" && cercRes.value.ok) {
      const cercData = await cercRes.value.json();
      if (Array.isArray(cercData)) {
        for (const s of cercData) {
          const sLat = parseFloat(s.SITE_LATITUDE);
          const sLon = parseFloat(s.SITE_LONGITUDE);
          if (isNaN(sLat) || isNaN(sLon)) continue;
          const distMeters = haversineDistance(lat, lon, sLat, sLon);
          const distMiles = distMeters / 1609.34;
          if (distMiles <= 3) {
            allSites.push({
              name: s.SITE_NAME || s.EPA_ID || "Superfund Site",
              distanceMiles: Math.round(distMiles * 100) / 100,
              lat: sLat,
              lon: sLon,
            });
          }
        }
      }
    }

    // Sort by distance
    allSites.sort((a, b) => a.distanceMiles - b.distanceMiles);

    return {
      count1mile: allSites.filter((s) => s.distanceMiles <= 1).length,
      count3mile: allSites.length,
      sites: allSites,
    };
  } catch {
    return fallback;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*             RISK SOURCE 3: USGS EARTHQUAKE HISTORY                    */
/* ═══════════════════════════════════════════════════════════════════════ */

async function fetchRiskEarthquake(
  lat: number,
  lon: number
): Promise<RiskEarthquake> {
  const fallback: RiskEarthquake = {
    eventCount: 0,
    maxMagnitude: null,
    riskLevel: "Low",
  };
  try {
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    const startTime = tenYearsAgo.toISOString().split("T")[0];

    const url =
      `https://earthquake.usgs.gov/fdsnws/event/1/query` +
      `?format=geojson&latitude=${lat}&longitude=${lon}` +
      `&maxradiuskm=50&minmagnitude=3.0&orderby=time&limit=10` +
      `&starttime=${startTime}`;

    const res = await fetchWithTimeout(url, {}, 10000);
    if (!res.ok) return fallback;

    const data = await res.json();
    const features = data.features || [];
    const eventCount = features.length;

    let maxMagnitude: number | null = null;
    for (const f of features) {
      const mag = f.properties?.mag;
      if (typeof mag === "number" && (maxMagnitude === null || mag > maxMagnitude)) {
        maxMagnitude = mag;
      }
    }

    let riskLevel: RiskEarthquake["riskLevel"] = "Low";
    if (eventCount >= 5 || (maxMagnitude && maxMagnitude >= 5.0))
      riskLevel = "High";
    else if (eventCount >= 2 || (maxMagnitude && maxMagnitude >= 4.0))
      riskLevel = "Moderate";

    return { eventCount, maxMagnitude, riskLevel };
  } catch {
    return fallback;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*               RISK SOURCE 4: WILDFIRE RISK (USFS)                     */
/* ═══════════════════════════════════════════════════════════════════════ */

async function fetchRiskWildfire(
  lat: number,
  lon: number
): Promise<RiskWildfire> {
  const fallback: RiskWildfire = { class: null, riskLevel: "Unknown" };
  try {
    const url =
      `https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_WildlandUrbanInterface_01/MapServer/2/query` +
      `?geometry=${lon},${lat}&geometryType=esriGeometryPoint` +
      `&inSR=4326&spatialRel=esriSpatialRelIntersects` +
      `&outFields=WHP_CLASS&returnGeometry=false&f=json`;

    const res = await fetchWithTimeout(url, {}, 10000);
    if (!res.ok) return fallback;

    const data = await res.json();
    const features = data.features;
    if (!features || features.length === 0) {
      // No WUI data for this location — this typically means the area is outside
      // the wildland-urban interface, which implies minimal wildfire risk.
      return { class: "Minimal", riskLevel: "Low" };
    }

    const whpClass = features[0].attributes?.WHP_CLASS;
    const classStr = whpClass != null ? String(whpClass) : null;

    // WHP_CLASS: 1=Very Low, 2=Low, 3=Moderate, 4=High, 5=Very High
    const riskMap: Record<string, RiskWildfire["riskLevel"]> = {
      "1": "Low",
      "2": "Low",
      "3": "Moderate",
      "4": "High",
      "5": "Very High",
    };

    const labelMap: Record<string, string> = {
      "1": "Very Low",
      "2": "Low",
      "3": "Moderate",
      "4": "High",
      "5": "Very High",
    };

    return {
      class: classStr ? (labelMap[classStr] || classStr) : null,
      riskLevel: classStr ? (riskMap[classStr] || "Unknown") : "Unknown",
    };
  } catch {
    return fallback;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*          RISK SOURCE 5: EPA EJSCREEN AIR QUALITY SCORE                */
/* ═══════════════════════════════════════════════════════════════════════ */

async function fetchRiskAirQuality(
  address: string,
  lat?: number | null,
  lon?: number | null
): Promise<RiskAirQuality> {
  const fallback: RiskAirQuality = { score: null, description: "Air quality data not available for this location" };

  // Step 1: Try EPA EJScreen (prefer lat/lon geometry for reliability, fall back to address)
  try {
    const url = lat != null && lon != null
      ? `https://ejscreen.epa.gov/mapper/ejscreenRESTbroker.aspx` +
        `?namestr=&geometry={"x":${lon},"y":${lat},"spatialReference":{"wkid":4326}}` +
        `&distance=1&unit=9035&aession=&f=json`
      : `https://ejscreen.epa.gov/mapper/ejscreenRESTbroker.aspx` +
        `?namestr=${encodeURIComponent(address)}` +
        `&distance=1&unit=mile&areatype=address` +
        `&areaid=${encodeURIComponent(address)}&f=json`;

    const res = await fetchWithTimeout(url, {}, 10000);
    if (res.ok) {
      const data = await res.json();
      const raw = data?.data?.[0];
      if (raw) {
        // D_PM25_2 = particulate matter percentile, D_OZONE_2 = ozone percentile
        // D_RSEI_2 = toxic releases, D_PRMP_2 = industrial proximity
        const pm25 = toFloat(raw.D_PM25_2);
        const ozone = toFloat(raw.D_OZONE_2);
        const toxicReleases = toFloat(raw.D_RSEI_2);
        const industrialProx = toFloat(raw.D_PRMP_2);

        // Compute a composite score 0-100 (100 = cleanest)
        const metrics = [pm25, ozone, toxicReleases, industrialProx].filter(
          (v): v is number => v !== null
        );
        if (metrics.length > 0) {
          // EPA percentiles: higher = worse. Invert to make higher = better.
          const avgPercentile =
            metrics.reduce((sum, v) => sum + v, 0) / metrics.length;
          const score = Math.round(100 - avgPercentile);

          let description: string;
          if (score >= 80) description = "good air quality";
          else if (score >= 60)
            description = "moderate air quality";
          else if (score >= 40)
            description = "elevated due to nearby pollution sources";
          else
            description = "elevated due to nearby industrial activity";

          return { score, description };
        }
      }
    }
  } catch {
    // EJScreen failed, try fallback
  }

  // Step 2: Try AirNow API (requires free API key)
  const airNowKey = process.env.AIRNOW_API_KEY;
  if (airNowKey && lat != null && lon != null) {
    try {
      const airNowUrl =
        `https://www.airnowapi.org/aq/observation/latLong/current/` +
        `?format=application/json&latitude=${lat}&longitude=${lon}` +
        `&distance=25&API_KEY=${airNowKey}`;
      const res = await fetchWithTimeout(airNowUrl, {}, 10000);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // AirNow returns AQI values; lower is better
          // Average the AQI values, then invert to our 0-100 scale (100 = best)
          const aqiValues = data
            .map((d: Record<string, unknown>) => toFloat(d.AQI as unknown))
            .filter((v): v is number => v !== null);
          if (aqiValues.length > 0) {
            const avgAqi = aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length;
            // AQI 0-50 = good, 51-100 = moderate, 101-150 = unhealthy for sensitive
            // Convert to our 0-100 scale where 100 = best
            const score = Math.max(0, Math.min(100, Math.round(100 - avgAqi)));
            let description: string;
            if (avgAqi <= 50) description = "good air quality";
            else if (avgAqi <= 100) description = "moderate air quality";
            else if (avgAqi <= 150) description = "unhealthy for sensitive groups";
            else description = "unhealthy air quality";
            return { score, description };
          }
        }
      }
    } catch {
      // AirNow also failed
    }
  }

  // Step 3: Return neutral fallback — NOT a red/negative indicator
  return fallback;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*             RISK SOURCE 6: RADON RISK BY COUNTY                       */
/* ═══════════════════════════════════════════════════════════════════════ */

// radonZones loaded at top of file


async function fetchCountyFIPS(
  lat: number,
  lon: number
): Promise<string | null> {
  try {
    const url =
      `https://geocoding.geo.census.gov/geocoder/geographies/coordinates` +
      `?x=${lon}&y=${lat}&benchmark=Public_AR_Current` +
      `&vintage=Current_Current&format=json`;
    const res = await fetchWithTimeout(url, {}, 10000);
    if (!res.ok) return null;

    const data = await res.json();
    const geos = data?.result?.geographies?.Counties;
    if (!geos || geos.length === 0) return null;

    const stateFips = geos[0].STATE;
    const countyFips = geos[0].COUNTY;
    if (!stateFips || !countyFips) return null;
    return `${stateFips}${countyFips}`;
  } catch {
    return null;
  }
}

async function fetchRiskRadon(
  lat: number,
  lon: number
): Promise<RiskRadonZone> {
  const fallback: RiskRadonZone = { zone: null, riskLabel: "Unknown" };
  try {
    const fips = await fetchCountyFIPS(lat, lon);
    if (!fips) return fallback;

    const zone = radonZones[fips] ?? null;
    if (zone === null) return fallback;

    const labels: Record<number, RiskRadonZone["riskLabel"]> = {
      1: "High",
      2: "Moderate",
      3: "Low",
    };
    return { zone, riskLabel: labels[zone] || "Unknown" };
  } catch {
    return fallback;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*          RISK SOURCE 7: LEAD PAINT & ASBESTOS (year_built)            */
/* ═══════════════════════════════════════════════════════════════════════ */

function assessLeadPaintRisk(yearBuilt: number | null): boolean {
  return yearBuilt !== null && yearBuilt < 1978;
}

function assessAsbestosRisk(yearBuilt: number | null): boolean {
  return yearBuilt !== null && yearBuilt < 1980;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                  FBI CRIME DATA (state-level proxy)                   */
/* ═══════════════════════════════════════════════════════════════════════ */

async function fetchCrimeData(state: string): Promise<{ violentCrimeRate: number | null; propertyCrimeRate: number | null; jurisdiction: string | null; year: number | null; comparedToNational: "below" | "at" | "above" | null } | null> {
  const apiKey = process.env.CRIME_DATA_API_KEY;
  if (!apiKey) return null;
  try {
    // Get state-level crime data as a reasonable proxy
    const stateAbbr = state?.length === 2 ? state.toUpperCase() : null;
    if (!stateAbbr) return null;
    // Fetch violent and property crime rates from CDE summarized endpoint (rates are per 100k/month)
    const [violentRes, propertyRes] = await Promise.all([
      fetchWithTimeout(`https://api.usa.gov/crime/fbi/cde/summarized/state/${stateAbbr}/violent-crime?from=01-2022&to=12-2022&API_KEY=${apiKey}`),
      fetchWithTimeout(`https://api.usa.gov/crime/fbi/cde/summarized/state/${stateAbbr}/property-crime?from=01-2022&to=12-2022&API_KEY=${apiKey}`),
    ]);
    if (!violentRes.ok && !propertyRes.ok) return null;

    const extractAnnualRate = (json: Record<string, unknown> | null): number | null => {
      if (!json) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ratesObj = (json as any)?.offenses?.rates;
      if (!ratesObj) return null;
      const firstKey = Object.keys(ratesObj)[0];
      if (!firstKey) return null;
      const monthlyRates = Object.values(ratesObj[firstKey]) as number[];
      if (monthlyRates.length === 0) return null;
      return Math.round(monthlyRates.reduce((s, v) => s + v, 0));
    };

    const violentJson = violentRes.ok ? await violentRes.json() : null;
    const propertyJson = propertyRes.ok ? await propertyRes.json() : null;
    const violent = extractAnnualRate(violentJson);
    const property = extractAnnualRate(propertyJson);
    let compared: "below" | "at" | "above" | null = null;
    if (violent !== null) {
      if (violent < 350) compared = "below";
      else if (violent <= 420) compared = "at";
      else compared = "above";
    }
    return { violentCrimeRate: violent, propertyCrimeRate: property, jurisdiction: stateAbbr, year: 2022, comparedToNational: compared };
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                  HUD LOCATION AFFORDABILITY INDEX                     */
/* ═══════════════════════════════════════════════════════════════════════ */

async function fetchLocationAffordability(lat: number, lon: number): Promise<{ housingTransportPct: number | null; isAffordable: boolean | null; source: string } | null> {
  try {
    const url = `https://htaindex.cnt.org/api/search?lat=${lat}&lng=${lon}&year=2019`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const data = await res.json();
    const pct = data?.h_t_ami != null ? Math.round(data.h_t_ami * 100) : null;
    return {
      housingTransportPct: pct,
      isAffordable: pct !== null ? pct < 45 : null,
      source: "US Department of Housing and Urban Development Location Affordability Index",
    };
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                  EPA TRI FACILITIES                                   */
/* ═══════════════════════════════════════════════════════════════════════ */

async function fetchTRIFacilities(lat: number, lon: number): Promise<{ countWithin2Miles: number; facilities: { name: string; type: string }[] } | null> {
  try {
    // Query EPA EnviroFacts TRI facility data within ~2 miles (0.03 degree approximation)
    const latMin = (lat - 0.03).toFixed(4);
    const latMax = (lat + 0.03).toFixed(4);
    const lonMin = (lon - 0.03).toFixed(4);
    const lonMax = (lon + 0.03).toFixed(4);
    const url = `https://data.epa.gov/efservice/TRI_FACILITY/PREF_LATITUDE/>${latMin}/<${latMax}/PREF_LONGITUDE/>${lonMin}/<${lonMax}/JSON/rows/0:20`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    const facilities = data.slice(0, 10).map((f: Record<string, unknown>) => ({
      name: String(f.FAC_NAME || f.FACILITY_NAME || "Unknown"),
      type: String(f.INDUSTRY_SECTOR || f.SIC_CODE || "Industrial"),
    }));
    return { countWithin2Miles: data.length, facilities };
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                  HOME RISK PROFILE ORCHESTRATOR                       */
/* ═══════════════════════════════════════════════════════════════════════ */

/**
 * Fetches all risk data sources in parallel using Promise.allSettled.
 * A failure in any one source never breaks the others.
 */
export async function fetchHomeRiskProfile(
  lat: number,
  lon: number,
  address: string,
  yearBuilt: number | null,
  state?: string | null
): Promise<HomeRiskProfile> {
  const defaultProfile: HomeRiskProfile = {
    floodZone: { code: "X", isSFHA: false, elevation: null, riskLevel: "Low" },
    superfundSites: { count1mile: 0, count3mile: 0, sites: [] },
    earthquakeRisk: { eventCount: 0, maxMagnitude: null, riskLevel: "Low" },
    wildfireRisk: { class: null, riskLevel: "Unknown" },
    airQuality: { score: null, description: null },
    radonZone: { zone: null, riskLabel: "Unknown" },
    leadPaintRisk: assessLeadPaintRisk(yearBuilt),
    asbestosRisk: assessAsbestosRisk(yearBuilt),
    crimeData: null,
    locationAffordability: null,
    triFacilities: null,
  };

  const [
    floodResult,
    superfundResult,
    earthquakeResult,
    wildfireResult,
    airQualityResult,
    radonResult,
    crimeResult,
    affordabilityResult,
    triResult,
  ] = await Promise.allSettled([
    fetchRiskFloodZone(lat, lon),
    fetchRiskSuperfund(lat, lon),
    fetchRiskEarthquake(lat, lon),
    fetchRiskWildfire(lat, lon),
    fetchRiskAirQuality(address, lat, lon),
    fetchRiskRadon(lat, lon),
    state ? fetchCrimeData(state) : Promise.resolve(null),
    fetchLocationAffordability(lat, lon),
    fetchTRIFacilities(lat, lon),
  ]);

  // FIX 7: For eastern US states, default Unknown wildfire to Very Low
  let wildfireRisk =
    wildfireResult.status === "fulfilled"
      ? wildfireResult.value
      : defaultProfile.wildfireRisk;

  const EASTERN_US_STATES = new Set([
    "VA", "MD", "DC", "NY", "NJ", "CT", "MA", "PA", "OH", "MI", "IL",
    "FL", "GA", "NC", "SC", "TN", "KY", "WV", "IN", "DE", "RI", "NH",
    "VT", "ME", "AL", "MS", "LA", "AR", "MO", "WI", "MN", "IA"
  ]);
  const stateCode = (state ?? "").toUpperCase().trim().slice(0, 2);
  if (wildfireRisk.riskLevel === "Unknown" && EASTERN_US_STATES.has(stateCode)) {
    wildfireRisk = {
      class: "Very Low",
      riskLevel: "Low",
    };
  }

  return {
    floodZone:
      floodResult.status === "fulfilled"
        ? floodResult.value
        : defaultProfile.floodZone,
    superfundSites:
      superfundResult.status === "fulfilled"
        ? superfundResult.value
        : defaultProfile.superfundSites,
    earthquakeRisk:
      earthquakeResult.status === "fulfilled"
        ? earthquakeResult.value
        : defaultProfile.earthquakeRisk,
    wildfireRisk,
    airQuality:
      airQualityResult.status === "fulfilled"
        ? airQualityResult.value
        : defaultProfile.airQuality,
    radonZone:
      radonResult.status === "fulfilled"
        ? radonResult.value
        : defaultProfile.radonZone,
    leadPaintRisk: defaultProfile.leadPaintRisk,
    asbestosRisk: defaultProfile.asbestosRisk,
    crimeData:
      crimeResult.status === "fulfilled"
        ? crimeResult.value
        : defaultProfile.crimeData,
    locationAffordability:
      affordabilityResult.status === "fulfilled"
        ? affordabilityResult.value
        : defaultProfile.locationAffordability,
    triFacilities:
      triResult.status === "fulfilled"
        ? triResult.value
        : defaultProfile.triFacilities,
  };
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                  UNIFIED DATA FETCHER                                 */
/* ═══════════════════════════════════════════════════════════════════════ */

/**
 * Fetches and merges data from all available property data sources.
 * Follows a waterfall pattern:
 * 1. Geocode the address to get coordinates
 * 2. Parallel calls to all enrichment APIs
 * 3. Returns unified result with source tracking
 */
export async function fetchUnifiedHomeData(
  identity: PropertyIdentity
): Promise<UnifiedHomeData> {
  const sources: string[] = [];

  // Phase 1: Geocode
  let geocoding: GeocodingResult | null = null;

  if (identity.lat && identity.lon) {
    geocoding = await reverseGeocode(identity.lat, identity.lon);
    if (geocoding) sources.push("nominatim-geocoding");
  } else if (identity.address) {
    const fullAddress = [
      identity.address,
      identity.city,
      identity.state,
      identity.zipCode,
    ]
      .filter(Boolean)
      .join(", ");

    geocoding = await geocodeAddress(fullAddress);
    if (geocoding) sources.push("nominatim-geocoding");
  }

  const lat = geocoding?.lat ?? identity.lat;
  const lon = geocoding?.lon ?? identity.lon;
  const zipCode =
    geocoding?.zipCode ?? identity.zipCode;

  // Phase 2: Parallel enrichment
  let census: CensusData | null = null;
  let hudRent: HUDFairMarketRent | null = null;
  let walkScore: WalkScoreResult | null = null;
  let floodZone: FloodZoneResult | null = null;
  let environmental: EnvironmentalData | null = null;
  let weather: WeatherData | null = null;
  let amenities: AmenityProximity | null = null;
  let rentcast: RentcastData | null = null;
  let estated: EstatedData | null = null;
  let riskProfile: HomeRiskProfile | null = null;

  const apiCalls: Promise<void>[] = [];

  // Census and HUD need zip code
  if (zipCode) {
    apiCalls.push(
      fetchCensusData(zipCode).then((data) => {
        if (data) {
          census = data;
          sources.push("census-acs");
        }
      })
    );
    apiCalls.push(
      fetchHUDFairMarketRent(zipCode).then((data) => {
        if (data) {
          hudRent = data;
          sources.push("hud-fmr");
        }
      })
    );
  }

  // Location-based APIs need coordinates
  if (lat && lon) {
    const address = geocoding?.displayName ?? identity.address;

    apiCalls.push(
      fetchWalkScore(address, lat, lon).then((data) => {
        if (data) {
          walkScore = data;
          sources.push("walkscore");
        }
      })
    );
    apiCalls.push(
      fetchFloodZone(lat, lon).then((data) => {
        if (data) {
          floodZone = data;
          sources.push("fema-flood");
        }
      })
    );
    apiCalls.push(
      fetchEnvironmentalData(lat, lon).then((data) => {
        if (data) {
          environmental = data;
          sources.push("epa-ejscreen");
        }
      })
    );
    apiCalls.push(
      fetchWeather(lat, lon).then((data) => {
        if (data) {
          weather = data;
          sources.push("openweathermap");
        }
      })
    );
    apiCalls.push(
      fetchNearbyAmenities(lat, lon).then((data) => {
        if (data) {
          amenities = data;
          sources.push("google-places");
        }
      })
    );

    // Risk profile — fans out to all 7 risk sources internally via Promise.allSettled
    apiCalls.push(
      fetchHomeRiskProfile(lat, lon, geocoding?.displayName ?? identity.address, null, geocoding?.state ?? identity.state).then(
        (data) => {
          riskProfile = data;
          sources.push("risk-profile");
        }
      )
    );
  }

  // Property-specific APIs need address + zip
  if (identity.address && zipCode) {
    apiCalls.push(
      fetchRentcastData(identity.address, zipCode).then((data) => {
        if (data) {
          rentcast = data;
          sources.push("rentcast");
        }
      })
    );
    apiCalls.push(
      fetchEstatedData(identity.address, zipCode).then((data) => {
        if (data) {
          estated = data;
          sources.push("estated");
        }
      })
    );
  }

  await Promise.allSettled(apiCalls);

  // Update lead/asbestos flags with yearBuilt from Estated if available
  const resolvedEstated = estated as EstatedData | null;
  const resolvedRisk = riskProfile as HomeRiskProfile | null;
  if (resolvedRisk && resolvedEstated?.yearBuilt != null) {
    const yb = resolvedEstated.yearBuilt;
    riskProfile = Object.assign({}, resolvedRisk, {
      leadPaintRisk: assessLeadPaintRisk(yb),
      asbestosRisk: assessAsbestosRisk(yb),
    });
  }

  return {
    identity: {
      address: identity.address,
      city: geocoding?.city ?? identity.city,
      state: geocoding?.state ?? identity.state,
      zipCode,
      lat,
      lon,
    },
    geocoding,
    census,
    hudRent,
    walkScore,
    floodZone,
    environmental,
    weather,
    amenities,
    rentcast,
    estated,
    riskProfile,
    sources,
  };
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                         HELPERS                                       */
/* ═══════════════════════════════════════════════════════════════════════ */

function clean(value: unknown): string | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed === "" || trimmed === "N/A") return null;
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

/** Haversine distance between two coordinates in meters */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                 NCES SCHOOL DATA (free, no key)                       */
/* ═══════════════════════════════════════════════════════════════════════ */

export interface NearbySchool {
  name: string;
  district: string;
  level: 'Elementary' | 'Middle' | 'High' | 'Middle/High' | 'K-12' | 'Other';
  enrollment: number | null;
  locale: string;
  distanceMiles: number;
  greatSchoolsSearchUrl: string;
}

export async function fetchNearbySchools(lat: number, lon: number, city?: string): Promise<NearbySchool[]> {
  console.log(`[schools] fetchNearbySchools called — lat: ${lat}, lon: ${lon}, city: ${city || '(none)'}`);
  try {
    const overpassQuery = `
      [out:json][timeout:8];
      (
        node["amenity"="school"](around:5000,${lat},${lon});
        way["amenity"="school"](around:5000,${lat},${lon});
      );
      out body;
    `;

    const OVERPASS_MIRRORS = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
      'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
    ];
    const RETRYABLE_STATUSES = [429, 502, 503, 504];

    let data: Record<string, unknown> | null = null;
    for (const mirror of OVERPASS_MIRRORS) {
      try {
        const res = await fetchWithTimeout(
          mirror,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(overpassQuery)}`,
          },
          12000
        );

        if (RETRYABLE_STATUSES.includes(res.status)) {
          console.warn(`[schools] Overpass mirror ${mirror} returned HTTP ${res.status} — trying next mirror`);
          continue;
        }

        if (!res.ok) {
          console.warn(`[schools] Overpass mirror ${mirror} HTTP ${res.status} for ${lat}, ${lon}`);
          return [];
        }

        data = await res.json();
        break;
      } catch (mirrorErr) {
        console.warn(`[schools] Overpass mirror ${mirror} failed:`, mirrorErr instanceof Error ? mirrorErr.message : String(mirrorErr));
        continue;
      }
    }

    if (!data) {
      console.warn(`[schools] All Overpass mirrors failed for ${lat}, ${lon} — returning empty`);
      return [];
    }
    const elements = Array.isArray(data?.elements) ? data.elements : [];

    if (elements.length === 0) {
      console.warn(`[schools] No schools found via Overpass for ${lat}, ${lon}`);
      return [];
    }

    console.log(`[schools] Overpass returned ${elements.length} schools near ${lat}, ${lon}`);

    const schools: NearbySchool[] = elements
      .filter((el: Record<string, unknown>) => {
        const tags = el.tags as Record<string, string> | undefined;
        return tags?.name; // skip unnamed entries
      })
      .map((el: Record<string, unknown>) => {
        const tags = el.tags as Record<string, string>;
        const name = tags.name || 'Unknown School';

        // Determine lat/lon: nodes have lat/lon directly, ways have center or we skip
        const elLat = typeof el.lat === 'number' ? el.lat
          : (el.center as Record<string, number> | undefined)?.lat ?? lat;
        const elLon = typeof el.lon === 'number' ? el.lon
          : (el.center as Record<string, number> | undefined)?.lon ?? lon;

        const dist = haversineDistanceMiles(lat, lon, elLat, elLon);

        // Derive level from name heuristics and OSM tags
        let level: NearbySchool['level'] = 'Other';
        const nameLower = name.toLowerCase();

        // Parse OSM grade range tags
        const gsloStr = tags['school:grade:low'] || tags['GSLO'] || '';
        const gshiStr = tags['school:grade:high'] || tags['GSHI'] || '';
        const gslo = gsloStr ? parseInt(gsloStr, 10) : NaN;
        const gshi = gshiStr ? parseInt(gshiStr, 10) : NaN;

        // Name-based heuristics (expanded)
        if (nameLower.includes('elementary') || nameLower.includes('primary')) {
          level = 'Elementary';
        } else if (
          nameLower.includes('middle') ||
          nameLower.includes('junior') ||
          nameLower.includes('jr high') ||
          nameLower.includes('jr. high') ||
          nameLower.includes('intermediate')
        ) {
          level = 'Middle';
        } else if (nameLower.includes('high school') || nameLower.includes('senior high')) {
          level = 'High';
        } else if (nameLower.includes('secondary')) {
          // "Secondary" with grade data: determine Middle, High, or Middle/High
          if (!isNaN(gshi) && gshi <= 8) {
            level = 'Middle';
          } else if (!isNaN(gslo) && gslo <= 6 && !isNaN(gshi) && gshi >= 9) {
            level = 'Middle/High';
          } else if (!isNaN(gslo) && gslo >= 9) {
            level = 'High';
          } else {
            // Default secondary without grade data → High
            level = 'High';
          }
        }

        // Grade range heuristics (if still Other)
        if (level === 'Other' && !isNaN(gshi) && !isNaN(gslo)) {
          if (gshi <= 5) level = 'Elementary';
          else if (gslo >= 9) level = 'High';
          else if (gslo >= 6 && gshi <= 8) level = 'Middle';
          else if (gslo <= 6 && gshi >= 9) level = 'Middle/High';
        }

        // Check OSM tags for grade/level hints
        if (level === 'Other') {
          const iscedLevel = tags['isced:level'] || '';
          const schoolType = tags['school:type'] || '';
          if (iscedLevel.includes('1') || schoolType.toLowerCase().includes('primary')) level = 'Elementary';
          else if (iscedLevel.includes('2') || schoolType.toLowerCase().includes('middle')) level = 'Middle';
          else if (iscedLevel.includes('3') || schoolType.toLowerCase().includes('secondary') || schoolType.toLowerCase().includes('high')) level = 'High';
        }

        const cityForUrl = city || '';

        return {
          name,
          district: tags['addr:city'] || '',
          level,
          enrollment: null,
          locale: '',
          distanceMiles: Math.round(dist * 100) / 100,
          greatSchoolsSearchUrl: `https://www.greatschools.org/search/search.page?q=${encodeURIComponent(name + ' ' + cityForUrl)}`,
        };
      });

    schools.sort((a: NearbySchool, b: NearbySchool) => a.distanceMiles - b.distanceMiles);
    return schools.slice(0, 6);
  } catch (err) {
    console.error('[PAID-FETCH] fetchNearbySchools FAILED:', err instanceof Error ? err.message : String(err));
    console.error('[homes-data] Overpass school fetch failed:', err);
    return [];
  }
}

function haversineDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                 FBI CRIME DATA (requires CRIME_DATA_API_KEY)          */
/* ═══════════════════════════════════════════════════════════════════════ */

export interface CrimeData {
  jurisdiction: string;
  year: number;
  violentCrimeRate: number;
  propertyCrimeRate: number;
  vsNationalViolent: 'below' | 'average' | 'above';
  vsNationalProperty: 'below' | 'average' | 'above';
  dataNote: string;
}

// Map full state names to abbreviations for crime data lookup
const STATE_ABBR_MAP: Record<string, string> = {
  ALABAMA: "AL", ALASKA: "AK", ARIZONA: "AZ", ARKANSAS: "AR", CALIFORNIA: "CA",
  COLORADO: "CO", CONNECTICUT: "CT", DELAWARE: "DE", FLORIDA: "FL", GEORGIA: "GA",
  HAWAII: "HI", IDAHO: "ID", ILLINOIS: "IL", INDIANA: "IN", IOWA: "IA",
  KANSAS: "KS", KENTUCKY: "KY", LOUISIANA: "LA", MAINE: "ME", MARYLAND: "MD",
  MASSACHUSETTS: "MA", MICHIGAN: "MI", MINNESOTA: "MN", MISSISSIPPI: "MS",
  MISSOURI: "MO", MONTANA: "MT", NEBRASKA: "NE", NEVADA: "NV",
  "NEW HAMPSHIRE": "NH", "NEW JERSEY": "NJ", "NEW MEXICO": "NM", "NEW YORK": "NY",
  "NORTH CAROLINA": "NC", "NORTH DAKOTA": "ND", OHIO: "OH", OKLAHOMA: "OK",
  OREGON: "OR", PENNSYLVANIA: "PA", "RHODE ISLAND": "RI", "SOUTH CAROLINA": "SC",
  "SOUTH DAKOTA": "SD", TENNESSEE: "TN", TEXAS: "TX", UTAH: "UT", VERMONT: "VT",
  VIRGINIA: "VA", WASHINGTON: "WA", "WEST VIRGINIA": "WV", WISCONSIN: "WI",
  WYOMING: "WY", "DISTRICT OF COLUMBIA": "DC",
};

function resolveStateAbbr(state: string): string | null {
  if (!state) return null;
  const trimmed = state.trim().toUpperCase();
  if (trimmed.length === 2) return trimmed;
  return STATE_ABBR_MAP[trimmed] ?? null;
}

export async function fetchCityCrimeData(state: string, city: string, county?: string | null): Promise<CrimeData | null> {
  console.log('[PAID-FETCH] fetchCityCrimeData called with:', state, city, 'county:', county);
  const apiKey = process.env.CRIME_DATA_API_KEY;
  if (!apiKey) {
    console.log('[homes-data] CRIME_DATA_API_KEY not configured');
    return null;
  }

  const extractAnnualRate = (json: Record<string, unknown> | null): number => {
    if (!json) return 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ratesObj = (json as any)?.offenses?.rates;
    if (!ratesObj) return 0;
    const firstKey = Object.keys(ratesObj)[0];
    if (!firstKey) return 0;
    const monthlyRates = Object.values(ratesObj[firstKey]) as number[];
    if (monthlyRates.length === 0) return 0;
    return Math.round(monthlyRates.reduce((s, v) => s + v, 0));
  };

  try {
    const stateAbbr = resolveStateAbbr(state);
    if (!stateAbbr) {
      console.warn(`[homes-data] Could not resolve state abbreviation for: ${state}`);
      return null;
    }

    // Strategy 1: Try county-level via FBI agency ORI lookup
    // Many cities (e.g. Fairfax, Vienna in VA) report at the county level
    const countyName = county?.replace(/ County$/i, '').trim();
    if (countyName) {
      try {
        console.log(`[crime-data] Attempting county-level lookup for ${countyName} County, ${stateAbbr}`);
        const agencyRes = await fetchWithTimeout(
          `https://api.usa.gov/crime/fbi/cde/agency/byStateAbbr/${stateAbbr}?API_KEY=${apiKey}`,
          {},
          15000
        );
        if (agencyRes.ok) {
          const agencies = await agencyRes.json();
          if (Array.isArray(agencies)) {
            // Find the county-level agency (sheriff or county police)
            const countyLower = countyName.toLowerCase();
            const countyAgency = agencies.find((a: Record<string, unknown>) => {
              const name = String(a.agency_name || '').toLowerCase();
              const type = String(a.agency_type_name || '').toLowerCase();
              return (
                name.includes(countyLower) &&
                (type.includes('county') || type.includes('sheriff') || name.includes('county'))
              );
            });

            if (countyAgency) {
              const ori = String(countyAgency.ori || '');
              console.log(`[crime-data] Found county ORI: ${ori} for ${countyName} County`);

              if (ori) {
                const [violentRes, propertyRes] = await Promise.all([
                  fetchWithTimeout(`https://api.usa.gov/crime/fbi/cde/summarized/agency/${ori}/violent-crime?from=01-2022&to=12-2022&API_KEY=${apiKey}`, {}, 15000),
                  fetchWithTimeout(`https://api.usa.gov/crime/fbi/cde/summarized/agency/${ori}/property-crime?from=01-2022&to=12-2022&API_KEY=${apiKey}`, {}, 15000),
                ]);

                if (violentRes.ok || propertyRes.ok) {
                  const violentJson = violentRes.ok ? await violentRes.json() : null;
                  const propertyJson = propertyRes.ok ? await propertyRes.json() : null;
                  const violentCrimeRate = extractAnnualRate(violentJson);
                  const propertyCrimeRate = extractAnnualRate(propertyJson);

                  if (violentCrimeRate > 0 || propertyCrimeRate > 0) {
                    const vsNationalViolent: CrimeData['vsNationalViolent'] = violentCrimeRate < 280 ? 'below' : violentCrimeRate > 480 ? 'above' : 'average';
                    const vsNationalProperty: CrimeData['vsNationalProperty'] = propertyCrimeRate < 1600 ? 'below' : propertyCrimeRate > 2600 ? 'above' : 'average';

                    console.log(`[crime-data] County-level data found for ${countyName} County: violent=${violentCrimeRate}, property=${propertyCrimeRate}`);
                    return {
                      jurisdiction: `${countyName} County, ${stateAbbr}`,
                      year: 2022,
                      violentCrimeRate,
                      propertyCrimeRate,
                      vsNationalViolent,
                      vsNationalProperty,
                      dataNote: `County-level data for ${countyName} County, ${stateAbbr} from FBI Crime Data Explorer, 2022. Neighborhood-level crime data is not available for this area from federal databases. Search "${city} crime statistics" or contact the local police department's public records office for current data.`,
                    };
                  }
                }
              }
            } else {
              console.log(`[crime-data] No county agency found for ${countyName} in ${stateAbbr}`);
            }
          }
        }
      } catch (err) {
        console.warn(`[crime-data] County-level lookup failed for ${countyName}:`, err instanceof Error ? err.message : String(err));
      }
    }

    // Strategy 2: Fall back to state-level summarized crime rates from CDE API
    console.log(`[crime-data] Falling back to state-level data for ${stateAbbr}`);
    const [violentRes, propertyRes] = await Promise.all([
      fetchWithTimeout(`https://api.usa.gov/crime/fbi/cde/summarized/state/${stateAbbr}/violent-crime?from=01-2022&to=12-2022&API_KEY=${apiKey}`, {}, 15000),
      fetchWithTimeout(`https://api.usa.gov/crime/fbi/cde/summarized/state/${stateAbbr}/property-crime?from=01-2022&to=12-2022&API_KEY=${apiKey}`, {}, 15000),
    ]);
    if (!violentRes.ok && !propertyRes.ok) return null;

    const violentJson = violentRes.ok ? await violentRes.json() : null;
    const propertyJson = propertyRes.ok ? await propertyRes.json() : null;
    console.log(`[crime-data] State-level response keys: violent=${violentJson ? Object.keys(violentJson).join(',') : 'null'}, property=${propertyJson ? Object.keys(propertyJson).join(',') : 'null'}`);
    const violentCrimeRate = extractAnnualRate(violentJson);
    const propertyCrimeRate = extractAnnualRate(propertyJson);
    console.log(`[crime-data] State-level extracted rates: violent=${violentCrimeRate}, property=${propertyCrimeRate}`);

    if (violentCrimeRate === 0 && propertyCrimeRate === 0) {
      console.warn(`[crime-data] State-level data returned 0 rates for ${stateAbbr} — possible response format mismatch`);
      return null;
    }

    const vsNationalViolent: CrimeData['vsNationalViolent'] = violentCrimeRate < 280 ? 'below' : violentCrimeRate > 480 ? 'above' : 'average';
    const vsNationalProperty: CrimeData['vsNationalProperty'] = propertyCrimeRate < 1600 ? 'below' : propertyCrimeRate > 2600 ? 'above' : 'average';

    return {
      jurisdiction: `${stateAbbr} (statewide)`,
      year: 2022,
      violentCrimeRate,
      propertyCrimeRate,
      vsNationalViolent,
      vsNationalProperty,
      dataNote: `State-level data for ${stateAbbr} from FBI Crime Data Explorer, 2022. Neighborhood-level crime data is not available for this area from federal databases. Search "${city} crime statistics" or contact the local police department's public records office for current data.`,
    };
  } catch (err) {
    console.error('[PAID-FETCH] fetchCityCrimeData FAILED:', err instanceof Error ? err.message : String(err));
    console.error('[homes-data] FBI crime data fetch failed:', err);
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                 RENTCAST PRICE HISTORY                                */
/* ═══════════════════════════════════════════════════════════════════════ */

export interface PriceHistory {
  lastSalePrice: number | null;
  lastSaleDate: string | null;
  assessedValue: number | null;
  appreciationAmount: number | null;
  appreciationPercent: number | null;
  annualAppreciationRate: number | null;
}

export async function fetchPriceHistory(address: string, currentPrice: number | null): Promise<PriceHistory | null> {
  console.log('[PAID-FETCH] fetchPriceHistory called with:', address);
  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://api.rentcast.io/v1/properties?address=${encodeURIComponent(address)}&limit=1`;
    const res = await fetchWithTimeout(url, {
      headers: { 'X-Api-Key': apiKey },
    }, 15000);

    if (!res.ok) {
      logAPIFail("homes-data/price-history", res.status, `Rentcast price history returned ${res.status}`, { address });
      return null;
    }

    const data = await res.json();
    const items = Array.isArray(data) ? data : [];
    if (items.length === 0) return null;

    const prop = items[0];
    const lastSalePrice = prop.lastSalePrice ? Number(prop.lastSalePrice) : null;
    const lastSaleDate = prop.lastSaleDate || null;
    const assessedValue = prop.assessedValue ? Number(prop.assessedValue) : null;

    let appreciationAmount: number | null = null;
    let appreciationPercent: number | null = null;
    let annualAppreciationRate: number | null = null;

    if (lastSalePrice && currentPrice && lastSalePrice > 0) {
      appreciationAmount = currentPrice - lastSalePrice;
      appreciationPercent = Math.round(((currentPrice - lastSalePrice) / lastSalePrice) * 10000) / 100;

      if (lastSaleDate) {
        const saleYear = new Date(lastSaleDate).getFullYear();
        const currentYear = new Date().getFullYear();
        const yearsOwned = currentYear - saleYear;
        if (yearsOwned > 0) {
          annualAppreciationRate = Math.round((appreciationPercent / yearsOwned) * 100) / 100;
        }
      }
    }

    return {
      lastSalePrice,
      lastSaleDate,
      assessedValue,
      appreciationAmount,
      appreciationPercent,
      annualAppreciationRate,
    };
  } catch (err) {
    console.error('[PAID-FETCH] fetchPriceHistory FAILED:', err instanceof Error ? err.message : String(err));
    console.error('[homes-data] Rentcast price history fetch failed:', err);
    logAPIFail("homes-data/price-history", 0, `Rentcast price history exception: ${err instanceof Error ? err.message : String(err)}`, { address });
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                 GOOGLE PLACES BROKERAGE LOOKUP                        */
/* ═══════════════════════════════════════════════════════════════════════ */

export interface BrokerageInfo {
  agentName: string | null;
  brokerageName: string | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  googleSearchUrl: string | null;
}

export async function fetchBrokerageRating(brokerageName: string): Promise<{ rating: number | null; reviewCount: number | null; searchUrl: string }> {
  console.log('[PAID-FETCH] fetchBrokerageRating called with:', brokerageName);
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey || !brokerageName) {
    return { rating: null, reviewCount: null, searchUrl: `https://www.google.com/search?q=${encodeURIComponent(brokerageName)}` };
  }

  try {
    const res = await fetchWithTimeout(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.displayName,places.rating,places.userRatingCount,places.formattedAddress',
        },
        body: JSON.stringify({ textQuery: brokerageName }),
      },
      10000
    );
    if (!res.ok) {
      return { rating: null, reviewCount: null, searchUrl: `https://www.google.com/search?q=${encodeURIComponent(brokerageName)}` };
    }

    const data = await res.json();
    const candidate = data?.places?.[0];
    if (!candidate) {
      return { rating: null, reviewCount: null, searchUrl: `https://www.google.com/search?q=${encodeURIComponent(brokerageName)}` };
    }

    return {
      rating: candidate.rating ?? null,
      reviewCount: candidate.userRatingCount ?? null,
      searchUrl: `https://www.google.com/search?q=${encodeURIComponent(brokerageName)}`,
    };
  } catch (err) {
    console.error('[PAID-FETCH] fetchBrokerageRating FAILED:', err instanceof Error ? err.message : String(err));
    console.error('[homes-data] Google Places brokerage lookup failed:', err);
    return { rating: null, reviewCount: null, searchUrl: `https://www.google.com/search?q=${encodeURIComponent(brokerageName)}` };
  }
}
