"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Loader2,
  ArrowLeft,
  Check,
  X,
  Shield,
  Droplets,
  Flame,
  Wind,
  AlertTriangle,
  Lock,
  Zap,
  Download,
  DollarSign,
  Trophy,
  ArrowRight,
  TrendingUp,
  MapPin,
  Wrench,
  GraduationCap,
  Handshake,
  ChevronDown,
  ChevronUp,
  Building2,
  Star,
  ExternalLink,
  History,
  ShieldCheck,
  ShieldAlert,
  Activity,
  AlertCircle,
  Award,
  BarChart3,
  HelpCircle,
  LayoutGrid,
  Quote,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  // Legend,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════════════ */
/*                              TYPES                                    */
/* ═══════════════════════════════════════════════════════════════════════ */

interface PropertyAnalysis {
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
  riskProfile: RiskProfile | null;
}

interface RiskProfile {
  floodZone: {
    code: string | null;
    isSFHA: boolean;
    elevation: number | null;
    riskLevel: string;
  };
  superfundSites: {
    count1mile: number;
    count3mile: number;
    sites: { name: string; distanceMiles: number }[];
  };
  earthquakeRisk: {
    eventCount: number;
    maxMagnitude: number | null;
    riskLevel: string;
  };
  wildfireRisk: {
    class: string | null;
    riskLevel: string;
  };
  airQuality: {
    score: number | null;
    description: string | null;
  };
  radonZone: {
    zone: number | null;
    riskLabel: string;
  };
  leadPaintRisk: boolean;
  asbestosRisk: boolean;
}

interface NegotiationIntelligence {
  marketPosition: string;
  daysOnMarketAnalysis: string;
  suggestedOfferRange: string;
  concessionOpportunities: string;
  redFlags: string;
  negotiationStrength: "strong_buyer" | "balanced" | "sellers_market";
}

interface MaintenanceItem {
  system: string;
  typicalLifespan: string;
  riskLevel: "green" | "yellow" | "red";
  estimatedCost: string;
}

interface PriceHistoryEvent {
  date: string;
  event: string;
  price: number | null;
  priceChange: number | null;
  source: string;
}

interface ComparisonReport {
  summary: string;
  properties: PropertyAnalysis[];
  property1Summary?: string;
  property2Summary?: string;
  ourPick: { winner: number; reasoning: string; address?: string; bullets?: string[]; narrative?: string; caveat?: string } | null;
  finalVerdict: string | null;
  buyerProtectionChecklist?: { item: string; why: string; howToFind: string }[][];
  generatedAt: string;
  dataQuality: string;
  property1OverallScore?: number | null;
  property2OverallScore?: number | null;
  property1FinancialScore?: number | null;
  property2FinancialScore?: number | null;
  property1LocationScore?: number | null;
  property2LocationScore?: number | null;
  property1StructuralScore?: number | null;
  property2StructuralScore?: number | null;
  property1LifestyleScore?: number | null;
  property2LifestyleScore?: number | null;
  property1RiskScore?: number | null;
  property2RiskScore?: number | null;
  isPremium?: boolean;
  // Paid sections
  scoreAnalysis?: Record<string, string>;
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
  questionsToAskAgent?: { property: string; category: string; question: string; whyItMatters: string }[];
  priceHistoryInsights?: string[][];
  priceHistoryComparison?: string;
  // Sprint 1 features (per-property arrays, nulls preserve index alignment)
  closingCosts?: (ClosingCostEstimate | null)[];
  insuranceEstimate?: (InsuranceEstimateData | null)[];
  taxReassessment?: (TaxReassessmentData | null)[];
  hoaRisk?: (HoaRiskDataType | null)[];
  redFlags?: RedFlagsDataType[];
  loanPrograms?: (LoanProgramEligibilityData | null)[];
  floodInsurance?: FloodInsuranceData[];
  paidData?: {
    schools: NearbySchool[][];
    crimeData: (CrimeDataType | null)[];
    priceHistory: (PriceHistoryType | null)[];
    brokerageInfo: BrokerageInfoType[];
  };
}

interface NearbySchool {
  name: string;
  district: string;
  level: 'Elementary' | 'Middle' | 'High' | 'Middle/High' | 'K-12' | 'Other';
  enrollment: number | null;
  locale: string;
  distanceMiles: number;
  greatSchoolsSearchUrl: string;
}

interface CrimeDataType {
  jurisdiction: string;
  year: number;
  violentCrimeRate: number;
  propertyCrimeRate: number;
  vsNationalViolent: 'below' | 'average' | 'above';
  vsNationalProperty: 'below' | 'average' | 'above';
  dataNote: string;
}

interface PriceHistoryType {
  lastSalePrice: number | null;
  lastSaleDate: string | null;
  assessedValue: number | null;
  appreciationAmount: number | null;
  appreciationPercent: number | null;
  annualAppreciationRate: number | null;
}

interface BrokerageInfoType {
  agentName: string | null;
  brokerageName: string | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  googleSearchUrl: string | null;
}

/* Sprint 1 Feature Types */
interface ClosingCostEstimate {
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

interface InsuranceEstimateData {
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

interface TaxReassessmentData {
  assessedValue: number | null;
  listingPrice: number;
  assessmentGap: number | null;
  gapPercentage: number | null;
  isReassessmentRisk: boolean;
  estimatedCurrentAnnualTax: number | null;
  estimatedPostPurchaseAnnualTax: number;
  estimatedAnnualTaxIncrease: number | null;
}

interface HoaRiskDataType {
  riskLevel: "low" | "medium" | "high";
  riskObservations: string[];
  agentQuestions: string[];
  monthlyFee: number;
}

interface RedFlagItemType {
  text: string;
  severity: "amber" | "red";
}

interface RedFlagsDataType {
  rulesFlags: RedFlagItemType[];
  aiRedFlags: string[];
  noFlagsDetected: boolean;
}

interface LoanProgramType {
  name: string;
  minDownPayment: string;
  estimatedMonthlyPayment: string;
  keyRequirement: string;
}

interface LoanProgramEligibilityData {
  programs: LoanProgramType[];
  stateProgram: string;
  state: string;
}

interface FloodInsuranceData {
  floodZone: string;
  required: boolean;
  estimateLow: number | null;
  estimateHigh: number | null;
  note: string;
  nfipCoverageNote: string | null;
}

interface ListingData {
  address: string | null;
  fullAddress: string | null;
  price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  yearBuilt: number | null;
  hoaFee: number | null;
  hoaStatus?: 'confirmed' | 'confirmed_none' | 'not_listed';
  daysOnMarket: number | null;
  propertyType: string | null;
  pricePerSqft: number | null;
  lotSize?: string | null;
  hasGarage?: boolean | null;
  hasPool?: boolean | null;
  hasBasement?: boolean | null;
  parkingSpaces?: number | null;
  priceHistory?: PriceHistoryEvent[];
  listingPriceChanges?: { date: string; oldPrice: number; newPrice: number; changePercent: number }[];
  lastSalePrice?: number | null;
  lastSaleDate?: string | null;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                         SCORE HELPERS                                 */
/* ═══════════════════════════════════════════════════════════════════════ */



function scoreRingColor(score: number): string {
  if (score >= 8) return "#10B981";
  if (score >= 5) return "#F59E0B";
  return "#EF4444";
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                       RISK BADGE HELPERS                              */
/* ═══════════════════════════════════════════════════════════════════════ */

type BadgeLevel = "red" | "yellow" | "green" | "gray";


interface RiskItem {
  label: string;
  level: BadgeLevel;
  value: string;
  explanation: string;
  icon: React.ReactNode;
  tooltip?: string;
}

function getRiskItems(
  riskProfile: RiskProfile | null,
  yearBuilt: number | null
): RiskItem[] {
  if (!riskProfile) {
    return [
      {
        label: "Risk Data",
        level: "gray" as BadgeLevel,
        value: "Unavailable",
        explanation: "Risk data could not be retrieved for this property. This is usually because the property address could not be precisely located. This does not indicate high risk, it means we were unable to assess it. Consider requesting a professional environmental assessment.",
        icon: <Shield className="h-4 w-4" />,
      },
    ];
  }

  const r = riskProfile;
  const items: RiskItem[] = [];

  const floodLevel: BadgeLevel = r.floodZone.isSFHA ? "red" : r.floodZone.riskLevel === "Low" ? "green" : "yellow";
  items.push({ label: "Flood Zone", level: floodLevel, value: floodLevel === "red" ? `High Risk (Zone ${r.floodZone.code ?? "SFHA"})` : floodLevel === "green" ? `Low Risk (Zone ${r.floodZone.code ?? "X"})` : `Moderate (Zone ${r.floodZone.code ?? "X"})`, explanation: floodLevel === "red" ? "Flood insurance is likely required by your lender, estimated $1,500 to $4,000/year." : floodLevel === "green" ? "Outside the high-risk flood area. Flood insurance is optional but recommended." : "Moderate flood zone. Flood insurance may be recommended.", icon: <Droplets className="h-4 w-4" />, ...(floodLevel === "yellow" && !r.floodZone.code ? { tooltip: "Flood zone data is retrieved from FEMA's NFHL database. If the zone letter is not available, the property address may not have a flood zone determination on file. Request a flood zone determination from your lender." } : {}) });

  const sfLevel: BadgeLevel = r.superfundSites.count1mile > 0 ? "red" : r.superfundSites.count3mile > 0 ? "yellow" : "green";
  items.push({ label: "Superfund Sites", level: sfLevel, value: sfLevel === "red" ? `${r.superfundSites.count1mile} within 1 mile` : sfLevel === "yellow" ? `${r.superfundSites.count3mile} within 3 miles` : "None nearby", explanation: sfLevel === "red" ? "Toxic cleanup sites nearby may affect property values and health." : sfLevel === "yellow" ? "Superfund sites are within a few miles. Monitor EPA cleanup status." : "No known toxic cleanup sites in the immediate area.", icon: <AlertTriangle className="h-4 w-4" /> });

  const eqLevel: BadgeLevel = r.earthquakeRisk.riskLevel === "High" ? "red" : r.earthquakeRisk.riskLevel === "Moderate" ? "yellow" : "green";
  items.push({ label: "Earthquake Risk", level: eqLevel, value: `${r.earthquakeRisk.riskLevel} (${r.earthquakeRisk.eventCount} events${r.earthquakeRisk.maxMagnitude ? `, max ${r.earthquakeRisk.maxMagnitude}M` : ""})`, explanation: eqLevel === "red" ? "Significant seismic activity. Earthquake insurance is strongly recommended." : eqLevel === "yellow" ? "Moderate seismic activity. Consider earthquake insurance." : "Low seismic activity in this area.", icon: <Zap className="h-4 w-4" /> });

  const wfLevel: BadgeLevel = r.wildfireRisk.riskLevel === "High" || r.wildfireRisk.riskLevel === "Very High" ? "red" : r.wildfireRisk.riskLevel === "Moderate" ? "yellow" : "green";
  items.push({ label: "Wildfire Risk", level: wfLevel, value: r.wildfireRisk.riskLevel, explanation: wfLevel === "red" ? "High wildfire hazard area. May face higher insurance rates." : wfLevel === "yellow" ? "Moderate wildfire risk. Maintain defensible space." : "Low wildfire risk.", icon: <Flame className="h-4 w-4" />, ...(r.wildfireRisk.riskLevel === "Unknown" ? { tooltip: "Wildfire risk data is sourced from USFS. This data may not be available for all locations, particularly urban or eastern US properties." } : {}) });

  const aqScore = r.airQuality.score;
  const aqLevel: BadgeLevel = aqScore !== null && aqScore < 50 ? "red" : aqScore !== null && aqScore <= 70 ? "yellow" : aqScore !== null ? "green" : "gray";
  items.push({ label: "Air Quality", level: aqLevel, value: aqScore !== null ? `Score: ${aqScore}/100` : "Data unavailable", explanation: aqLevel === "red" ? "Poor air quality. May impact health for sensitive groups." : aqLevel === "yellow" ? "Fair air quality. Some pollutant exposure above average." : aqLevel === "green" ? "Good air quality." : "Air quality data was not available.", icon: <Wind className="h-4 w-4" />, ...(aqLevel === "gray" ? { tooltip: "Air quality data from AirNow requires an API key. This will be available in a future update." } : {}) });

  const radonLevel: BadgeLevel = r.radonZone.zone === 1 ? "red" : r.radonZone.zone === 2 ? "yellow" : r.radonZone.zone === 3 ? "green" : "gray";
  items.push({ label: "Radon Zone", level: radonLevel, value: r.radonZone.zone !== null ? `Zone ${r.radonZone.zone} (${r.radonZone.riskLabel})` : "Unknown", explanation: radonLevel === "red" ? "High radon potential. Testing is strongly recommended." : radonLevel === "yellow" ? "Moderate radon potential. Testing recommended." : radonLevel === "green" ? "Low radon potential." : "Radon zone data was not available.", icon: <Shield className="h-4 w-4" />, ...(radonLevel === "gray" ? { tooltip: "Radon zone data was not available for this location." } : {}) });

  items.push({ label: "Lead Paint Era", level: r.leadPaintRisk ? "red" : "green", value: r.leadPaintRisk ? `Pre-1978 (Built ${yearBuilt ?? "before 1978"})` : "Post-1978", explanation: r.leadPaintRisk ? "Homes built before 1978 may contain lead paint." : "Built after the 1978 lead paint ban.", icon: <Shield className="h-4 w-4" /> });

  items.push({ label: "Asbestos Risk", level: r.asbestosRisk ? "red" : "green", value: r.asbestosRisk ? `Pre-1980 (Built ${yearBuilt ?? "before 1980"})` : "Post-1980", explanation: r.asbestosRisk ? "Homes built before 1980 may contain asbestos materials." : "Lower risk of asbestos-containing materials.", icon: <Shield className="h-4 w-4" /> });

  return items;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                       FINANCIAL HELPERS                               */
/* ═══════════════════════════════════════════════════════════════════════ */

function estimateMonthlyMortgage(price: number): number {
  const downPayment = price * 0.2;
  const principal = price - downPayment;
  const monthlyRate = 0.07 / 12;
  const numPayments = 30 * 12;
  return Math.round(principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1));
}

function estimatePropertyTax(price: number): number {
  return Math.round((price * 0.011) / 12);
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                   SCORE GAUGE COMPONENT (SVG)                         */
/* ═══════════════════════════════════════════════════════════════════════ */

function ScoreGauge({ score, label, size = 100, isNull = false, isWinner = false }: { score: number | null; label: string; size?: number; isNull?: boolean; isWinner?: boolean }) {
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  if (score === null || isNull) {
    return (
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90 text-zinc-200 dark:text-zinc-800">
            <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-zinc-400 leading-tight text-center">Insufficient<br/>data</span>
          </div>
        </div>
        {label && <p className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 text-center uppercase tracking-wider">{label}</p>}
      </div>
    );
  }

  const pct = Math.min(score / 10, 1);
  const offset = circumference * (1 - pct);
  const color = scoreRingColor(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="currentColor" strokeOpacity={0.05} strokeWidth={strokeWidth} className="text-zinc-900 dark:text-white" />
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-700 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1">
            {isWinner && <span className="inline-block h-2 w-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />}
            <span className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100 leading-none">{score}</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 opacity-60">Score</span>
        </div>
      </div>
      {label && <p className="mt-4 text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-center">{label}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                       CHART COLORS                                    */
/* ═══════════════════════════════════════════════════════════════════════ */

const PROPERTY_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];

/* ═══════════════════════════════════════════════════════════════════════ */
/*                       MAIN REPORT CONTENT                             */
/* ═══════════════════════════════════════════════════════════════════════ */

/* Helper: safely extract a displayable string from brokerage/agent fields
   that may be an object {name, email, phone, website} instead of a string. */
const getBrokerageName = (val: unknown): string => {
  if (!val) return 'Not available';
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>;
    return (obj.name as string) || (obj.brokerage as string) || 'Not available';
  }
  return String(val);
};

function ReportContent() {
const params = useParams();
  const searchParams = useSearchParams();
  const upgraded = searchParams.get("upgraded") === "true";
  const sessionId = searchParams.get("session_id");
  const [report, setReport] = useState<ComparisonReport | null>(null);
  const [listings, setListings] = useState<ListingData[]>([]);
  const [isPaid, setIsPaid] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFinancialMethodology, setShowFinancialMethodology] = useState(false);
  const [paidData, setPaidData] = useState<ComparisonReport['paidData']>(undefined);
  const [activeSection, setActiveSection] = useState<string>("executive-summary");

  // Track which section is in view for sidebar TOC
  useEffect(() => {
    if (!report) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-10% 0px -80% 0px" }
    );
    const sections = document.querySelectorAll("[data-toc-section]");
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [report]);

  useEffect(() => {
    // Check URL params for direct report loading (after upgrade from Stripe)
    const urlReportId = params.id as string;

    if (urlReportId) {
      // Load report from DB
      (async () => {
        try {
          // If returning from upgrade payment, unlock FIRST before fetching
          if (upgraded && sessionId) {
            setVerifyingPayment(true);

            // Step 1: Call verify-session and the report POST unlock — await BOTH before proceeding
            const [verifyResult, postResult] = await Promise.allSettled([
              fetch("/api/stripe/verify-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId }),
              }).then(r => r.json()),
              fetch(`/api/homes/report/${urlReportId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId }),
              }).then(r => r.json()),
            ]);

            // Check if either unlock succeeded
            const verifyOk = verifyResult.status === "fulfilled" && verifyResult.value?.verified;
            const postOk = postResult.status === "fulfilled" && postResult.value?.unlocked;

            if (!verifyOk && !postOk) {
              console.error('[UNLOCK] Both unlock strategies failed:', { verifyResult, postResult });
              setError("Payment was confirmed but we couldn't unlock your report. Please refresh the page or contact support.");
              setVerifyingPayment(false);
              setLoading(false);
              return;
            }
          }

           // Clean URL only AFTER unlock is confirmed (removing Stripe params but KEEPING the id in the path)
          if (upgraded || sessionId) {
            window.history.replaceState({}, "", `/homes/report/${urlReportId}`);
          }

          // Step 2: Fetch the unlocked report
          const res = await fetch(`/api/homes/report/${urlReportId}`);
          if (!res.ok) {
            throw new Error("Failed to load report");
          }
          const data = await res.json();
          setReport(data.report);
          setListings(data.listings || []);
          setPaidData(data.paidData || data.report?.paidData);
          setReportId(data.reportId || urlReportId);
          setIsPaid(data.plan !== "free");

          // If upgraded but still showing as free, retry a few times
          if (upgraded && data.plan === "free") {
            const delays = [300, 500, 1000, 2000];
            for (const delay of delays) {
              await new Promise((r) => setTimeout(r, delay));
              if (sessionId) {
                try {
                  await fetch(`/api/homes/report/${urlReportId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sessionId }),
                  });
                } catch { /* ignore */ }
              }
              const retryRes = await fetch(`/api/homes/report/${urlReportId}`);
              if (retryRes.ok) {
                const retryData = await retryRes.json();
                if (retryData.plan !== "free") {
                  setReport(retryData.report);
                  setListings(retryData.listings || []);
                  setPaidData(retryData.paidData || retryData.report?.paidData);
                  setIsPaid(true);
                  break;
                }
              }
            }
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load report");
        } finally {
          setVerifyingPayment(false);
          setLoading(false);
        }
      })();
      return;
    }

    // Fallback: load from sessionStorage (normal flow)
    const stored = sessionStorage.getItem("rivvl_home_report");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setReport(parsed.report);
        setListings(parsed.listings || []);
        setPaidData(parsed.paidData || parsed.report?.paidData);
        const storedPlan = parsed.plan;
        if (storedPlan) {
          setIsPaid(storedPlan !== "free");
        } else {
          setIsPaid(!parsed.report?.isPremium);
        }
        if (parsed.reportId) setReportId(parsed.reportId);
      } catch { /* invalid */ }
    }
    setLoading(false);
  }, [params.id, upgraded, sessionId]);

