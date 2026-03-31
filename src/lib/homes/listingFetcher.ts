import Firecrawl from "@mendable/firecrawl-js";
import Anthropic from "@anthropic-ai/sdk";
import { logError } from "@/lib/logger";

/* ═══════════════════════════════════════════════════════════════════════ */
/*                            TYPES                                      */
/* ═══════════════════════════════════════════════════════════════════════ */

export interface RawHomeListing {
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  fullAddress: string | null;
  price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  lotSize: string | null;
  yearBuilt: number | null;
  propertyType: string | null;
  description: string | null;
  listingAgent: string | null;
  brokerage: string | null;
  hoaFee: number | null;
  hoaStatus: 'confirmed' | 'confirmed_none' | 'not_listed';
  parkingSpaces: number | null;
  hasGarage: boolean | null;
  hasPool: boolean | null;
  hasBasement: boolean | null;
  daysOnMarket: number | null;
  pricePerSqft: number | null;
  priceHistory: {
    date: string;
    event: string;
    price: number | null;
    priceChange: number | null;
    source: string;
  }[];
  listingPriceChanges: {
    date: string;
    oldPrice: number;
    newPrice: number;
    changePercent: number;
  }[];
  lastSalePrice: number | null;
  lastSaleDate: string | null;
  rawUrl: string;
  dataSource: "zillow" | "redfin" | "realtor" | "rentcast_fallback" | "unknown";
  dataQuality: "complete" | "partial" | "insufficient";
  fetchError?: boolean;
  fetchErrorMessage?: string;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                        SOURCE DETECTION                               */
/* ═══════════════════════════════════════════════════════════════════════ */

function detectSource(url: string): RawHomeListing["dataSource"] {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes("zillow.com")) return "zillow";
    if (hostname.includes("redfin.com")) return "redfin";
    if (hostname.includes("realtor.com")) return "realtor";
  } catch {
    // invalid URL
  }
  return "unknown";
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                    FIRECRAWL EXTRACTION SCHEMA                        */
/* ═══════════════════════════════════════════════════════════════════════ */

const EXTRACTION_PROMPT = `You are a data extraction expert. Extract real estate property listing information from the following scraped webpage content.

Return ONLY a valid JSON object (no markdown, no backticks, no explanation) with these exact fields:

{"address":null,"city":null,"state":null,"zip":null,"price":null,"beds":null,"baths":null,"sqft":null,"lotSize":null,"yearBuilt":null,"propertyType":null,"description":null,"listingAgent":null,"brokerage":null,"hoaFee":null,"parkingSpaces":null,"hasGarage":null,"hasPool":null,"hasBasement":null,"daysOnMarket":null,"priceHistory":[{"date":"","event":"","price":null,"priceChange":null,"source":""}],"listingPriceChanges":[{"date":"","oldPrice":0,"newPrice":0,"changePercent":0}],"lastSalePrice":null,"lastSaleDate":null}

Rules:
- Use null for any field you cannot find.
- Price should be a number (no dollar signs, no commas).
- Beds, baths, sqft, yearBuilt, hoaFee, parkingSpaces, daysOnMarket should be numbers.
- hasGarage, hasPool, hasBasement should be booleans.
- lotSize is a string (e.g. "0.25 acres").
- propertyType should be: "single family", "condo", "townhouse", "multi-family", "land", or other.
- description is the full listing description text.
- brokerage is the listing brokerage/office name (e.g. "Keller Williams", "RE/MAX").
- Search the ENTIRE page from top to bottom. Data may appear anywhere.
- priceHistory should capture the COMPLETE "Price History", "Sales History", or "Property History" table/section. Extract ALL rows with date, event type, and price. Events include: "Sold", "Listed", "Price Reduced", "Price Increased", "Relisted", "Pending", "Contingent", "Withdrawn". Look for this data in tables, timeline sections, or history dropdowns. This is critical data.
- listingPriceChanges tracks only price change events with old and new values.
- lastSalePrice and lastSaleDate are the most recent sale (not listing).`;

