import { NextRequest, NextResponse } from "next/server";
import Firecrawl from "@mendable/firecrawl-js";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { rateLimitResponse } from "@/lib/rate-limit";
import type { ScrapedCar, ScrapeResponse } from "@/types";

const MAX_URLS = 4;

/**
 * Internal shared secret for server-to-server calls (e.g., /api/analyze -> /api/scrape).
 * Falls back to the Supabase service role key to avoid needing yet another env var.
 */
const INTERNAL_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/**
 * Validate that a URL is safe to scrape:
 * - Must be http or https
 * - Must not target localhost, private IPs, or link-local addresses
 */
function isSafeUrl(urlString: string): { safe: boolean; reason?: string } {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return { safe: false, reason: "Invalid URL format" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { safe: false, reason: "Only http and https URLs are allowed" };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]") {
    return { safe: false, reason: "Cannot scrape localhost" };
  }

  // Block private/internal IP ranges
  const ipMatch = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipMatch) {
    const [, a, b] = ipMatch.map(Number);
    if (a === 10) return { safe: false, reason: "Cannot scrape private IP addresses" };
    if (a === 172 && b >= 16 && b <= 31) return { safe: false, reason: "Cannot scrape private IP addresses" };
    if (a === 192 && b === 168) return { safe: false, reason: "Cannot scrape private IP addresses" };
    if (a === 169 && b === 254) return { safe: false, reason: "Cannot scrape link-local addresses" };
    if (a === 0) return { safe: false, reason: "Cannot scrape this address" };
  }

  return { safe: true };
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                     FIRECRAWL SCRAPE OPTIONS                           */
/* ═══════════════════════════════════════════════════════════════════════ */

/**
 * Enhanced Firecrawl options for maximum content extraction from dealer sites.
 * - waitFor: gives JS-heavy pages time to fully render before scraping
 * - actions: expands collapsed accordion/dropdown sections so hidden content
 *   is captured (each click targets ALL matching elements; non-matching
 *   selectors are silently skipped by the browser)
 */
const FIRECRAWL_SCRAPE_OPTIONS = {
  formats: ["markdown" as const],
  waitFor: 7000,
  actions: [
    { type: "click" as const, selector: "[data-toggle]", all: true },
    { type: "click" as const, selector: ".accordion-header", all: true },
    { type: "click" as const, selector: ".collapse-trigger", all: true },
    { type: "click" as const, selector: "details > summary", all: true },
    { type: "click" as const, selector: "[aria-expanded='false']", all: true },
    { type: "wait" as const, milliseconds: 1000 },
  ],
};

// Carvana has heavier bot detection — use longer waits and fewer actions
const CARVANA_SCRAPE_OPTIONS = {
  formats: ["markdown" as const],
  waitFor: 15000,
  timeout: 60000,
  actions: [
    { type: "wait" as const, milliseconds: 3000 },
    { type: "click" as const, selector: "[data-testid='vdp-see-more']", all: true },
    { type: "click" as const, selector: "[aria-expanded='false']", all: true },
    { type: "wait" as const, milliseconds: 2000 },
  ],
};

function isCarvanaUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.includes("carvana.com");
  } catch {
    return false;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                       CLIENT INITIALIZATION                            */
/* ═══════════════════════════════════════════════════════════════════════ */

function getFirecrawl() {
  const key = process.env.FIRECRAWL_API_KEY ?? "";
  if (!key) console.warn("[scrape] FIRECRAWL_API_KEY is not set");
  return new Firecrawl({ apiKey: key });
}

function getAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY ?? "";
  if (!key) console.warn("[scrape] ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey: key });
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                    EXPIRED LISTING DETECTION                           */
/* ═══════════════════════════════════════════════════════════════════════ */

const EXPIRED_PATTERNS = [
  /no longer (available|listed)/i,
  /vehicle (has been |was )?(sold|removed)/i,
  /this listing has (expired|ended|been removed)/i,
  /sorry,?\s*this vehicle is no longer/i,
  /vehicle not found/i,
  /listing not found/i,
];

function detectExpiredListing(markdown: string): boolean {
  return EXPIRED_PATTERNS.some((pattern) => pattern.test(markdown));
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                          SCRAPE ENDPOINT                               */
/* ═══════════════════════════════════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  try {
    // Authentication: allow either a logged-in user or an internal server call
    const internalToken = req.headers.get("x-internal-token");
    const isInternalCall = internalToken === INTERNAL_SECRET && INTERNAL_SECRET.length > 0;

    let userId: string | undefined;
    if (!isInternalCall) {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json(
          { error: "Authentication required", code: "AUTH_REQUIRED" },
          { status: 401 }
        );
      }
      userId = user.id;

      // Rate limit: max 10 scrape requests per hour per user
      const rlResponse = rateLimitResponse(
        { name: "scrape", maxRequests: 10 },
        req,
        userId
      );
      if (rlResponse) return rlResponse;
    }

    const body = await req.json();
    const { urls } = body as { urls: string[] };

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "Please provide an array of URLs" },
        { status: 400 }
      );
    }

    if (urls.length > MAX_URLS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_URLS} URLs allowed per request` },
        { status: 400 }
      );
    }

    // Validate all URLs are safe (no internal IPs, no non-http schemes)
    for (const url of urls) {
      const check = isSafeUrl(url);
      if (!check.safe) {
        return NextResponse.json(
          { error: `Unsafe URL rejected: ${check.reason} (${url})` },
          { status: 400 }
        );
      }
    }

    console.log(`[scrape] Processing ${urls.length} URLs:`, urls);

    // Scrape all URLs in parallel
    const results = await Promise.allSettled(
      urls.map((url) => scrapeSingleUrl(url))
    );

    const cars: ScrapedCar[] = results.map((result, i) => {
      if (result.status === "fulfilled") {
        return result.value;
      }
      console.error(
        `[scrape] Promise rejected for URL ${urls[i]}:`,
        result.reason
      );
      return makeErrorCar(
        urls[i],
        new Date().toISOString(),
        result.reason instanceof Error
          ? result.reason.message
          : "Failed to retrieve data for this URL"
      );
    });

    const response: ScrapeResponse = { cars };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[scrape] Top-level API error:", err);
    return NextResponse.json(
      { error: "Internal server error while retrieving vehicle data" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                     SCRAPE A SINGLE URL                                */
/* ═══════════════════════════════════════════════════════════════════════ */

async function scrapeSingleUrl(url: string): Promise<ScrapedCar> {
  const now = new Date().toISOString();

  // Validate URL
  try {
    new URL(url);
  } catch {
    return makeErrorCar(url, now, "Invalid URL format");
  }

  // Step 1: Scrape the page with Firecrawl
  const isCarvana = isCarvanaUrl(url);
  const scrapeOptions = isCarvana ? CARVANA_SCRAPE_OPTIONS : FIRECRAWL_SCRAPE_OPTIONS;
  console.log(`[scrape] Step 1: Firecrawl scraping ${url}${isCarvana ? " (Carvana mode)" : ""}`);
  let markdown = "";
  let metadata: Record<string, unknown> = {};

  try {
    const firecrawl = getFirecrawl();
    const scrapeResult = await firecrawl.scrape(url, scrapeOptions);

    markdown = scrapeResult.markdown || "";
    metadata = (scrapeResult.metadata as Record<string, unknown>) || {};
    console.log(
      `[scrape] Firecrawl OK: ${markdown.length} chars | Status: ${metadata.statusCode || "?"}`,
    );
  } catch (err) {
    console.error(`[scrape] Firecrawl error for ${url}:`, err);

    // Carvana fallback: extract VIN from URL and return minimal car for NHTSA enrichment
    if (isCarvana) {
      const vinMatch = url.match(/\/vehicle\/(\d+)\/([A-HJ-NPR-Z0-9]{17})/i) || url.match(/([A-HJ-NPR-Z0-9]{17})/i);
      if (vinMatch) {
        const vin = vinMatch[vinMatch.length - 1];
        console.log(`[scrape] Carvana fallback: extracted VIN ${vin} from URL`);
        return {
          url,
          scrapedAt: now,
          vin,
          year: null, make: null, model: null, trim: null,
          price: null, mileage: null, engine: null, engineHP: null,
          transmission: null, driveType: null, fuelType: null, bodyStyle: null,
          exteriorColor: null, interiorColor: null, features: [],
          dealerName: "Carvana", dealerLocation: null, listingTitle: null,
          rawMarkdown: "",
          photoCount: 0, photoUrl: null,
          error: "Carvana page could not be loaded. Basic data will be retrieved via VIN lookup.",
        } as ScrapedCar;
      }
    }

    return makeErrorCar(
      url,
      now,
      `Could not retrieve data from this page: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }

  // Check for 404 pages
  if (metadata.statusCode === 404 || metadata.error === "Not Found") {
    return makeErrorCar(url, now, "This listing page returned a 404. The car may have been removed.");
  }

  // Check for expired/sold listings
  if (detectExpiredListing(markdown)) {
    // Try to extract basic info from the expired page (sometimes metadata has useful data)
    const partialData = extractFromMetadata(metadata, url);
    if (partialData) {
      return {
        ...partialData,
        url,
        rawMarkdown: markdown.slice(0, 5000),
        scrapedAt: now,
        error: "This listing has been sold or removed. Basic details were extracted from the page.",
      };
    }
    return makeErrorCar(
      url,
      now,
      "This listing has been sold or removed from the site."
    );
  }

  if (!markdown || markdown.trim().length < 50) {
    return makeErrorCar(
      url,
      now,
      `Page content too short to extract details (${markdown.length} chars).`
    );
  }

  // Step 2: Use Claude to extract structured data
  console.log(`[scrape] Step 2: Claude AI extraction (${markdown.length} chars)`);
  try {
    let extracted = await extractWithAI(markdown, url);
    console.log(`[scrape] Extraction OK: ${extracted.year} ${extracted.make} ${extracted.model} - $${extracted.price}`);

    // If structured extraction is sparse, try a second AI pass with a more
    // open-ended prompt on a larger chunk of the page content
    const keyFieldCount = countKeyFields(extracted);
    if (keyFieldCount < 5) {
      console.log(`[scrape] Sparse extraction (${keyFieldCount}/16 key fields) — trying AI fallback`);
      try {
        const fallback = await extractWithAIFallback(markdown, url);
        extracted = mergeExtractions(extracted, fallback);
        console.log(`[scrape] Fallback merged: now ${countKeyFields(extracted)} key fields`);
      } catch (fallbackErr) {
        console.warn(`[scrape] AI fallback failed, using original extraction:`, fallbackErr);
      }
    }

    return {
      ...extracted,
      url,
      rawMarkdown: markdown.slice(0, 10000),
      scrapedAt: now,
      error: null,
    };
  } catch (err) {
    console.error(`[scrape] AI extraction failed for ${url}:`, err);

    // Fallback: try to get basic data from Firecrawl metadata
    const fallback = extractFromMetadata(metadata, url);
    if (fallback && (fallback.year || fallback.make)) {
      console.log(`[scrape] Using metadata fallback for ${url}`);
      return {
        ...fallback,
        url,
        rawMarkdown: markdown.slice(0, 10000),
        scrapedAt: now,
        error: "AI extraction unavailable. Basic details extracted from page metadata.",
      };
    }

    return makeErrorCar(
      url,
      now,
      `AI extraction failed: ${err instanceof Error ? err.message : "Unknown error"}. Please try again or enter details manually.`
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                    AI-ASSISTED DATA EXTRACTION                         */
/* ═══════════════════════════════════════════════════════════════════════ */

interface ExtractedFields {
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
}

const MODELS_TO_TRY = [
  "claude-haiku-4-5-20251001",
  "claude-sonnet-4-20250514",
] as const;

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1500;

async function extractWithAI(
  markdown: string,
  url: string
): Promise<ExtractedFields> {
  const truncated = markdown.slice(0, 30000);

  const prompt = `You are a data extraction expert. Extract car listing information from the following scraped webpage content.

SOURCE URL: ${url}

IMPORTANT INSTRUCTIONS:
- SEARCH THE ENTIRE PAGE from top to bottom. Data may appear in ANY section — main content, sidebars, headers, footers, breadcrumbs, specification tables, or image alt text. Do NOT assume a specific page layout or HTML structure.
- Dealer websites vary enormously. Do not rely on specific div IDs or class names. Extract data from wherever it appears in the text.
- This is a scraped car listing page. The content may be messy with navigation elements, ads, footers, and broken formatting mixed in.
- Look for the ACTUAL car listing data — price, year, make, model, mileage, VIN, etc.
- The VIN is a 17-character alphanumeric code (never contains I, O, or Q). It might appear anywhere in the text.
- Price often appears as "$XX,XXX" or "Price: $XX,XXX" or similar patterns.
- Mileage may appear as "XX,XXX miles" or "Mileage: XX,XXX" or "Odometer: XX,XXX".
- Features might be in a list, comma-separated, or scattered throughout the page.
- Dealer info might be in header, footer, or sidebar content.
- If you find partial information (e.g., year and model but not make), still include what you can find.
- For numbers (price, mileage, year), return them as plain numbers without formatting.
- For features, gather any mentioned features, options, or packages into the array.
- photoUrl: if you see any image URL that looks like a car photo (contains jpg, jpeg, png, webp), include the first one.

Return ONLY a valid JSON object (no markdown formatting, no backticks, no explanation) with these exact fields:

{"listingTitle":null,"price":null,"mileage":null,"year":null,"make":null,"model":null,"trim":null,"vin":null,"exteriorColor":null,"interiorColor":null,"engine":null,"transmission":null,"driveType":null,"fuelType":null,"bodyStyle":null,"features":[],"dealerName":null,"dealerLocation":null,"photoCount":null,"photoUrl":null}

Use null for any field you genuinely cannot find. Use numbers for price/mileage/year/photoCount. Use strings for everything else. Features must be an array of strings.

SCRAPED PAGE CONTENT:
${truncated}`;

  const anthropic = getAnthropic();

  // Try each model with retries
  let lastError: Error | null = null;

  for (const model of MODELS_TO_TRY) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        console.log(
          `[scrape] Claude call: model=${model}, attempt=${attempt + 1}/${MAX_RETRIES}`
        );

        const message = await anthropic.messages.create({
          model,
          max_tokens: 2048,
          messages: [{ role: "user", content: prompt }],
        });

        const text =
          message.content[0].type === "text" ? message.content[0].text : "";
        console.log(
          `[scrape] Claude response: ${text.length} chars, model=${message.model}, stop=${message.stop_reason}`
        );

        if (!text || text.trim().length === 0) {
          throw new Error("Claude returned empty response");
        }

        return parseExtraction(text);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const isRetryable =
          lastError.message.includes("529") ||
          lastError.message.includes("overloaded") ||
          lastError.message.includes("Overloaded") ||
          lastError.message.includes("500") ||
          lastError.message.includes("Internal server error") ||
          lastError.message.includes("429") ||
          lastError.message.includes("rate");

        console.warn(
          `[scrape] Claude attempt ${attempt + 1} with ${model} failed: ${lastError.message.slice(0, 100)}`
        );

        if (isRetryable) {
          // Exponential backoff: 1.5s, 3s, 6s
          const delay = BASE_DELAY_MS * Math.pow(2, attempt);
          console.log(`[scrape] Retrying in ${delay}ms...`);
          await sleep(delay);
          continue;
        }

        // Non-retryable error — break inner loop, try next model
        break;
      }
    }
    console.log(`[scrape] Exhausted retries for ${model}, trying next model...`);
  }

  throw lastError || new Error("All Claude models failed");
}

function parseExtraction(text: string): ExtractedFields {
  let jsonStr = text.trim();

  // Strip markdown code block wrappers
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  // Find the JSON object
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error(`[scrape] No JSON in Claude response: ${text.slice(0, 300)}`);
    throw new Error("AI did not return valid JSON");
  }

  let parsed: ExtractedFields;
  try {
    parsed = JSON.parse(jsonMatch[0]) as ExtractedFields;
  } catch {
    console.error(
      `[scrape] JSON parse failed: ${jsonMatch[0].slice(0, 300)}`
    );
    throw new Error("AI returned malformed JSON");
  }

  // Sanitize
  return {
    listingTitle:
      typeof parsed.listingTitle === "string" ? parsed.listingTitle : null,
    price:
      typeof parsed.price === "number" && parsed.price > 0
        ? parsed.price
        : parseNumberFromField(parsed.price),
    mileage:
      typeof parsed.mileage === "number" && parsed.mileage >= 0
        ? parsed.mileage
        : parseNumberFromField(parsed.mileage),
    year:
      typeof parsed.year === "number" &&
      parsed.year >= 1900 &&
      parsed.year <= new Date().getFullYear() + 2
        ? parsed.year
        : null,
    make: typeof parsed.make === "string" ? parsed.make : null,
    model: typeof parsed.model === "string" ? parsed.model : null,
    trim: typeof parsed.trim === "string" ? parsed.trim : null,
    vin: typeof parsed.vin === "string" ? parsed.vin : null,
    exteriorColor:
      typeof parsed.exteriorColor === "string" ? parsed.exteriorColor : null,
    interiorColor:
      typeof parsed.interiorColor === "string" ? parsed.interiorColor : null,
    engine: typeof parsed.engine === "string" ? parsed.engine : null,
    transmission:
      typeof parsed.transmission === "string" ? parsed.transmission : null,
    driveType:
      typeof parsed.driveType === "string" ? parsed.driveType : null,
    fuelType: typeof parsed.fuelType === "string" ? parsed.fuelType : null,
    bodyStyle:
      typeof parsed.bodyStyle === "string" ? parsed.bodyStyle : null,
    features: Array.isArray(parsed.features)
      ? parsed.features.filter((f): f is string => typeof f === "string")
      : [],
    dealerName:
      typeof parsed.dealerName === "string" ? parsed.dealerName : null,
    dealerLocation:
      typeof parsed.dealerLocation === "string" ? parsed.dealerLocation : null,
    photoCount:
      typeof parsed.photoCount === "number" && parsed.photoCount >= 0
        ? parsed.photoCount
        : null,
    photoUrl: typeof parsed.photoUrl === "string" ? parsed.photoUrl : null,
  };
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                  SPARSE EXTRACTION AI FALLBACK                         */
/* ═══════════════════════════════════════════════════════════════════════ */

const KEY_FIELDS: (keyof ExtractedFields)[] = [
  "year", "make", "model", "price", "mileage",
  "trim", "vin", "exteriorColor", "interiorColor",
  "engine", "transmission", "driveType", "fuelType",
  "bodyStyle", "dealerName", "dealerLocation",
];

function countKeyFields(extracted: ExtractedFields): number {
  return KEY_FIELDS.filter((k) => {
    const v = extracted[k];
    return v !== null && v !== undefined;
  }).length;
}

/**
 * AI fallback for sparse extractions. Sends a larger chunk of the page to
 * Claude Sonnet with a less prescriptive prompt, letting the model
 * intelligently find car data in any page structure.
 */
async function extractWithAIFallback(
  markdown: string,
  url: string
): Promise<ExtractedFields> {
  const truncated = markdown.slice(0, 40000);
  const anthropic = getAnthropic();

  const prompt = `You are an expert at finding vehicle information on car dealer websites. The initial structured extraction of this page found very few data fields. Please search the ENTIRE page content below very carefully and extract any vehicle listing data you can find.

SOURCE URL: ${url}

This page may have an unusual structure. The data might be:
- In plain text anywhere on the page
- In navigation breadcrumbs (e.g., "Home > Used Cars > 2024 > Toyota > Camry")
- In URLs or link text
- In image filenames or alt text
- In page titles, headings, or metadata text
- In specification tables with unusual formatting
- In "contact us" or "request quote" sections that mention the vehicle
- Embedded in long paragraphs or dealer descriptions

Search exhaustively and extract every piece of vehicle information you can find.

Return ONLY a valid JSON object (no markdown, no backticks, no explanation) with these fields:
{"listingTitle":null,"price":null,"mileage":null,"year":null,"make":null,"model":null,"trim":null,"vin":null,"exteriorColor":null,"interiorColor":null,"engine":null,"transmission":null,"driveType":null,"fuelType":null,"bodyStyle":null,"features":[],"dealerName":null,"dealerLocation":null,"photoCount":null,"photoUrl":null}

Use null for any field you genuinely cannot find. Use numbers for price/mileage/year/photoCount. Features must be an array of strings.

FULL PAGE CONTENT:
${truncated}`;

  console.log(`[scrape] AI fallback: sending ${truncated.length} chars to claude-sonnet-4-20250514`);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  if (!text || text.trim().length === 0) {
    throw new Error("AI fallback returned empty response");
  }

  return parseExtraction(text);
}

/**
 * Merge two extractions: the fallback fills in any null fields from the primary.
 * Primary extraction values are always preserved when non-null.
 */
function mergeExtractions(
  primary: ExtractedFields,
  fallback: ExtractedFields
): ExtractedFields {
  return {
    listingTitle: primary.listingTitle ?? fallback.listingTitle,
    price: primary.price ?? fallback.price,
    mileage: primary.mileage ?? fallback.mileage,
    year: primary.year ?? fallback.year,
    make: primary.make ?? fallback.make,
    model: primary.model ?? fallback.model,
    trim: primary.trim ?? fallback.trim,
    vin: primary.vin ?? fallback.vin,
    exteriorColor: primary.exteriorColor ?? fallback.exteriorColor,
    interiorColor: primary.interiorColor ?? fallback.interiorColor,
    engine: primary.engine ?? fallback.engine,
    transmission: primary.transmission ?? fallback.transmission,
    driveType: primary.driveType ?? fallback.driveType,
    fuelType: primary.fuelType ?? fallback.fuelType,
    bodyStyle: primary.bodyStyle ?? fallback.bodyStyle,
    features: primary.features.length > 0 ? primary.features : fallback.features,
    dealerName: primary.dealerName ?? fallback.dealerName,
    dealerLocation: primary.dealerLocation ?? fallback.dealerLocation,
    photoCount: primary.photoCount ?? fallback.photoCount,
    photoUrl: primary.photoUrl ?? fallback.photoUrl,
  };
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                   METADATA FALLBACK EXTRACTION                         */
/* ═══════════════════════════════════════════════════════════════════════ */

/**
 * Extract basic car info from Firecrawl metadata (og:title, og:description, etc.)
 * This is a fallback when Claude API is unavailable.
 */
function extractFromMetadata(
  metadata: Record<string, unknown>,
  url: string
): ExtractedFields | null {
  const ogTitle = getString(metadata, "og:title") || getString(metadata, "ogTitle") || getString(metadata, "title") || "";
  const ogDesc = getString(metadata, "og:description") || getString(metadata, "ogDescription") || getString(metadata, "description") || "";
  const combined = `${ogTitle} ${ogDesc}`;

  if (!combined || combined.trim().length < 10) return null;

  // Try to extract year/make/model from title like "2024 Ford Bronco Sport Big Bend"
  const yearMatch = combined.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? parseInt(yearMatch[0], 10) : null;

  // Price from description like "$24,990" or "for $24,990"
  const priceMatch = combined.match(/\$[\d,]+/);
  const price = priceMatch
    ? parseFloat(priceMatch[0].replace(/[$,]/g, "")) || null
    : null;

  // Mileage from description like "22,140 miles"
  const mileageMatch = combined.match(/([\d,]+)\s*miles/i);
  const mileage = mileageMatch
    ? parseInt(mileageMatch[1].replace(/,/g, ""), 10) || null
    : null;

  // Try to extract make/model — common car makes
  const makes = [
    "Acura","Alfa Romeo","Aston Martin","Audi","Bentley","BMW","Buick",
    "Cadillac","Chevrolet","Chrysler","Dodge","Ferrari","Fiat","Ford",
    "Genesis","GMC","Honda","Hyundai","Infiniti","Jaguar","Jeep","Kia",
    "Lamborghini","Land Rover","Lexus","Lincoln","Lucid","Maserati",
    "Mazda","McLaren","Mercedes-Benz","Mercedes","Mini","Mitsubishi",
    "Nissan","Polestar","Porsche","Ram","Rivian","Rolls-Royce","Subaru",
    "Tesla","Toyota","Volkswagen","Volvo",
  ];

  let make: string | null = null;
  let model: string | null = null;

  for (const m of makes) {
    const regex = new RegExp(`\\b${m}\\b\\s+([\\w-]+(?:\\s+[\\w-]+)?)`, "i");
    const match = combined.match(regex);
    if (match) {
      make = m;
      model = match[1].trim();
      break;
    }
  }

  // VIN from URL
  const vinMatch = url.toUpperCase().match(/\b[A-HJ-NPR-Z0-9]{17}\b/);
  const vin = vinMatch ? vinMatch[0] : null;

  // Photo from og:image
  const photoUrl = getString(metadata, "og:image") || getString(metadata, "ogImage") || null;

  if (!year && !make && !price) return null;

  return {
    listingTitle: ogTitle || null,
    price,
    mileage,
    year,
    make,
    model,
    trim: null,
    vin,
    exteriorColor: null,
    interiorColor: null,
    engine: null,
    transmission: null,
    driveType: null,
    fuelType: null,
    bodyStyle: null,
    features: [],
    dealerName: null,
    dealerLocation: null,
    photoCount: null,
    photoUrl,
  };
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                          HELPERS                                       */
/* ═══════════════════════════════════════════════════════════════════════ */

function parseNumberFromField(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value > 0 ? value : null;
  if (typeof value === "string") {
    const cleaned = value.replace(/[$,\s]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) || num <= 0 ? null : num;
  }
  return null;
}

function getString(obj: Record<string, unknown>, key: string): string | null {
  const val = obj[key];
  return typeof val === "string" && val.trim() ? val.trim() : null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeErrorCar(
  url: string,
  timestamp: string,
  error: string
): ScrapedCar {
  return {
    url,
    listingTitle: null,
    price: null,
    mileage: null,
    year: null,
    make: null,
    model: null,
    trim: null,
    vin: null,
    exteriorColor: null,
    interiorColor: null,
    engine: null,
    transmission: null,
    driveType: null,
    fuelType: null,
    bodyStyle: null,
    features: [],
    dealerName: null,
    dealerLocation: null,
    photoCount: null,
    photoUrl: null,
    rawMarkdown: null,
    scrapedAt: timestamp,
    error,
  };
}
