import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimitResponse } from "@/lib/rate-limit";
import { PLAN_LIMITS } from "@/lib/stripe/planLimits";
import { getEffectivePlanTier } from "@/lib/supabase/types";
import { saveHomeReportWithSupabase } from "@/lib/report-storage";
import { fetchHomeListing } from "@/lib/homes/listingFetcher";
import type { RawHomeListing } from "@/lib/homes/listingFetcher";
import {
  geocodeAddress,
  fetchHomeRiskProfile,
  fetchNearbySchools,
  fetchCityCrimeData,
  fetchPriceHistory,
  fetchBrokerageRating,
  fetchCensusTractData,
} from "@/lib/homes/dataFetcher";
import type { HomeRiskProfile, NearbySchool, CrimeData, PriceHistory, BrokerageInfo, CensusTractData } from "@/lib/homes/dataFetcher";
import {
  generateHomeComparison,
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
import { logError, logWarn, logCrash } from "@/lib/logger";

interface HomePaidData {
  schools: NearbySchool[][];  // per property
  crimeData: (CrimeData | null)[];  // per property
  priceHistory: (PriceHistory | null)[];  // per property
  brokerageInfo: BrokerageInfo[];  // per property
  censusTract: (CensusTractData | null)[];  // per property
}

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

/* ═══════════════════════════════════════════════════════════════════════ */
/*                         URL VALIDATION                                */
/* ═══════════════════════════════════════════════════════════════════════ */

function isValidPropertyUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return host.length > 0 && !host.includes("localhost");
  } catch {
    return false;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                         POST HANDLER                                  */
/* ═══════════════════════════════════════════════════════════════════════ */

interface HomePreferences {
  priorities?: string[];
  buyerSituation?: string;
  mustHaves?: string[];
}

interface HomeCompareRequest {
  urls: string[];
  mlsNumbers?: string[];
  preferences?: HomePreferences;
  userId?: string;
  planType?: string;
  stripeSessionId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as HomeCompareRequest;
    const { urls: rawUrls, mlsNumbers, preferences, planType, stripeSessionId } = body;
    const urls = (rawUrls || []).filter((u: string) => u && u.trim().length > 0);

    // Require authentication
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to generate a report.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    // Rate limit
    const rlResponse = rateLimitResponse(
      { name: "homes-compare", maxRequests: 5 },
      req,
      user.id
    );
    if (rlResponse) return rlResponse;

    // Validate inputs
    const validUrls = urls.filter((u) => u && u.trim().length > 0);
    const totalInputs = validUrls.length + (mlsNumbers?.length || 0);
    if (totalInputs < 2) {
      return NextResponse.json(
        { error: "Please provide at least 2 property listing URLs or MLS numbers." },
        { status: 400 }
      );
    }

    for (const url of validUrls) {
      if (!isValidPropertyUrl(url)) {
        return NextResponse.json(
          { error: `Invalid URL: ${url}` },
          { status: 400 }
        );
      }
    }

    // Determine plan — read from user's home_plan_tier
    let plan = planType || "free";
    let planFromStripe: string | null = null;

    // If Stripe session provided, verify payment
    if (stripeSessionId) {
      try {
        const { getStripeServer } = await import("@/lib/stripe/server");
        const stripe = getStripeServer();
        const session = await stripe.checkout.sessions.retrieve(stripeSessionId);

        if (
          session.metadata?.userId === user.id &&
          session.payment_status === "paid" &&
          session.metadata?.role
        ) {
          planFromStripe = session.metadata.role;
          plan = planFromStripe;

          // Update home plan in DB
          const { createServiceClient } = await import("@/lib/supabase/server");
          const adminForPayment = createServiceClient();
          const planConfig = PLAN_LIMITS[plan];

          if (planConfig && plan.startsWith("home_")) {
            const { data: existing } = await adminForPayment
              .from("stripe_events")
              .select("event_id")
              .eq("event_id", `session_${session.id}`)
              .maybeSingle();

            if (!existing) {
              await adminForPayment
                .from("profiles")
                .update({
                  home_plan_tier: plan,
                  home_reports_used: 0,
                  home_max_reports: planConfig.maxReports,
                })
                .eq("id", user.id);

              await adminForPayment.from("stripe_events").insert({
                event_id: `session_${session.id}`,
                processed_at: new Date().toISOString(),
              }).then(({ error }) => {
                if (error) { /* duplicate */ }
              });
            }
          }
        }
      } catch (err) {
        console.error("[homes-compare] Stripe session verification failed:", err);
        logError("homes-compare/stripe-verify", err, { route: "/api/homes/compare", vertical: "homes" });
      }
    }

    // If no Stripe session, read home plan from DB
    if (!planFromStripe) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("home_plan_tier, home_reports_used, home_max_reports")
        .eq("id", user.id)
        .single();

      const rawHomePlan = profile?.home_plan_tier ?? "free";
      plan = getEffectivePlanTier(
        rawHomePlan,
        profile?.home_reports_used ?? 0,
        profile?.home_max_reports ?? 0,
      );
    }

    // Enforce property limits from PLAN_LIMITS
    const planConfig = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
    const maxProperties = planConfig.maxProperties;

    if (totalInputs > maxProperties) {
      return NextResponse.json(
        {
          error: `Your current plan supports up to ${maxProperties} properties. Upgrade to compare more.`,
          code: "PROPERTY_LIMIT_EXCEEDED",
        },
        { status: 400 }
      );
    }

    // Check usage limits for non-free plans
    if (plan !== "free" && !planFromStripe) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("home_reports_used, home_max_reports")
        .eq("id", user.id)
        .single();

      const used = profile?.home_reports_used ?? 0;
      const max = profile?.home_max_reports ?? 0;
      if (max > 0 && used >= max) {
        return NextResponse.json(
          {
            error: "You have reached your home report limit. Please upgrade your plan.",
            code: "LIMIT_REACHED",
          },
          { status: 403 }
        );
      }
    }

    // Step 1: Fetch all listings in parallel
    console.log(`[homes-compare] Fetching ${validUrls.length} listings...`);
    const listingResults = await Promise.allSettled(
      validUrls.map((url) => fetchHomeListing(url))
    );

    const listings: (RawHomeListing | null)[] = listingResults.map(
      (result, i) => {
        if (result.status === "fulfilled") return result.value;
        console.error(
          `[homes-compare] Listing fetch failed for ${validUrls[i]}:`,
          result.reason
        );
        logError("homes-compare/listing-fetch", result.reason, { route: "/api/homes/compare", vertical: "homes" });
        return null;
      }
    );

    // Fetch MLS listings
    let mlsListings: (RawHomeListing | null)[] = [];
    if (mlsNumbers && mlsNumbers.length > 0) {
      const { fetchHomeListingByMLS } = await import("@/lib/homes/listingFetcher");
      const mlsResults = await Promise.allSettled(
        mlsNumbers.map((mls: string) => fetchHomeListingByMLS(mls.trim()))
      );
      mlsListings = mlsResults.map((result, i) => {
        if (result.status === "fulfilled") return result.value;
        console.error(`[homes-compare] MLS fetch failed for ${mlsNumbers[i]}:`, result.reason);
        logError("homes-compare/mls-fetch", result.reason, { route: "/api/homes/compare", vertical: "homes" });
        return null;
      });
    }

    // Merge URL and MLS listings
    const allListings: (RawHomeListing | null)[] = [...listings, ...mlsListings];

    const successfulListings = allListings.filter(
      (l): l is RawHomeListing => l !== null
    );
    console.log(`[homes-compare] Step 1 complete: ${successfulListings.length} listings fetched`, successfulListings.map(l => l.fullAddress ?? l.address));
    if (successfulListings.length < 2) {
      return NextResponse.json(
        {
          error:
            "We had trouble reading one or more listings. Please check the URLs and try again. Make sure you are pasting the full property detail page URL.",
        },
        { status: 422 }
      );
    }

    // Step 2: Geocode and fetch risk profiles
    console.log("[homes-compare] Geocoding and fetching risk profiles...");
    const enrichmentResults = await Promise.allSettled(
      successfulListings.map(async (listing) => {
        const address = listing.fullAddress ?? listing.address ?? "";
        if (!address) {
          console.warn(`[homes-compare] No address available for listing, skipping geocoding`);
          return { listing, riskProfile: null as HomeRiskProfile | null, geocodingFailed: true, lat: null as number | null, lon: null as number | null, county: null as string | null, state: null as string | null };
        }

        try {
          const geocoding = await geocodeAddress(address, {
            city: listing.city,
            state: listing.state,
            zip: listing.zip,
          });

          if (!geocoding) {
            console.warn(`[homes-compare] Geocoding failed for: ${address}`);
            logWarn("homes-compare/geocoding", `Geocoding failed for: ${address}`, { route: "/api/homes/compare", vertical: "homes" });
            return { listing, riskProfile: null as HomeRiskProfile | null, geocodingFailed: true, lat: null as number | null, lon: null as number | null, county: null as string | null, state: null as string | null };
          }

          console.log(`[homes-compare] Geocoding succeeded for: ${address} (${geocoding.lat}, ${geocoding.lon})`);
          const riskProfile = await fetchHomeRiskProfile(
            geocoding.lat,
            geocoding.lon,
            address,
            listing.yearBuilt,
            listing.state ?? geocoding.state ?? null
          );

          return { listing, riskProfile, geocodingFailed: false, lat: geocoding.lat, lon: geocoding.lon, county: geocoding.county, state: geocoding.state };
        } catch (err) {
          console.error(
            `[homes-compare] Enrichment failed for ${address}:`,
            err
          );
          logError("homes-compare/enrichment", err, { route: "/api/homes/compare", vertical: "homes" });
          return { listing, riskProfile: null as HomeRiskProfile | null, geocodingFailed: true, lat: null as number | null, lon: null as number | null, county: null as string | null, state: null as string | null };
        }
      })
    );

    const enrichedProperties = enrichmentResults.map((result, i) => {
      if (result.status === "fulfilled") return result.value;
      return {
        listing: successfulListings[i],
        riskProfile: null as HomeRiskProfile | null,
        lat: null as number | null,
        lon: null as number | null,
        county: null as string | null,
        state: null as string | null,
      };
    });

    console.log(`[homes-compare] Step 2 complete: risk profiles`, enrichedProperties.map(ep => ({ address: ep.listing.fullAddress, hasRisk: !!ep.riskProfile })));

    // Determine if this is a full (paid) report for API response gating
    const isFullReport = planConfig.fullReport;
    console.log('[PAID-DATA-GATE] plan:', plan, 'isFullReport:', isFullReport, 'planConfig:', JSON.stringify(planConfig));

    // Step 2b: ALWAYS fetch enrichment data (even for free reports) so that
    // paid content is pre-generated and stored in the DB.  When a free user
    // upgrades, the unlock API just flips the plan flag — no re-generation needed.
    const paidData: HomePaidData = {
      schools: [],
      crimeData: [],
      priceHistory: [],
      brokerageInfo: [],
      censusTract: [],
    };

    {
      console.log('[homes-compare] Fetching all enrichment data (pre-generate for instant unlock)...');
      // Helper: race a promise against a timeout, returning fallback on timeout
      const withTimeout = <T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> =>
        Promise.race([
          promise,
          new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
        ]);
      const ENRICHMENT_TIMEOUT = 45_000; // 45s per-property enrichment budget — crime has sequential county→state fallback (up to 30s)
      const paidResults = await Promise.allSettled(
        enrichedProperties.map(async (ep) => {
          const listing = ep.listing;
          const address = listing.fullAddress ?? listing.address ?? '';
          const city = listing.city ?? '';
          const state = listing.state ?? '';
          const lat = ep.lat;
          const lon = ep.lon;

          const enrichmentPromise = (async () => {
            const [schoolsResult, crimeResult, priceResult, brokerageResult, censusResult] = await Promise.allSettled([
              lat && lon ? fetchNearbySchools(lat, lon, city) : Promise.resolve([]),
              state && city ? fetchCityCrimeData(state, city, ep.county) : Promise.resolve(null),
              address ? fetchPriceHistory(address, listing.price) : Promise.resolve(null),
              (async () => {
                const rawAgent = listing.listingAgent || null;
                const agent = rawAgent && typeof rawAgent === 'object' ? (rawAgent as Record<string, unknown>).name as string || null : rawAgent;
                const rawBrokerage = (listing as unknown as Record<string, unknown>).brokerage;
                const brokerage = rawBrokerage
                  ? typeof rawBrokerage === 'string' ? rawBrokerage
                  : typeof rawBrokerage === 'object' ? (rawBrokerage as Record<string, unknown>).name as string || null
                  : null
                  : null;
                let rating = null;
                let reviewCount = null;
                let searchUrl = null;
                if (brokerage) {
                  const result = await fetchBrokerageRating(brokerage);
                  rating = result.rating;
                  reviewCount = result.reviewCount;
                  searchUrl = result.searchUrl;
                }
                return {
                  agentName: agent,
                  brokerageName: brokerage,
                  googleRating: rating,
                  googleReviewCount: reviewCount,
                  googleSearchUrl: searchUrl,
                } as BrokerageInfo;
              })(),
              lat && lon ? fetchCensusTractData(lat, lon, listing.zip, state) : Promise.resolve(null),
            ]);

            return {
              schools: schoolsResult.status === 'fulfilled' ? schoolsResult.value : [],
              crime: crimeResult.status === 'fulfilled' ? crimeResult.value : null,
              price: priceResult.status === 'fulfilled' ? priceResult.value : null,
              brokerage: brokerageResult.status === 'fulfilled' ? brokerageResult.value : { agentName: null, brokerageName: null, googleRating: null, googleReviewCount: null, googleSearchUrl: null },
              census: censusResult.status === 'fulfilled' ? censusResult.value : null,
            };
          })();

          return withTimeout(enrichmentPromise, ENRICHMENT_TIMEOUT, {
            schools: [] as NearbySchool[],
            crime: null,
            price: null,
            brokerage: { agentName: listing.listingAgent || null, brokerageName: null, googleRating: null, googleReviewCount: null, googleSearchUrl: null } as BrokerageInfo,
            census: null,
          });
        })
      );

      for (const result of paidResults) {
        if (result.status === 'fulfilled') {
          paidData.schools.push(result.value.schools);
          paidData.crimeData.push(result.value.crime);
          paidData.priceHistory.push(result.value.price);
          paidData.brokerageInfo.push(result.value.brokerage);
          paidData.censusTract.push(result.value.census);
        } else {
          const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
          logWarn("homes-compare/paid-data", `Paid data fetch failed for property: ${reason}`, { route: "/api/homes/compare", vertical: "homes" });
          paidData.schools.push([]);
          paidData.crimeData.push(null);
          paidData.priceHistory.push(null);
          paidData.brokerageInfo.push({ agentName: null, brokerageName: null, googleRating: null, googleReviewCount: null, googleSearchUrl: null });
          paidData.censusTract.push(null);
        }
      }
      console.log("[homes-compare] Step 2b complete: paid data", {
        schools: paidData.schools.map(s => s.length),
        crime: paidData.crimeData.map(c => c !== null),
        priceHistory: paidData.priceHistory.map(p => p !== null),
        brokerage: paidData.brokerageInfo.map(b => !!(b.agentName || b.brokerageName)),
        censusTract: paidData.censusTract.map(c => c !== null ? c.source : null),
      });

      // Log empty price history for tracking
      for (let i = 0; i < paidData.priceHistory.length; i++) {
        if (!paidData.priceHistory[i]) {
          const addr = enrichedProperties[i]?.listing?.fullAddress ?? enrichedProperties[i]?.listing?.address ?? `Property ${i + 1}`;
          logWarn("homes-compare/price-history-empty", `Price history empty for: ${addr}`, { route: "/api/homes/compare", vertical: "homes" });
        }
      }
    }

    // Step 3: Generate AI comparison — ALWAYS generate full (paid) output so
    // content is pre-stored for instant unlock when free users upgrade.
    console.log(`[homes-compare] Generating AI comparison (always full for pre-generation)...`);
    let report: HomeComparisonReport;
    try {
      report = await generateHomeComparison(
        enrichedProperties,
        preferences,
        true, // Always generate full report for pre-storage
        { censusTract: paidData.censusTract, schools: paidData.schools, crimeData: paidData.crimeData }
      );
    } catch (err) {
      console.error("[homes-compare] AI comparison failed:", err);
      logError("homes-compare/ai-comparison", err, { route: "/api/homes/compare", vertical: "homes" });
      return NextResponse.json(
        { error: "AI analysis could not be completed. Please try again." },
        { status: 500 }
      );
    }

    // Override AI risk scores with formula-based calculation
    for (let i = 0; i < enrichedProperties.length; i++) {
      const formulaScore = calculateRiskScore(enrichedProperties[i].riskProfile);
      if (report.properties[i]) {
        report.properties[i].riskScore = formulaScore;
      }
    }

    // Step 3b: Calculate Sprint 1 features for ALL reports (stored in DB, hidden from free users in API response)
    // This ensures instant unlock when a free user upgrades — no re-generation needed.
    {
      console.log("[homes-compare] Calculating Sprint 1 features (for all plans, stored for instant unlock)...");

      const floodInsuranceArr = enrichedProperties.map(ep => {
        const floodCode = ep.riskProfile?.floodZone?.code ?? null;
        return calculateFloodInsurance(floodCode);
      });

      const insuranceArr = enrichedProperties.map((ep) => {
        const l = ep.listing;
        const price = l.price ?? 0;
        if (price <= 0) return null;
        const crimeAbove = ep.riskProfile?.crimeData?.comparedToNational === "above";
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
        const assessedVal = paidData.priceHistory[i]?.assessedValue ?? null;
        const annualIns = insuranceArr[i]?.adjustedAnnualPremium ?? 0;
        return calculateClosingCosts(price, annualIns, assessedVal);
      });

      const taxReassessmentArr = enrichedProperties.map((ep, i) => {
        const price = ep.listing.price ?? 0;
        if (price <= 0) return null;
        const assessedVal = paidData.priceHistory[i]?.assessedValue ?? null;
        return calculateTaxReassessment(price, assessedVal);
      });

      const loanProgramsArr = enrichedProperties.map(ep => {
        const price = ep.listing.price ?? 0;
        if (price <= 0) return null;
        return calculateLoanPrograms(price, ep.listing.state);
      });

      // Rules-based red flags
      const rulesFlagsArr = enrichedProperties.map((ep, i) => {
        const assessedVal = paidData.priceHistory[i]?.assessedValue ?? null;
        return calculateRedFlags(ep.listing, ep.riskProfile, assessedVal, floodInsuranceArr[i]);
      });

      // AI-generated features (HOA risk + red flags synthesis)
      let hoaRiskArr: (import("@/lib/homes/comparisonEngine").HoaRiskData | null)[] = enrichedProperties.map(() => null);
      let aiRedFlagsArr: string[][] = enrichedProperties.map(() => []);
      try {
        const aiFeatures = await generateSprintAIFeatures(enrichedProperties, rulesFlagsArr);
        hoaRiskArr = aiFeatures.hoaRisk;
        aiRedFlagsArr = aiFeatures.aiRedFlags;
      } catch (err) {
        console.error("[homes-compare] Sprint AI features failed:", err);
        logError("homes-compare/sprint-ai", err, { route: "/api/homes/compare", vertical: "homes" });
      }

      // Attach Sprint 1 data to report (preserve nulls to maintain per-property index alignment)
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

      console.log("[homes-compare] Step 3b complete: Sprint 1 features", {
        floodInsurance: !!report.floodInsurance,
        insurance: report.insuranceEstimate?.length ?? 0,
        closingCosts: report.closingCosts?.length ?? 0,
        taxReassessment: report.taxReassessment?.length ?? 0,
        loanPrograms: report.loanPrograms?.length ?? 0,
        redFlags: report.redFlags?.length ?? 0,
        hoaRisk: report.hoaRisk?.filter(h => h !== null).length ?? 0,
      });
      console.log("[homes-compare] Sprint 1 features calculated successfully");
    }

    // Step 4: Save FULL home report to database (before applying paywall)
    // The full data including ourPick and finalVerdict is preserved in DB
    // so it can be revealed when the user upgrades later.
    console.log("[homes-compare] Step 4: Saving report. Keys in report:", Object.keys(report));
    console.log('[REPORT-SAVE] report keys:', Object.keys(report), 'has paidData:', !!paidData?.schools?.length);
    const reportId = await saveHomeReportWithSupabase({
      report: report as unknown as Record<string, unknown>,
      listings: successfulListings,
      plan,
      userId: user.id,
      paidData, // Always store paid data for instant unlock on upgrade
    });

    // Step 5: Apply paywall logic for the API response only
    if (!isFullReport) {
      // Free users: hide premium sections in the API response
      report.ourPick = null;
      report.finalVerdict = null;
      report.isPremium = true;
      // Remove paid-only AI sections (all pre-generated but hidden for free users)
      delete report.scoreAnalysis;
      delete report.neighborhoodIntelligence;
      delete report.neighborhoodIntelligenceStructured;
      delete report.schoolDistrictContext;
      delete report.schoolDistrictContextStructured;
      delete report.negotiationIntelligence;
      delete report.maintenanceAnalysis;
      delete report.investmentOutlook;
      delete report.investmentOutlookStructured;
      delete report.questionsToAskAgent;
      delete report.priceHistoryInsights;
      delete report.priceHistoryComparison;
      delete report.buyerProtectionChecklist;
      delete report.commuteAnalysis;
      delete report.investmentPerspective;
      delete report.comparableContext;
      delete report.detailedComparison;
      // Remove Sprint 1 paid sections
      delete report.closingCosts;
      delete report.insuranceEstimate;
      delete report.taxReassessment;
      delete report.hoaRisk;
      delete report.redFlags;
      delete report.loanPrograms;
      delete report.floodInsurance;
      // Limit pros/cons to 3 each for free
      for (const prop of report.properties) {
        prop.pros = prop.pros.slice(0, 3);
        prop.cons = prop.cons.slice(0, 3);
      }
      // Risk Report stays visible for free users (differentiator)
    }

    return NextResponse.json({
      report,
      listings: successfulListings,
      plan,
      reportId,
      ...(isFullReport ? { paidData } : {}),
    });
  } catch (err) {
    console.error("[homes-compare] Top-level error:", err);
    logCrash("homes-compare/top-level", err, { route: "/api/homes/compare", vertical: "homes" });
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