/* ═══════════════════════════════════════════════════════════════════════ */
/*                        FIRECRAWL OPTIONS                              */
/* ═══════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════ */
/*                     RENTCAST MLS FALLBACK                             */
/* ═══════════════════════════════════════════════════════════════════════ */

interface RentcastProperty {
  addressLine1?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  lotSize?: number;
  yearBuilt?: number;
  propertyType?: string;
  lastSalePrice?: number;
  lastSaleDate?: string;
  features?: {
    garage?: boolean;
    pool?: boolean;
    basement?: boolean;
    parkingSpaces?: number;
  };
}

function extractAddressFromUrl(url: string): string | null {
  try {
    const path = new URL(url).pathname;
    // Zillow: /homedetails/123-Main-St-City-ST-12345/12345_zpid/
    const zillowMatch = path.match(/\/homedetails\/([^/]+)\//);
    if (zillowMatch) {
      return zillowMatch[1]
        .replace(/-/g, " ")
        .replace(/\d{5,}_zpid/i, "")
        .trim();
    }
    // Redfin: /CA/City/123-Main-St-12345/home/12345
    const redfinMatch = path.match(
      /\/([A-Z]{2})\/([^/]+)\/([^/]+)\/home/i
    );
    if (redfinMatch) {
      return `${redfinMatch[3].replace(/-/g, " ")} ${redfinMatch[2].replace(
        /-/g,
        " "
      )} ${redfinMatch[1]}`;
    }
    // Realtor: /realestateandhomes-detail/123-Main-St_City_ST_12345
    const realtorMatch = path.match(
      /\/realestateandhomes-detail\/([^/]+)/
    );
    if (realtorMatch) {
      return realtorMatch[1].replace(/_/g, " ").replace(/-/g, " ").trim();
    }
  } catch {
    // invalid URL
  }
  return null;
}

async function fetchRentcastFallback(
  partialData: Partial<RawHomeListing>
): Promise<Partial<RawHomeListing>> {
  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey) {
    console.log("[homes-listing] RENTCAST_API_KEY not configured");
    return {};
  }

  // Build address query from partial data or URL
  let addressQuery = "";
  if (partialData.fullAddress) {
    addressQuery = partialData.fullAddress;
  } else if (partialData.address) {
    const parts = [
      partialData.address,
      partialData.city,
      partialData.state,
      partialData.zip,
    ].filter(Boolean);
    addressQuery = parts.join(", ");
  } else if (partialData.rawUrl) {
    addressQuery = extractAddressFromUrl(partialData.rawUrl) || "";
  }

  if (!addressQuery) return {};

  try {
    const url = `https://api.rentcast.io/v1/properties?address=${encodeURIComponent(
      addressQuery
    )}&limit=1`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      headers: { "X-Api-Key": apiKey },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return {};

    const data = (await res.json()) as RentcastProperty[];
    if (!data || data.length === 0) return {};

    const prop = data[0];
    return {
      address: prop.addressLine1 || null,
      city: prop.city || null,
      state: prop.state || null,
      zip: prop.zipCode || null,
      beds: prop.bedrooms ?? null,
      baths: prop.bathrooms ?? null,
      sqft: prop.squareFootage ?? null,
      lotSize: prop.lotSize ? `${prop.lotSize} sqft` : null,
      yearBuilt: prop.yearBuilt ?? null,
      propertyType: prop.propertyType || null,
      hasGarage: prop.features?.garage ?? null,
      hasPool: prop.features?.pool ?? null,
      hasBasement: prop.features?.basement ?? null,
      parkingSpaces: prop.features?.parkingSpaces ?? null,
      lastSalePrice: prop.lastSalePrice ?? null,
      lastSaleDate: prop.lastSaleDate ?? null,
    };
  } catch (err) {
    console.error("[homes-listing] Rentcast fallback failed:", err);
    logError("listingFetcher/rentcast-fallback", err, { vertical: "homes" });
    return {};
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                     QUALITY ASSESSMENT                                */
/* ═══════════════════════════════════════════════════════════════════════ */

const KEY_FIELDS: (keyof RawHomeListing)[] = [
  "address",
  "price",
  "beds",
  "baths",
  "sqft",
  "yearBuilt",
  "propertyType",
  "city",
  "state",
  "zip",
];

function assessQuality(
  listing: Partial<RawHomeListing>
): RawHomeListing["dataQuality"] {
  const missing = KEY_FIELDS.filter((k) => {
    const v = listing[k];
    return v === null || v === undefined;
  });
  if (missing.length === 0) return "complete";
  if (missing.length <= 2) return "partial";
  return "insufficient";
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                   CLAUDE AI EXTRACTION HELPER                         */
/* ═══════════════════════════════════════════════════════════════════════ */

async function extractWithClaude(
  pageContent: string,
  sourceUrl: string
): Promise<Record<string, unknown>> {
  const aiKey = process.env.ANTHROPIC_API_KEY ?? "";
  if (!aiKey) return {};

  const client = new Anthropic({ apiKey: aiKey });
  const truncated = pageContent.slice(0, 30000);
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `${EXTRACTION_PROMPT}\n\nSOURCE URL: ${sourceUrl}\n\nSCRAPED PAGE CONTENT:\n${truncated}`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (textBlock && textBlock.type === "text") {
    try {
      let jsonStr = textBlock.text.trim();
      // Strip markdown fences
      jsonStr = jsonStr
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "");
      const match = jsonStr.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]) as Record<string, unknown>;
      }
    } catch (parseErr) {
      console.error("[homes-listing] AI JSON parse failed:", parseErr);
      logError("listingFetcher/ai-parse", parseErr, { vertical: "homes" });
    }
  }
  return {};
}