  const numProperties = report?.properties?.length ?? 2;
  const upgradeRole = numProperties <= 2 ? "home_standard" : "home_premium";
  const upgradePrice = numProperties <= 2 ? "$9.99" : "$19.99";

  const handleUpgradeCheckout = async () => {
    setUpgradeLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: upgradeRole, reportId, source: "report" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start checkout");
      if (data.url) window.location.href = data.url;
    } catch { setUpgradeLoading(false); }
  };

  const handleDownloadPdf = async () => {
    if (!reportId || pdfLoading) return;
    setPdfLoading(true);
    try {
      const res = await fetch("/api/homes/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate PDF");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `rivvl-home-comparison-${date}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate PDF.");
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        {verifyingPayment && (
          <p className="text-sm font-medium text-zinc-500">Unlocking your report...</p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-gray-100">Error Loading Report</h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-gray-400">{error}</p>
        <Link href="/compare/homes" className="mt-6 inline-flex items-center rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-zinc-800">Compare Real Estate</Link>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
        <Home className="h-12 w-12 text-zinc-300" />
        <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-gray-100">No Report Found</h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-gray-400">Generate a comparison report first to view results here.</p>
        <Link href="/compare/homes" className="mt-6 inline-flex items-center rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-zinc-800">Compare Real Estate</Link>
      </div>
    );
  }

  const properties = report.properties;

  // Short address helper
  const shortAddr = (addr: string) => {
    const s = addr.split(",")[0];
    return s.length > 25 ? s.slice(0, 25) + "..." : s;
  };

  // ─── Score bar chart data ───
  const categories = ["Overall", "Price", "Location", "Value", "Risk"];
  const scoreKeys: (keyof PropertyAnalysis)[] = ["overallScore", "priceScore", "locationScore", "valueScore", "riskScore"];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _barChartData = categories.map((cat, ci) => {
    const row: Record<string, unknown> = { category: cat };
    properties.forEach((p, pi) => {
      const val = p[scoreKeys[ci]];
      row[`p${pi}`] = val ?? 0;
    });
    return row;
  });

  // Financial snapshot data
  const financialData = listings.map((l, i) => {
    const price = l?.price ?? 0;
    const mortgage = price > 0 ? estimateMonthlyMortgage(price) : 0;
    const hoaStatus = l?.hoaStatus ?? 'not_listed';
    const hoa = hoaStatus === 'confirmed' ? (l?.hoaFee ?? 0) : 0;
    const tax = price > 0 ? estimatePropertyTax(price) : 0;
    const insurance = Math.round(price * 0.004 / 12);
    return {
      address: properties[i]?.address ?? `Property ${i + 1}`,
      shortAddr: shortAddr(properties[i]?.address ?? `Property ${i + 1}`),
      mortgage,
      hoa,
      tax,
      insurance,
      total: mortgage + hoa + tax + insurance,
      pricePerSqft: l?.pricePerSqft ?? null,
      price,
      downPayment: Math.round(price * 0.2),
      loanAmount: Math.round(price * 0.8),
      fiveYearCost: (mortgage + hoa + tax + insurance) * 60,
      equityAfter5Years: Math.round(price * 0.8 * 0.03 * 5 + price * 0.2), // simplified
    };
  });

  // TOC items — only rendered if the section has data
  const tocItems: { id: string; label: string; show: boolean; nested?: boolean; paidOnly?: boolean }[] = [
    { id: "executive-summary", label: "Executive Summary", show: true },
    { id: "score-dashboard", label: "Score Dashboard", show: true },
    { id: "red-flags", label: "Red Flags", show: !!(report.redFlags && report.redFlags.length > 0) },
    { id: "key-facts", label: "Key Facts", show: true },
    { id: "pros-cons", label: "Pros and Cons", show: true },
    { id: "financial-breakdown", label: "Financial Breakdown", show: true },
    { id: "closing-costs", label: "Closing Costs", show: !!(report.closingCosts && report.closingCosts.some(cc => cc !== null)), nested: true, paidOnly: true },
    { id: "insurance-estimate", label: "Insurance Estimate", show: !!(report.insuranceEstimate && report.insuranceEstimate.some(ins => ins !== null)), nested: true, paidOnly: true },
    { id: "loan-programs", label: "Loan Programs", show: !!(report.loanPrograms && report.loanPrograms.some(lp => lp !== null)), nested: true, paidOnly: true },
    { id: "tax-reassessment", label: "Tax Reassessment", show: !!(report.taxReassessment && report.taxReassessment.some(tr => tr !== null)), nested: true, paidOnly: true },
    { id: "hoa-risk", label: "HOA Risk", show: true, paidOnly: true },
    { id: "negotiation-intelligence", label: "Negotiation Intelligence", show: true, paidOnly: true },
    { id: "neighborhood", label: "Neighborhood Intelligence", show: true, paidOnly: true },
    { id: "schools", label: "School District", show: true, paidOnly: true },
    { id: "safety-crime", label: "Safety and Crime", show: true, paidOnly: true },
    { id: "price-history", label: "Price and Transaction History", show: isPaid ? !!(listings.some(l => (l.priceHistory && l.priceHistory.length > 0) || l.lastSalePrice != null) || (paidData?.priceHistory && paidData.priceHistory.some(p => p !== null))) : true, paidOnly: true },
    { id: "maintenance-analysis", label: "Maintenance Analysis", show: isPaid ? !!(report.maintenanceAnalysis && report.maintenanceAnalysis.length > 0) : true, paidOnly: true },
    { id: "investment-outlook", label: "Investment Outlook", show: isPaid ? !!(report.investmentOutlook || report.investmentPerspective) : true, paidOnly: true },
    { id: "side-by-side", label: "Detailed Comparison", show: isPaid ? !!(report.detailedComparison && report.detailedComparison.length > 0) : true, paidOnly: true },
    { id: "buyer-checklist", label: "Buyer Checklist", show: true, paidOnly: true },
    { id: "questions-to-ask", label: "Questions to Ask", show: true, paidOnly: true },
    { id: "our-pick", label: "Our Pick", show: isPaid ? !!(report.ourPick) : true, paidOnly: true },
    { id: "listing-agent", label: "Listing Agent Info", show: true, paidOnly: true },
  ];

  const visibleTocItems = tocItems.filter(t => t.show);

  return (
    <div className="min-h-screen bg-mesh-gradient">
    <div className="flex flex-row gap-8 max-w-screen-xl mx-auto px-4 py-10 sm:py-16">
      {/* ═══ SIDEBAR TABLE OF CONTENTS ═══ */}
      <nav className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24 glass-morphism rounded-3xl p-6 shadow-xl border border-border">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-400 mb-6 px-2">Analysis Index</p>
          <ul className="space-y-0.5">
            {visibleTocItems.map((item) => {
              const isActive = activeSection === item.id;
              const isLocked = !isPaid && item.paidOnly;
              return (
                <li key={item.id}>
                  <a
                    href={isLocked ? undefined : `#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      if (isLocked) return;
                      const el = document.getElementById(item.id);
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className={`block rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-3 transition-all duration-300 ${
                      item.nested ? "pl-6 pr-2.5" : "px-3"
                    } ${
                      isLocked
                        ? "text-muted-foreground/30 cursor-default"
                        : isActive
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-primary"
                    }`}
                  >
                    {item.nested && <span className="h-1 w-1 rounded-full bg-current opacity-30" />}
                    {isLocked && <Lock className="h-3 w-3 flex-shrink-0 opacity-40" />}
                    <span>{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* ═══ MAIN REPORT CONTENT ═══ */}
      <div className="flex-1 min-w-0">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/compare/homes" className="inline-flex items-center gap-1.5 text-sm font-black uppercase tracking-widest text-muted-foreground transition-all hover:text-primary dark:text-gray-400 hover:scale-[1.02] active:scale-[0.98]">
          <ArrowLeft className="h-4 w-4" />
          New Comparison
        </Link>
        {reportId && (
          <Button
            onClick={handleDownloadPdf}
            loading={pdfLoading}
            loadingText="Generating..."
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-2 text-xs font-black uppercase tracking-[0.2em] text-primary-foreground transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
          >
            {!pdfLoading && <Download className="h-4 w-4" />}
            Download PDF
          </Button>
        )}
      </div>

      {/* ─── SECTION 1: REPORT HEADER + EXECUTIVE SUMMARY ─── */}
      <div id="executive-summary" data-toc-section className="scroll-mt-24 report-card p-10 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -mr-40 -mt-40" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest text-primary">Comprehensive Analysis</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter uppercase leading-[0.9]">
                Real Estate <br /><span className="text-primary italic">Intelligence</span>
              </h1>
              <p className="text-sm text-zinc-500 font-medium opacity-60 uppercase tracking-widest">
                Generated Signature • {new Date(report.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3 max-w-md">
              {properties.map((p, i) => (
                <div key={i} className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 shadow-sm backdrop-blur-sm">
                  <div className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ backgroundColor: PROPERTY_COLORS[i] }} />
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 truncate max-w-[150px]">{p.address}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-zinc-200/0 via-zinc-200 to-zinc-200/0 dark:via-zinc-800 mb-10" />

          {isPaid && report.property1Summary && report.property2Summary ? (
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-8 transition-all hover:bg-white dark:hover:bg-zinc-800 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-1 w-10 rounded-full bg-zinc-900" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Property Alpha</h4>
                </div>
                <p className="text-base leading-relaxed text-zinc-900 dark:text-zinc-200 font-medium italic">&quot;{report.property1Summary}&quot;</p>
              </div>
              <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-8 transition-all hover:bg-white dark:hover:bg-zinc-800 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-1 w-10 rounded-full bg-zinc-500" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">Property Beta</h4>
                </div>
                <p className="text-base leading-relaxed text-zinc-900 dark:text-zinc-200 font-medium italic">&quot;{report.property2Summary}&quot;</p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-primary/5 p-10 border border-primary/10">
              {isPaid ? (
                <p className="text-base leading-relaxed text-zinc-900 dark:text-zinc-200 italic font-medium text-center max-w-3xl mx-auto">&quot;{report.summary}&quot;</p>
              ) : (
                <div className="flex flex-col items-center text-center max-w-2xl mx-auto py-4">
                  <p className="text-sm leading-relaxed text-zinc-500 mb-10">
                    {report.summary.split(/(?<=[.!?])\s+/).slice(0, 1).join(" ")}...
                  </p>
                  <div className="flex flex-col items-center gap-8">
                    <div className="flex -space-x-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-14 w-14 rounded-full bg-zinc-100 dark:bg-zinc-800 border-4 border-white dark:border-zinc-900 flex items-center justify-center text-zinc-400 shadow-lg">
                          <Lock className="h-6 w-6" />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-6">
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Unlock Full Investment Intelligence</p>
                      <Button
                        onClick={handleUpgradeCheckout}
                        loading={upgradeLoading}
                        className="h-16 px-12 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/30 hover:shadow-primary/40 transition-all hover:-tranzinc-y-1 active:tranzinc-y-0"
                      >
                        {upgradeLoading ? "Preparing Intelligence..." : `Upgrade Now: ${upgradePrice}`}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── SECTION 2: SCORE DASHBOARD ─── */}
      <div id="score-dashboard" data-toc-section className="mt-12 scroll-mt-24 report-card overflow-hidden">
        {/* Header (Already using gradient style) */}
        <div className="bg-gradient-to-r from-zinc-800 to-zinc-950 p-8 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-110" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800/50 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                <BarChart3 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight leading-tight">Investment Performance</h3>
                <p className="text-xs font-bold text-white/70 tracking-widest mt-1 italic font-bold text-white/70">Vanguard Metrics & Competitive Indexing</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-10">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left: Score Comparison */}
            <div className="lg:col-span-1 report-card bg-zinc-50 dark:bg-zinc-800/20 border-zinc-100 dark:border-zinc-800 p-8 shadow-inner">
              <div className="flex items-center gap-2 mb-8">
                <Target className="w-5 h-5 text-primary" />
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900">Performance Index</h4>
              </div>
              <div className="flex flex-col items-center gap-12 py-4">
                <ScoreGauge score={report.property1OverallScore ?? null} label="Property Alpha" isWinner={report.property1OverallScore! > report.property2OverallScore!} />
                <div className="h-px w-20 bg-zinc-200 dark:bg-zinc-800" />
                <ScoreGauge score={report.property2OverallScore ?? null} label="Property Beta" isWinner={report.property2OverallScore! > report.property1OverallScore!} />
              </div>
            </div>

            {/* Right: Detailed Breakdown */}
            <div className="lg:col-span-2 space-y-8">
              <div className="report-card bg-zinc-50 dark:bg-zinc-800/20 border-zinc-100 dark:border-zinc-800 p-8">
                <div className="flex items-center gap-2 mb-8">
                  <Activity className="w-5 h-5 text-primary" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-600">Dimensional Analysis</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800">
                        <th className="py-4 text-left text-xs font-black uppercase tracking-widest text-zinc-500">Metric</th>
                        <th className="py-4 px-4 text-center text-xs font-black uppercase tracking-widest text-zinc-900">Alpha</th>
                        <th className="py-4 px-4 text-center text-xs font-black uppercase tracking-widest text-zinc-500">Beta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {[
                        { label: "Financial Robustness", p1: report.property1FinancialScore, p2: report.property2FinancialScore },
                        { label: "Market Appreciation", p1: report.property1LocationScore, p2: report.property2LocationScore },
                        { label: "Structural Integrity", p1: report.property1StructuralScore, p2: report.property2StructuralScore },
                        { label: "Community & Lifestyle", p1: report.property1LifestyleScore, p2: report.property2LifestyleScore },
                        { label: "Risk Mitigation", p1: report.property1RiskScore, p2: report.property2RiskScore },
                      ].map((row, i) => (
                        <tr key={i} className="group hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="py-5 text-sm font-bold text-zinc-900 dark:text-zinc-200">{row.label}</td>
                          <td className="py-5 px-4 text-center">
                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-black text-sm border-2 ${
                              row.p1 && row.p1 >= 8 ? "bg-green-50 text-green-600 border-green-200" :
                              row.p1 && row.p1 >= 6 ? "bg-yellow-50 text-yellow-600 border-yellow-200" :
                              "bg-zinc-50 text-zinc-600 border-zinc-200"
                            }`}>
                              {row.p1 || "—"}
                            </span>
                          </td>
                          <td className="py-5 px-4 text-center">
                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-black text-sm border-2 ${
                              row.p2 && row.p2 >= 8 ? "bg-green-50 text-green-600 border-green-200" :
                              row.p2 && row.p2 >= 6 ? "bg-yellow-50 text-yellow-600 border-yellow-200" :
                              "bg-zinc-50 text-zinc-600 border-zinc-200"
                            }`}>
                              {row.p2 || "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Explanatory Note */}
              <div className="p-8 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-800 dark:border dark:border-zinc-700 shadow-xl relative overflow-hidden group">
                <Zap className="absolute top-4 right-4 text-yellow-400 w-8 h-8 opacity-20 group-hover:scale-110 transition-transform" />
                <h5 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-400" />
                  Algorithm Logic
                </h5>
                <p className="text-sm leading-relaxed text-zinc-300 font-medium italic">
                  Scores are calculated using a proprietary 142-point vector analysis, weighting public records, market trends, and risk indices to provide a standardized investment comparison.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── RED FLAGS IN THIS LISTING (Sprint 1, Feature 5) ─── */}
      {report.redFlags && report.redFlags.length > 0 ? (
        isPaid ? (
          <section id="red-flags" data-toc-section className="mt-12 scroll-mt-24">
            <div className="glass-morphism rounded-3xl border border-red-500/30 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-zinc-800/10 to-transparent px-8 py-6 border-b border-zinc-800/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-600/20">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-widest text-red-600">Red Flags Matrix</h2>
                </div>
              </div>
              <div className="p-8">
                <div className={`grid gap-6 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                  {report.redFlags.map((rf, ri) => (
                    <div key={ri} className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[ri] }} />
                        <span className="text-xs font-black uppercase tracking-widest text-foreground truncate">{shortAddr(properties[ri]?.address ?? `Prop ${ri + 1}`)}</span>
                      </div>
                      {rf.noFlagsDetected ? (
                        <div className="flex items-center gap-2 rounded-xl bg-green-50/5 dark:bg-green-500/5 border border-green-500/20 px-4 py-3">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-xs font-black uppercase tracking-wider text-green-600">Secure: No major flags</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {rf.rulesFlags.map((flag, fi) => (
                            <div key={`rule-${fi}`} className={`group relative rounded-xl border-l-4 p-4 transition-all hover:tranzinc-x-1 ${flag.severity === "red" ? "border-l-red-500 bg-red-50/50 dark:bg-red-900/20" : "border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/20"}`}>
                              <p className={`text-xs font-black leading-relaxed ${flag.severity === "red" ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"}`}>{flag.text}</p>
                            </div>
                          ))}
                          {rf.aiRedFlags.map((flag, fi) => (
                            <div key={`ai-${fi}`} className="group relative rounded-xl border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/20 p-4 transition-all hover:tranzinc-x-1">
                              <p className="text-xs font-black leading-relaxed text-amber-700 dark:text-amber-400">{flag}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section id="red-flags" data-toc-section className="mt-12 scroll-mt-24">
            <div className="glass-morphism rounded-3xl border border-border/50 shadow-xl overflow-hidden relative">
              <div className="bg-muted px-8 py-6 border-b border-border/50 opacity-40">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5" />
                  <h2 className="text-xl font-black uppercase tracking-widest text-foreground">Red Flags Matrix</h2>
                </div>
              </div>
              <div className="p-8 blur-[8px] pointer-events-none select-none">
                <div className="grid gap-6 lg:grid-cols-2">
                  {[1, 2].map(n => (
                    <div key={n} className="rounded-xl border-l-4 border-l-amber-400 bg-amber-50 px-4 py-3">
                      <p className="text-xs text-amber-300">Placeholder for flag analytics</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 dark:bg-background/60 backdrop-blur-sm transition-all group-hover:bg-white/30">
                <div className="mb-4 rounded-2xl bg-white p-4 shadow-2xl dark:bg-zinc-900 border border-border">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-black text-foreground mb-1">Unlock Threat Assessment</h3>
                <p className="text-xs text-muted-foreground mb-6">Identify potential dealbreakers before they surface in escrow.</p>
                <button onClick={handleUpgradeCheckout} disabled={upgradeLoading} className="h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  {upgradeLoading ? "Preparing..." : `Unlock Analysis: ${upgradePrice}`}
                </button>
              </div>
            </div>
          </section>
        )
      ) : null}

      {/* ─── SECTION 3: KEY FACTS TABLE ─── */}
      {/* ─── SECTION 3: KEY FACTS TABLE ─── */}
      <section id="key-facts" data-toc-section className="mt-12 scroll-mt-24 report-card overflow-hidden">
        <div className="bg-zinc-900 p-8 text-white relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight leading-tight">Specifications Matrix</h2>
              <p className="text-xs font-bold text-white/50 uppercase tracking-widest mt-1">Cross-Property Technical Audit</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/80 border-b border-border">
                <th className="px-8 py-5 text-left text-xs font-black uppercase tracking-[0.1em] text-zinc-500 whitespace-nowrap">Analytical Vector</th>
                {properties.map((p, i) => (
                  <th key={i} className="px-6 py-5 text-center text-xs font-black uppercase tracking-[0.1em] text-zinc-500 min-w-[200px]">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[i] }} />
                      {shortAddr(p.address)}
                    </div>
                  </th>
                ))}
                <th className="px-6 py-5 text-center text-xs font-black uppercase tracking-[0.1em] text-primary">Alpha Advantage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {(() => {
                const allRows = buildComparisonRows(properties, listings, isPaid);
                const FREE_ROW_LABELS = ["Price", "Bedrooms", "Bathrooms", "Square Feet"];
                return allRows.map((row, ri) => {
                  const isFreeVisible = isPaid || FREE_ROW_LABELS.includes(row.label);
                  return (
                    <tr key={ri} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="px-8 py-5 text-xs font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                        {!isFreeVisible && <Lock className="inline h-3 w-3 mr-2 opacity-50 text-primary" />}
                        {row.label}
                      </td>
                      {row.values.map((val, vi) => {
                        const isHoaWarning = row.label === "HOA Fee" && val.includes("Not listed");
                        const isBest = row.bestIndex === vi;
                        return (
                          <td key={vi} className={`px-6 py-5 text-center text-sm transition-all duration-300 ${!isFreeVisible ? "text-zinc-300 dark:text-zinc-700 select-none blur-[6px]" : isHoaWarning ? "text-amber-500 font-bold" : isBest ? "bg-primary/5 text-primary font-black scale-105" : "text-zinc-900 dark:text-zinc-100 font-medium"}`}>
                            {val}
                          </td>
                        );
                      })}
                      <td className="px-6 py-5 text-center">
                        {!isFreeVisible ? (
                          <div className="flex justify-center opacity-20"><Lock className="h-4 w-4 text-zinc-400" /></div>
                        ) : row.bestIndex !== null ? (
                          <div className="flex justify-center"><Check className="h-5 w-5 text-green-500 font-black" /></div>
                        ) : (
                          <span className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Tie</span>
                        )}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
        {!isPaid && (
          <div className="p-8 bg-zinc-50 dark:bg-zinc-800/40 border-t border-border flex flex-col items-center gap-4">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-[0.15em]">🔒 +6 more data points available in full intelligence report</span>
            <Button 
                onClick={handleUpgradeCheckout} 
                loading={upgradeLoading} 
                className="h-12 px-10 rounded-xl bg-zinc-900 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-zinc-900/20 hover:scale-[1.05] transition-all"
            >
              {upgradeLoading ? "Authorizing..." : `Unlock Complete Matrix: ${upgradePrice}`}
            </Button>
          </div>
        )}
      </section>

      {/* ─── SECTION 4: PROS AND CONS ─── */}
      <section id="pros-cons" data-toc-section className="mt-12 scroll-mt-24">
        <div className="report-card overflow-hidden mb-8">
          <div className="bg-zinc-900 px-8 py-6 text-white border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-lg shadow-zinc-900/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">Competitive Advantage</h2>
                <p className="text-xs font-bold text-white/50 tracking-widest mt-0.5 font-bold text-white/50">Aggregate Sentiment Intelligence</p>
              </div>
            </div>
          </div>
          <div className="p-10">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={properties.map((p, i) => ({ name: shortAddr(p.address), score: p.overallScore, fill: PROPERTY_COLORS[i] }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.05} horizontal={false} />
                  <XAxis type="number" domain={[0, 10]} hide />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fontWeight: 900, fill: "currentColor", opacity: 0.7 }} width={120} />
                  <Tooltip 
                    cursor={{ fill: 'currentColor', opacity: 0.05 }}
                    contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '16px', border: '1px solid var(--border)', fontSize: '12px', fontWeight: 900, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="score" name="Intelligence Index" barSize={24} radius={[0, 8, 8, 0]}>
                    {properties.map((_, i) => (
                      <Cell key={i} fill={PROPERTY_COLORS[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className={`grid gap-8 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
          {properties.map((p, i) => {
            const visiblePros = isPaid ? p.pros : p.pros.slice(0, 1);
            const hiddenPros = isPaid ? [] : p.pros.slice(1);
            const visibleCons = isPaid ? p.cons : p.cons.slice(0, 1);
            const hiddenCons = isPaid ? [] : p.cons.slice(1);
            return (
              <div key={i} className="report-card p-8 group transition-all duration-500 hover:shadow-2xl hover:-tranzinc-y-1">
                <div className="flex items-center gap-3 mb-8 border-b border-border/50 pb-6">
                  <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[i] }} />
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100 truncate" title={p.address}>{shortAddr(p.address)}</h3>
                </div>
                
                <div className="space-y-8">
                  {/* Pros */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-green-500">Value Drivers</p>
                      <div className="h-px flex-grow bg-green-500/10" />
                    </div>
                    <div className="space-y-3">
                      {visiblePros.map((pro, pi) => (
                        <div key={pi} className="flex items-start gap-3 group/item">
                          <div className="mt-1 h-5 w-5 flex items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20 text-green-500 border border-green-100 dark:border-green-900/30">
                            <Check className="h-3 w-3 font-black" />
                          </div>
                          <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 leading-relaxed uppercase tracking-tight italic">{pro}</span>
                        </div>
                      ))}
                      {!isPaid && hiddenPros.length > 0 && (
                        <div className="flex items-start gap-3 opacity-30 select-none blur-[2px]">
                          <div className="mt-1 h-5 w-5 flex items-center justify-center rounded-full bg-zinc-100 border border-zinc-200">
                            <Lock className="h-2 w-2" />
                          </div>
                          <span className="text-sm font-medium">Standard analytical catalyst secured</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cons */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-red-500">Risk Vectors</p>
                      <div className="h-px flex-grow bg-red-500/10" />
                    </div>
                    <div className="space-y-3">
                      {visibleCons.map((con, ci) => (
                        <div key={ci} className="flex items-start gap-3 group/item">
                          <div className="mt-1 h-5 w-5 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-100 dark:border-red-900/30">
                            <X className="h-3 w-3 font-black" />
                          </div>
                          <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 leading-relaxed uppercase tracking-tight italic">{con}</span>
                        </div>
                      ))}
                      {!isPaid && hiddenCons.length > 0 && (
                        <div className="flex items-start gap-3 opacity-30 select-none blur-[2px]">
                          <div className="mt-1 h-5 w-5 flex items-center justify-center rounded-full bg-zinc-100 border border-zinc-200">
                            <Lock className="h-2 w-2" />
                          </div>
                          <span className="text-sm font-medium">Critical liability assessment locked</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── SECTION 5: RISK REPORT (always visible — rivvl differentiator) ─── */}
      {/* ─── SECTION 5: RISK REPORT (always visible — rivvl differentiator) ─── */}
      <section id="risk-report" data-toc-section className="mt-12 scroll-mt-24 report-card overflow-hidden">
        <div className="bg-gradient-to-r from-zinc-800 to-zinc-950 px-8 py-8 text-white relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000" />
          <div className="relative z-10 flex items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-inner">
              <Shield className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight leading-none uppercase">Risk Exposure</h2>
              <p className="text-xs font-bold text-white/70 tracking-widest mt-1.5 italic">Environmental & Safety Threat Matrix</p>
            </div>
          </div>
        </div>
        <div className="p-10">
          <div className="mb-10 p-5 rounded-2xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 flex items-start gap-4 shadow-sm">
            <div className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
            <p className="text-xs font-bold tracking-wide text-orange-700 dark:text-orange-400 leading-relaxed">
              Intelligence Summary: rivvl surfaces underlying environmental and safety risks often omitted in standard real estate listings for maximum transparency.
            </p>
          </div>
          
          {isPaid && (
            <div className="space-y-8">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Cross-Property Threat Comparison</h3>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(() => {
                    const riskCats = ["Flood", "Superfund", "Earthquake", "Wildfire", "Air", "Radon"];
                    return riskCats.map(cat => {
                      const row: Record<string, unknown> = { category: cat };
                      properties.forEach((p, pi) => {
                        if (!p.riskProfile) { row[`p${pi}`] = 0; return; }
                        const r = p.riskProfile;
                        let score = 5;
                        if (cat === "Flood") score = r.floodZone.isSFHA ? 2 : r.floodZone.riskLevel === "Low" ? 9 : 5;
                        else if (cat === "Superfund") score = r.superfundSites.count1mile > 0 ? 2 : r.superfundSites.count3mile > 0 ? 5 : 9;
                        else if (cat === "Earthquake") score = r.earthquakeRisk.riskLevel === "High" ? 2 : r.earthquakeRisk.riskLevel === "Moderate" ? 5 : 9;
                        else if (cat === "Wildfire") score = r.wildfireRisk.riskLevel === "High" || r.wildfireRisk.riskLevel === "Very High" ? 2 : r.wildfireRisk.riskLevel === "Moderate" ? 5 : 9;
                        else if (cat === "Air") { const aq = r.airQuality.score; score = aq === null ? 0 : aq < 50 ? 2 : aq <= 70 ? 5 : 9; }
                        else if (cat === "Radon") score = r.radonZone.zone === 1 ? 2 : r.radonZone.zone === 2 ? 5 : r.radonZone.zone === 3 ? 9 : 0;
                        row[`p${pi}`] = score;
                      });
                      return row;
                    });
                  })()} layout="vertical" barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.05} horizontal={false} />
                    <XAxis type="number" domain={[0, 10]} hide />
                    <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fontWeight: 900, fill: "currentColor", opacity: 0.7 }} width={80} />
                    <Tooltip 
                      cursor={{ fill: 'currentColor', opacity: 0.05 }}
                      contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '16px', border: '1px solid var(--border)', fontSize: '12px', fontWeight: 900, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    />
                    {properties.map((_, i) => (
                      <Bar key={i} dataKey={`p${i}`} name={shortAddr(properties[i].address)} fill={PROPERTY_COLORS[i]} barSize={16} radius={[0, 4, 4, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        <div className={`grid gap-8 p-10 pt-0 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
          {properties.map((p, i) => {
            const yearBuilt = listings[i]?.yearBuilt ?? null;
            const riskItems = getRiskItems(p.riskProfile, yearBuilt);
            const FREE_RISK_LABELS = ["Flood Zone", "Lead Paint Era", "Radon Zone"];
            const visibleItems = isPaid ? riskItems : riskItems.filter(item => FREE_RISK_LABELS.includes(item.label));
            const hiddenItems = isPaid ? [] : riskItems.filter(item => !FREE_RISK_LABELS.includes(item.label));

            return (
              <div key={i} className="bg-zinc-50 dark:bg-zinc-800/20 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-8 transition-all hover:bg-white dark:hover:bg-zinc-800/40 hover:shadow-xl group/card">
                <div className="flex items-center justify-between mb-8 border-b border-zinc-200 dark:border-zinc-700/50 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[i] }} />
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]" title={p.address}>{shortAddr(p.address)}</h3>
                  </div>
                  <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-border shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-tight text-zinc-400">Threat</span>
                    {p.riskScore !== null ? (
                      <span className={`text-base font-black ${
                        p.riskScore >= 7 ? "text-red-500" :
                        p.riskScore >= 4 ? "text-yellow-500" :
                        "text-green-500"
                      }`}>{p.riskScore}/10</span>
                    ) : (
                      <span className="text-base font-black text-zinc-300">N/A</span>
                    )}
                  </div>
                </div>

                <div className="grid gap-4">
                  {visibleItems.map((item, ri) => (
                    <div key={ri} className={`group/item relative rounded-2xl border-l-[6px] p-5 transition-all hover:tranzinc-x-1 shadow-sm ${item.level === 'red' ? 'border-l-red-500 bg-red-50 dark:bg-red-900/10' : item.level === 'yellow' ? 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/10' : 'border-l-green-500 bg-green-50 dark:bg-green-900/10'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={cn("transition-colors group-hover/item:scale-110 duration-300", item.level === 'red' ? 'text-red-500' : item.level === 'yellow' ? 'text-amber-500' : 'text-green-500')}>
                            {item.icon}
                          </div>
                          <span className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">{item.label}</span>
                        </div>
                        <span className="text-xs font-black text-zinc-500 uppercase tracking-tighter">{item.value}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 font-bold italic tracking-tight uppercase">&quot;{item.explanation}&quot;</p>
                    </div>
                  ))}
                  {hiddenItems.map((item, ri) => (
                    <div key={`hidden-${ri}`} className="group relative overflow-hidden rounded-2xl border border-border bg-muted/30 p-4 transition-all hover:bg-muted/50">
                      <div className="blur-[4px] opacity-20 pointer-events-none flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {item.icon}
                          <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                        </div>
                        <span className="text-xs font-black">███</span>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="h-4 w-4 text-primary opacity-40" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── SECTION 6: FINANCIAL SNAPSHOT ─── */}
      {/* ─── SECTION 6: FINANCIAL SNAPSHOT ─── */}
      <section id="financial-breakdown" data-toc-section className="mt-12 scroll-mt-24 report-card overflow-hidden">
        <div className="bg-zinc-900 border-b border-border/50 px-8 py-8 text-white relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-500/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-lg shadow-zinc-900/20">
                <DollarSign className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight leading-none">
                  {isPaid ? "Financial Intelligence" : "Financial Snapshot"}
                </h2>
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest mt-1.5 italic">
                  Complete ownership & liquidity analysis
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-8 p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 flex items-start gap-4 shadow-sm">
            <div className="mt-1 h-2.5 w-2.5 rounded-full bg-zinc-400 animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
              Basis: Estimated monthly cost of ownership calculated with a 20% down payment and 30-year fixed rate at 7.0%.
            </p>
          </div>

          {!isPaid ? (
            /* Free: mortgage visible, rest blurred */
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {financialData.map((f, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-white dark:bg-zinc-900 p-6 shadow-sm transition-all hover:shadow-md group">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[i] }} />
                      <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 truncate">{f.shortAddr}</h4>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400 uppercase">Est. Mortgage</span>
                      <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight group-hover:scale-105 transition-transform">${f.mortgage.toLocaleString()}<span className="text-xs font-bold text-zinc-400">/mo</span></span>
                    </div>
                    <p className="mt-4 text-xs font-medium text-zinc-400 uppercase tracking-tighter">Principal + Interest payments only</p>
                  </div>
                ))}
              </div>
              
              {/* Blurred teaser rows */}
              <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-border bg-white dark:bg-zinc-900 shadow-xl group/teaser">
                <div className="blur-[10px] select-none pointer-events-none opacity-40 scale-[1.01] transition-all group-hover/teaser:blur-[12px] duration-700">
                  <table className="w-full border-collapse">
                    <tbody>
                      {["HOA Fee", "Property Tax", "Insurance", "Total Monthly Cost", "5-Year Total Cost", "Equity After 5 Years"].map((label, ri) => (
                        <tr key={ri} className={`border-b border-border/30 ${ri % 2 === 0 ? "bg-white dark:bg-zinc-900" : "bg-zinc-50/50 dark:bg-zinc-800/50"}`}>
                          <td className="px-8 py-5 text-xs font-black uppercase tracking-widest text-zinc-400">{label}</td>
                          {financialData.map((_, vi) => (
                            <td key={vi} className="px-8 py-5 text-center text-xs font-black text-zinc-300">$X,XXX</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 dark:bg-black/60 backdrop-blur-[2px] p-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-zinc-900/10 flex items-center justify-center mb-6">
                    <Lock className="h-8 w-8 text-zinc-900" />
                  </div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-2">Deep Financial Liquidity Analysis</h3>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-8">
                    Unlock closing costs, specific insurance estimates, state-level loan programs, tax reassessment analysis, and real equity projections.
                  </p>
                  <Button 
                    onClick={handleUpgradeCheckout} 
                    loading={upgradeLoading} 
                    className="h-14 px-12 rounded-2xl bg-zinc-900 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-zinc-900/30 hover:scale-[1.05] transition-all"
                  >
                    {upgradeLoading ? "Authorizing Premium..." : `Unlock Full Intelligence: ${upgradePrice}`}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="overflow-x-auto rounded-2xl border border-border bg-white dark:bg-zinc-900 shadow-xl">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-zinc-900 text-white">
                      <th className="px-8 py-5 text-left text-xs font-black uppercase tracking-[0.2em]">Financial Intelligence Vector</th>
                      {financialData.map((f, i) => (
                        <th key={i} className="px-6 py-5 text-center text-xs font-black uppercase tracking-[0.2em] border-l border-white/5">
                          <div className="flex items-center justify-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[i] }} />
                            {f.shortAddr}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                    {(() => {
                      const rows: { label: string; values: string[]; isTotal?: boolean }[] = [
                        { label: "Acquisition Price", values: financialData.map(f => f.price > 0 ? `$${f.price.toLocaleString()}` : "N/A") },
                        { label: "Strategic Down Payment (20%)", values: financialData.map(f => f.price > 0 ? `$${f.downPayment.toLocaleString()}` : "N/A") },
                        { label: "Principal Loan Debt", values: financialData.map(f => f.price > 0 ? `$${f.loanAmount.toLocaleString()}` : "N/A") },
                        { label: "Debt Service (30yr Fixed @ 7%)", values: financialData.map(f => f.mortgage > 0 ? `$${f.mortgage.toLocaleString()}/mo` : "N/A") },
                        { label: "Association Assessments (HOA)", values: listings.map((l) => {
                          const status = l?.hoaStatus ?? 'not_listed';
                          if (status === 'confirmed' && l?.hoaFee != null) return `$${l.hoaFee.toLocaleString()}/mo`;
                          if (status === 'confirmed_none') return "None";
                          return "Investigation Req.";
                        }) },
                        { label: "Standard Property Taxation", values: financialData.map(f => f.tax > 0 ? `$${f.tax.toLocaleString()}/mo` : "N/A") },
                        { label: "Hazard & Liability Coverage", values: financialData.map(f => f.insurance > 0 ? `$${f.insurance.toLocaleString()}/mo` : "N/A") },
                        { label: "TOTAL CARRYING COST", values: financialData.map(f => f.total > 0 ? `$${f.total.toLocaleString()}/mo` : "N/A"), isTotal: true },
                        { label: "Projected 5-Year Ownership Basis", values: financialData.map(f => f.fiveYearCost > 0 ? `$${f.fiveYearCost.toLocaleString()}` : "N/A") },
                        { label: "Future Valuation (5yr @ 3% APR)", values: financialData.map(f => f.price > 0 ? `$${Math.round(f.price * Math.pow(1.03, 5)).toLocaleString()}` : "N/A") },
                        { label: "Net Equity Position (Year 5)", values: financialData.map(f => {
                          if (f.price <= 0) return "N/A";
                          const futureValue = Math.round(f.price * Math.pow(1.03, 5));
                          const monthlyRate = 0.07 / 12;
                          const numPayments = 360;
                          const loanAmt = f.loanAmount;
                          const paidPayments = 60;
                          const remainingBalance = Math.round(loanAmt * (Math.pow(1 + monthlyRate, numPayments) - Math.pow(1 + monthlyRate, paidPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1));
                          return `$${(futureValue - remainingBalance).toLocaleString()}`;
                        }) },
                      ];
                      return rows.map((row, ri) => (
                        <tr key={ri} className={`group hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors ${row.isTotal ? "bg-primary/5 dark:bg-primary/10" : ""}`}>
                          <td className={`px-8 py-5 text-xs uppercase tracking-wide ${row.isTotal ? "font-black text-primary" : "font-bold text-zinc-500 dark:text-zinc-400"}`}>{row.label}</td>
                          {row.values.map((val, vi) => (
                            <td key={vi} className={`px-6 py-5 text-center text-sm tabular-nums border-l border-zinc-100 dark:border-white/5 ${row.isTotal ? "font-black text-primary" : "font-medium text-zinc-900 dark:text-zinc-100"}`}>{val}</td>
                          ))}
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>

            {/* ─── CLOSING COST ESTIMATE (Sprint 1, Feature 1) ─── */}
            {report.closingCosts && report.closingCosts.some(cc => cc !== null) && (
              <div id="closing-costs" className="space-y-6 scroll-mt-24">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-lg">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">Liquidity Requirements: Closing Costs</h3>
                </div>
                <div className={`grid gap-6 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                  {report.closingCosts.map((cc, ci) => {
                    if (!cc) return (
                      <div key={ci} className="bg-zinc-50 dark:bg-zinc-800/20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 flex flex-col items-center justify-center text-center">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[ci] }} />
                          <span className="text-xs font-black uppercase tracking-widest text-zinc-400">{shortAddr(properties[ci]?.address ?? `Prop ${ci + 1}`)}</span>
                        </div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Market data unavailable for this vector</p>
                      </div>
                    );
                    return (
                    <div key={ci} className="bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-lg overflow-hidden flex flex-col transition-all hover:shadow-2xl hover:-tranzinc-y-1 duration-500">
                      <div className="px-6 py-5 border-b border-border bg-zinc-900 text-white">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[ci] }} />
                          <span className="text-xs font-black uppercase tracking-widest truncate">{shortAddr(properties[ci]?.address ?? `Property ${ci + 1}`)}</span>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <tbody className="divide-y divide-zinc-50 dark:divide-white/5">
                            {[
                              { label: "Equity Down Payment (20%)", value: cc.downPayment },
                              { label: "Lender Origination Basis (1%)", value: cc.loanOriginationFee },
                              { label: "Title & Indemnity Coverage", value: cc.titleInsurance },
                              { label: "Professional Valuation (Appraisal)", value: cc.appraisalFee },
                              { label: "Technical Home Inspection", value: cc.homeInspection },
                              { label: "Legal & Settlement Services", value: cc.attorneyFee },
                              { label: "Prepaid Pro-Rata Property Tax", value: cc.prepaidPropertyTax },
                              { label: "Hazard Insurance (Paid-in-Advance)", value: cc.firstYearInsurance },
                              { label: "Fiduciary Escrow Capitalization", value: cc.escrowSetup },
                            ].map((row, ri) => (
                              <tr key={ri} className="group hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                                <td className="px-6 py-3.5 text-[11px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-tight italic">{row.label}</td>
                                <td className="px-6 py-3.5 text-right text-xs font-black text-zinc-900 dark:text-zinc-100 tabular-nums">${row.value.toLocaleString()}</td>
                              </tr>
                            ))}
                            <tr className="bg-green-500/10 dark:bg-green-500/20">
                              <td className="px-6 py-5 text-xs font-black uppercase tracking-widest text-green-600 dark:text-green-400">Net Liquidity Required</td>
                              <td className="px-6 py-5 text-right text-base font-black text-green-600 dark:text-green-400 tabular-nums">${cc.totalCashToClose.toLocaleString()}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    );
                  })}
                </div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic text-center">Disclaimer: Estimates are modeled on national averages. Actual closing disclosures will vary based on specific lender and jurisdiction requirements.</p>
              </div>
            )}

            {/* ─── INSURANCE COST ESTIMATE (Sprint 1, Feature 2) ─── */}
            {report.insuranceEstimate && report.insuranceEstimate.some(ins => ins !== null) && (
              <div id="insurance-estimate" className="space-y-6 scroll-mt-24">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-lg">
                    <Shield className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">Liability Mitigation: Insurance Estimates</h3>
                </div>
                <div className={`grid gap-6 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                  {report.insuranceEstimate.map((ins, ii) => {
                    if (!ins) return (
                      <div key={ii} className="bg-zinc-50 dark:bg-zinc-800/20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 flex flex-col items-center justify-center text-center">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[ii] }} />
                          <span className="text-xs font-black uppercase tracking-widest text-zinc-400">{shortAddr(properties[ii]?.address ?? `Prop ${ii + 1}`)}</span>
                        </div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Insurance modeling unavailable</p>
                      </div>
                    );
                    return (
                    <div key={ii} className="bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-lg overflow-hidden flex flex-col transition-all hover:shadow-2xl hover:-tranzinc-y-1 duration-500">
                      <div className="px-6 py-5 border-b border-border bg-zinc-900 text-white">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[ii] }} />
                          <span className="text-xs font-black uppercase tracking-widest truncate">{shortAddr(properties[ii]?.address ?? `Property ${ii + 1}`)}</span>
                        </div>
                      </div>
                      <div className="p-6 space-y-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Estimated Annual Premium</p>
                            <span className="text-xs font-black text-zinc-400 tabular-nums">${ins.monthlyEstimate}/mo</span>
                          </div>
                          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-100 dark:border-white/5">
                            <p className="text-lg font-black text-zinc-900 dark:text-white tracking-tighter">${ins.annualRangeLow.toLocaleString()} – ${ins.annualRangeHigh.toLocaleString()}<span className="text-xs font-bold text-zinc-400">/yr</span></p>
                          </div>
                        </div>

                        {ins.multipliers.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500">Risk Variance Factors</p>
                            <div className="space-y-2">
                              {ins.multipliers.map((m, mi) => (
                                <div key={mi} className="flex items-start gap-2 bg-amber-500/5 rounded-lg px-3 py-2 border border-amber-500/10">
                                  <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5" />
                                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-tight italic leading-snug">{m}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {ins.floodInsuranceRequired && (
                          <div className="bg-red-500/5 rounded-xl p-4 border border-red-500/10 space-y-2">
                            <div className="flex items-center gap-2">
                              <Droplets className="h-3.5 w-3.5 text-red-500" />
                              <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Mandatory Flood Coverage (NFIP)</p>
                            </div>
                            <p className="text-base font-black text-red-600 dark:text-red-400">${ins.floodInsuranceEstimateLow?.toLocaleString()} – ${ins.floodInsuranceEstimateHigh?.toLocaleString()}<span className="text-xs font-bold">/yr</span></p>
                          </div>
                        )}

                        <div className="pt-4 border-t border-zinc-100 dark:border-white/5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Aggregate Annual Exposure</p>
                          <p className="text-xl font-black text-zinc-900 tracking-tighter dark:text-zinc-100">${ins.totalAnnualInsuranceLow.toLocaleString()} – ${ins.totalAnnualInsuranceHigh.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic text-center">Note: Insurance figures are algorithmic projections. Actual premiums are subject to underwriting, claim history, and professional inspection.</p>
              </div>
            )}

            {/* ─── FLOOD INSURANCE DETAIL (Sprint 1, Feature 7) ─── */}
            {report.floodInsurance && report.floodInsurance.length > 0 && report.floodInsurance.some(fi => fi.required || fi.floodZone === "D") && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-500 text-white shadow-lg shadow-zinc-500/20">
                    <Droplets className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">Hydrographic Risk: Flood Detail</h3>
                </div>
                <div className={`grid gap-6 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                  {report.floodInsurance.map((fi, fii) => (
                    <div key={fii} className={`report-card p-6 border-l-[6px] transition-all hover:shadow-2xl hover:-tranzinc-y-1 duration-500 ${fi.required ? "border-l-amber-500 bg-amber-500/5" : "border-l-green-500 bg-green-500/5 grayscale opacity-80"}`}>
                      <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[fii] }} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 truncate max-w-[120px]">{shortAddr(properties[fii]?.address ?? `Prop ${fii + 1}`)}</span>
                        </div>
                        <span className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${fi.required ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"}`}>
                          Zone {fi.floodZone || "Unknown"}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-tight leading-relaxed italic uppercase">&quot;{fi.note}&quot;</p>
                      {fi.estimateLow && fi.estimateHigh && fi.required && (
                        <div className="mt-6 pt-4 border-t border-border/50">
                          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Projected NFIP Premium</p>
                          <p className="text-lg font-black text-amber-600 tracking-tighter">${fi.estimateLow.toLocaleString()} – ${fi.estimateHigh.toLocaleString()}<span className="text-xs font-bold text-zinc-400">/yr</span></p>
                        </div>
                      )}
                      {fi.nfipCoverageNote && (
                        <p className="mt-3 text-[10px] font-medium text-zinc-400 dark:text-zinc-500 tracking-tighter uppercase leading-tight">{fi.nfipCoverageNote}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── FIRST-TIME BUYER LOAN PROGRAMS (Sprint 1, Feature 6) ─── */}
            {report.loanPrograms && report.loanPrograms.some(lp => lp !== null) && (
              <div id="loan-programs" className="space-y-6 scroll-mt-24">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-lg shadow-zinc-900/20">
                    <Home className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">Capital Access: Strategic Loan Programs</h3>
                </div>
                <div className={`grid gap-6 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                  {report.loanPrograms.map((lp, li) => {
                    if (!lp) return (
                      <div key={li} className="bg-zinc-50 dark:bg-zinc-800/20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 flex flex-col items-center justify-center text-center">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[li] }} />
                          <span className="text-xs font-black uppercase tracking-widest text-zinc-400">{shortAddr(properties[li]?.address ?? `Prop ${li + 1}`)}</span>
                        </div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Incentive data unavailable</p>
                      </div>
                    );
                    return (
                    <div key={li} className="bg-white dark:bg-zinc-900 rounded-3xl border border-border shadow-lg overflow-hidden flex flex-col transition-all hover:shadow-2xl hover:-tranzinc-y-1 duration-500">
                      <div className="px-6 py-5 border-b border-border bg-zinc-900 text-white">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[li] }} />
                          <span className="text-xs font-black uppercase tracking-widest truncate">{shortAddr(properties[li]?.address ?? `Property ${li + 1}`)}</span>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                              <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Institutional Instrument</th>
                              <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400">LTV Target</th>
                              <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400 underline decoration-zinc-500/30 decoration-2">P+I Est.</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                            {lp.programs.map((prog, pi) => (
                              <tr key={pi} className="group hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                                <td className="px-5 py-4">
                                  <p className="text-xs font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-tight italic">{prog.name}</p>
                                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight mt-1">{prog.keyRequirement}</p>
                                </td>
                                <td className="px-4 py-4 text-center text-xs font-bold text-zinc-700 dark:text-zinc-300 tabular-nums">{prog.minDownPayment}</td>
                                <td className="px-4 py-4 text-right text-xs font-black text-zinc-900 dark:text-zinc-100 tabular-nums underline decoration-zinc-500/10">{prog.estimatedMonthlyPayment}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="px-6 py-5 bg-zinc-500/5 dark:bg-zinc-500/10 border-t border-border">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 mb-2 px-1">Regional Catalyst: {lp.state}</p>
                        <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-tight italic bg-white dark:bg-zinc-900/50 p-3 rounded-xl border border-border/50 leading-relaxed">&quot;{lp.stateProgram}&quot;</p>
                      </div>
                    </div>
                    );
                  })}
                </div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic text-center">Eligibility is modeled on acquisition basis and regional accessibility limits. Program availability is subject to credit verification and institutional capacity limits.</p>
              </div>
            )}

            {/* ─── TAX REASSESSMENT RISK (Sprint 1, Feature 3) ─── */}
            {report.taxReassessment && report.taxReassessment.some(tr => tr !== null) && (
              <div id="tax-reassessment" className="space-y-6 scroll-mt-24">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">Fiscal Exposure: Tax Reassessment Risk</h3>
                </div>
                <div className={`grid gap-6 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                  {report.taxReassessment.map((tr, ti) => {
                    if (!tr) return (
                      <div key={ti} className="bg-zinc-50 dark:bg-zinc-800/20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 flex flex-col items-center justify-center text-center">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[ti] }} />
                          <span className="text-xs font-black uppercase tracking-widest text-zinc-400">{shortAddr(properties[ti]?.address ?? `Prop ${ti + 1}`)}</span>
                        </div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Tax risk modeling unavailable</p>
                      </div>
                    );
                    return (
                    <div key={ti} className={`bg-white dark:bg-zinc-900 rounded-2xl border transition-all hover:shadow-2xl hover:-tranzinc-y-1 duration-500 overflow-hidden ${tr.isReassessmentRisk ? "border-amber-500 shadow-lg shadow-amber-500/5" : "border-border shadow-md"}`}>
                      <div className={`px-6 py-5 border-b text-white ${tr.isReassessmentRisk ? "bg-amber-600" : "bg-zinc-900"}`}>
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[ti] }} />
                          <span className="text-xs font-black uppercase tracking-widest truncate">{shortAddr(properties[ti]?.address ?? `Property ${ti + 1}`)}</span>
                        </div>
                      </div>
                      <div className="p-6 space-y-5">
                        {tr.isReassessmentRisk && tr.assessedValue && tr.gapPercentage !== null ? (
                          <>
                            <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-2">High Variance Detected</p>
                              <p className="text-[11px] font-bold text-amber-800 dark:text-amber-200 leading-relaxed italic uppercase">
                                Listed at ${tr.listingPrice.toLocaleString()} — {tr.gapPercentage}% above current assessment of ${tr.assessedValue.toLocaleString()}.
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-100 dark:border-white/5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Current Base</p>
                                <p className="text-xs font-black text-zinc-900 dark:text-white tabular-nums">{tr.estimatedCurrentAnnualTax !== null ? `$${tr.estimatedCurrentAnnualTax.toLocaleString()}/yr` : "N/A"}</p>
                              </div>
                              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-100 dark:border-white/5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Post-Acquisition</p>
                                <p className="text-xs font-black text-zinc-900 dark:text-white tabular-nums">${tr.estimatedPostPurchaseAnnualTax.toLocaleString()}/yr</p>
                              </div>
                            </div>
                            {tr.estimatedAnnualTaxIncrease !== null && tr.estimatedAnnualTaxIncrease > 0 && (
                              <div className="flex justify-between items-center py-3 px-4 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/20">
                                <span className="text-[10px] font-black uppercase tracking-widest">Potential Escalation</span>
                                <span className="text-sm font-black tabular-nums">+${tr.estimatedAnnualTaxIncrease.toLocaleString()}/yr</span>
                              </div>
                            )}
                          </>
                        ) : tr.assessedValue ? (
                          <div className="bg-green-500/10 rounded-xl p-5 border border-green-500/20 flex items-center gap-3">
                            <ShieldCheck className="h-5 w-5 text-green-500" />
                            <p className="text-[11px] font-black text-green-700 dark:text-green-400 uppercase tracking-tight italic">Valuation Alignment: Low Reassessment Risk</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-5 border border-zinc-100 dark:border-white/5">
                              <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 leading-relaxed italic uppercase">
                                Assessment modeling based on average effective rates (1.1%) due to unavailable public records.
                              </p>
                            </div>
                            <div className="flex justify-between items-center py-4 border-t border-border/50">
                              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Algorithmic Est.</span>
                              <span className="text-sm font-black text-zinc-900 dark:text-white tabular-nums">${Math.round(tr.listingPrice * 0.011).toLocaleString()}/yr</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Total monthly cost comparison bar chart */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-lg">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">Relative Liquidity Comparison</h3>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-border p-10 shadow-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-8 text-center italic">Aggregate Monthly Ownership Liability</p>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financialData.map((f, i) => ({ name: f.shortAddr, total: f.total, fill: PROPERTY_COLORS[i] }))} layout="vertical" barCategoryGap="25%">
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.05} horizontal={false} />
                      <XAxis type="number" hide domain={[0, 'dataMax + 1000']} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fontWeight: 900, fill: "currentColor", opacity: 0.7 }} width={100} axisLine={false} tickLine={false} />
                      <Tooltip 
                        cursor={{ fill: 'currentColor', opacity: 0.05 }}
                        contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '16px', border: '1px solid var(--border)', fontSize: '12px', fontWeight: 900, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [`$${Number(value).toLocaleString()}`, "Monthly Total"]}
                      />
                      <Bar dataKey="total" radius={[0, 8, 8, 0]} barSize={32}>
                        {financialData.map((_, i) => (
                          <Cell key={i} fill={PROPERTY_COLORS[i]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic text-center max-w-2xl mx-auto leading-relaxed">Financial modeling aggregates debt service, localized taxation, and hazard coverage. Actual liability is contingent on individual credit profiles and dynamic insurance underwriting.</p>
            </div>

            <p className="text-xs text-zinc-400 italic">Monthly costs are estimates for budgeting purposes. Mortgage calculated at 7% fixed rate with 20% down payment. Property tax estimate uses 1.1% annual rate (US average). Insurance estimate based on property size. Actual figures will vary. Consult a mortgage lender for personalized quotes.</p>

            {/* FIX 4: How We Calculate This (expandable) */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50 shadow-sm">
              <button
                type="button"
                onClick={() => setShowFinancialMethodology(!showFinancialMethodology)}
                className="flex w-full items-center justify-between px-5 py-3 text-left"
              >
                <span className="text-xs font-semibold text-zinc-950 dark:text-gray-100">How We Calculate This</span>
                {showFinancialMethodology ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
              </button>
              {showFinancialMethodology && (
                <div className="px-5 pb-5 space-y-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  <div>
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300">Monthly Mortgage</p>
                    <p>Calculated using the listed purchase price, assuming 20% down payment and a 30-year fixed mortgage at 7.0% interest rate. This is a standard estimate. Actual rates vary based on your credit score, lender, and market conditions at time of purchase.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300">Property Tax</p>
                    <p>Estimated at 1.1% of the purchase price annually (the US national average effective property tax rate). Actual property taxes vary significantly by county and municipality. Check with the local tax assessor for exact figures.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300">Homeowner&#39;s Insurance</p>
                    <p>Estimated at $150-$250 per month based on property size and type. Actual insurance costs vary by location, coverage level, and insurer.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300">5-Year Cost of Ownership</p>
                    <p>Sum of all estimated monthly costs multiplied by 60 months.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300">Estimated Home Value in 5 Years</p>
                    <p>Calculated assuming 3% annual appreciation, which approximates the long-term US average. Actual appreciation varies significantly by location and market conditions.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300">Estimated Equity After 5 Years</p>
                    <p>Estimated home value in 5 years minus the remaining loan balance after 5 years of payments.</p>
                  </div>
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <p className="text-xs italic">All figures are estimates for comparison and budgeting purposes only. rivvl.ai is not a mortgage lender, financial advisor, or appraiser. Always consult qualified professionals for accurate figures before making purchasing decisions.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  PAID-ONLY SECTIONS — or upgrade CTA for free users              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {isPaid ? (
        <>
          {/* ─── HOA RISK INTELLIGENCE (Sprint 1, Feature 4) ─── */}
          <section id="hoa-risk" data-toc-section className="mt-12 scroll-mt-24 report-card overflow-hidden">
            <div className="bg-gradient-to-r from-zinc-800 to-zinc-950 px-8 py-8 text-white relative group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000" />
              <div className="relative z-10 flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-zinc-800/50 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                  <Building2 className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight leading-none">HOA Risk Intelligence</h2>
                  <p className="text-xs font-bold text-white/70 uppercase tracking-widest mt-1.5 italic">Community Governance & Fee Sustainability Analysis</p>
                </div>
              </div>
            </div>
            
            <div className="p-10">
              <div className="mb-10 p-5 rounded-2xl bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 flex items-start gap-4 shadow-sm">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-yellow-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                <p className="text-xs font-bold tracking-wide text-yellow-700 dark:text-yellow-400 leading-relaxed italic">
                  Intelligence Summary: Analysis of fee adequacy, reserve status, and underlying community risk factors that impact long-term valuation.
                </p>
              </div>

              <div className={`grid gap-8 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                {properties.map((prop, hi) => {
                  const hoa = report.hoaRisk?.[hi] ?? null;
                  const listing = listings[hi];
                  const hoaStatus = listing?.hoaStatus ?? 'not_listed';

                  if (!hoa && hoaStatus === 'confirmed_none') {
                    return (
                      <div key={hi} className="bg-zinc-50 dark:bg-zinc-800/20 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-8 transition-all hover:bg-white dark:hover:bg-zinc-800/40 hover:shadow-xl group/card">
                        <div className="flex items-center gap-3 mb-8 border-b border-zinc-200 dark:border-zinc-700/50 pb-6">
                          <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[hi] }} />
                          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">{shortAddr(prop.address)}</h3>
                        </div>
                        <div className="rounded-2xl border-l-[6px] border-l-green-500 bg-green-50 dark:bg-green-900/10 p-6 shadow-sm">
                          <div className="flex items-center gap-3 mb-3">
                            <Check className="h-4 w-4 text-green-500" />
                            <p className="text-xs font-black text-green-700 dark:text-green-400 uppercase tracking-widest italic">Confirmed Independent</p>
                          </div>
                          <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300 leading-relaxed italic tracking-tight">
                            &quot;Physical audit of listing records confirms zero mandatory HOA affiliation for this parcel.&quot;
                          </p>
                        </div>
                      </div>
                    );
                  }

                  if (!hoa && hoaStatus !== 'confirmed_none') {
                    return (
                      <div key={hi} className="bg-zinc-50 dark:bg-zinc-800/20 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-8 transition-all hover:bg-white dark:hover:bg-zinc-800/40 hover:shadow-xl group/card">
                        <div className="flex items-center justify-between mb-8 border-b border-zinc-200 dark:border-zinc-700/50 pb-6">
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[hi] }} />
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">{shortAddr(prop.address)}</h3>
                          </div>
                          <span className="inline-flex rounded-xl px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white shadow-lg shadow-amber-500/20">Unknown</span>
                        </div>
                        <div className="rounded-2xl border-l-[6px] border-l-amber-500 bg-amber-50 dark:bg-amber-900/10 p-6 shadow-sm mb-6">
                          <div className="flex items-center gap-3 mb-3">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest italic tracking-tight">Disclosure Omission</p>
                          </div>
                          <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300 leading-relaxed italic tracking-tight">
                            &quot;HOA Fee not explicitly disclosed. High probability for {listing?.propertyType ?? 'this asset class'} requiring secondary validation.&quot;
                          </p>
                        </div>
                        <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1 italic">Discovery Protocol</p>
                          <ul className="space-y-2.5">
                            {[
                              "Does this property have an HOA? If so, what is the monthly fee?",
                              "Are there any community association fees or shared amenity costs?",
                              "What are the deed restrictions or CC&Rs for this property?",
                            ].map((q, qi) => (
                              <li key={qi} className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-start gap-3 bg-white dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-white/5 tracking-tighter">
                                <span className="text-zinc-500">{qi+1}.</span>
                                {q}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  }

                  if (hoa && hoa.monthlyFee === 0 && hoaStatus !== 'confirmed') {
                    return (
                      <div key={hi} className="bg-zinc-50 dark:bg-zinc-800/20 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-8 transition-all hover:bg-white dark:hover:bg-zinc-800/40 hover:shadow-xl group/card">
                        <div className="flex items-center justify-between mb-8 border-b border-zinc-200 dark:border-zinc-700/50 pb-6">
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[hi] }} />
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">{shortAddr(prop.address)}</h3>
                          </div>
                          <span className="inline-flex rounded-xl px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white shadow-lg shadow-amber-500/20">Liability Trace</span>
                        </div>
                        <div className="rounded-2xl border-l-[6px] border-l-amber-500 bg-amber-50 dark:bg-amber-900/10 p-6 shadow-sm mb-6 italic">
                           <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300 leading-relaxed tracking-tight italic">
                            &quot;Record mismatch detected. Listing indicates zero fee, but community infrastructure suggests mandatory assessments.&quot;
                          </p>
                        </div>
                        {hoa.riskObservations.length > 0 && (
                          <div className="mb-6 space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1 italic">Risk Indicators</p>
                            {hoa.riskObservations.map((obs, oi) => (
                              <div key={oi} className="flex items-start gap-3 bg-red-500/5 p-3 rounded-xl border border-red-500/10">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                                <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200 tracking-tighter italic leading-snug">{obs}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {hoa.agentQuestions.length > 0 && (
                          <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900 px-1 italic">Interrogation Points</p>
                            <ul className="space-y-2.5">
                              {hoa.agentQuestions.map((q, qi) => (
                                <li key={qi} className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-start gap-3 bg-white dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-white/5 uppercase tracking-tighter leading-tight">
                                  <span className="text-zinc-900">{qi+1}.</span>
                                  {q}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (!hoa) return null;
                  const riskLevel = hoa.riskLevel || 'low';
                  const riskConfig = {
                    high: { color: "bg-red-500", text: "High Threat", icon: ShieldAlert, sub: "Significant Fiscal Risk" },
                    medium: { color: "bg-amber-500", text: "Moderate Risk", icon: AlertTriangle, sub: "Notable Liabilities" },
                    low: { color: "bg-green-500", text: "Low Threat", icon: ShieldCheck, sub: "Stable Governance" }
                  }[riskLevel];

                  return (
                    <div key={hi} className="bg-zinc-50 dark:bg-zinc-800/20 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-8 transition-all hover:bg-white dark:hover:bg-zinc-800/40 hover:shadow-xl group/card">
                      <div className="flex items-center justify-between mb-8 border-b border-zinc-200 dark:border-zinc-700/50 pb-6">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[hi] }} />
                          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">{shortAddr(prop.address)}</h3>
                        </div>
                        <span className={`inline-flex rounded-xl px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${riskConfig.color}`}>
                          {riskConfig.text}
                        </span>
                      </div>

                      <div className="bg-zinc-900 rounded-2xl p-6 text-white mb-8 shadow-inner shadow-black/20">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Assessed Monthly Liability</p>
                        <p className="text-2xl font-black tracking-tighter tabular-nums">${hoa.monthlyFee.toLocaleString()}<span className="text-xs font-bold text-white/30 ml-1">/mo</span></p>
                      </div>

                      <div className="space-y-6">
                        {hoa.riskObservations.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1 italic">Intelligence Feed</p>
                            <div className="space-y-2.5">
                              {hoa.riskObservations.map((obs, oi) => (
                                <div key={oi} className="flex gap-3 bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-100 dark:border-white/5 transition-all hover:tranzinc-x-1">
                                  <riskConfig.icon className="h-4 w-4 shrink-0 mt-0.5" style={{ color: riskLevel === 'high' ? '#EF4444' : riskLevel === 'medium' ? '#F59E0B' : '#10B981' }} />
                                  <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-tight italic italic leading-relaxed">{obs}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {hoa.agentQuestions.length > 0 && (
                          <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900 px-1 italic">Validation Checklist</p>
                            <div className="space-y-2">
                              {hoa.agentQuestions.map((q, qi) => (
                                <div key={qi} className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100/30 dark:bg-zinc-800/30 px-4 py-3 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700/50 flex gap-3 uppercase tracking-tighter leading-snug italic">
                                  <span className="text-zinc-900">{qi+1}.</span>
                                  {q}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                );
              })}
            </div>
          </div>
        </section>

          {/* ─── NEGOTIATION INTELLIGENCE (paid) ─── */}
          {(() => {
            const hasNegData = report.negotiationIntelligence && report.negotiationIntelligence.length > 0;
            if (hasNegData) {
              return (
                <section id="negotiation-intelligence" data-toc-section className="mt-12 scroll-mt-24 report-card overflow-hidden">
                  <div className="bg-gradient-to-r from-zinc-800 to-zinc-950 px-8 py-8 text-white relative group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000" />
                    <div className="relative z-10 flex items-center gap-5">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-inner">
                        <Handshake className="h-7 w-7" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight leading-none">Negotiation Intelligence</h2>
                        <p className="text-xs font-bold text-white/70 uppercase tracking-widest mt-1.5 italic">Buyer Leverage & Strategic Acquisition Modeling</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-10">
                    <div className={`grid gap-8 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                      {report.negotiationIntelligence!.map((neg, ni) => {
                        const strength = neg.negotiationStrength || 'balanced';
                        const config = {
                          strong_buyer: { color: "bg-green-500", text: "Dominant Leverage", sub: "Buyer's Market" },
                          balanced: { color: "bg-amber-500", text: "Equilibrium", sub: "Balanced Market" },
                          sellers_market: { color: "bg-red-500", text: "Seller Advantage", sub: "Supply Constrained" }
                        }[strength] || { color: "bg-zinc-500", text: "Neutral", sub: "Data Limited" };

                        return (
                          <div key={ni} className="bg-zinc-50 dark:bg-zinc-800/20 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-8 transition-all hover:bg-white dark:hover:bg-zinc-800/40 hover:shadow-xl group/card">
                            <div className="flex items-center justify-between mb-8 border-b border-zinc-200 dark:border-zinc-700/50 pb-6">
                              <div className="flex items-center gap-3">
                                <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[ni] }} />
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">{shortAddr(properties[ni]?.address ?? `Prop ${ni+1}`)}</h3>
                              </div>
                              <span className={`inline-flex rounded-xl px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${config.color}`}>
                                {config.text}
                              </span>
                            </div>

                            <div className="space-y-6">
                              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-5 shadow-sm">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-900 mb-2">Market Position Analysis</p>
                                <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 leading-relaxed italic uppercase tracking-tight">&quot;{neg.marketPosition}&quot;</p>
                              </div>

                              <div className="grid grid-cols-1 gap-4">
                                <div className="bg-zinc-100/50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-white/5">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Time on Market Impact</p>
                                  <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 leading-snug uppercase tracking-tighter italic">{neg.daysOnMarketAnalysis}</p>
                                </div>
                                <div className="bg-green-500/5 dark:bg-green-500/10 p-5 rounded-2xl border border-green-500/20 shadow-inner">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-green-600 dark:text-green-400 mb-2">Suggested Delta Range</p>
                                  <p className="text-sm font-black text-green-700 dark:text-green-300 uppercase tracking-tighter leading-tight italic">{neg.suggestedOfferRange}</p>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1 italic">Tactical Concessions</p>
                                <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 tracking-tighter uppercase leading-relaxed italic">
                                  {neg.concessionOpportunities}
                                </p>
                              </div>

                              {neg.redFlags && neg.redFlags !== "None identified" && (
                                <div className="bg-red-500/10 p-4 rounded-xl border border-zinc-800/20">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-red-600 mb-1 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Risk Exposure
                                  </p>
                                  <p className="text-[11px] font-bold text-red-700 dark:text-red-400 uppercase tracking-tighter italic leading-snug">{neg.redFlags}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              );
            }
            // Fallback: generate negotiation intelligence from listing data
            return (
              <section id="negotiation-intelligence" data-toc-section className="mt-12 scroll-mt-24 report-card overflow-hidden">
                <div className="bg-gradient-to-r from-zinc-800 to-zinc-950 px-8 py-8 text-white">
                  <div className="flex items-center gap-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30">
                      <Handshake className="h-7 w-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tight leading-none">Negotiation Intelligence</h2>
                      <p className="text-xs font-bold text-white/70 uppercase tracking-widest mt-1.5 italic">Algorithmic Leverage Modeling</p>
                    </div>
                  </div>
                </div>

                <div className="p-10">
                  <div className={`grid gap-8 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                    {properties.map((prop, pi) => {
                      const listing = listings[pi];
                      const dom = listing?.daysOnMarket ?? null;
                      const reductions = listing?.priceHistory?.filter(e => e.event === "Price Reduced") ?? [];
                      const strength = dom !== null ? (dom > 90 ? "strong_buyer" : dom > 30 ? "balanced" : "sellers_market") : "balanced";
                      const config = {
                        strong_buyer: { color: "bg-green-500", text: "Dominant Leverage", sub: "Buyer High" },
                        balanced: { color: "bg-amber-500", text: "Market Equilibrium", sub: "Balanced" },
                        sellers_market: { color: "bg-red-500", text: "Seller Advantage", sub: "High Demand" }
                      }[strength];
                      
                      const price = listing?.price ?? 0;
                      const offerLow = dom !== null && dom > 90 ? Math.round(price * 0.92) : dom !== null && dom > 45 ? Math.round(price * 0.95) : dom !== null && dom > 30 ? Math.round(price * 0.97) : Math.round(price * 0.98);
                      const offerHigh = dom !== null && dom > 90 ? Math.round(price * 0.97) : dom !== null && dom > 45 ? Math.round(price * 0.98) : price;

                      return (
                        <div key={pi} className="bg-zinc-50 dark:bg-zinc-800/20 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-8 transition-all hover:bg-white dark:hover:bg-zinc-800/40 hover:shadow-xl group/card">
                          <div className="flex items-center justify-between mb-8 border-b border-zinc-200 dark:border-zinc-700/50 pb-6">
                            <div className="flex items-center gap-3">
                              <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[pi] }} />
                              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">{shortAddr(prop.address)}</h3>
                            </div>
                            <span className={`inline-flex rounded-xl px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${config.color}`}>
                              {config.text}
                            </span>
                          </div>

                          <div className="space-y-6">
                            <div className="bg-zinc-900 rounded-2xl p-6 text-white mb-6 shadow-inner">
                              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Time Exposure Coefficient</p>
                              <p className="text-2xl font-black tracking-tighter tabular-nums">{dom !== null ? dom : 'N/A'}<span className="text-xs font-bold text-white/30 ml-1">days on market</span></p>
                            </div>

                            <div className="space-y-4">
                              <div className="bg-zinc-100/50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-white/5">
                                <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 leading-snug uppercase tracking-tighter italic">
                                  {dom !== null
                                    ? `&quot;Exposure of ${dom} days indicates ${dom > 90 ? "critical negotiation window; high liquidity-driven leverage identified." : dom > 45 ? "moderate stale-listing discount potential." : "early stage listing; limited downward mobility."}&quot;`
                                    : "Days on market analysis not available. Historical patterns suggest standard regional baseline."}
                                </p>
                              </div>

                              {price > 0 && (
                                <div className="bg-green-500/5 dark:bg-green-500/10 p-5 rounded-2xl border border-green-500/20 shadow-inner">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-green-600 dark:text-green-400 mb-2">Algorithmic Target Range</p>
                                  <p className="text-sm font-black text-green-700 dark:text-green-300 uppercase tracking-tighter tabular-nums tracking-wide">
                                    ${offerLow.toLocaleString()} – ${offerHigh.toLocaleString()}
                                  </p>
                                </div>
                              )}

                              <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900 px-1 italic">Structural Liquidity Signal</p>
                                <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 tracking-tighter uppercase leading-relaxed italic">
                                  {reductions.length > 0
                                    ? `Detected ${reductions.length} downward price adjustment(s). Seller motivation coefficient: Extreme. Pursue appraisal gaps & CC credits.`
                                    : "Zero price adjustments detected. Baseline negotiations target structural inspection findings & closing credits."}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          })()}

          {/* ─── NEIGHBORHOOD INTELLIGENCE (paid) ─── */}
          <section id="neighborhood" data-toc-section className="mt-12 scroll-mt-24 report-card overflow-hidden">
            <div className="bg-gradient-to-r from-zinc-800 to-zinc-950 px-8 py-8 text-white relative group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000" />
              <div className="relative z-10 flex items-center gap-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                  <MapPin className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight leading-none">Geographic Intelligence</h2>
                  <p className="text-xs font-bold text-white/70 uppercase tracking-widest mt-1.5 italic">Neighborhood Dynamics & Community Profile</p>
                </div>
              </div>
            </div>

            <div className="p-10">
              {report.neighborhoodIntelligenceStructured && report.neighborhoodIntelligenceStructured.length > 0 ? (
                <div className="space-y-10">
                  <div className={`grid gap-8 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                    {report.neighborhoodIntelligenceStructured.map((data, pi) => (
                      <div key={pi} className="bg-zinc-50 dark:bg-zinc-800/20 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-8 transition-all hover:bg-white dark:hover:bg-zinc-800/40 hover:shadow-xl group/card">
                        <div className="flex items-center gap-3 mb-8 border-b border-zinc-200 dark:border-zinc-700/50 pb-6">
                          <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[pi] }} />
                          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">{shortAddr(properties[pi]?.address ?? `Prop ${pi+1}`)}</h3>
                        </div>
                        <ul className="space-y-4">
                          {data.bullets.map((bullet, bi) => (
                            <li key={bi} className="flex items-start gap-4 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-tight leading-relaxed italic">
                              <span className="mt-1 h-2 w-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: PROPERTY_COLORS[pi] }} />
                              &quot;{bullet}&quot;
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  {report.neighborhoodIntelligenceStructured[0]?.verdict && (
                    <div className="p-6 rounded-2xl bg-zinc-900/5 border border-zinc-900/20 flex items-start gap-4 shadow-sm">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-zinc-900 animate-pulse" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900 mb-1">Comparative Verdict</p>
                        <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-tighter leading-relaxed italic">{report.neighborhoodIntelligenceStructured[0].verdict}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-zinc-50 dark:bg-zinc-800/20 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
                  <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest leading-relaxed max-w-2xl mx-auto italic">
                    {report.neighborhoodIntelligence || "Regional demographic and baseline community profiling data not available for this specific coordinate set."}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ─── NEARBY SCHOOLS (paid, real data) ─── */}
          {isPaid && paidData?.schools && paidData.schools.some(s => s.length > 0) ? (
            <section id="schools" data-toc-section className="mt-12 scroll-mt-24 report-card overflow-hidden">
              <div className="bg-gradient-to-r from-zinc-800 to-zinc-950 px-8 py-8 text-white relative group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000" />
                <div className="relative z-10 flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-800/50 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                    <GraduationCap className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight leading-none">Educational Infrastructure</h2>
                    <p className="text-xs font-bold text-white/70 uppercase tracking-widest mt-1.5 italic">Institutional Proximity & NCES Registry Data</p>
                  </div>
                </div>
              </div>

              <div className="p-10">
                <div className={`grid gap-8 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                  {paidData.schools.map((schoolList, pi) => {
                    const grouped: Record<string, NearbySchool[]> = {};
                    for (const s of schoolList) {
                      if (!grouped[s.level]) grouped[s.level] = [];
                      if (grouped[s.level].length < 3) grouped[s.level].push(s);
                    }
                    const displaySchools = Object.values(grouped).flat().sort((a, b) => a.distanceMiles - b.distanceMiles).slice(0, 9);

                    return (
                      <div key={pi} className="bg-zinc-50 dark:bg-zinc-800/20 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-8 flex flex-col transition-all hover:bg-white dark:hover:bg-zinc-800/40 hover:shadow-xl">
                        <div className="flex items-center gap-3 mb-8 border-b border-zinc-200 dark:border-zinc-700/50 pb-6">
                          <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[pi] }} />
                          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">{shortAddr(properties[pi]?.address ?? `Prop ${pi+1}`)}</h3>
                        </div>
                        {displaySchools.length > 0 ? (
                          <div className="space-y-4">
                            {displaySchools.map((school, si) => {
                              const levelColor = school.level === 'Elementary' ? 'bg-zinc-700' 
                                : school.level === 'Middle' ? 'bg-green-600' 
                                : school.level === 'High' ? 'bg-zinc-500' 
                                : 'bg-zinc-400';
                              return (
                                <div key={si} className="group relative bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-100 dark:border-white/5 shadow-sm transition-all hover:tranzinc-x-1">
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-[11px] font-black uppercase tracking-tighter text-zinc-800 dark:text-zinc-200 leading-tight pr-4">{school.name}</h4>
                                    <span className={`shrink-0 rounded-lg px-2 py-1 text-[8px] font-black uppercase text-white ${levelColor} shadow-lg shadow-${levelColor.split('-')[1]}-500/20`}>
                                      {school.level}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-50 dark:border-white/5">
                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                      <MapPin className="h-3 w-3" />
                                      {school.distanceMiles}<span className="text-[8px]">mi</span>
                                    </div>
                                    <a href={school.greatSchoolsSearchUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[9px] font-black text-zinc-900 hover:underline uppercase tracking-widest">
                                      Registry <ExternalLink className="h-2.5 w-2.5" />
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-10 grayscale opacity-50">
                            <GraduationCap className="h-8 w-8 text-zinc-300 mb-3" />
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">Zero Proximity Records</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="px-10 py-6 border-t border-border bg-zinc-50/50 dark:bg-zinc-900/50">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic text-center max-w-4xl mx-auto leading-relaxed">Infrastructure data via NCES Registry. Intelligence feeds represent geographic proximity indices; boundary confirmation via jurisdictional authorities is mandatory.</p>
              </div>
            </section>
          ) : isPaid && (
            <section id="schools" data-toc-section className="mt-12 scroll-mt-24 report-card overflow-hidden">
              <div className="bg-gradient-to-r from-zinc-800 to-zinc-900 px-8 py-8 text-white">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-800/50 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                    <GraduationCap className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight leading-none">School District Context</h2>
                    <p className="text-xs font-bold text-white/70 uppercase tracking-widest mt-1.5 italic">Institutional Baseline & District Analysis</p>
                  </div>
                </div>
              </div>
              
              <div className="p-10">
                {report.schoolDistrictContextStructured && report.schoolDistrictContextStructured.length > 0 ? (
                  <div className="space-y-10">
                    <div className={`grid gap-8 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                      {report.schoolDistrictContextStructured.map((data, pi) => (
                        <div key={pi} className="bg-zinc-50 dark:bg-zinc-800/20 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-8 transition-all hover:bg-white dark:hover:bg-zinc-800/40 hover:shadow-xl group/card">
                          <div className="flex items-center gap-3 mb-8 border-b border-zinc-200 dark:border-zinc-700/50 pb-6">
                            <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[pi] }} />
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">{shortAddr(properties[pi]?.address ?? `Prop ${pi+1}`)}</h3>
                          </div>
                          <ul className="space-y-4">
                            {data.bullets.map((bullet, bi) => (
                              <li key={bi} className="flex items-start gap-4 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-tight leading-relaxed italic">
                                <span className="mt-1 h-2 w-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: PROPERTY_COLORS[pi] }} />
                                &quot;{bullet}&quot;
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    {report.schoolDistrictContextStructured[0]?.verdict && (
                      <div className="p-6 rounded-2xl bg-zinc-900/5 border border-zinc-900/20 flex items-start gap-4 shadow-sm">
                        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-zinc-900 animate-pulse" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900 mb-1">Comparative Verdict</p>
                          <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-tighter leading-relaxed italic">{report.schoolDistrictContextStructured[0].verdict}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-zinc-50 dark:bg-zinc-800/20 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
                    <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest leading-relaxed max-w-2xl mx-auto italic">
                      {report.schoolDistrictContext || "NCES district intelligence protocols not available for localized verification at this primary coordinate baseline."}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ─── SAFETY CONTEXT (paid, crime data) ─── */}
          {isPaid && paidData?.crimeData && paidData.crimeData.some(c => c !== null) ? (
            <section id="safety-crime" data-toc-section className="mt-12 scroll-mt-24 report-card overflow-hidden">
              <div className="bg-gradient-to-r from-zinc-700 to-zinc-900 px-8 py-8 text-white relative group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000" />
                <div className="relative z-10 flex items-center gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-inner">
                    <Shield className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight leading-none">Safety Context</h2>
                    <p className="text-xs font-bold text-white/70 uppercase tracking-widest mt-1.5 italic">Jurisdictional Crime Indices & FBI UCR Feed</p>
                  </div>
                </div>
              </div>

              <div className="p-10">
                <div className={`grid gap-8 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                  {paidData.crimeData.map((crime, ci) => (
                    <div key={ci} className="bg-zinc-50 dark:bg-zinc-800/20 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-8 transition-all hover:bg-white dark:hover:bg-zinc-800/40 hover:shadow-xl group/card">
                      <div className="flex items-center gap-3 mb-8 border-b border-zinc-200 dark:border-zinc-700/50 pb-6">
                        <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[ci] }} />
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">{shortAddr(properties[ci]?.address ?? `Prop ${ci+1}`)}</h3>
                      </div>
                      
                      {crime ? (
                        <div className="space-y-8">
                          {/* Violent Crime Rate */}
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 italic">Violent Index</span>
                              <span className={`inline-flex rounded-xl px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white shadow-lg ${crime.vsNationalViolent === 'below' ? 'bg-green-500' : crime.vsNationalViolent === 'above' ? 'bg-red-500' : 'bg-amber-500'}`}>
                                {crime.vsNationalViolent === 'below' ? 'Below Average' : crime.vsNationalViolent === 'above' ? 'Above Average' : 'Par'}
                              </span>
                            </div>
                            <div className="bg-zinc-900 rounded-2xl p-5 mb-4 shadow-inner">
                              <p className="text-2xl font-black tracking-tighter text-white tabular-nums leading-none">
                                {crime.violentCrimeRate.toLocaleString()}
                                <span className="text-[10px] font-bold text-white/30 ml-2 uppercase tracking-widest">/ 100k</span>
                              </p>
                            </div>
                            <div className="relative h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden shadow-inner">
                              <div className="absolute left-0 top-0 h-full transition-all duration-1000" style={{ width: `${Math.min(100, (crime.violentCrimeRate / 800) * 100)}%`, backgroundColor: crime.vsNationalViolent === 'below' ? '#10B981' : crime.vsNationalViolent === 'above' ? '#EF4444' : '#F59E0B' }} />
                              <div className="absolute top-0 h-full w-1 bg-white/50 border-x border-black/20" style={{ left: `${(380 / 800) * 100}%` }} />
                            </div>
                            <div className="flex items-center justify-between mt-2 px-1">
                              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Jurisdiction Level</p>
                              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-900">National Median (380)</p>
                            </div>
                          </div>

                          {/* Property Crime Rate */}
                          <div>
                            <div className="flex items-center justify-between mb-4 pt-4 border-t border-zinc-100 dark:border-white/5">
                              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 italic">Property Index</span>
                              <span className={`inline-flex rounded-xl px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white shadow-lg ${crime.vsNationalProperty === 'below' ? 'bg-green-500' : crime.vsNationalProperty === 'above' ? 'bg-red-500' : 'bg-amber-500'}`}>
                                {crime.vsNationalProperty === 'below' ? 'Below Average' : crime.vsNationalProperty === 'above' ? 'Above Average' : 'Par'}
                              </span>
                            </div>
                            <div className="bg-zinc-900 rounded-2xl p-5 mb-4 shadow-inner">
                              <p className="text-2xl font-black tracking-tighter text-white tabular-nums leading-none">
                                {crime.propertyCrimeRate.toLocaleString()}
                                <span className="text-[10px] font-bold text-white/30 ml-2 uppercase tracking-widest">/ 100k</span>
                              </p>
                            </div>
                            <div className="relative h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden shadow-inner">
                              <div className="absolute left-0 top-0 h-full transition-all duration-1000" style={{ width: `${Math.min(100, (crime.propertyCrimeRate / 4000) * 100)}%`, backgroundColor: crime.vsNationalProperty === 'below' ? '#10B981' : crime.vsNationalProperty === 'above' ? '#EF4444' : '#F59E0B' }} />
                              <div className="absolute top-0 h-full w-1 bg-white/50 border-x border-black/20" style={{ left: `${(2100 / 4000) * 100}%` }} />
                            </div>
                            <div className="flex items-center justify-between mt-2 px-1">
                              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Jurisdiction Level</p>
                              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-900">National Median (2,100)</p>
                            </div>
                          </div>

                          <div className="bg-zinc-100/50 dark:bg-white/5 p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700/50">
                            <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-tighter italic leading-relaxed">Intelligence Note: {crime.dataNote}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 grayscale opacity-50">
                          <AlertCircle className="h-8 w-8 text-zinc-300 mb-3" />
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">Data Retraction via FBI UCR</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-10 py-6 border-t border-border bg-zinc-50/50 dark:bg-zinc-900/50">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic text-center max-w-4xl mx-auto leading-relaxed">Statistics sourced via FBI Uniform Crime Reporting (UCR) protocols. Metrics reflect jurisdictional aggregates rather than granular parcel-level risk. Reported incidents only.</p>
              </div>
            </section>
          ) : isPaid && (
            <section id="safety-crime" data-toc-section className="mt-12 scroll-mt-24 report-card overflow-hidden">
              <div className="bg-gradient-to-r from-zinc-800 to-zinc-950 px-8 py-8 text-white">
                <div className="flex items-center gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30">
                    <Shield className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight leading-none">Safety & Crime Context</h2>
                    <p className="text-xs font-bold text-white/70 uppercase tracking-widest mt-1.5 italic">Forensic Data Retrieval Status</p>
                  </div>
                </div>
              </div>
              
              <div className="p-10">
                <div className="bg-zinc-50 dark:bg-zinc-800/20 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center max-w-4xl mx-auto">
                    {(() => {
                      const cities = Array.from(new Set(listings.map(l => l.fullAddress?.split(",")[1]?.trim()).filter(Boolean)));
                      const cityStr = cities.length > 0 ? cities.join(" and ") : "this area";
                      return (
                        <div className="space-y-6">
                          <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest leading-relaxed italic">
                            &quot;Geographic indices for {cityStr} could not be retrieved from the FBI UCR database at this primary coordinate baseline.&quot;
                          </p>
                          <div className="p-6 rounded-2xl bg-zinc-500/5 border border-zinc-500/20 text-zinc-700 dark:text-zinc-400 text-left">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3">Interrogation Protocol</p>
                            <p className="text-xs font-bold uppercase tracking-tight leading-relaxed italic italic leading-relaxed">
                              Neighborhood-specific indices require localized validation. Search &quot;{cityStr} forensic crime audit&quot; or contact municipal public record offices for updated risk modeling.
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                </div>
              </div>
              <div className="px-10 py-6 border-t border-border bg-zinc-50/50 dark:bg-zinc-900/50">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic text-center max-w-4xl mx-auto leading-relaxed">Baseline crime metrics via FBI public records and state-level forensic feeds.Parcel-level validation is mandatory via local law enforcement audits.</p>
              </div>
            </section>
          )}

          {/* ─── PRICE HISTORY (paid) ─── */}
          {isPaid && (() => {
            const hasListingHistory = listings.some(l => l.priceHistory && l.priceHistory.length > 0);
            const hasLastSale = listings.some(l => l.lastSalePrice != null);
            const hasPaidHistory = paidData?.priceHistory && paidData.priceHistory.some(p => p !== null);
            if (!hasListingHistory && !hasLastSale && !hasPaidHistory) return null;

            // Compute per-property stats for comparison table
            const propertyStats = properties.map((prop, idx) => {
              const listing = listings[idx];
              const ph = paidData?.priceHistory?.[idx];
              const events = listing?.priceHistory ?? [];
              const reductions = events.filter(e => e.event === "Price Reduced");
              const totalReduction = reductions.reduce((sum, e) => sum + (e.priceChange ? Math.abs(e.priceChange) : 0), 0);
              const lastSalePrice = listing?.lastSalePrice ?? ph?.lastSalePrice ?? null;
              const lastSaleDate = listing?.lastSaleDate ?? ph?.lastSaleDate ?? null;
              const currentPrice = listing?.price ?? null;
              const appreciation = lastSalePrice && currentPrice ? currentPrice - lastSalePrice : null;
              const appreciationPct = lastSalePrice && appreciation ? ((appreciation / lastSalePrice) * 100) : null;
              return {
                address: prop.address,
                lastSalePrice,
                lastSaleDate,
                appreciation,
                appreciationPct,
                reductionCount: reductions.length,
                totalReduction,
                daysOnMarket: listing?.daysOnMarket ?? null,
                events,
              };
            });

            return (
            <section id="price-history" data-toc-section className="mt-12 scroll-mt-24 report-card overflow-hidden">
              <div className="bg-gradient-to-r from-zinc-800 to-zinc-950 px-8 py-8 text-white relative group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000" />
                <div className="relative z-10 flex items-center gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                    <History className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight leading-none">Price Evolution Matrix</h2>
                    <p className="text-xs font-bold text-white/70 uppercase tracking-widest mt-1.5 italic">Historical Valuation & Appreciation Modeling</p>
                  </div>
                </div>
              </div>

              <div className="p-10">
                {/* Side-by-side comparison table */}
                <div className="overflow-x-auto rounded-3xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900/40 shadow-xl overflow-hidden mb-10">
                  <table className="w-full text-[11px] font-bold uppercase tracking-tighter">
                    <thead>
                      <tr className="bg-zinc-900 text-white">
                        <th className="px-6 py-5 text-left text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Valuation Metrics</th>
                        {propertyStats.map((ps, idx) => (
                          <th key={idx} className="px-6 py-5 text-left border-l border-white/5">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-6 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[idx] }} />
                              <span className="truncate max-w-[160px]">{shortAddr(ps.address)}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                      <tr>
                        <td className="px-6 py-4 text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/50 uppercase tracking-widest font-black text-[9px]">Last Sale Baseline</td>
                        {propertyStats.map((ps, idx) => (
                          <td key={idx} className="px-6 py-4 text-zinc-900 dark:text-zinc-100 tabular-nums italic font-black text-sm">
                            {ps.lastSalePrice != null ? `$${ps.lastSalePrice.toLocaleString()}` : '\u2014'}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/50 uppercase tracking-widest font-black text-[9px]">Last Sale Date</td>
                        {propertyStats.map((ps, idx) => (
                          <td key={idx} className="px-6 py-4 text-zinc-600 dark:text-zinc-400 italic">
                            {ps.lastSaleDate ? (() => { try { return new Date(ps.lastSaleDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }); } catch { return ps.lastSaleDate; } })() : '\u2014'}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/50 uppercase tracking-widest font-black text-[9px]">Total Appreciation</td>
                        {propertyStats.map((ps, idx) => {
                          const isPositive = (ps.appreciation ?? 0) >= 0;
                          return (
                            <td key={idx} className="px-6 py-4 tabular-nums italic font-black text-sm">
                              {ps.appreciation != null && ps.appreciationPct != null ? (
                                <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
                                  {isPositive ? '+' : ''}{ps.appreciationPct.toFixed(1)}%
                                </span>
                              ) : '\u2014'}
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/50 uppercase tracking-widest font-black text-[9px]">Price Cuts</td>
                        {propertyStats.map((ps, idx) => (
                          <td key={idx} className="px-6 py-4 text-zinc-600 dark:text-zinc-400 italic">
                             {ps.reductionCount > 0 ? `${ps.reductionCount} Reductions` : 'Zero adjustments'}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/50 uppercase tracking-widest font-black text-[9px] border-b-0">Days on Market</td>
                        {propertyStats.map((ps, idx) => (
                          <td key={idx} className="px-6 py-4 text-zinc-900 dark:text-zinc-100 italic font-black text-sm border-b-0">
                            {ps.daysOnMarket != null ? `${ps.daysOnMarket} Days` : 'Unknown'}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* AI narrative comparison */}
                {report.priceHistoryComparison && (
                  <div className="mb-10 p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-white/5 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900 mb-3 px-1 italic">Trend Synthesis</p>
                    <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-tighter leading-relaxed italic">&quot;{report.priceHistoryComparison}&quot;</p>
                  </div>
                )}

                {/* Per-property sales history and insights */}
                <div className={`grid gap-8 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                  {properties.map((prop, idx) => {
                    const listing = listings[idx];
                    const events = listing?.priceHistory?.slice(0, 8) ?? [];
                    const insights = report.priceHistoryInsights?.[idx] ?? [];
                    const ph = paidData?.priceHistory?.[idx];
                    const lastSalePrice = listing?.lastSalePrice ?? ph?.lastSalePrice ?? null;
                    const lastSaleDate = listing?.lastSaleDate ?? ph?.lastSaleDate ?? null;

                    return (
                      <div key={idx} className="bg-zinc-50 dark:bg-zinc-800/20 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-8 flex flex-col transition-all hover:bg-white dark:hover:bg-zinc-800/40 hover:shadow-xl group/card">
                        <div className="flex items-center gap-3 mb-8 border-b border-zinc-200 dark:border-zinc-700/50 pb-6">
                          <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[idx] }} />
                          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">{shortAddr(prop.address)}</h3>
                        </div>

                        {/* Sales History Feed */}
                        <div className="space-y-4 mb-8">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1 italic">Event Audit Log</p>
                          {events.length > 0 ? (
                            <div className="space-y-2">
                              {events.map((ev, evi) => (
                                <div key={evi} className="flex items-center justify-between bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-100 dark:border-white/5 shadow-sm">
                                  <div>
                                    <p className="text-[9px] font-black text-zinc-900 uppercase leading-none mb-1">{ev.event}</p>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{ev.date || 'Historic'}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[11px] font-black text-zinc-800 dark:text-zinc-100 tabular-nums tracking-tighter italic">${ev.price?.toLocaleString() ?? '\u2014'}</p>
                                    {ev.priceChange != null && (
                                      <p className={`text-[9px] font-black tabular-nums ${ev.priceChange < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        {ev.priceChange >= 0 ? '+' : ''}${Math.abs(ev.priceChange).toLocaleString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-8 rounded-2xl bg-zinc-100/50 dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
                              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic leading-relaxed">No Recent Public Audit Trails Found. Last recorded event: {lastSaleDate ? new Date(lastSaleDate).getFullYear() : 'N/A'} Purchase @ ${lastSalePrice?.toLocaleString() ?? 'Non-disclosed'}.</p>
                            </div>
                          )}
                        </div>

                        {/* Analysis Insights */}
                        {insights.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1 italic">Forensic Findings</p>
                            {insights.map((insight, ii) => (
                              <div key={ii} className="flex gap-3 bg-zinc-900/5 p-4 rounded-2xl border border-zinc-900/10">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-900 shrink-0" />
                                <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-tighter italic leading-relaxed leading-snug">{insight}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
            );
          })()}

          {/* ─── MAINTENANCE AND AGE ANALYSIS (paid) ─── */}
          {report.maintenanceAnalysis && report.maintenanceAnalysis.length > 0 && (
            <section id="maintenance-analysis" data-toc-section className="mt-12 scroll-mt-24 report-card overflow-hidden">
              <div className="bg-gradient-to-r from-zinc-800 to-zinc-950 px-8 py-8 text-white relative group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000" />
                <div className="relative z-10 flex items-center gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-inner">
                    <Wrench className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight leading-none">Maintenance Analysis</h2>
                    <p className="text-xs font-bold text-white/70 uppercase tracking-widest mt-1.5 italic">Structural Integrity & CapEx Forecasting</p>
                  </div>
                </div>
              </div>

              <div className="p-10">
                <div className={`grid gap-8 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                  {report.maintenanceAnalysis.map((propItems, pi) => {
                    const criticalRisk = propItems.filter(item => item.riskLevel === "red").length;
                    return (
                      <div key={pi} className="bg-zinc-50 dark:bg-zinc-800/20 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-8 flex flex-col transition-all hover:bg-white dark:hover:bg-zinc-800/40 hover:shadow-xl group/card">
                        <div className="flex items-center gap-3 mb-8 border-b border-zinc-200 dark:border-zinc-700/50 pb-6">
                          <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[pi] }} />
                          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">{shortAddr(properties[pi]?.address ?? `Prop ${pi+1}`)}</h3>
                        </div>

                        <div className="space-y-4 flex-1">
                          {propItems.map((item, ii) => {
                            const riskConfig = {
                              red: "bg-red-500",
                              yellow: "bg-amber-500",
                              green: "bg-green-500"
                            }[item.riskLevel] || "bg-zinc-500";
                            return (
                              <div key={ii} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-white/5 shadow-sm transition-all hover:tranzinc-x-1">
                                <div className="flex justify-between items-start mb-3">
                                  <h4 className="text-[11px] font-black uppercase tracking-tighter text-zinc-800 dark:text-zinc-200 leading-none">{item.system}</h4>
                                  <div className={`h-2 w-2 rounded-full ${riskConfig} shadow-[0_0_8px] shadow-current`} />
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-zinc-50 dark:border-white/5">
                                  <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Typical Lifespan</p>
                                    <p className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase italic leading-none">{item.typicalLifespan}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Est. Budget</p>
                                    <p className="text-[11px] font-black text-zinc-900 leading-none tracking-tighter tabular-nums">{item.estimatedCost}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-700/50">
                           <div className={`p-4 rounded-xl flex items-center gap-3 ${criticalRisk > 0 ? 'bg-red-500/5 border border-red-500/10' : 'bg-green-500/5 border border-green-500/10'}`}>
                              <AlertTriangle className={`h-4 w-4 ${criticalRisk > 0 ? 'text-red-500' : 'text-green-500'}`} />
                              <p className={`text-[10px] font-black uppercase tracking-tighter italic leading-relaxed ${criticalRisk > 0 ? 'text-red-700' : 'text-green-700'}`}>
                                {criticalRisk > 0 ? `${criticalRisk} Critical Obsolescence Risks identified.` : 'Zero structural obsolescence alerts.'}
                              </p>
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="px-10 py-6 border-t border-border bg-zinc-50/50 dark:bg-zinc-900/50 text-center">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic max-w-4xl mx-auto leading-relaxed">Depreciation analysis based on industry-standard asset lifecycles. Individual parcel audit is mandatory.</p>
              </div>
            </section>
          )}

          {/* ─── INVESTMENT OUTLOOK (paid) ─── */}
          {(report.investmentOutlook || report.investmentPerspective || report.investmentOutlookStructured) && (
            <section id="investment-outlook" data-toc-section className="mt-12 scroll-mt-24 report-card overflow-hidden">
              <div className="bg-gradient-to-r from-zinc-800 to-zinc-950 px-8 py-8 text-white relative group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000" />
                <div className="relative z-10 flex items-center gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                    <TrendingUp className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight leading-none">Investment Outlook</h2>
                    <p className="text-xs font-bold text-white/70 uppercase tracking-widest mt-1.5 italic">Capital Allocation & Market Performance Scaling</p>
                  </div>
                </div>
              </div>

              <div className="p-10">
                {report.investmentOutlookStructured && report.investmentOutlookStructured.length > 0 ? (
                  <div className="space-y-10">
                    <div className={`grid gap-8 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                      {report.investmentOutlookStructured.map((data, pi) => (
                        <div key={pi} className="bg-zinc-50 dark:bg-zinc-800/20 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-8 transition-all hover:bg-white dark:hover:bg-zinc-800/40 hover:shadow-xl group/card">
                          <div className="flex items-center gap-3 mb-8 border-b border-zinc-200 dark:border-zinc-700/50 pb-6">
                            <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[pi] }} />
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">{shortAddr(properties[pi]?.address ?? `Prop ${pi+1}`)}</h3>
                          </div>
                          <ul className="space-y-4">
                            {data.bullets.map((bullet, bi) => (
                              <li key={bi} className="flex items-start gap-4 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-tight leading-relaxed italic">
                                <span className="mt-1 h-2 w-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: PROPERTY_COLORS[pi] }} />
                                &quot;{bullet}&quot;
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    {report.investmentOutlookStructured[0]?.verdict && (
                      <div className="p-6 rounded-2xl bg-zinc-900/5 border border-zinc-900/20 flex items-start gap-4 shadow-sm">
                        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-zinc-900 animate-pulse" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900 mb-1">Strat-Alloc Verdict</p>
                          <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-tighter leading-relaxed italic">{report.investmentOutlookStructured[0].verdict}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-zinc-50 dark:bg-zinc-800/20 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center max-w-4xl mx-auto">
                    <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest leading-relaxed italic">
                      &quot;{report.investmentOutlook || report.investmentPerspective}&quot;
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ─── DETAILED SIDE-BY-SIDE COMPARISON (paid) ─── */}
          {report.detailedComparison && report.detailedComparison.length > 0 && (
            <section id="side-by-side" data-toc-section className="mt-12 scroll-mt-24 report-card overflow-hidden">
              <div className="bg-gradient-to-r from-zinc-800 to-zinc-950 px-8 py-8 text-white relative group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000" />
                <div className="relative z-10 flex items-center gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                    <LayoutGrid className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight leading-none">Detailed Data Matrix</h2>
                    <p className="text-xs font-bold text-white/70 uppercase tracking-widest mt-1.5 italic">Institutional-Grade Multi-Property Comparison</p>
                  </div>
                </div>
              </div>

              <div className="p-10">
                <div className="overflow-x-auto rounded-3xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900/40 shadow-xl overflow-hidden">
                  <table className="w-full text-[11px] font-bold uppercase tracking-tighter">
                    <thead>
                      <tr className="bg-zinc-900 text-white">
                        <th className="px-6 py-5 text-left text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Comparison Category</th>
                        {properties.map((p, i) => (
                          <th key={i} className="px-6 py-5 text-left border-l border-white/5">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-6 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[i] }} />
                              <span className="truncate max-w-[160px]">{shortAddr(p.address)}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                      {report.detailedComparison.map((row, ri) => (
                        <tr key={ri} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                          <td className="px-6 py-4 text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/50 uppercase tracking-widest font-black text-[9px]">
                            {row.label}
                          </td>
                          {row.values.map((val, vi) => (
                            <td key={vi} className="px-6 py-4 text-zinc-900 dark:text-zinc-100 tabular-nums italic font-black text-[11px] border-l border-zinc-50 dark:border-white/5">
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ─── BUYER PROTECTION CHECKLIST (paid) ─── */}
          {(() => {
            const defaultChecklist: { item: string; why: string; howToFind: string }[] = [
              { item: "Professional home inspection", why: "Reveals hidden structural, electrical, and plumbing issues that could cost thousands to fix", howToFind: "Hire a licensed home inspector — your agent can recommend one, or search ASHI.org" },
              { item: "Review seller disclosure statement", why: "Sellers are legally required to disclose known defects — gaps may indicate concealed issues", howToFind: "Request from listing agent; compare against inspection findings" },
              { item: "Title search and title insurance", why: "Protects against liens, ownership disputes, or boundary issues that could threaten your ownership", howToFind: "Your lender will order a title search; purchase owner's title insurance at closing" },
              { item: "Verify flood zone designation", why: "Flood insurance can add $1,000-$3,000+/year if the property is in a Special Flood Hazard Area", howToFind: "Check FEMA flood maps at msc.fema.gov or ask your lender for a flood determination" },
              { item: "Confirm school district assignments", why: "School quality directly impacts property value — proximity does not guarantee assignment", howToFind: "Contact the county school district office or check their website with the property address" },
              { item: "Review HOA documents", why: "HOA rules, financial health, and special assessments can significantly impact ownership costs", howToFind: "Request HOA bylaws, financial statements, meeting minutes, and reserve fund balance from listing agent" },
              { item: "Check for open building permits", why: "Unpermitted work can create liability and may need to be corrected before sale or occupancy", howToFind: "Search your county's online permit portal or call the building department" },
              { item: "Verify property tax history", why: "Taxes may increase significantly after purchase based on reassessment to purchase price", howToFind: "Check county tax assessor website; ask your agent about recent reassessments in the area" },
              { item: "Radon test (if basement)", why: "Radon is a leading cause of lung cancer — mitigation is affordable ($800-$1,500) if detected early", howToFind: "Request a radon test as part of your home inspection, especially for homes with basements" },
              { item: "Confirm all systems are functional", why: "Replacing HVAC, water heater, or appliances can cost $5,000-$15,000 shortly after purchase", howToFind: "Have inspector test all major systems; request maintenance records from seller" },
            ];
            const hasAIChecklist = report.buyerProtectionChecklist && report.buyerProtectionChecklist.length > 0;
            const checklistData = hasAIChecklist ? report.buyerProtectionChecklist! : [defaultChecklist];
            const isDefault = !hasAIChecklist;

            return (
              <section id="buyer-checklist" data-toc-section className="mt-12 scroll-mt-24 report-card overflow-hidden">
                <div className="bg-gradient-to-r from-zinc-800 to-zinc-950 px-8 py-8 text-white relative group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000" />
                  <div className="relative z-10 flex items-center gap-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                      <Shield className="h-7 w-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tight leading-none">Buyer Protection Protocol</h2>
                      <p className="text-xs font-bold text-white/70 uppercase tracking-widest mt-1.5 italic">Risk Mitigation & Pre-Offer Verification Framework</p>
                    </div>
                  </div>
                </div>

                <div className="p-10">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-900 mb-8 italic px-1">
                    {isDefault ? "Mandatory verification standards for offer submission." : "Proprietary verification items customized for selected assets."}
                  </p>

                  <div className={`${isDefault ? "" : `grid gap-8 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}`}>
                    {checklistData.map((items, pi) => (
                      <div key={pi} className="bg-zinc-50 dark:bg-zinc-800/20 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-8 flex flex-col transition-all hover:bg-white dark:hover:bg-zinc-800/40 hover:shadow-xl group/card">
                        {!isDefault && (
                          <div className="flex items-center gap-3 mb-8 border-b border-zinc-200 dark:border-zinc-700/50 pb-6">
                            <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[pi] }} />
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">{shortAddr(properties[pi]?.address ?? `Prop ${pi+1}`)}</h3>
                          </div>
                        )}
                        <div className="space-y-4">
                          {items.map((item, ii) => (
                            <div key={ii} className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-100 dark:border-white/5 shadow-sm hover:tranzinc-x-1 transition-transform">
                              <h4 className="text-[11px] font-black uppercase tracking-tighter text-zinc-900 mb-3 leading-none italic">{item.item}</h4>
                              <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                  <div className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 mt-1 shrink-0" />
                                  <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-tight leading-relaxed italic">{item.why}</p>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-white/5">
                                  <div className="h-4 w-4 rounded bg-zinc-500/10 flex items-center justify-center shrink-0">
                                    <div className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                                  </div>
                                  <p className="text-[10px] font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-tighter italic leading-relaxed">{item.howToFind}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          })()}

          {/* ─── QUESTIONS TO ASK YOUR AGENT (paid) ─── */}
          {(() => {
            const categoryColors: Record<string, string> = {
              'Financial': 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-300',
              'Condition': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
              'HOA': 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-300',
              'Legal': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
              'Neighborhood': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
              'Disclosure': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
              'Negotiation': 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-300',
            };

            type QuestionItem = { property: string; category: string; question: string; whyItMatters: string };
            let questions: QuestionItem[];

            if (report.questionsToAskAgent && report.questionsToAskAgent.length >= 12) {
              // AI generated enough questions, use them directly
              questions = report.questionsToAskAgent;
            } else {
              // Start with any AI-generated questions, then supplement with client-side ones
              const aiQuestions = report.questionsToAskAgent ?? [];
              const aiQuestionTexts = new Set(aiQuestions.map(q => q.question.toLowerCase()));

              // Generate property-specific questions from listing data
              questions = [];
              properties.forEach((prop, pi) => {
                const listing = listings[pi];
                const addr = prop.address;
                const dom = listing?.daysOnMarket;
                const hoa = listing?.hoaFee;
                const hoaStatus = listing?.hoaStatus ?? 'not_listed';
                const yearBuilt = listing?.yearBuilt;
                const reductions = listing?.priceHistory?.filter(e => e.event === "Price Reduced") ?? [];
                const pricePerSqft = listing?.pricePerSqft;

                // Year built unknown
                if (!yearBuilt) {
                  questions.push({ property: addr, category: "Disclosure", question: "Why is the year built not disclosed for this property? Request the full property disclosure and county tax records.", whyItMatters: "Year built affects insurance rates, system lifespans, and potential hazards like lead paint (pre-1978) and asbestos (pre-1980)." });
                }

                // HOA not listed
                if (hoaStatus === 'not_listed') {
                  questions.push({ property: addr, category: "HOA", question: "What is the HOA status for this property? Are there any community fees, maintenance fees, or shared amenity costs?", whyItMatters: "Undisclosed HOA fees could add $100 to $400 per month to ownership costs. This must be verified before making an offer." });
                }

                // Days on market
                if (dom != null && dom > 14) {
                  questions.push({ property: addr, category: "Negotiation", question: `This property has been on market for ${dom} days. What feedback have you received from buyers who toured it? Has the seller received and rejected any offers?`, whyItMatters: dom > 30 ? "Extended time on market gives you negotiation leverage and may indicate pricing issues or property concerns." : "Understanding buyer feedback helps you identify potential issues and calibrate your offer." });
                }
                if (dom != null && dom > 30) {
                  questions.push({ property: addr, category: "Financial", question: "Has the seller considered additional price reductions? What is their motivation level and timeline for selling?", whyItMatters: `At ${dom} days on market, the seller may be motivated to negotiate on price, closing costs, or repairs.` });
                }

                // HOA confirmed and high
                if (hoa != null && hoa > 200 && hoaStatus === 'confirmed') {
                  questions.push({ property: addr, category: "HOA", question: `The HOA fee is $${hoa}/month. Can you provide the last 2 years of HOA financial statements, reserve fund balance, and any planned special assessments?`, whyItMatters: `At $${hoa}/month ($${(hoa * 12).toLocaleString()}/year), you need to confirm the HOA is financially healthy.` });
                }

                // Old construction
                if (yearBuilt != null && yearBuilt < 1990) {
                  questions.push({ property: addr, category: "Condition", question: `Built in ${yearBuilt}, have the roof, HVAC, electrical panel, and plumbing been updated? Request documentation of any upgrades.`, whyItMatters: `Major systems in a ${new Date().getFullYear() - yearBuilt}-year-old home may need replacement soon, costing $10,000 to $30,000+.` });
                }
                if (yearBuilt != null && yearBuilt < 1978) {
                  questions.push({ property: addr, category: "Disclosure", question: "Has the seller completed a lead paint disclosure? Is there documentation of any lead paint testing or remediation?", whyItMatters: `Built in ${yearBuilt}, this home may contain lead-based paint. Federal law requires disclosure for homes built before 1978.` });
                }

                // Price reductions
                if (reductions.length > 0) {
                  const totalReduction = reductions.reduce((s, e) => s + Math.abs(e.priceChange ?? 0), 0);
                  questions.push({ property: addr, category: "Financial", question: `The price was reduced ${reductions.length} time${reductions.length > 1 ? 's' : ''} (total: $${totalReduction.toLocaleString()}). What prompted the reduction? Were there inspection findings from prior buyers?`, whyItMatters: "Price reductions often signal issues discovered during showings or a shift in the seller's motivation." });
                }

                // Price per sqft comparison
                if (pricePerSqft && properties.length >= 2) {
                  const otherPpSqft = listings.filter((_, j) => j !== pi).map(l => l?.pricePerSqft).filter((v): v is number => typeof v === 'number' && v > 0);
                  if (otherPpSqft.length > 0) {
                    const avgOther = Math.round(otherPpSqft.reduce((a, b) => a + b, 0) / otherPpSqft.length);
                    const diff = Math.abs(pricePerSqft - avgOther);
                    if (diff > 30) {
                      questions.push({ property: addr, category: "Financial", question: `This property is $${pricePerSqft}/sqft compared to $${avgOther}/sqft for the other property. What accounts for the $${diff}/sqft difference?`, whyItMatters: "Significant price per square foot differences may indicate premium features, condition issues, or mispricing." });
                    }
                  }
                }
              });

              // Always-include questions for all properties
              questions.push({ property: "All Properties", category: "Negotiation", question: "Are there any current offers on either property, and what is each seller's preferred closing timeline?", whyItMatters: "Understanding the seller's priorities helps you craft an offer that addresses their needs while protecting yours." });
              questions.push({ property: "All Properties", category: "Neighborhood", question: "What have comparable homes within half a mile of each property sold for in the last 90 days?", whyItMatters: "Recent comparable sales are the best indicator of current market value and help calibrate your offer price." });
              questions.push({ property: "All Properties", category: "Disclosure", question: "Have there been any previous offers that fell through on either property, and why?", whyItMatters: "Failed offers may indicate inspection issues, financing problems, or unrealistic seller expectations." });
              questions.push({ property: "All Properties", category: "Neighborhood", question: "Are there any known upcoming developments, construction projects, or zoning changes planned near either property?", whyItMatters: "Nearby construction or zoning changes can significantly impact property values, noise levels, and quality of life." });
              questions.push({ property: "All Properties", category: "Financial", question: "Can you provide the last 12 months of utility bills for each property?", whyItMatters: "Actual utility costs reveal the true monthly cost of ownership and can indicate insulation or HVAC efficiency issues." });

              // Merge: add AI questions first, then supplement with unique client-side questions
              const supplementQuestions = questions.filter(q => !aiQuestionTexts.has(q.question.toLowerCase()));
              questions = [...aiQuestions, ...supplementQuestions];
            }

            // FIX 5: Deduplicate — collect property-specific question texts, filter shared section
            const propertySpecificTexts = new Set<string>();
            for (const q of questions) {
              if (q.property !== 'All Properties' && q.property !== 'Both properties') {
                propertySpecificTexts.add(q.question.toLowerCase());
              }
            }
            const deduped = questions.filter(q => {
              if (q.property === 'All Properties' || q.property === 'Both properties') {
                const qLower = q.question.toLowerCase();
                // Exclude if a property-specific question contains the same key phrases
                const psArray = Array.from(propertySpecificTexts);
                for (let di = 0; di < psArray.length; di++) {
                  if (qLower.includes(psArray[di]) || psArray[di].includes(qLower)) return false;
                }
              }
              return true;
            });

            const grouped: Record<string, QuestionItem[]> = {};
            for (const q of deduped) {
              const key = q.property || 'Both properties';
              if (!grouped[key]) grouped[key] = [];
              grouped[key].push(q);
            }

            return (
              <section id="questions-to-ask" data-toc-section className="mt-12 scroll-mt-24 report-card overflow-hidden">
                <div className="bg-gradient-to-r from-zinc-800 to-zinc-950 px-8 py-8 text-white relative group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000" />
                  <div className="relative z-10 flex items-center gap-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                      <HelpCircle className="h-7 w-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tight leading-none">Smart Questions Matrix</h2>
                      <p className="text-xs font-bold text-white/70 uppercase tracking-widest mt-1.5 italic">Strategic Intelligence for Professional Negotiation</p>
                    </div>
                  </div>
                </div>

                <div className="p-10">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-900 mb-8 italic px-1">
                    Custom-engineered questions based on proprietary listing analytics.
                  </p>

                  <div className="space-y-12">
                    {Object.entries(grouped).map(([propName, qs], groupIdx) => (
                      <div key={groupIdx} className="space-y-6">
                        <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                           <div className="h-1.5 w-12 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100 italic">{propName}</h3>
                        </div>
                        
                        <div className="grid gap-6 md:grid-cols-2">
                          {qs.map((q, qi) => (
                            <div key={qi} className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-zinc-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all hover:-tranzinc-y-1 flex flex-col">
                              <div className="flex justify-between items-start mb-4">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest leading-none ${categoryColors[q.category] || 'bg-zinc-100 text-zinc-600'}`}>
                                  {q.category}
                                </span>
                              </div>
                              <p className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter leading-relaxed italic mb-4 flex-1">
                                &quot;{q.question}&quot;
                              </p>
                              <div className="p-4 rounded-2xl bg-zinc-900/5 border border-zinc-900/10">
                                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-900 mb-1 italic">Strategic Rationale</p>
                                <p className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-tight leading-relaxed italic">
                                  {q.whyItMatters}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          })()}

          {/* ─── OUR RECOMMENDATION (combined Our Pick + Final Verdict) ─── */}
          {report.ourPick && (
            <section id="our-pick" data-toc-section className="mt-12 scroll-mt-24 report-card overflow-hidden">
            <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 px-8 py-10 text-white relative group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-48 -mt-48 animate-pulse" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/50 backdrop-blur-lg border border-white/20 shadow-xl">
                    <Award className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Rivvl Analyst Verdict</h2>
                    <p className="text-xs font-bold text-white/70 tracking-widest mt-2 italic font-bold text-white/70">Institutional Acquisition Strategy & Risk Summary</p>
                  </div>
                </div>
                <div className="bg-zinc-800/50 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Primary Selection</p>
                  <p className="text-lg font-black uppercase tracking-tight">
                    {report.ourPick.address || properties[report.ourPick.winner - 1]?.address || `Property ${report.ourPick.winner}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-10 flex flex-col gap-10">
              <div className={`bg-zinc-50 dark:bg-zinc-900/50 rounded-[40px] border border-zinc-100 dark:border-white/5 p-10 relative overflow-hidden border-l-[6px] ${
                (report.ourPick.winner === 1 ? report.property1OverallScore : report.property2OverallScore) || 0 >= 8 ? "border-l-green-500" :
                (report.ourPick.winner === 1 ? report.property1OverallScore : report.property2OverallScore) || 0 >= 5 ? "border-l-yellow-500" :
                "border-l-red-500"
              }`}>
                <Quote className="absolute -bottom-10 -right-10 h-64 w-64 text-zinc-200/50 dark:text-zinc-800/10 pointer-events-none" />
                <div className="relative z-10">
                  <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-6 italic">Strategic Synthesis</p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-200 leading-tight tracking-tighter italic">
                    &quot;{report.ourPick.narrative || report.ourPick.reasoning}&quot;
                  </p>
                </div>
              </div>

              {report.ourPick.bullets && report.ourPick.bullets.length > 0 && (
                <div className="grid gap-8 lg:grid-cols-3">
                  {report.ourPick.bullets.slice(0, 3).map((b, bi) => (
                    <div key={bi} className="bg-white dark:bg-zinc-950 p-8 rounded-3xl border border-zinc-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="h-10 w-10 rounded-xl bg-zinc-900 flex items-center justify-center mb-6 shadow-lg shadow-zinc-900/20">
                        <Check className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 italic">Alpha Factor 0{bi+1}</p>
                      <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 leading-relaxed italic">{b}</p>
                    </div>
                  ))}
                </div>
              )}

              {report.finalVerdict && (
                <div className="p-8 rounded-2xl bg-zinc-900 text-white flex items-start gap-4 shadow-2xl">
                  <div className={`mt-1 h-3 w-3 rounded-full ${
                    (report.ourPick.winner === 1 ? report.property1OverallScore : report.property2OverallScore) || 0 >= 8 ? "bg-green-500 shadow-[0_0_10px_#10b981]" :
                    (report.ourPick.winner === 1 ? report.property1OverallScore : report.property2OverallScore) || 0 >= 5 ? "bg-yellow-500 shadow-[0_0_10px_#f59e0b]" :
                    "bg-red-500 shadow-[0_0_10px_#ef4444]"
                  }`} />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Final Risk Verdict</p>
                    <p className="text-sm font-bold tracking-tight italic leading-relaxed">{report.finalVerdict}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
        {!report.ourPick && report.finalVerdict && (
          <section id="our-pick" data-toc-section className="mt-12 scroll-mt-24 report-card overflow-hidden">
            <div className="p-10 flex flex-col gap-10">
              <div className="p-8 rounded-2xl bg-zinc-900 text-white flex items-start gap-4 shadow-2xl">
                <div className="mt-1 h-3 w-3 rounded-full bg-green-500 shadow-[0_0_10px_#10b981]" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Final Risk Verdict</p>
                  <p className="text-sm font-bold uppercase tracking-tight italic leading-relaxed">{report.finalVerdict}</p>
                </div>
              </div>
            </div>
          </section>
        )}
        </>
      ) : (
        /* ─── BLURRED OUR PICK + UPGRADE CTA for free users ─── */
        <>
        <section id="our-pick" data-toc-section className="mt-8 scroll-mt-20 relative">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-8 text-white shadow-xl blur-sm select-none pointer-events-none" aria-hidden="true">
            <div className="flex flex-col items-center text-center">
              <Trophy className="h-12 w-12 text-amber-300" />
              <p className="mt-3 text-sm font-bold uppercase tracking-widest text-zinc-200">Our Pick</p>
              <p className="mt-2 text-2xl font-black text-white">Upgrade to see our recommendation</p>
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Lock className="h-8 w-8 text-zinc-900" />
            <p className="mt-2 text-sm font-semibold text-zinc-950 dark:text-gray-100">Upgrade to unlock Our Pick</p>
          </div>
        </section>
        <section className="mt-8">
          <div className="rounded-2xl border-l-4 border-l-zinc-900 bg-gray-50 dark:bg-zinc-800/50 p-8 shadow-sm text-center">
            <Lock className="mx-auto h-10 w-10 text-zinc-900" />
            <h3 className="mt-4 text-xl font-bold text-zinc-950 dark:text-gray-100">Upgrade to Full Report: {upgradePrice}</h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-gray-400">Unlock everything you need to make a confident decision:</p>
            <div className="mt-4 mx-auto max-w-md text-left space-y-2">
              {[
                "Red flag analysis for each property",
                "Closing cost estimate with total cash needed",
                "Insurance cost estimate with flood risk assessment",
                "First-time buyer loan program eligibility",
                "Property tax reassessment risk warning",
                "HOA risk intelligence and questions to ask",
                "Complete financial breakdown with 5-year cost projection",
                "Negotiation intelligence with suggested offer range",
                "All 8 property risk factors",
                "Our Pick recommendation with full reasoning",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <Check className="h-4 w-4 shrink-0 text-green-500" />
                  {item}
                </div>
              ))}
            </div>
            <button
              onClick={handleUpgradeCheckout}
              disabled={upgradeLoading}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-500 px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
            >
              {upgradeLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting...</>
              ) : (
                <>Upgrade Now: {upgradePrice} <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
            <p className="mt-2 text-xs text-gray-400">One-time purchase for this comparison</p>
          </div>
        </section>
        </>
      )}

      {/* ─── LISTING INFORMATION (paid, always show for all properties) ─── */}
      {isPaid && (
        <section id="listing-agent" data-toc-section className="mt-12 scroll-mt-24 report-card overflow-hidden">
          <div className="bg-gradient-to-r from-zinc-800 to-zinc-950 px-8 py-8 text-white relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000" />
            <div className="relative z-10 flex items-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                <Building2 className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight leading-none">Brokerage Intelligence</h2>
                <p className="text-xs font-bold text-white/70 uppercase tracking-widest mt-1.5 italic">Institutional Representation Audit</p>
              </div>
            </div>
          </div>

          <div className="p-10">
            <div className={`grid gap-8 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
              {properties.map((prop, bii) => {
                const bi = paidData?.brokerageInfo?.[bii];
                const hasData = bi && (bi.agentName || bi.brokerageName);
                return (
                  <div key={bii} className="bg-zinc-50 dark:bg-zinc-800/20 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-8 flex flex-col transition-all hover:bg-white dark:hover:bg-zinc-800/40 hover:shadow-xl group/card">
                    <div className="flex items-center gap-3 mb-8 border-b border-zinc-200 dark:border-zinc-700/50 pb-6">
                      <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[bii] }} />
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">{shortAddr(prop.address)}</h3>
                    </div>
                    
                    {hasData ? (
                      <div className="space-y-6">
                        {bi.agentName && (
                          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-white/5 shadow-sm">
                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-900 mb-1">Lead Listing Agent</p>
                            <p className="text-[11px] font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-100 italic">{getBrokerageName(bi.agentName)}</p>
                          </div>
                        )}
                        {bi.brokerageName && (
                          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-white/5 shadow-sm">
                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-1">Representing Brokerage</p>
                            <p className="text-[11px] font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-100 italic">{getBrokerageName(bi.brokerageName)}</p>
                          </div>
                        )}
                        {bi && bi.googleRating && (
                          <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                            <div className="flex items-center gap-2">
                               <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                               <span className="text-[11px] font-black text-amber-900 dark:text-amber-400 tabular-nums italic">{bi.googleRating}</span>
                            </div>
                            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest italic">{bi.googleReviewCount} Audits</span>
                          </div>
                        )}
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest italic leading-relaxed text-center px-4">
                          Verify license at state registry. (e.g., <a href="https://www.dpor.virginia.gov/LicenseLookup/" target="_blank" rel="noopener noreferrer" className="text-zinc-900 hover:underline">VA DPOR</a>)
                        </p>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center p-8 rounded-3xl bg-zinc-100/50 dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic leading-relaxed">Listing agent metadata restricted or non-disclosed.</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── LEGAL DISCLAIMER ─── */}
      <section className="mt-16 report-card overflow-hidden bg-zinc-50 dark:bg-zinc-900">
        <div className="p-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-white">Institutional Disclaimer</h2>
          </div>
          <div className="grid gap-12 md:grid-cols-2">
            <div className="space-y-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic leading-relaxed">
              <p>This report is generated by Rivvl Intelligence for informational and educational purposes only. It does not constitute real estate advice, financial advice, legal advice, or a professional property appraisal.</p>
              <p>Rivvl is a technology platform that aggregates and analyzes publicly available data. We are not licensed real estate agents, brokers, appraisers, attorneys, or financial advisors.</p>
            </div>
            <div className="space-y-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic leading-relaxed">
               <p>Property scores and risk ratings reflect interprets of available data as of the generation date. Information depends on third-party sources (FEMA, EPA, USGS) which may contain updates not yet reflected here.</p>
               <p>Professional inspections, legal review, and independent due diligence are mandatory prior to executing real estate transactions. Rivvl assumes no liability for decisions made based on this analysis.</p>
            </div>
          </div>
        </div>
        <div className="px-10 py-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex gap-10">
              <div>
                 <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-0.5 whitespace-nowrap">Proprietary Engine</p>
                 <p className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase italic">Rivvl Analytical Core v3.4.2</p>
              </div>
              <div>
                 <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-0.5 whitespace-nowrap">Report Timestamp</p>
                 <p className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase italic">{new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}</p>
              </div>
           </div>
           <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-zinc-900 dark:border-zinc-100">
              <span className="text-xs font-black italic">R</span>
           </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="mt-20 pb-24 text-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900 italic">Before you choose. Rivvl.</p>
          <div className="flex gap-8 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
            <span>© {new Date().getFullYear()} Rivvl Intelligence Suite</span>
            <span className="text-zinc-300">{'//'}</span>
            <span>All Rights Reserved</span>
          </div>
        </div>
      </footer>
      </div>{/* end flex-1 main content */}
    </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                    COMPARISON TABLE BUILDER                           */
/* ═══════════════════════════════════════════════════════════════════════ */

function buildComparisonRows(
  properties: PropertyAnalysis[],
  listings: ListingData[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _isPaid: boolean
): { label: string; values: string[]; bestIndex: number | null }[] {
  const rows: { label: string; values: string[]; bestIndex: number | null }[] = [];

  const prices = listings.map((l) => l?.price ?? null);
  rows.push({ label: "Price", values: prices.map((p) => (p ? `$${p.toLocaleString()}` : "N/A")), bestIndex: findBestIndex(prices.filter((p): p is number => p !== null), "lowest", prices) });

  const beds = listings.map((l) => l?.beds ?? null);
  rows.push({ label: "Bedrooms", values: beds.map((b) => (b !== null ? String(b) : "N/A")), bestIndex: findBestIndex(beds.filter((b): b is number => b !== null), "highest", beds) });

  const baths = listings.map((l) => l?.baths ?? null);
  rows.push({ label: "Bathrooms", values: baths.map((b) => (b !== null ? String(b) : "N/A")), bestIndex: findBestIndex(baths.filter((b): b is number => b !== null), "highest", baths) });

  const sqfts = listings.map((l) => l?.sqft ?? null);
  rows.push({ label: "Square Feet", values: sqfts.map((s) => (s ? s.toLocaleString() : "N/A")), bestIndex: findBestIndex(sqfts.filter((s): s is number => s !== null), "highest", sqfts) });

  rows.push({ label: "Property Type", values: listings.map((l) => l?.propertyType ?? "N/A"), bestIndex: null });

  // Always include all rows (free users see them blurred)
  const ppsqft = listings.map((l) => l?.pricePerSqft ?? null);
  rows.push({ label: "Price/Sqft", values: ppsqft.map((p) => (p ? `$${p}` : "N/A")), bestIndex: findBestIndex(ppsqft.filter((p): p is number => p !== null), "lowest", ppsqft) });

  const years = listings.map((l) => l?.yearBuilt ?? null);
  rows.push({ label: "Year Built", values: years.map((y) => (y ? String(y) : "N/A")), bestIndex: findBestIndex(years.filter((y): y is number => y !== null), "highest", years) });

  const hoas = listings.map((l) => l?.hoaFee ?? null);
  rows.push({
    label: "HOA Fee",
    values: listings.map((l) => {
      const status = l?.hoaStatus ?? 'not_listed';
      if (status === 'confirmed' && l?.hoaFee != null) return `$${l.hoaFee}/mo`;
      if (status === 'confirmed_none') return "None (confirmed)";
      return "\u26A0 Not listed";
    }),
    bestIndex: findBestIndex(hoas.filter((h): h is number => h !== null), "lowest", hoas),
  });

  const dom = listings.map((l) => l?.daysOnMarket ?? null);
  rows.push({ label: "Days on Market", values: dom.map((d) => (d !== null ? String(d) : "N/A")), bestIndex: null });

  rows.push({ label: "Lot Size", values: listings.map((l) => l?.lotSize ?? "N/A"), bestIndex: null });
  rows.push({ label: "Garage", values: listings.map((l) => l?.hasGarage === true ? "Yes" : l?.hasGarage === false ? "No" : "N/A"), bestIndex: null });
  rows.push({ label: "Pool", values: listings.map((l) => l?.hasPool === true ? "Yes" : l?.hasPool === false ? "No" : "N/A"), bestIndex: null });
  rows.push({ label: "Basement", values: listings.map((l) => l?.hasBasement === true ? "Yes" : l?.hasBasement === false ? "No" : "N/A"), bestIndex: null });
  rows.push({ label: "Parking Spaces", values: listings.map((l) => l?.parkingSpaces !== null && l?.parkingSpaces !== undefined ? String(l.parkingSpaces) : "N/A"), bestIndex: null });

  // Estimated Monthly Cost (always shown)
  const monthlyCosts = listings.map((l) => {
    if (!l?.price) return null;
    const mortgage = estimateMonthlyMortgage(l.price);
    const hoa = l.hoaFee ?? 0;
    const tax = estimatePropertyTax(l.price);
    return mortgage + hoa + tax;
  });
  rows.push({ label: "Est. Monthly Cost", values: monthlyCosts.map((c) => c ? `$${c.toLocaleString()}` : "N/A"), bestIndex: findBestIndex(monthlyCosts.filter((c): c is number => c !== null), "lowest", monthlyCosts) });

  return rows;
}

function findBestIndex(
  validValues: number[],
  direction: "highest" | "lowest",
  allValues: (number | null)[]
): number | null {
  if (validValues.length < 2) return null;
  const best = direction === "highest" ? Math.max(...validValues) : Math.min(...validValues);
  const idx = allValues.indexOf(best);
  const allEqual = validValues.every((v) => v === validValues[0]);
  return allEqual ? null : idx;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                        PAGE EXPORT                                    */
/* ═══════════════════════════════════════════════════════════════════════ */

export default function HomeReportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}