function mapExtractedToListing(
  baseListing: Partial<RawHomeListing>,
  extracted: Record<string, unknown>
): Partial<RawHomeListing> {
  return {
    ...baseListing,
    address: strOrNull(extracted.address),
    city: strOrNull(extracted.city),
    state: strOrNull(extracted.state),
    zip: strOrNull(extracted.zip),
    price: numOrNull(extracted.price),
    beds: numOrNull(extracted.beds),
    baths: numOrNull(extracted.baths),
    sqft: numOrNull(extracted.sqft),
    lotSize: strOrNull(extracted.lotSize),
    yearBuilt: numOrNull(extracted.yearBuilt),
    propertyType: strOrNull(extracted.propertyType),
    description: strOrNull(extracted.description),
    listingAgent: strOrNull(extracted.listingAgent),
    brokerage: strOrNull(extracted.brokerage),
    hoaFee: numOrNull(extracted.hoaFee),
    hoaStatus: deriveHoaStatus(extracted),
    parkingSpaces: numOrNull(extracted.parkingSpaces),
    hasGarage: boolOrNull(extracted.hasGarage),
    hasPool: boolOrNull(extracted.hasPool),
    hasBasement: boolOrNull(extracted.hasBasement),
    daysOnMarket: numOrNull(extracted.daysOnMarket),
    priceHistory: Array.isArray(extracted.priceHistory) ? (extracted.priceHistory as { date: string; event: string; price: number | null; priceChange: number | null; source: string }[]) : [],
    listingPriceChanges: Array.isArray(extracted.listingPriceChanges) ? (extracted.listingPriceChanges as { date: string; oldPrice: number; newPrice: number; changePercent: number }[]) : [],
    lastSalePrice: numOrNull(extracted.lastSalePrice),
    lastSaleDate: strOrNull(extracted.lastSaleDate),
  };
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                     MAIN FETCH FUNCTION                               */
/* ═══════════════════════════════════════════════════════════════════════ */

export async function fetchHomeListing(
  url: string
): Promise<RawHomeListing> {
  const dataSource = detectSource(url);
  const isRedfin = url.toLowerCase().includes("redfin.com");
  const isRealtor = url.toLowerCase().includes("realtor.com");

  const baseListing: Partial<RawHomeListing> = {
    rawUrl: url,
    dataSource,
    dataQuality: "insufficient",
  };

  let listing: Partial<RawHomeListing> = { ...baseListing };
  let quality: RawHomeListing["dataQuality"] = "insufficient";

  // ═══ LAYER 1: Firecrawl full render (all URLs) ═══
  let firecrawl: Firecrawl | null = null;
  try {
    const fcKey = process.env.FIRECRAWL_API_KEY ?? "";
    if (fcKey) {
      firecrawl = new Firecrawl({ apiKey: fcKey });

      const result = await firecrawl.scrape(url, {
        formats: ["html" as const, "markdown" as const],
        waitFor: 5000,
        timeout: 30000,
      });

      const markdownContent = result.markdown || "";
      const htmlContent = (result as Record<string, unknown>).html as string || "";
      const pageContent = htmlContent.length > markdownContent.length ? htmlContent : markdownContent;

      if (pageContent.length > 50) {
        const extracted = await extractWithClaude(pageContent, url);
        listing = mapExtractedToListing(baseListing, extracted);
        listing.fullAddress = buildFullAddress(listing);
        quality = assessQuality(listing);

        // Check if we got the essentials (price + address + beds)
        if (listing.price && listing.address && listing.beds) {
          console.log("[homes-listing] Layer 1 succeeded with quality:", quality);
        } else {
          quality = "insufficient"; // Force next layer
        }
      }
    } else {
      console.warn("[homes-listing] FIRECRAWL_API_KEY is not set");
    }
  } catch (err) {
    console.error("[homes-listing] Layer 1 (Firecrawl full render) failed:", err);
    logError("listingFetcher/layer1", err, { vertical: "homes" });
  }

  // ═══ LAYER 2: Firecrawl with actions (Redfin/Realtor specifically) ═══
  if (quality === "insufficient" && (isRedfin || isRealtor) && firecrawl) {
    try {
      console.log("[homes-listing] Layer 2: Retrying with actions for", isRedfin ? "Redfin" : "Realtor");
      const result = await firecrawl.scrape(url, {
        formats: ["html" as const, "markdown" as const],
        waitFor: 5000,
        actions: [{ type: "wait" as const, milliseconds: 5000 }],
        onlyMainContent: false,
        timeout: 30000,
      });

      const markdownContent = result.markdown || "";
      const htmlContent = (result as Record<string, unknown>).html as string || "";
      const pageContent = htmlContent.length > markdownContent.length ? htmlContent : markdownContent;

      if (pageContent.length > 200) {
        const extracted = await extractWithClaude(pageContent, url);
        const layer2Listing = mapExtractedToListing(baseListing, extracted);
        listing = mergeListing(listing, layer2Listing);
        listing.fullAddress = buildFullAddress(listing);
        quality = assessQuality(listing);
      }
    } catch (err) {
      console.error("[homes-listing] Layer 2 (Firecrawl with actions) failed:", err);
      logError("listingFetcher/layer2", err, { vertical: "homes" });
    }
  }

  // ═══ LAYER 2.5: Targeted re-scrape for missing critical fields ═══
  const criticalMissing = !listing.yearBuilt || !listing.beds || !listing.baths || !listing.sqft || !listing.price;
  if (criticalMissing && firecrawl && quality !== "insufficient") {
    try {
      console.log("[homes-listing] Layer 2.5: Targeted re-scrape for missing critical fields");
      const result = await firecrawl.scrape(url, {
        formats: ["markdown" as const],
        waitFor: 3000,
        timeout: 20000,
      });
      const content = result.markdown || "";
      if (content.length > 50) {
        const anthropic = new Anthropic();
        const targetPrompt = `Extract ONLY the following fields from this real estate listing page. Return a JSON object with these fields only. Use null if not found.

{"yearBuilt":null,"beds":null,"baths":null,"sqft":null,"price":null,"hoaFee":null}

Look carefully in the property details, facts, features sections, and any tables or data grids. The year built may appear as "Built in XXXX", "Year Built: XXXX", or similar.

Page content:
${content.slice(0, 8000)}`;
        const resp = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 200,
          messages: [{ role: "user", content: targetPrompt }],
        });
        const text = resp.content[0]?.type === "text" ? resp.content[0].text : "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (!listing.yearBuilt && parsed.yearBuilt) listing.yearBuilt = parsed.yearBuilt;
          if (!listing.beds && parsed.beds) listing.beds = parsed.beds;
          if (!listing.baths && parsed.baths) listing.baths = parsed.baths;
          if (!listing.sqft && parsed.sqft) listing.sqft = parsed.sqft;
          if (!listing.price && parsed.price) listing.price = parsed.price;
          if (!listing.hoaFee && parsed.hoaFee) { listing.hoaFee = parsed.hoaFee; listing.hoaStatus = 'confirmed'; }
          quality = assessQuality(listing);
        }
      }
    } catch (err) {
      console.error("[homes-listing] Layer 2.5 (targeted re-scrape) failed:", err);
      logError("listingFetcher/layer2.5", err, { vertical: "homes" });
    }
  }

  // ═══ LAYER 3: Address from URL slug + Rentcast property lookup ═══
  if (quality === "insufficient") {
    console.log("[homes-listing] Layer 3: Trying Rentcast property lookup from URL slug");
    const addressFromUrl = extractAddressFromUrl(url);
    const addressQuery = listing.fullAddress || addressFromUrl || "";

    if (addressQuery) {
      const rentcastData = await fetchRentcastFallback({ ...listing, rawUrl: url, fullAddress: addressQuery || listing.fullAddress || null });
      if (Object.keys(rentcastData).length > 0) {
        listing = mergeListing(listing, rentcastData);
        listing.fullAddress = buildFullAddress(listing);
        listing.dataSource = listing.dataSource || dataSource;
        quality = assessQuality(listing);
      }
    }
  }

  // ═══ LAYER 4: Rentcast listing search (active sale listings) ═══
  if (quality === "insufficient" || quality === "partial") {
    const addressQuery = listing.fullAddress || extractAddressFromUrl(url) || "";
    if (addressQuery) {
      const apiKey = process.env.RENTCAST_API_KEY;
      if (apiKey) {
        try {
          console.log("[homes-listing] Layer 4: Trying Rentcast active listing search");
          const searchUrl = `https://api.rentcast.io/v1/listings/sale?address=${encodeURIComponent(addressQuery)}&limit=1`;
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 10000);
          const res = await fetch(searchUrl, {
            headers: { "X-Api-Key": apiKey },
            signal: controller.signal,
          });
          clearTimeout(timer);

          if (res.ok) {
            const data = await res.json();
            const items = Array.isArray(data) ? data : [];
            if (items.length > 0) {
              const prop = items[0];
              const layer4Data: Partial<RawHomeListing> = {
                price: prop.price || prop.listPrice || null,
                daysOnMarket: prop.daysOnMarket ?? null,
                description: prop.description || null,
                listingAgent: prop.listingAgent || null,
              };
              listing = mergeListing(listing, layer4Data);
              listing.fullAddress = buildFullAddress(listing);
              quality = assessQuality(listing);
            }
          }
        } catch (err) {
          console.error("[homes-listing] Layer 4 (Rentcast sale listing) failed:", err);
          logError("listingFetcher/layer4", err, { vertical: "homes" });
        }
      }
    }
  }

  // ═══ LAYER 4.5: Rentcast property record for yearBuilt if still missing ═══
  if (!listing.yearBuilt) {
    const addressQuery = listing.fullAddress || extractAddressFromUrl(url) || "";
    const apiKey = process.env.RENTCAST_API_KEY;
    if (addressQuery && apiKey) {
      try {
        console.log("[homes-listing] Layer 4.5: Rentcast property lookup for yearBuilt");
        const propUrl = `https://api.rentcast.io/v1/properties?address=${encodeURIComponent(addressQuery)}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(propUrl, {
          headers: { "X-Api-Key": apiKey },
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : [];
          if (items.length > 0) {
            const prop = items[0];
            const yb = prop.yearBuilt ?? prop.year_built ?? null;
            if (yb && typeof yb === "number") {
              listing.yearBuilt = yb;
              console.log("[homes-listing] Layer 4.5: Found yearBuilt from Rentcast:", yb);
            }
          }
        }
      } catch (err) {
        console.error("[homes-listing] Layer 4.5 (Rentcast yearBuilt) failed:", err);
        logError("listingFetcher/layer4.5", err, { vertical: "homes" });
      }
    }
  }

  // ═══ LAYER 5: Graceful partial result ═══
  if (quality === "insufficient") {
    listing.fetchError = true;
    listing.fetchErrorMessage =
      "Could not retrieve full listing data from this URL. Partial information may be shown.";
  }

  // Calculate pricePerSqft
  const price = listing.price;
  const sqft = listing.sqft;
  listing.pricePerSqft = price && sqft && sqft > 0 ? Math.round(price / sqft) : null;

  // Set final quality
  listing.dataQuality = quality;

  // Ensure new fields have safe defaults
  if (!listing.priceHistory) listing.priceHistory = [];
  if (!listing.listingPriceChanges) listing.listingPriceChanges = [];
  if (listing.lastSalePrice === undefined) listing.lastSalePrice = null;
  if (listing.lastSaleDate === undefined) listing.lastSaleDate = null;

  console.log(`[homes-listing] Final quality for ${url}: ${quality}`);
  return listing as RawHomeListing;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                     MLS NUMBER LOOKUP                                 */
/* ═══════════════════════════════════════════════════════════════════════ */

export async function fetchHomeListingByMLS(
  mlsNumber: string
): Promise<RawHomeListing> {
  const baseListing: Partial<RawHomeListing> = {
    rawUrl: `mls:${mlsNumber}`,
    dataSource: "unknown",
    dataQuality: "insufficient",
  };

  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey) {
    console.warn("[homes-listing] RENTCAST_API_KEY not configured for MLS lookup");
    return {
      ...baseListing,
      address: null, city: null, state: null, zip: null, fullAddress: null,
      price: null, beds: null, baths: null, sqft: null, lotSize: null,
      yearBuilt: null, propertyType: null, description: null, listingAgent: null, brokerage: null,
      hoaFee: null, hoaStatus: 'not_listed' as const, parkingSpaces: null, hasGarage: null, hasPool: null,
      hasBasement: null, daysOnMarket: null, pricePerSqft: null,
      priceHistory: [], listingPriceChanges: [], lastSalePrice: null, lastSaleDate: null,
      fetchError: true,
      fetchErrorMessage: "Rentcast API key not configured for MLS lookup.",
    } as RawHomeListing;
  }

  // Try Rentcast MLS listing endpoint
  try {
    const url = `https://api.rentcast.io/v1/listings/mls?mlsNumber=${encodeURIComponent(mlsNumber)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, {
      headers: { "X-Api-Key": apiKey },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const listing = Array.isArray(data) ? data[0] : data;
      if (listing) {
        const mapped: Partial<RawHomeListing> = {
          ...baseListing,
          address: listing.addressLine1 || listing.formattedAddress || null,
          city: listing.city || null,
          state: listing.state || null,
          zip: listing.zipCode || null,
          price: listing.price || listing.listPrice || listing.lastSalePrice || null,
          beds: listing.bedrooms ?? null,
          baths: listing.bathrooms ?? null,
          sqft: listing.squareFootage ?? null,
          lotSize: listing.lotSize ? `${listing.lotSize} sqft` : null,
          yearBuilt: listing.yearBuilt ?? null,
          propertyType: listing.propertyType || null,
          description: listing.description || null,
          listingAgent: listing.listingAgent || null,
          brokerage: listing.brokerage || null,
          hoaFee: listing.hoaFee ?? null,
          hoaStatus: listing.hoaFee != null ? (listing.hoaFee > 0 ? 'confirmed' as const : 'confirmed_none' as const) : 'not_listed' as const,
          parkingSpaces: listing.features?.parkingSpaces ?? null,
          hasGarage: listing.features?.garage ?? null,
          hasPool: listing.features?.pool ?? null,
          hasBasement: listing.features?.basement ?? null,
          daysOnMarket: listing.daysOnMarket ?? null,
          priceHistory: [],
          listingPriceChanges: [],
          lastSalePrice: listing.lastSalePrice ?? null,
          lastSaleDate: listing.lastSaleDate ?? null,
          dataSource: "unknown",
        };
        mapped.fullAddress = buildFullAddress(mapped);
        mapped.pricePerSqft = mapped.price && mapped.sqft && mapped.sqft > 0
          ? Math.round(mapped.price / mapped.sqft) : null;
        mapped.dataQuality = assessQuality(mapped);

        if (mapped.dataQuality === "insufficient") {
          mapped.fetchError = true;
          mapped.fetchErrorMessage = `We could not find a listing for MLS number ${mlsNumber}. Please try the listing URL instead.`;
        }

        return mapped as RawHomeListing;
      }
    }
  } catch (err) {
    console.error("[homes-listing] MLS lookup failed:", err);
    logError("listingFetcher/mls-lookup", err, { vertical: "homes" });
  }

  // All methods failed
  return {
    ...baseListing,
    address: null, city: null, state: null, zip: null, fullAddress: null,
    price: null, beds: null, baths: null, sqft: null, lotSize: null,
    yearBuilt: null, propertyType: null, description: null, listingAgent: null, brokerage: null,
    hoaFee: null, hoaStatus: 'not_listed' as const, parkingSpaces: null, hasGarage: null, hasPool: null,
    hasBasement: null, daysOnMarket: null, pricePerSqft: null,
    priceHistory: [], listingPriceChanges: [], lastSalePrice: null, lastSaleDate: null,
    fetchError: true,
    fetchErrorMessage: `We could not find a listing for MLS number ${mlsNumber}. Please try the listing URL instead.`,
  } as RawHomeListing;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                          HELPERS                                      */
/* ═══════════════════════════════════════════════════════════════════════ */

function strOrNull(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

function numOrNull(v: unknown): number | null {
  if (typeof v === "number" && !isNaN(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[,$]/g, ""));
    return isNaN(n) ? null : n;
  }
  return null;
}

function boolOrNull(v: unknown): boolean | null {
  if (typeof v === "boolean") return v;
  return null;
}

function deriveHoaStatus(extracted: Record<string, unknown>): RawHomeListing['hoaStatus'] {
  const hoaFee = numOrNull(extracted.hoaFee);
  const desc = strOrNull(extracted.description)?.toLowerCase() ?? '';
  // Check if listing explicitly says no HOA
  const noHoaPatterns = /no\s*hoa|no\s*homeowner.?s?\s*association|hoa:\s*none|hoa\s*fee:\s*\$?0/i;
  if (hoaFee === 0 || noHoaPatterns.test(desc)) {
    return 'confirmed_none';
  }
  if (hoaFee !== null && hoaFee > 0) {
    return 'confirmed';
  }
  return 'not_listed';
}

function buildFullAddress(listing: Partial<RawHomeListing>): string | null {
  const parts = [
    listing.address,
    listing.city,
    listing.state,
    listing.zip,
  ].filter(Boolean);
  return parts.length >= 2 ? parts.join(", ") : null;
}

function mergeListing(
  primary: Partial<RawHomeListing>,
  fallback: Partial<RawHomeListing>
): Partial<RawHomeListing> {
  const merged = { ...primary };
  for (const key of Object.keys(fallback) as (keyof RawHomeListing)[]) {
    if (
      (merged[key] === null || merged[key] === undefined) &&
      fallback[key] !== null &&
      fallback[key] !== undefined
    ) {
      (merged as Record<string, unknown>)[key] = fallback[key];
    }
  }
  return merged;
}
