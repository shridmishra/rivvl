"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/Tooltip";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";

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

function scoreColor(score: number): string {
  if (score >= 8) return "text-emerald-600";
  if (score >= 5) return "text-amber-500";
  return "text-red-500";
}


function scoreRingColor(score: number): string {
  if (score >= 8) return "#10B981";
  if (score >= 5) return "#F59E0B";
  return "#EF4444";
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                       RISK BADGE HELPERS                              */
/* ═══════════════════════════════════════════════════════════════════════ */

type BadgeLevel = "red" | "yellow" | "green" | "gray";

function badgeBorderColor(level: BadgeLevel): string {
  switch (level) {
    case "red": return "border-l-red-500";
    case "yellow": return "border-l-amber-500";
    case "green": return "border-l-emerald-500";
    case "gray": return "border-l-gray-400";
  }
}

function badgeClasses(level: BadgeLevel): string {
  switch (level) {
    case "red":
      return "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300";
    case "yellow":
      return "bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300";
    case "green":
      return "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300";
    case "gray":
      return "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  }
}

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

function ScoreGauge({ score, label, size = 90, isNull = false, isWinner = false }: { score: number | null; label: string; size?: number; isNull?: boolean; isWinner?: boolean }) {
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  if (score === null || isNull) {
    return (
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[9px] font-bold text-gray-400 leading-tight text-center">Insufficient<br/>data</span>
          </div>
        </div>
        {label && <p className="mt-1 text-[10px] font-medium text-slate-500 dark:text-gray-400 text-center">{label}</p>}
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
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-700 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1">
            {isWinner && <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />}
            <span className="text-2xl font-bold" style={{ color: "#1a1a2e" }}>{score}</span>
          </div>
          <span className="text-[9px] text-slate-400">/10</span>
        </div>
      </div>
      {label && <p className="mt-1 text-[10px] font-medium text-slate-500 dark:text-gray-400 text-center">{label}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                       CHART COLORS                                    */
/* ═══════════════════════════════════════════════════════════════════════ */

const PROPERTY_COLORS = ["#6C5CE7", "#00D2FF", "#F59E0B"];

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
  const router = useRouter();
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
    const params = new URLSearchParams(window.location.search);
    const urlReportId = params.get("id");
    const upgraded = params.get("upgraded") === "true";
    const sessionId = params.get("session_id");

    if (urlReportId) {
      router.replace(`/homes/report/${urlReportId}${window.location.search}`);
      return;
    }

    // Fallback: load from sessionStorage (normal flow)
    const stored = sessionStorage.getItem("rivvl_home_report");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.reportId) {
          router.replace(`/homes/report/${parsed.reportId}`);
          return;
        }
        // ... rest of fallback logic if somehow reportId is missing but data is there
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
  }, []);

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
        <Loader2 className="h-8 w-8 animate-spin text-[#6C5CE7]" />
        {verifyingPayment && (
          <p className="text-sm font-medium text-[#6C5CE7]">Unlocking your report...</p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <h2 className="mt-4 text-lg font-semibold text-indigo-950 dark:text-gray-100">Error Loading Report</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">{error}</p>
        <Link href="/compare/homes" className="mt-6 inline-flex items-center rounded-xl bg-[#00D2FF] px-6 py-3 text-sm font-semibold text-[#0F0F1A] transition-all hover:bg-[#00B8E0]">Compare Real Estate</Link>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
        <Home className="h-12 w-12 text-slate-300" />
        <h2 className="mt-4 text-lg font-semibold text-indigo-950 dark:text-gray-100">No Report Found</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">Generate a comparison report first to view results here.</p>
        <Link href="/compare/homes" className="mt-6 inline-flex items-center rounded-xl bg-[#00D2FF] px-6 py-3 text-sm font-semibold text-[#0F0F1A] transition-all hover:bg-[#00B8E0]">Compare Real Estate</Link>
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
  const barChartData = categories.map((cat, ci) => {
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
    <div className="flex flex-row gap-8 max-w-screen-xl mx-auto px-4 py-10 sm:py-14">
      {/* ═══ SIDEBAR TABLE OF CONTENTS ═══ */}
      <nav className="hidden lg:block w-56 flex-shrink-0">
        <div className="sticky top-8 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1A1A2E] p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#6C5CE7] mb-3">In This Report</p>
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
                    className={`block rounded-md py-1.5 text-xs transition-all flex items-center gap-1.5 ${
                      item.nested ? "pl-5 pr-2.5" : "px-2.5"
                    } ${
                      isLocked
                        ? "text-gray-400 dark:text-gray-600 cursor-default"
                        : isActive
                          ? "bg-purple-50 dark:bg-[#6C5CE7]/10 font-semibold text-[#6C5CE7] rounded-lg"
                          : "text-slate-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#15152A] hover:text-[#6C5CE7]"
                    }`}
                  >
                    {item.nested && <span className="text-gray-300 dark:text-gray-600 text-[8px]">&#9679;</span>}
                    {isLocked && <Lock className="h-3 w-3 flex-shrink-0 text-gray-400 dark:text-gray-600" />}
                    <span className={item.nested ? "text-[11px]" : ""}>{item.label}</span>
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
      <div className="flex items-center justify-between mb-6">
        <Link href="/compare/homes" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-[#00D2FF] dark:text-gray-400">
          <ArrowLeft className="h-4 w-4" />
          New Comparison
        </Link>
        {reportId && (
          <Button
            onClick={handleDownloadPdf}
            loading={pdfLoading}
            loadingText="Generating..."
            variant="outline"
            className="inline-flex items-center gap-2 rounded-xl border border-[#00D2FF]/30 bg-white dark:bg-[#1A1A2E] px-4 py-2 text-sm font-semibold text-[#00D2FF] transition-all hover:bg-[#00D2FF]/10"
          >
            {!pdfLoading && <Download className="h-4 w-4" />}
            Download PDF
          </Button>
        )}
      </div>

      {/* ─── SECTION 1: REPORT HEADER + EXECUTIVE SUMMARY ─── */}
      <div id="executive-summary" data-toc-section className="scroll-mt-20 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1A1A2E] p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-indigo-950 dark:text-gray-100 sm:text-3xl">
          <span className="bg-gradient-to-r from-[#00D2FF] to-[#6C5CE7] bg-clip-text text-transparent">Real Estate Comparison Report</span>
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {properties.map((p, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-[#00D2FF]/30 bg-[#00D2FF]/5 px-3 py-1 text-xs font-medium text-[#00D2FF]">
              <Home className="h-3 w-3" />
              {p.address}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400 dark:text-gray-500">
          Generated on {new Date(report.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
        {isPaid && report.property1Summary && report.property2Summary ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border-l-[3px] border-l-[#6C5CE7] bg-[#f3f0ff] dark:bg-[#6C5CE7]/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Home className="h-4 w-4 text-[#6C5CE7]" />
                <h4 className="text-sm font-bold text-[#6C5CE7]">{properties[0]?.address}</h4>
              </div>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-gray-300">{report.property1Summary}</p>
            </div>
            <div className="rounded-lg border-l-[3px] border-l-[#00D2FF] bg-[#e8fbff] dark:bg-[#00D2FF]/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Home className="h-4 w-4 text-[#00D2FF]" />
                <h4 className="text-sm font-bold text-[#00D2FF]">{properties[1]?.address}</h4>
              </div>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-gray-300">{report.property2Summary}</p>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-lg bg-gradient-to-r from-[#6C5CE7]/5 to-[#00D2FF]/5 p-4">
            {isPaid ? (
              <p className="text-sm leading-relaxed text-slate-700 dark:text-gray-300">{report.summary}</p>
            ) : (
              <div className="relative">
                <p className="text-sm leading-relaxed text-slate-700 dark:text-gray-300">
                  {report.summary.split(/(?<=[.!?])\s+/).slice(0, 1).join(" ")}...
                </p>
                <div className="mt-3 flex flex-col items-start gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-[11px] text-gray-500 dark:text-gray-400">
                    🔒 Full analysis unlocked in paid report
                  </span>
                  <button onClick={handleUpgradeCheckout} disabled={upgradeLoading} className="inline-flex items-center gap-1.5 rounded-lg bg-[#6C5CE7] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5B4BD5]">
                    {upgradeLoading ? "Redirecting..." : `Get Full Report: ${upgradePrice} →`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── SECTION 2: SCORE DASHBOARD (Stacked: Bar Chart on top, Ring Grid below) ─── */}
      <section id="score-dashboard" data-toc-section className="mt-8 scroll-mt-20 bg-white dark:bg-[#1A1A2E] rounded-2xl border border-gray-300 dark:border-gray-600 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF6] px-6 py-4">
          <h2 className="text-xl font-bold text-white tracking-tight">Score Dashboard</h2>
        </div>
        <div className="mt-4 space-y-4">
          {/* A) Full-width horizontal bar comparison chart */}
          <div className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-[#6C5CE7] border-b border-gray-200 pb-2 mb-4">Score Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} tickCount={6} ticks={[0, 2, 4, 5, 6, 8, 10]} />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 12, fill: "#64748B" }} width={80} />
                <Tooltip formatter={(value) => `${Number(value)}/10`} />
                {properties.map((_, i) => (
                  <Bar key={i} dataKey={`p${i}`} name={properties[i].address.length > 40 ? properties[i].address.slice(0, 40) + "..." : properties[i].address} fill={PROPERTY_COLORS[i]} barSize={20} radius={[0, 4, 4, 0]} label={{ position: "right", fontSize: 10, fill: "#64748B", formatter: (v: unknown) => `${v}` }} />
                ))}
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* B) Full-width detailed score ring grid */}
          <div className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-[#6C5CE7] border-b border-gray-200 pb-2 mb-4">Detailed Scores</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-bold text-indigo-950 dark:text-gray-100">Property</th>
                    {categories.map((cat) => (
                      <th key={cat} className="px-3 py-2 text-center text-xs font-bold text-indigo-950 dark:text-gray-100">{cat}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {properties.map((p, pi) => {
                    const scores = [p.overallScore, p.priceScore, p.locationScore, p.valueScore, p.riskScore];
                    return (
                      <tr key={pi} className={pi % 2 === 0 ? "bg-white dark:bg-[#1A1A2E]" : "bg-[#f9fafb] dark:bg-[#15152A]"}>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: PROPERTY_COLORS[pi] }} />
                            <span className="text-xs font-medium text-slate-700 dark:text-gray-300 truncate max-w-[180px] block" title={p.address} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.address}</span>
                          </div>
                        </td>
                        {scores.map((s, si) => {
                          const otherScores = properties.filter((_, oi) => oi !== pi).map(op => {
                            const vals = [op.overallScore, op.priceScore, op.locationScore, op.valueScore, op.riskScore];
                            return vals[si];
                          });
                          const isWinner = s !== null && otherScores.every(os => os === null || (s !== null && s > os));
                          const isTied = s !== null && otherScores.some(os => os === s);
                          return (
                            <td key={si} className="px-2 py-3 text-center">
                              <div className="flex justify-center">
                                <ScoreGauge score={s} label="" size={80} isWinner={isWinner && !isTied} />
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* C) Score Breakdown — moved from standalone section into Score Dashboard */}
          {isPaid && report.scoreAnalysis && Object.keys(report.scoreAnalysis).length > 0 && (
            <div className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-[#6C5CE7] border-b border-gray-200 pb-2 mb-4">Why These Scores?</h3>
              <div className={`grid gap-4 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                {properties.map((p, pi) => (
                  <div key={pi}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[pi] }} />
                      <h4 className="text-sm font-semibold text-indigo-950 dark:text-gray-100 truncate">{p.address}</h4>
                    </div>
                    <div className="space-y-3">
                      {["price", "location", "value", "risk"].map((cat) => {
                        const key = `property${pi + 1}_${cat}`;
                        let text = report.scoreAnalysis?.[key];
                        // FIX 2: If risk explanation is missing or a generic fallback, build from actual riskProfile data
                        if (cat === "risk" && (!text || /unavailable/i.test(text))) {
                          const rp = p.riskProfile;
                          if (rp) {
                            const parts: string[] = [];
                            if (rp.floodZone?.code) parts.push(`flood zone ${rp.floodZone.code} (${rp.floodZone.riskLevel})`);
                            if (rp.radonZone?.riskLabel) parts.push(`radon: ${rp.radonZone.riskLabel}`);
                            if (rp.wildfireRisk?.riskLevel) parts.push(`wildfire: ${rp.wildfireRisk.riskLevel}`);
                            if (rp.earthquakeRisk?.riskLevel) parts.push(`earthquake: ${rp.earthquakeRisk.riskLevel}`);
                            if (rp.leadPaintRisk) parts.push("lead paint risk (pre-1978)");
                            if (rp.asbestosRisk) parts.push("asbestos risk (pre-1980)");
                            if (parts.length > 0) {
                              text = `Risk score based on ${parts.join(", ")}.`;
                            }
                          }
                        }
                        if (!text) return null;
                        return (
                          <div key={cat} className="rounded-lg bg-gray-50 dark:bg-[#15152A] p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">{cat} Score</p>
                            <p className="text-xs leading-relaxed text-slate-700 dark:text-gray-300">{text}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── RED FLAGS IN THIS LISTING (Sprint 1, Feature 5) ─── */}
      {report.redFlags && report.redFlags.length > 0 ? (
        isPaid ? (
          <section id="red-flags" data-toc-section className="mt-8 scroll-mt-20">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white tracking-tight bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF6] px-6 py-4 rounded-t-2xl">
              <AlertTriangle className="h-5 w-5 text-white" />
              Red Flags in This Listing
            </h2>
            <div className={`mt-4 grid gap-4 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
              {report.redFlags.map((rf, ri) => (
                <div key={ri} className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[ri] }} />
                    <h3 className="text-sm font-semibold text-indigo-950 dark:text-gray-100 truncate">{properties[ri]?.address ?? `Property ${ri + 1}`}</h3>
                  </div>
                  {rf.noFlagsDetected ? (
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 px-3 py-3">
                      <Check className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">No major red flags detected</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {rf.rulesFlags.map((flag, fi) => (
                        <div key={`rule-${fi}`} className={`rounded-lg border-l-4 ${flag.severity === "red" ? "border-l-red-500 bg-red-50 dark:bg-red-900/10" : "border-l-amber-500 bg-amber-50 dark:bg-amber-900/10"} px-3 py-2.5`}>
                          <p className={`text-xs leading-relaxed ${flag.severity === "red" ? "text-red-800 dark:text-red-300" : "text-amber-800 dark:text-amber-300"}`}>{flag.text}</p>
                        </div>
                      ))}
                      {rf.aiRedFlags.map((flag, fi) => (
                        <div key={`ai-${fi}`} className="rounded-lg border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-900/10 px-3 py-2.5">
                          <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">{flag}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section id="red-flags" data-toc-section className="mt-8 scroll-mt-20">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white tracking-tight bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF6] px-6 py-4 rounded-t-2xl">
              <AlertTriangle className="h-5 w-5 text-white" />
              Red Flags in This Listing
            </h2>
            <div className="mt-4 relative overflow-hidden rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1A1A2E] shadow-sm">
              <div className="blur-sm select-none pointer-events-none p-5 space-y-3">
                {[1, 2, 3].map(n => (
                  <div key={n} className="rounded-lg border-l-4 border-l-amber-400 bg-amber-50 dark:bg-amber-900/10 px-3 py-2.5">
                    <p className="text-xs text-amber-300">This is a placeholder for a red flag finding that requires the full report to view.</p>
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-[#1A1A2E]/60 gap-2">
                <div className="flex items-center gap-2 text-sm font-medium text-[#6C5CE7]">
                  <Lock className="h-4 w-4" />
                  Unlock red flag analysis for these properties
                </div>
                <button onClick={handleUpgradeCheckout} disabled={upgradeLoading} className="inline-flex items-center gap-1.5 rounded-lg bg-[#6C5CE7] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5B4BD5]">
                  {upgradeLoading ? "Redirecting..." : `Unlock Full Report: ${upgradePrice}`}
                </button>
              </div>
            </div>
          </section>
        )
      ) : null}

      {/* ─── SECTION 3: KEY FACTS TABLE ─── */}
      <section id="key-facts" data-toc-section className="mt-8 scroll-mt-20">
        <h2 className="text-xl font-bold text-white tracking-tight bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF6] px-6 py-4 rounded-t-2xl">Key Facts Comparison</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1A1A2E] shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#6C5CE7]">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white">Feature</th>
                {properties.map((p, i) => (
                  <th key={i} className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[i] }} />
                      {shortAddr(p.address)}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">Winner</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const allRows = buildComparisonRows(properties, listings, isPaid);
                const FREE_ROW_LABELS = ["Price", "Bedrooms", "Bathrooms", "Square Feet"];
                return allRows.map((row, ri) => {
                  const isFreeVisible = isPaid || FREE_ROW_LABELS.includes(row.label);
                  return (
                    <tr key={ri} className={`border-b border-gray-300 dark:border-gray-600/50 ${ri % 2 === 0 ? "bg-white dark:bg-[#1A1A2E]" : "bg-gray-50/50 dark:bg-[#15152A]"}`}>
                      <td className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-gray-400">
                        {!isFreeVisible && <Lock className="inline h-3 w-3 mr-1 text-slate-400" />}
                        {row.label}
                      </td>
                      {row.values.map((val, vi) => {
                        const isHoaWarning = row.label === "HOA Fee" && val.includes("Not listed");
                        return (
                          <td key={vi} className={`px-4 py-2.5 text-center text-xs font-medium ${!isFreeVisible ? "text-slate-300 dark:text-gray-600 select-none blur-sm" : isHoaWarning ? "text-amber-600 dark:text-amber-400" : row.bestIndex === vi ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 font-bold" : "text-slate-700 dark:text-gray-300"}`}>
                            {val}
                          </td>
                        );
                      })}
                      <td className="px-4 py-2.5 text-center">
                        {!isFreeVisible ? (
                          <Lock className="mx-auto h-3 w-3 text-slate-300" />
                        ) : row.bestIndex !== null ? (
                          <Check className="mx-auto h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <span className="text-[10px] text-slate-400">Tie</span>
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
          <div className="mt-3 flex flex-col items-center gap-2 py-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">🔒 +6 more data points in full report</span>
            <button onClick={handleUpgradeCheckout} disabled={upgradeLoading} className="inline-flex items-center gap-1.5 rounded-lg bg-[#6C5CE7] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5B4BD5]">
              {upgradeLoading ? "Redirecting..." : `Unlock Full Report: ${upgradePrice} →`}
            </button>
          </div>
        )}
      </section>

      {/* ─── SECTION 4: PROS AND CONS ─── */}
      <section id="pros-cons" data-toc-section className="mt-8 scroll-mt-20">
        <h2 className="text-xl font-bold text-white tracking-tight bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF6] px-6 py-4 rounded-t-2xl">Pros and Cons</h2>
        <div className="mt-4 bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow mb-4">
          <h3 className="text-lg font-semibold text-[#6C5CE7] border-b border-gray-200 pb-2 mb-4">Overall Comparison at a Glance</h3>
          <ResponsiveContainer width="100%" height={Math.max(120, properties.length * 50)}>
            <BarChart data={properties.map((p, i) => ({ name: shortAddr(p.address), score: p.overallScore, fill: PROPERTY_COLORS[i] }))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
              <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#64748B" }} width={120} />
              <Tooltip formatter={(value) => `${Number(value)}/10`} />
              <Bar dataKey="score" name="Overall Score" barSize={24} radius={[0, 4, 4, 0]} label={{ position: "right", fontSize: 11, fill: "#64748B", formatter: (v: unknown) => `${v}/10` }}>
                {properties.map((_, i) => (
                  <Cell key={i} fill={PROPERTY_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className={`mt-4 grid gap-4 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
          {properties.map((p, i) => {
            const visiblePros = isPaid ? p.pros : p.pros.slice(0, 1);
            const hiddenPros = isPaid ? [] : p.pros.slice(1);
            const visibleCons = isPaid ? p.cons : p.cons.slice(0, 1);
            const hiddenCons = isPaid ? [] : p.cons.slice(1);
            const minBlurredPros = isPaid ? 0 : Math.max(0, 3 - hiddenPros.length);
            const minBlurredCons = isPaid ? 0 : Math.max(0, 2 - hiddenCons.length);
            return (
              <div key={i} className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[i] }} />
                  <h3 className="text-sm font-semibold text-indigo-950 dark:text-gray-100 truncate">{p.address}</h3>
                </div>
                <div className="space-y-2">
                  {visiblePros.map((pro, pi) => (
                    <div key={`pro-${pi}`} className="flex items-start gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 px-3 py-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span className="text-xs text-slate-700 dark:text-gray-300">{pro}</span>
                    </div>
                  ))}
                  {hiddenPros.map((_, pi) => (
                    <div key={`hpro-${pi}`} className="flex items-start gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2 select-none">
                      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <span className="text-xs text-gray-300 dark:text-gray-600 blur-sm">Upgrade to unlock this insight</span>
                    </div>
                  ))}
                  {Array.from({ length: minBlurredPros }).map((_, pi) => (
                    <div key={`pad-pro-${pi}`} className="flex items-start gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2 select-none">
                      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <span className="text-xs text-gray-300 dark:text-gray-600 blur-sm">Upgrade to unlock this insight</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-2">
                  {visibleCons.map((con, ci) => (
                    <div key={`con-${ci}`} className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/10 px-3 py-2">
                      <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                      <span className="text-xs text-slate-700 dark:text-gray-300">{con}</span>
                    </div>
                  ))}
                  {hiddenCons.map((_, ci) => (
                    <div key={`hcon-${ci}`} className="flex items-start gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2 select-none">
                      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <span className="text-xs text-gray-300 dark:text-gray-600 blur-sm">Upgrade to unlock this insight</span>
                    </div>
                  ))}
                  {Array.from({ length: minBlurredCons }).map((_, ci) => (
                    <div key={`pad-con-${ci}`} className="flex items-start gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2 select-none">
                      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <span className="text-xs text-gray-300 dark:text-gray-600 blur-sm">Upgrade to unlock this insight</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {!isPaid && (
          <div className="mt-4 flex flex-col items-center gap-2 py-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">🔒 Full pros and cons analysis unlocked</span>
            <button onClick={handleUpgradeCheckout} disabled={upgradeLoading} className="inline-flex items-center gap-1.5 rounded-lg bg-[#6C5CE7] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5B4BD5]">
              {upgradeLoading ? "Redirecting..." : `Unlock Full Report: ${upgradePrice} →`}
            </button>
          </div>
        )}
      </section>

      {/* ─── SECTION 5: RISK REPORT (always visible — rivvl differentiator) ─── */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-xl font-bold text-white tracking-tight bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF6] px-6 py-4 rounded-t-2xl">
          <Shield className="h-5 w-5 text-white" />
          Property Risk Report
        </h2>
        <div className="mb-4 rounded-lg border border-[#6C5CE7]/20 bg-[#6C5CE7]/5 px-4 py-3">
          <p className="text-xs text-slate-600 dark:text-gray-400">
            This information is rarely disclosed by sellers or agents. rivvl surfaces it automatically so you can make a fully informed decision.
          </p>
        </div>
        {isPaid && (
          <div className="mt-4 bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow mb-4">
            <h3 className="text-lg font-semibold text-[#6C5CE7] border-b border-gray-200 pb-2 mb-4">Risk Profile Comparison</h3>
            <p className="text-[10px] text-slate-400 mb-3">Higher score = lower risk. Unknown data shown as N/A.</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={(() => {
                const riskCats = ["Flood", "Superfund", "Earthquake", "Wildfire", "Air Quality", "Radon"];
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
                    else if (cat === "Air Quality") { const aq = r.airQuality.score; score = aq === null ? 0 : aq < 50 ? 2 : aq <= 70 ? 5 : 9; }
                    else if (cat === "Radon") score = r.radonZone.zone === 1 ? 2 : r.radonZone.zone === 2 ? 5 : r.radonZone.zone === 3 ? 9 : 0;
                    row[`p${pi}`] = score;
                  });
                  return row;
                });
              })()} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 10 }} />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: "#64748B" }} width={90} />
                <Tooltip formatter={(value) => `${Number(value)}/10`} />
                {properties.map((_, i) => (
                  <Bar key={i} dataKey={`p${i}`} name={shortAddr(properties[i].address)} fill={PROPERTY_COLORS[i]} barSize={16} radius={[0, 3, 3, 0]} />
                ))}
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className={`grid gap-4 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
          {properties.map((p, i) => {
            const yearBuilt = listings[i]?.yearBuilt ?? null;
            const riskItems = getRiskItems(p.riskProfile, yearBuilt);
            const FREE_RISK_LABELS = ["Flood Zone", "Lead Paint Era", "Radon Zone"];
            const visibleItems = isPaid ? riskItems : riskItems.filter(item => FREE_RISK_LABELS.includes(item.label));
            const hiddenItems = isPaid ? [] : riskItems.filter(item => !FREE_RISK_LABELS.includes(item.label));

            return (
              <div key={i} className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[i] }} />
                    <h3 className="text-sm font-semibold text-indigo-950 dark:text-gray-100 truncate">{p.address}</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500">Risk Score</span>
                    {p.riskScore !== null ? (
                      <span className={`text-sm font-bold ${scoreColor(p.riskScore)}`}>{p.riskScore}/10</span>
                    ) : (
                      <span className="text-sm font-bold text-gray-400 inline-flex items-center">N/A<InfoTooltip text="Risk score requires at least one environmental data point. Some properties in densely urban areas have limited government risk data available." /></span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {visibleItems.map((item, ri) => (
                    <div key={ri} className={`rounded-lg border-l-4 ${badgeBorderColor(item.level)} ${badgeClasses(item.level)} px-3 py-2.5`}>
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <span className="text-xs font-bold">{item.label}</span>
                        <span className="ml-auto text-xs font-medium">{item.value}</span>
                        {item.tooltip && <InfoTooltip text={item.tooltip} />}
                      </div>
                      <p className="mt-1 text-[10px] leading-relaxed opacity-80">{item.explanation}</p>
                    </div>
                  ))}
                  {hiddenItems.map((item, ri) => (
                    <div key={`hidden-${ri}`} className="relative rounded-lg border-l-4 border-l-gray-300 bg-gray-100 dark:bg-gray-800 px-3 py-2.5 select-none">
                      <div className="blur-sm flex items-center gap-2">
                        {item.icon}
                        <span className="text-xs font-bold text-gray-400">{item.label}</span>
                        <span className="ml-auto text-xs font-medium text-gray-400">████</span>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {!isPaid && (
          <div className="mt-4 flex flex-col items-center gap-2 py-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">🔒 5 more risk factors in full report</span>
            <button onClick={handleUpgradeCheckout} disabled={upgradeLoading} className="inline-flex items-center gap-1.5 rounded-lg bg-[#6C5CE7] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5B4BD5]">
              {upgradeLoading ? "Redirecting..." : `Unlock Full Report: ${upgradePrice} →`}
            </button>
          </div>
        )}
      </section>

      {/* ─── SECTION 6: FINANCIAL SNAPSHOT ─── */}
      <section id="financial-breakdown" data-toc-section className="mt-8 scroll-mt-20">
        <h2 className="flex items-center gap-2 text-xl font-bold text-white tracking-tight bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF6] px-6 py-4 rounded-t-2xl">
          <DollarSign className="h-5 w-5 text-white" />
          {isPaid ? "Full Financial Analysis" : "Financial Snapshot"}
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">Estimated monthly cost of ownership (20% down, 30-year fixed at 7%)</p>

        {!isPaid ? (
          /* Free: mortgage visible, rest blurred */
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {financialData.map((f, i) => (
                <div key={i} className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1A1A2E] p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[i] }} />
                    <h4 className="text-xs font-semibold text-indigo-950 dark:text-gray-100 truncate">{f.shortAddr}</h4>
                    <span className="ml-auto text-lg font-bold text-indigo-950 dark:text-gray-100">${f.mortgage.toLocaleString()}/mo</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Estimated mortgage payment (principal + interest)</p>
                </div>
              ))}
            </div>
            {/* Blurred teaser rows */}
            <div className="relative overflow-hidden rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1A1A2E] shadow-sm">
              <div className="blur-sm select-none pointer-events-none">
                <table className="w-full text-sm">
                  <tbody>
                    {["HOA Fee", "Property Tax", "Insurance", "Total Monthly Cost", "5-Year Total Cost", "Equity After 5 Years"].map((label, ri) => (
                      <tr key={ri} className={`border-b border-gray-300 dark:border-gray-600/50 ${ri % 2 === 0 ? "bg-white dark:bg-[#1A1A2E]" : "bg-gray-50/50 dark:bg-[#15152A]"}`}>
                        <td className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-gray-400">{label}</td>
                        {financialData.map((_, vi) => (
                          <td key={vi} className="px-4 py-2.5 text-center text-xs font-medium text-slate-400">$X,XXX</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-[#1A1A2E]/60 gap-2">
                <div className="flex items-center gap-2 text-sm font-medium text-[#6C5CE7]">
                  <Lock className="h-4 w-4" />
                  Unlock closing costs, insurance estimates, loan programs, tax analysis, and more
                </div>
                <button onClick={handleUpgradeCheckout} disabled={upgradeLoading} className="inline-flex items-center gap-1.5 rounded-lg bg-[#6C5CE7] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5B4BD5]">
                  {upgradeLoading ? "Redirecting..." : `Unlock Full Report: ${upgradePrice} →`}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Paid: comprehensive 12-row financial breakdown */
          <div className="mt-4 space-y-4">
            <div className="overflow-x-auto rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1A1A2E] shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#6C5CE7]">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white">Financial Metric</th>
                    {financialData.map((f, i) => (
                      <th key={i} className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[i] }} />
                          {f.shortAddr}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const rows: { label: string; values: string[]; isBold?: boolean }[] = [
                      { label: "Purchase Price", values: financialData.map(f => f.price > 0 ? `$${f.price.toLocaleString()}` : "N/A") },
                      { label: "Down Payment (20% assumed)", values: financialData.map(f => f.price > 0 ? `$${f.downPayment.toLocaleString()}` : "N/A") },
                      { label: "Loan Amount", values: financialData.map(f => f.price > 0 ? `$${f.loanAmount.toLocaleString()}` : "N/A") },
                      { label: "Monthly Mortgage (30yr fixed, 7% est.)", values: financialData.map(f => f.mortgage > 0 ? `$${f.mortgage.toLocaleString()}` : "N/A") },
                      { label: "Monthly HOA (from listing)", values: listings.map((l) => {
                        const status = l?.hoaStatus ?? 'not_listed';
                        if (status === 'confirmed' && l?.hoaFee != null) return `$${l.hoaFee.toLocaleString()}`;
                        if (status === 'confirmed_none') return "None (confirmed)";
                        return "\u26A0 Not listed";
                      }) },
                      { label: "Est. Monthly Property Tax (1.1% avg)", values: financialData.map(f => f.tax > 0 ? `$${f.tax.toLocaleString()}` : "N/A") },
                      { label: "Est. Monthly Insurance", values: financialData.map(f => f.insurance > 0 ? `$${f.insurance.toLocaleString()}` : "N/A") },
                      { label: "TOTAL ESTIMATED MONTHLY COST", values: financialData.map(f => f.total > 0 ? `$${f.total.toLocaleString()}` : "N/A"), isBold: true },
                      { label: "Annual Total Cost", values: financialData.map(f => f.total > 0 ? `$${(f.total * 12).toLocaleString()}` : "N/A") },
                      { label: "5-Year Total Cost of Ownership", values: financialData.map(f => f.fiveYearCost > 0 ? `$${f.fiveYearCost.toLocaleString()}` : "N/A") },
                      { label: "Est. Home Value in 5 Years (3% appr.)", values: financialData.map(f => f.price > 0 ? `$${Math.round(f.price * Math.pow(1.03, 5)).toLocaleString()}` : "N/A") },
                      { label: "Est. Equity After 5 Years", values: financialData.map(f => {
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
                      <tr key={ri} className={`border-b border-gray-300 dark:border-gray-600/50 ${row.isBold ? "bg-purple-50 dark:bg-purple-900/20 font-bold" : ri % 2 === 0 ? "bg-white dark:bg-[#1A1A2E]" : "bg-gray-50/50 dark:bg-[#15152A]"}`}>
                        <td className={`px-4 py-2.5 text-xs ${row.isBold ? "font-bold text-indigo-950 dark:text-gray-100" : "font-medium text-slate-600 dark:text-gray-400"}`}>{row.label}</td>
                        {row.values.map((val, vi) => (
                          <td key={vi} className={`px-4 py-2.5 text-center text-xs ${row.isBold ? "font-bold text-indigo-950 dark:text-gray-100" : "font-medium text-slate-700 dark:text-gray-300"}`}>{val}</td>
                        ))}
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            {/* ─── CLOSING COST ESTIMATE (Sprint 1, Feature 1) ─── */}
            {report.closingCosts && report.closingCosts.some(cc => cc !== null) && (
              <div id="closing-costs" className="space-y-4 scroll-mt-20">
                <h3 className="flex items-center gap-2 text-sm font-bold text-indigo-950 dark:text-gray-100 mt-2">
                  <DollarSign className="h-4 w-4 text-[#6C5CE7]" />
                  Closing Cost Estimate
                </h3>
                <div className={`grid gap-4 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                  {report.closingCosts.map((cc, ci) => {
                    if (!cc) return (
                      <div key={ci} className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-1.5 mb-3">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[ci] }} />
                          <span className="text-xs font-semibold text-slate-600 dark:text-gray-300 truncate">{shortAddr(properties[ci]?.address ?? `Property ${ci + 1}`)}</span>
                        </div>
                        <p className="text-xs text-slate-500 italic">Closing cost data unavailable for this property.</p>
                      </div>
                    );
                    return (
                    <div key={ci} className="overflow-x-auto rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1A1A2E] shadow-sm">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1E1E30]">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[ci] }} />
                          <span className="text-xs font-semibold text-slate-600 dark:text-gray-300 truncate">{shortAddr(properties[ci]?.address ?? `Property ${ci + 1}`)}</span>
                        </div>
                      </div>
                      <table className="w-full text-xs">
                        <tbody>
                          {[
                            { label: "Down Payment (20%)", value: cc.downPayment },
                            { label: "Loan Origination Fee (1%)", value: cc.loanOriginationFee },
                            { label: "Title Insurance (0.5%)", value: cc.titleInsurance },
                            { label: "Appraisal Fee", value: cc.appraisalFee },
                            { label: "Home Inspection", value: cc.homeInspection },
                            { label: "Attorney/Closing Agent Fee", value: cc.attorneyFee },
                            { label: "Prepaid Property Tax (2 months)", value: cc.prepaidPropertyTax },
                            { label: "First Year Insurance", value: cc.firstYearInsurance },
                            { label: "Escrow Setup (2 mo. insurance + 2 mo. tax)", value: cc.escrowSetup },
                          ].map((row, ri) => (
                            <tr key={ri} className={`border-b border-gray-300 dark:border-gray-600/50 ${ri % 2 === 0 ? "bg-white dark:bg-[#1A1A2E]" : "bg-gray-50/50 dark:bg-[#15152A]"}`}>
                              <td className="px-4 py-2 font-medium text-slate-600 dark:text-gray-400">{row.label}</td>
                              <td className="px-4 py-2 text-right font-medium text-slate-700 dark:text-gray-300">${row.value.toLocaleString()}</td>
                            </tr>
                          ))}
                          <tr className="bg-indigo-50/50 dark:bg-indigo-900/10">
                            <td className="px-4 py-2.5 font-bold text-indigo-950 dark:text-gray-100">Total Cash Needed to Close</td>
                            <td className="px-4 py-2.5 text-right font-bold text-indigo-950 dark:text-gray-100">${cc.totalCashToClose.toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    );
                  })}
                </div>
                <p className="text-[9px] text-slate-400 italic">Closing cost estimates are approximations based on national averages. Your actual costs will vary. Consult your lender for a Loan Estimate.</p>
              </div>
            )}

            {/* ─── INSURANCE COST ESTIMATE (Sprint 1, Feature 2) ─── */}
            {report.insuranceEstimate && report.insuranceEstimate.some(ins => ins !== null) && (
              <div id="insurance-estimate" className="space-y-4 scroll-mt-20">
                <h3 className="flex items-center gap-2 text-sm font-bold text-indigo-950 dark:text-gray-100 mt-2">
                  <Shield className="h-4 w-4 text-[#6C5CE7]" />
                  Insurance Cost Estimate
                </h3>
                <div className={`grid gap-4 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                  {report.insuranceEstimate.map((ins, ii) => {
                    if (!ins) return (
                      <div key={ii} className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[ii] }} />
                          <h4 className="text-xs font-semibold text-indigo-950 dark:text-gray-100 truncate">{shortAddr(properties[ii]?.address ?? `Property ${ii + 1}`)}</h4>
                        </div>
                        <p className="text-xs text-slate-500 italic">Insurance estimate data unavailable for this property.</p>
                      </div>
                    );
                    return (
                    <div key={ii} className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[ii] }} />
                        <h4 className="text-xs font-semibold text-indigo-950 dark:text-gray-100 truncate">{shortAddr(properties[ii]?.address ?? `Property ${ii + 1}`)}</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="rounded-lg bg-gray-50 dark:bg-[#15152A] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Estimated Annual Homeowners Insurance</p>
                          <p className="text-sm font-bold text-indigo-950 dark:text-gray-100">${ins.annualRangeLow.toLocaleString()} to ${ins.annualRangeHigh.toLocaleString()} per year</p>
                          <p className="text-[10px] text-slate-400 mt-1">${ins.monthlyEstimate.toLocaleString()} per month (estimated)</p>
                        </div>
                        {ins.multipliers.length > 0 && (
                          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/10 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600 mb-1">Adjustment Factors</p>
                            <ul className="space-y-1">
                              {ins.multipliers.map((m, mi) => (
                                <li key={mi} className="text-[10px] text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                                  {m}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {/* Flood Insurance (Feature 7) inline */}
                        {ins.floodInsuranceRequired && ins.floodInsuranceEstimateLow && ins.floodInsuranceEstimateHigh && (
                          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600 mb-1">Flood Insurance Required (NFIP Estimate)</p>
                            <p className="text-sm font-bold text-amber-700 dark:text-amber-300">${ins.floodInsuranceEstimateLow.toLocaleString()} to ${ins.floodInsuranceEstimateHigh.toLocaleString()} per year</p>
                          </div>
                        )}
                        <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/10 p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-600 mb-1">Total Estimated Annual Insurance</p>
                          <p className="text-sm font-bold text-indigo-950 dark:text-gray-100">${ins.totalAnnualInsuranceLow.toLocaleString()} to ${ins.totalAnnualInsuranceHigh.toLocaleString()} per year</p>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
                <p className="text-[9px] text-slate-400 italic">Insurance estimates are approximations. Actual premiums depend on your coverage choices, insurer, and property inspection. Get quotes from at least 3 insurers.</p>
              </div>
            )}

            {/* ─── FLOOD INSURANCE DETAIL (Sprint 1, Feature 7) ─── */}
            {report.floodInsurance && report.floodInsurance.length > 0 && report.floodInsurance.some(fi => fi.required || fi.floodZone === "D") && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-indigo-950 dark:text-gray-100 mt-2">
                  <Droplets className="h-4 w-4 text-[#00D2FF]" />
                  Flood Insurance Detail
                </h3>
                <div className={`grid gap-4 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                  {report.floodInsurance.map((fi, fii) => (
                    <div key={fii} className={`rounded-xl border p-4 shadow-sm ${fi.required ? "border-amber-300 dark:border-amber-700/40 bg-amber-50/50 dark:bg-amber-900/10" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A1A2E]"}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[fii] }} />
                        <span className="text-xs font-semibold text-indigo-950 dark:text-gray-100 truncate">{shortAddr(properties[fii]?.address ?? `Property ${fii + 1}`)}</span>
                        <span className={`ml-auto inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${fi.required ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"}`}>
                          Zone {fi.floodZone || "Unknown"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-gray-300">{fi.note}</p>
                      {fi.estimateLow && fi.estimateHigh && fi.required && (
                        <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">Estimated: ${fi.estimateLow.toLocaleString()} to ${fi.estimateHigh.toLocaleString()} per year</p>
                      )}
                      {fi.nfipCoverageNote && (
                        <p className="mt-2 text-[10px] text-slate-500 dark:text-gray-400">{fi.nfipCoverageNote}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── FIRST-TIME BUYER LOAN PROGRAMS (Sprint 1, Feature 6) ─── */}
            {report.loanPrograms && report.loanPrograms.some(lp => lp !== null) && (
              <div id="loan-programs" className="space-y-4 scroll-mt-20">
                <h3 className="flex items-center gap-2 text-sm font-bold text-indigo-950 dark:text-gray-100 mt-2">
                  <Home className="h-4 w-4 text-[#6C5CE7]" />
                  First-Time Buyer Loan Programs
                </h3>
                <div className={`grid gap-4 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                  {report.loanPrograms.map((lp, li) => {
                    if (!lp) return (
                      <div key={li} className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-1.5 mb-3">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[li] }} />
                          <span className="text-xs font-semibold text-slate-600 dark:text-gray-300 truncate">{shortAddr(properties[li]?.address ?? `Property ${li + 1}`)}</span>
                        </div>
                        <p className="text-xs text-slate-500 italic">Loan program data unavailable for this property.</p>
                      </div>
                    );
                    return (
                    <div key={li} className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1A1A2E] shadow-sm overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1E1E30]">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[li] }} />
                          <span className="text-xs font-semibold text-slate-600 dark:text-gray-300 truncate">{shortAddr(properties[li]?.address ?? `Property ${li + 1}`)}</span>
                        </div>
                      </div>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-[#6C5CE7]">
                            <th className="px-4 py-3 text-left font-bold text-white uppercase tracking-wider">Program</th>
                            <th className="px-4 py-3 text-center font-bold text-white uppercase tracking-wider">Min Down</th>
                            <th className="px-4 py-3 text-center font-bold text-white uppercase tracking-wider">Est. Monthly</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lp.programs.map((prog, pi) => (
                            <tr key={pi} className={`border-b border-gray-300 dark:border-gray-600/50 ${pi % 2 === 0 ? "bg-white dark:bg-[#1A1A2E]" : "bg-gray-50/50 dark:bg-[#15152A]"}`}>
                              <td className="px-3 py-2">
                                <p className="font-semibold text-slate-700 dark:text-gray-300">{prog.name}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{prog.keyRequirement}</p>
                              </td>
                              <td className="px-3 py-2 text-center font-medium text-slate-700 dark:text-gray-300">{prog.minDownPayment}</td>
                              <td className="px-3 py-2 text-center font-medium text-slate-700 dark:text-gray-300">{prog.estimatedMonthlyPayment}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="px-4 py-3 bg-indigo-50/50 dark:bg-indigo-900/10 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-600 mb-1">State Program ({lp.state})</p>
                        <p className="text-[10px] text-slate-600 dark:text-gray-400">{lp.stateProgram}</p>
                      </div>
                    </div>
                    );
                  })}
                </div>
                <p className="text-[9px] text-slate-400 italic">Loan program eligibility is estimated based on purchase price and location. Income limits, credit score requirements, and program availability change frequently. Consult a HUD-approved housing counselor or licensed mortgage broker.</p>
              </div>
            )}

            {/* ─── TAX REASSESSMENT RISK (Sprint 1, Feature 3) ─── */}
            {report.taxReassessment && report.taxReassessment.some(tr => tr !== null) && (
              <div id="tax-reassessment" className="space-y-3 scroll-mt-20">
                <h3 className="flex items-center gap-2 text-sm font-bold text-indigo-950 dark:text-gray-100 mt-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Property Tax Reassessment Risk
                </h3>
                <div className={`grid gap-4 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                  {report.taxReassessment.map((tr, ti) => {
                    if (!tr) return (
                      <div key={ti} className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1A1A2E] p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[ti] }} />
                          <span className="text-xs font-semibold text-indigo-950 dark:text-gray-100 truncate">{shortAddr(properties[ti]?.address ?? `Property ${ti + 1}`)}</span>
                        </div>
                        <p className="text-xs text-slate-500 italic">Tax reassessment data unavailable for this property.</p>
                      </div>
                    );
                    return (
                    <div key={ti} className={`rounded-xl border p-4 shadow-sm ${tr.isReassessmentRisk ? "border-amber-300 dark:border-amber-700/40 bg-amber-50/30 dark:bg-amber-900/10" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A1A2E]"}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[ti] }} />
                        <span className="text-xs font-semibold text-indigo-950 dark:text-gray-100 truncate">{shortAddr(properties[ti]?.address ?? `Property ${ti + 1}`)}</span>
                      </div>
                      {tr.isReassessmentRisk && tr.assessedValue && tr.gapPercentage !== null ? (
                        <div className="space-y-2">
                          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600 mb-1">Reassessment Risk Detected</p>
                            <p className="text-xs text-amber-800 dark:text-amber-300">
                              This property is listed at ${tr.listingPrice.toLocaleString()}, which is {tr.gapPercentage}% above its current assessed value of ${tr.assessedValue.toLocaleString()}. After purchase, the county may reassess the property closer to the sale price.
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-lg bg-gray-50 dark:bg-[#15152A] p-2">
                              <p className="text-[10px] text-slate-500">Current Annual Tax (est.)</p>
                              <p className="text-xs font-bold text-slate-700 dark:text-gray-300">{tr.estimatedCurrentAnnualTax !== null ? `$${tr.estimatedCurrentAnnualTax.toLocaleString()}` : "Data unavailable"}</p>
                            </div>
                            <div className="rounded-lg bg-gray-50 dark:bg-[#15152A] p-2">
                              <p className="text-[10px] text-slate-500">Post-Purchase Tax (est.)</p>
                              <p className="text-xs font-bold text-slate-700 dark:text-gray-300">${tr.estimatedPostPurchaseAnnualTax.toLocaleString()}</p>
                            </div>
                          </div>
                          {tr.estimatedAnnualTaxIncrease !== null && tr.estimatedAnnualTaxIncrease > 0 && (
                            <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold">Budget for an additional ${tr.estimatedAnnualTaxIncrease.toLocaleString()} per year in property taxes.</p>
                          )}
                        </div>
                      ) : tr.assessedValue ? (
                        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/10 p-3">
                          <p className="text-xs text-emerald-700 dark:text-emerald-300">Assessed value is close to listing price. Low reassessment risk.</p>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-gray-50 dark:bg-[#15152A] p-3 space-y-2">
                          <p className="text-xs text-slate-700 dark:text-gray-300">
                            Assessed value not available from public records. Based on the purchase price of {`$${tr.listingPrice.toLocaleString()}`} and the average effective property tax rate of 1.1%, estimated annual property taxes are approximately {`$${Math.round(tr.listingPrice * 0.011).toLocaleString()}`} ({`$${Math.round((tr.listingPrice * 0.011) / 12).toLocaleString()}`}/month).
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-gray-400">
                            Virginia property taxes are reassessed periodically. After purchase, your assessed value will likely adjust toward the sale price over the next 1 to 3 years. Request the actual tax bill from the seller or agent to confirm.
                          </p>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Total monthly cost comparison bar chart */}
            <div className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="text-xs font-semibold text-indigo-950 dark:text-gray-100 mb-4">Total Estimated Monthly Cost Comparison</h4>
              <ResponsiveContainer width="100%" height={Math.max(150, financialData.length * 60)}>
                <BarChart data={financialData.map((f, i) => ({ name: f.shortAddr, total: f.total, fill: PROPERTY_COLORS[i] }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `$${v.toLocaleString()}`} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Bar dataKey="total" name="Total Monthly Cost" barSize={20} label={{ position: "right", fontSize: 10, fill: "#64748B", formatter: (v: unknown) => `$${Number(v).toLocaleString()}` }}>
                    {financialData.map((_, i) => (
                      <Cell key={i} fill={PROPERTY_COLORS[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p className="text-[9px] text-slate-400 italic">Monthly costs are estimates for budgeting purposes. Mortgage calculated at 7% fixed rate with 20% down payment. Property tax estimate uses 1.1% annual rate (US average). Insurance estimate based on property size. Actual figures will vary. Consult a mortgage lender for personalized quotes.</p>

            {/* FIX 4: How We Calculate This (expandable) */}
            <div className="rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#15152A] shadow-sm">
              <button
                type="button"
                onClick={() => setShowFinancialMethodology(!showFinancialMethodology)}
                className="flex w-full items-center justify-between px-5 py-3 text-left"
              >
                <span className="text-xs font-semibold text-indigo-950 dark:text-gray-100">How We Calculate This</span>
                {showFinancialMethodology ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </button>
              {showFinancialMethodology && (
                <div className="px-5 pb-5 space-y-3 text-xs leading-relaxed text-slate-600 dark:text-gray-400">
                  <div>
                    <p className="font-semibold text-slate-700 dark:text-gray-300">Monthly Mortgage</p>
                    <p>Calculated using the listed purchase price, assuming 20% down payment and a 30-year fixed mortgage at 7.0% interest rate. This is a standard estimate. Actual rates vary based on your credit score, lender, and market conditions at time of purchase.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 dark:text-gray-300">Property Tax</p>
                    <p>Estimated at 1.1% of the purchase price annually (the US national average effective property tax rate). Actual property taxes vary significantly by county and municipality. Check with the local tax assessor for exact figures.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 dark:text-gray-300">Homeowner&#39;s Insurance</p>
                    <p>Estimated at $150-$250 per month based on property size and type. Actual insurance costs vary by location, coverage level, and insurer.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 dark:text-gray-300">5-Year Cost of Ownership</p>
                    <p>Sum of all estimated monthly costs multiplied by 60 months.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 dark:text-gray-300">Estimated Home Value in 5 Years</p>
                    <p>Calculated assuming 3% annual appreciation, which approximates the long-term US average. Actual appreciation varies significantly by location and market conditions.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 dark:text-gray-300">Estimated Equity After 5 Years</p>
                    <p>Estimated home value in 5 years minus the remaining loan balance after 5 years of payments.</p>
                  </div>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-[10px] italic">All figures are estimates for comparison and budgeting purposes only. rivvl.ai is not a mortgage lender, financial advisor, or appraiser. Always consult qualified professionals for accurate figures before making purchasing decisions.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  PAID-ONLY SECTIONS — or upgrade CTA for free users              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {isPaid ? (
        <>
          {/* ─── HOA RISK INTELLIGENCE (Sprint 1, Feature 4) ─── */}
          <section id="hoa-risk" data-toc-section className="mt-8 scroll-mt-20">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white tracking-tight bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF6] px-6 py-4 rounded-t-2xl">
              <Building2 className="h-5 w-5 text-white" />
              HOA Risk Intelligence
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">Analysis of HOA fee adequacy and potential risks</p>
            <div className={`mt-4 grid gap-4 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
              {properties.map((prop, hi) => {
                const hoa = report.hoaRisk?.[hi] ?? null;
                const listing = listings[hi];
                const hoaStatus = listing?.hoaStatus ?? 'not_listed';
                if (!hoa && hoaStatus === 'confirmed_none') {
                  // Only show "No HOA Confirmed" if the listing explicitly states no HOA
                  return (
                    <div key={hi} className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[hi] }} />
                        <h3 className="text-sm font-semibold text-indigo-950 dark:text-gray-100 truncate">{prop.address}</h3>
                      </div>
                      <div className="rounded-lg border border-emerald-300 dark:border-emerald-700/40 bg-emerald-50 dark:bg-emerald-900/10 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Check className="h-4 w-4 text-emerald-500" />
                          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">No HOA Confirmed</p>
                        </div>
                        <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                          This property has confirmed no HOA. However, verify directly with the listing agent as some community fees may still apply.
                        </p>
                      </div>
                    </div>
                  );
                }
                if (!hoa && hoaStatus !== 'confirmed_none') {
                  // HOA status is not_listed/unknown and AI didn't generate risk data — show discovery questions
                  return (
                    <div key={hi} className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[hi] }} />
                          <h3 className="text-sm font-semibold text-indigo-950 dark:text-gray-100 truncate">{prop.address}</h3>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold text-white bg-amber-500">
                          HOA Unknown
                        </span>
                      </div>
                      <div className="rounded-lg border border-amber-300 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/10 p-4 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <p className="text-xs font-bold text-amber-700 dark:text-amber-300">HOA Status Not Disclosed</p>
                        </div>
                        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                          {`HOA fee was not disclosed in the listing. This requires investigation before making an offer. Undisclosed HOA fees are common for ${listing?.propertyType ?? 'this property type'} and could add $100 to $400 per month to ownership costs.`}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">Discovery Questions to Ask the Listing Agent</p>
                        <ol className="space-y-1.5 list-decimal list-inside">
                          <li className="text-xs text-slate-700 dark:text-gray-300">Does this property have an HOA? If so, what is the monthly fee?</li>
                          <li className="text-xs text-slate-700 dark:text-gray-300">Are there any community association fees, maintenance fees, or shared amenity costs?</li>
                          <li className="text-xs text-slate-700 dark:text-gray-300">Are there any upcoming assessments or neighborhood improvement fees planned?</li>
                          <li className="text-xs text-slate-700 dark:text-gray-300">What are the deed restrictions or CC&Rs for this property?</li>
                          <li className="text-xs text-slate-700 dark:text-gray-300">Are there any required memberships (pool, recreation center, etc.) with separate fees?</li>
                        </ol>
                      </div>
                    </div>
                  );
                }
                // Properties with not_listed HOA that have discovery questions from the AI
                if (hoa && hoa.monthlyFee === 0 && hoaStatus !== 'confirmed') {
                  return (
                    <div key={hi} className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[hi] }} />
                          <h3 className="text-sm font-semibold text-indigo-950 dark:text-gray-100 truncate">{prop.address}</h3>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold text-white bg-amber-500">
                          HOA Unknown
                        </span>
                      </div>
                      <div className="rounded-lg border border-amber-300 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/10 p-4 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <p className="text-xs font-bold text-amber-700 dark:text-amber-300">HOA Status Not Disclosed</p>
                        </div>
                        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                          {`HOA fee was not disclosed in the listing. This requires investigation before making an offer. Undisclosed HOA fees are common for ${listing?.propertyType ?? 'this property type'} and could add $100 to $400 per month to ownership costs.`}
                        </p>
                      </div>
                      {hoa.riskObservations.length > 0 && (
                        <div className="mb-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">Risk Observations</p>
                          <ul className="space-y-1.5">
                            {hoa.riskObservations.map((obs, oi) => (
                              <li key={oi} className="flex items-start gap-2 text-xs text-slate-700 dark:text-gray-300">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                                {obs}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {hoa.agentQuestions.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">Discovery Questions to Ask the Listing Agent</p>
                          <ol className="space-y-1.5 list-decimal list-inside">
                            {hoa.agentQuestions.map((q, qi) => (
                              <li key={qi} className="text-xs text-slate-700 dark:text-gray-300">{q}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  );
                }
                  if (!hoa) return null;
                  const riskColor = hoa.riskLevel === "high" ? "#EF4444" : hoa.riskLevel === "medium" ? "#F59E0B" : "#10B981";
                  const riskLabel = hoa.riskLevel === "high" ? "High Risk" : hoa.riskLevel === "medium" ? "Medium Risk" : "Low Risk";
                  return (
                    <div key={hi} className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[hi] }} />
                          <h3 className="text-sm font-semibold text-indigo-950 dark:text-gray-100 truncate">{properties[hi]?.address ?? `Property ${hi + 1}`}</h3>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold text-white" style={{ backgroundColor: riskColor }}>
                          {riskLabel}
                        </span>
                      </div>
                      <div className="rounded-lg bg-gray-50 dark:bg-[#15152A] p-3 mb-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Monthly HOA Fee</p>
                        <p className="text-sm font-bold text-indigo-950 dark:text-gray-100">${hoa.monthlyFee.toLocaleString()}/month</p>
                      </div>
                      {hoa.riskObservations.length > 0 && (
                        <div className="mb-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">Risk Observations</p>
                          <ul className="space-y-1.5">
                            {hoa.riskObservations.map((obs, oi) => (
                              <li key={oi} className="flex items-start gap-2 text-xs text-slate-700 dark:text-gray-300">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                                {obs}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {hoa.agentQuestions.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">Questions to Ask the HOA</p>
                          <ol className="space-y-1.5 list-decimal list-inside">
                            {hoa.agentQuestions.map((q, qi) => (
                              <li key={qi} className="text-xs text-slate-700 dark:text-gray-300">{q}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

          {/* ─── NEGOTIATION INTELLIGENCE (paid) ─── */}
          {(() => {
            const hasNegData = report.negotiationIntelligence && report.negotiationIntelligence.length > 0;
            if (hasNegData) {
              return (
                <section id="negotiation-intelligence" data-toc-section className="mt-8 scroll-mt-20">
                  <h2 className="flex items-center gap-2 text-xl font-bold text-white tracking-tight bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF6] px-6 py-4 rounded-t-2xl">
                    <Handshake className="h-5 w-5 text-white" />
                    Negotiation Intelligence
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">How much leverage do you have as a buyer?</p>
                  <div className={`mt-4 grid gap-4 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                    {report.negotiationIntelligence!.map((neg, ni) => {
                      const strengthColor = neg.negotiationStrength === "strong_buyer" ? "#10B981" : neg.negotiationStrength === "balanced" ? "#F59E0B" : "#EF4444";
                      const strengthLabel = neg.negotiationStrength === "strong_buyer" ? "Strong Buyer Position" : neg.negotiationStrength === "balanced" ? "Balanced Market" : "Seller's Market";
                      return (
                        <div key={ni} className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[ni] }} />
                              <h3 className="text-sm font-semibold text-indigo-950 dark:text-gray-100 truncate">{properties[ni]?.address ?? `Property ${ni + 1}`}</h3>
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold text-white" style={{ backgroundColor: strengthColor }}>
                              {strengthLabel}
                            </span>
                          </div>
                          <div className="space-y-3">
                            <div className="rounded-lg bg-gray-50 dark:bg-[#15152A] p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Market Position</p>
                              <p className="text-xs leading-relaxed text-slate-700 dark:text-gray-300">{neg.marketPosition}</p>
                            </div>
                            <div className="rounded-lg bg-gray-50 dark:bg-[#15152A] p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Days on Market Analysis</p>
                              <p className="text-xs leading-relaxed text-slate-700 dark:text-gray-300">{neg.daysOnMarketAnalysis}</p>
                            </div>
                            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/10 p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600 mb-1">Suggested Offer Range</p>
                              <p className="text-xs leading-relaxed text-slate-700 dark:text-gray-300">{neg.suggestedOfferRange}</p>
                              <p className="mt-1 text-[9px] italic text-slate-400">Estimate based on available data</p>
                            </div>
                            <div className="rounded-lg bg-gray-50 dark:bg-[#15152A] p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Concession Opportunities</p>
                              <p className="text-xs leading-relaxed text-slate-700 dark:text-gray-300">{neg.concessionOpportunities}</p>
                            </div>
                            {neg.redFlags && neg.redFlags !== "None identified" && (
                              <div className="rounded-lg bg-red-50 dark:bg-red-900/10 p-3">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-red-600 mb-1">Red Flags</p>
                                <p className="text-xs leading-relaxed text-slate-700 dark:text-gray-300">{neg.redFlags}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            }
            // Fallback: generate negotiation intelligence from listing data
            return (
              <section id="negotiation-intelligence" data-toc-section className="mt-8 scroll-mt-20">
                <h2 className="flex items-center gap-2 text-xl font-bold text-white tracking-tight bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF6] px-6 py-4 rounded-t-2xl">
                  <Handshake className="h-5 w-5 text-white" />
                  Negotiation Intelligence
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">How much leverage do you have as a buyer?</p>
                <div className={`mt-4 grid gap-4 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                  {properties.map((prop, pi) => {
                    const listing = listings[pi];
                    const dom = listing?.daysOnMarket ?? null;
                    const reductions = listing?.priceHistory?.filter(e => e.event === "Price Reduced") ?? [];
                    const strength = dom !== null ? (dom > 90 ? "strong_buyer" : dom > 30 ? "balanced" : "sellers_market") : "balanced";
                    const strengthColor = strength === "strong_buyer" ? "#10B981" : strength === "balanced" ? "#F59E0B" : "#EF4444";
                    const strengthLabel = strength === "strong_buyer" ? "Strong Buyer Position" : strength === "balanced" ? "Balanced Market" : "Seller's Market";
                    const price = listing?.price ?? 0;
                    const offerLow = dom !== null && dom > 90 ? Math.round(price * 0.92) : dom !== null && dom > 45 ? Math.round(price * 0.95) : dom !== null && dom > 30 ? Math.round(price * 0.97) : Math.round(price * 0.98);
                    const offerHigh = dom !== null && dom > 90 ? Math.round(price * 0.97) : dom !== null && dom > 45 ? Math.round(price * 0.98) : price;

                    return (
                      <div key={pi} className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[pi] }} />
                            <h3 className="text-sm font-semibold text-indigo-950 dark:text-gray-100 truncate">{prop.address}</h3>
                          </div>
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold text-white" style={{ backgroundColor: strengthColor }}>
                            {strengthLabel}
                          </span>
                        </div>
                        <div className="space-y-3">
                          <div className="rounded-lg bg-gray-50 dark:bg-[#15152A] p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Days on Market Analysis</p>
                            <p className="text-xs leading-relaxed text-slate-700 dark:text-gray-300">
                              {dom !== null
                                ? `This property has been on the market for ${dom} days. ${dom > 90 ? "Properties on market longer than 90 days typically have significant negotiation room — consider offering 5-8% below asking." : dom > 45 ? "At 46-90 days, buyer leverage is moderate — consider offering 3-5% below asking." : dom > 30 ? "At 15-45 days, the market position is balanced — consider offering 1-3% below asking." : "At under 14 days, the seller has a stronger position. Be prepared to offer at or near asking price."}`
                                : "Days on market data is not available. Ask your agent about the listing history and any previous offers."}
                            </p>
                          </div>
                          {price > 0 && (
                            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/10 p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600 mb-1">Suggested Offer Range</p>
                              <p className="text-xs leading-relaxed text-slate-700 dark:text-gray-300">${offerLow.toLocaleString()} – ${offerHigh.toLocaleString()}</p>
                              <p className="mt-1 text-[9px] italic text-slate-400">AI Estimate based on days on market and listing data</p>
                            </div>
                          )}
                          <div className="rounded-lg bg-gray-50 dark:bg-[#15152A] p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Concession Opportunities</p>
                            <p className="text-xs leading-relaxed text-slate-700 dark:text-gray-300">
                              {reductions.length > 0
                                ? `This property has had ${reductions.length} price reduction(s), signaling seller flexibility. Consider asking for closing cost credits, repair credits, or appliance inclusions.`
                                : "No price reductions detected yet. You can still ask for closing cost credits, home warranty inclusion, or repair credits based on inspection findings."}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })()}

          {/* ─── NEIGHBORHOOD INTELLIGENCE (paid) ─── */}
          <section id="neighborhood" data-toc-section className="mt-8 scroll-mt-20">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white tracking-tight bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF6] px-6 py-4 rounded-t-2xl">
              <MapPin className="h-5 w-5 text-white" />
              Neighborhood Intelligence
            </h2>
            {report.neighborhoodIntelligenceStructured && report.neighborhoodIntelligenceStructured.length > 0 ? (
              <>
                <div className={`mt-4 grid gap-4 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                  {report.neighborhoodIntelligenceStructured.map((data, pi) => (
                    <div key={pi} className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[pi] }} />
                        <h3 className="text-sm font-semibold" style={{ color: PROPERTY_COLORS[pi] }}>{properties[pi]?.address ?? `Property ${pi + 1}`}</h3>
                      </div>
                      <ul className="space-y-2">
                        {data.bullets.map((bullet, bi) => (
                          <li key={bi} className="flex items-start gap-2 text-xs text-slate-700 dark:text-gray-300">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: PROPERTY_COLORS[pi] }} />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                {report.neighborhoodIntelligenceStructured[0]?.verdict && (
                  <div className="mt-3 rounded-xl border border-[#6C5CE7]/20 bg-[#6C5CE7]/5 px-4 py-3">
                    <p className="text-xs font-semibold text-[#6C5CE7]">Comparison Verdict</p>
                    <p className="text-sm text-slate-700 dark:text-gray-300 mt-1">{report.neighborhoodIntelligenceStructured[0].verdict}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-4 bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm leading-relaxed text-slate-700 dark:text-gray-300">
                  {report.neighborhoodIntelligence || (() => {
                    const cities = Array.from(new Set(listings.map(l => l.fullAddress?.split(",")[1]?.trim()).filter(Boolean)));
                    const states = Array.from(new Set(listings.map(l => l.fullAddress?.split(",")[2]?.trim()?.split(" ")[0]).filter(Boolean)));
                    const cityStr = cities.length > 0 ? cities.join(" / ") : "this area";
                    const stateStr = states.length > 0 ? states[0] : "";
                    return `The properties being compared are located in ${cityStr}${stateStr ? `, ${stateStr}` : ""}. Neighborhood data was not available for this comparison. Visit census.gov or city-data.com with the property address for local demographic information.`;
                  })()}
                </p>
              </div>
            )}
          </section>

          {/* ─── NEARBY SCHOOLS (paid, real data) ─── */}
          {isPaid && paidData?.schools && paidData.schools.some(s => s.length > 0) ? (
            <section id="schools" data-toc-section className="mt-8 scroll-mt-20">
              <h2 className="flex items-center gap-2 text-xl font-bold text-white tracking-tight bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF6] px-6 py-4 rounded-t-2xl">
                <GraduationCap className="h-5 w-5 text-white" />
                Nearby Schools
              </h2>
              <div className={`mt-4 grid gap-4 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                {paidData.schools.map((schoolList, pi) => {
                  // Group by level and limit 3 per level
                  const grouped: Record<string, NearbySchool[]> = {};
                  for (const s of schoolList) {
                    if (!grouped[s.level]) grouped[s.level] = [];
                    if (grouped[s.level].length < 3) grouped[s.level].push(s);
                  }
                  const displaySchools = Object.values(grouped).flat().sort((a, b) => a.distanceMiles - b.distanceMiles).slice(0, 9);

                  return (
                    <div key={pi} className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[pi] }} />
                        <h3 className="text-sm font-semibold text-indigo-950 dark:text-gray-100 truncate">{properties[pi]?.address ?? `Property ${pi + 1}`}</h3>
                      </div>
                      {displaySchools.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-[#6C5CE7]">
                                <th className="px-4 py-3 text-left font-bold text-white uppercase tracking-wider">School Name</th>
                                <th className="px-4 py-3 text-center font-bold text-white uppercase tracking-wider">Level</th>
                                <th className="px-4 py-3 text-center font-bold text-white uppercase tracking-wider">Distance</th>
                                <th className="px-4 py-3 text-center font-bold text-white uppercase tracking-wider">View Ratings</th>
                              </tr>
                            </thead>
                            <tbody>
                              {displaySchools.map((school, si) => {
                                const levelColor = school.level === 'Elementary' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                  : school.level === 'Middle' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                  : school.level === 'High' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                  : school.level === 'Middle/High' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
                                return (
                                  <tr key={si} className={si % 2 === 0 ? "bg-white dark:bg-[#1A1A2E]" : "bg-gray-50/50 dark:bg-[#15152A]"}>
                                    <td className="px-2 py-1.5 font-medium text-slate-700 dark:text-gray-300">{school.name}</td>
                                    <td className="px-2 py-1.5 text-center">
                                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${levelColor}`}>{school.level}</span>
                                    </td>
                                    <td className="px-2 py-1.5 text-center text-slate-500 dark:text-gray-400">{school.distanceMiles} mi</td>
                                    <td className="px-2 py-1.5 text-center">
                                      <a href={school.greatSchoolsSearchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-purple-300 dark:border-purple-700 px-2 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                                        View on GreatSchools <ExternalLink className="h-2.5 w-2.5" />
                                      </a>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 dark:text-gray-400 italic">No public schools found within 2 miles of this address.</p>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-[9px] text-slate-400 italic">School directory data from the National Center for Education Statistics (NCES). For ratings, test scores, and parent reviews, click &apos;View on GreatSchools&apos; for each school. School attendance boundaries may differ from proximity. Confirm your assigned school with the local school district.</p>
            </section>
          ) : isPaid && (
            <section id="schools" data-toc-section className="mt-8 scroll-mt-20">
              <h2 className="flex items-center gap-2 text-xl font-bold text-white tracking-tight bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF6] px-6 py-4 rounded-t-2xl">
                <GraduationCap className="h-5 w-5 text-white" />
                School District Context
              </h2>
              {report.schoolDistrictContextStructured && report.schoolDistrictContextStructured.length > 0 ? (
                <>
                  <div className={`mt-4 grid gap-4 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                    {report.schoolDistrictContextStructured.map((data, pi) => (
                      <div key={pi} className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[pi] }} />
                          <h3 className="text-sm font-semibold" style={{ color: PROPERTY_COLORS[pi] }}>{properties[pi]?.address ?? `Property ${pi + 1}`}</h3>
                        </div>
                        <ul className="space-y-2">
                          {data.bullets.map((bullet, bi) => (
                            <li key={bi} className="flex items-start gap-2 text-xs text-slate-700 dark:text-gray-300">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: PROPERTY_COLORS[pi] }} />
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  {report.schoolDistrictContextStructured[0]?.verdict && (
                    <div className="mt-3 rounded-xl border border-[#6C5CE7]/20 bg-[#6C5CE7]/5 px-4 py-3">
                      <p className="text-xs font-semibold text-[#6C5CE7]">Comparison Verdict</p>
                      <p className="text-sm text-slate-700 dark:text-gray-300 mt-1">{report.schoolDistrictContextStructured[0].verdict}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-4 bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-gray-300">
                    {report.schoolDistrictContext || "School district data was not available for these addresses. Visit GreatSchools.org or your county school district website to verify school assignments."}
                  </p>
                  <p className="mt-2 text-[9px] text-slate-400 italic">School data sourced from public records. Confirm current school assignments with the local school district.</p>
                </div>
              )}
            </section>
          )}

          {/* ─── SAFETY CONTEXT (paid, crime data) ─── */}
          {isPaid && paidData?.crimeData && paidData.crimeData.some(c => c !== null) ? (
            <section id="safety-crime" data-toc-section className="mt-8 scroll-mt-20">
              <h2 className="flex items-center gap-2 text-xl font-bold text-white tracking-tight bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF6] px-6 py-4 rounded-t-2xl">
                <Shield className="h-5 w-5 text-white" />
                Safety Context
              </h2>
              <div className={`mt-4 grid gap-4 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                {paidData.crimeData.map((crime, ci) => (
                  <div key={ci} className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[ci] }} />
                      <h3 className="text-sm font-semibold text-indigo-950 dark:text-gray-100 truncate">{properties[ci]?.address ?? `Property ${ci + 1}`}</h3>
                    </div>
                    {crime ? (
                      <div className="space-y-3">
                        {/* Violent Crime Rate */}
                        <div className="rounded-lg bg-gray-50 dark:bg-[#15152A] p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Violent Crime Rate</span>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${crime.vsNationalViolent === 'below' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : crime.vsNationalViolent === 'above' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                              {crime.vsNationalViolent === 'below' ? 'Below Average' : crime.vsNationalViolent === 'above' ? 'Above Average' : 'Average'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-gray-300">{crime.violentCrimeRate.toLocaleString()} per 100,000 residents</p>
                          <div className="mt-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                            <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${Math.min(100, (crime.violentCrimeRate / 800) * 100)}%`, backgroundColor: crime.vsNationalViolent === 'below' ? '#10B981' : crime.vsNationalViolent === 'above' ? '#EF4444' : '#F59E0B' }} />
                            <div className="absolute top-0 h-full w-0.5 bg-slate-500" style={{ left: `${(380 / 800) * 100}%` }} title="National average: 380" />
                          </div>
                          <p className="mt-1 text-[9px] text-slate-400">National average: ~380 per 100,000</p>
                        </div>
                        {/* Property Crime Rate */}
                        <div className="rounded-lg bg-gray-50 dark:bg-[#15152A] p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Property Crime Rate</span>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${crime.vsNationalProperty === 'below' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : crime.vsNationalProperty === 'above' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                              {crime.vsNationalProperty === 'below' ? 'Below Average' : crime.vsNationalProperty === 'above' ? 'Above Average' : 'Average'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-gray-300">{crime.propertyCrimeRate.toLocaleString()} per 100,000 residents</p>
                          <div className="mt-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                            <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${Math.min(100, (crime.propertyCrimeRate / 4000) * 100)}%`, backgroundColor: crime.vsNationalProperty === 'below' ? '#10B981' : crime.vsNationalProperty === 'above' ? '#EF4444' : '#F59E0B' }} />
                            <div className="absolute top-0 h-full w-0.5 bg-slate-500" style={{ left: `${(2100 / 4000) * 100}%` }} title="National average: 2100" />
                          </div>
                          <p className="mt-1 text-[9px] text-slate-400">National average: ~2,100 per 100,000</p>
                        </div>
                        <p className="text-[9px] text-slate-400 italic">{crime.dataNote}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-gray-400 italic">Crime data not available for this jurisdiction.</p>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[9px] text-slate-400 italic">Crime statistics from FBI Uniform Crime Reporting. These are city/jurisdiction-level figures, not neighborhood or street-level data. They reflect reported crimes only.</p>
            </section>
          ) : isPaid && (
            <section id="safety-crime" data-toc-section className="mt-8 scroll-mt-20">
              <h2 className="flex items-center gap-2 text-xl font-bold text-white tracking-tight bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF6] px-6 py-4 rounded-t-2xl">
                <Shield className="h-5 w-5 text-white" />
                Safety and Crime Context
              </h2>
              <div className="mt-4 bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  {(() => {
                    const cities = Array.from(new Set(listings.map(l => l.fullAddress?.split(",")[1]?.trim()).filter(Boolean)));
                    const cityStr = cities.length > 0 ? cities.join(" and ") : "this area";
                    return (
                      <>
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-gray-300">
                          Crime statistics for {cityStr} could not be retrieved from the FBI Uniform Crime Reporting database at the time of report generation.
                        </p>
                        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/10 p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600 mb-1">What To Do</p>
                          <p className="text-xs leading-relaxed text-slate-700 dark:text-gray-300">
                            Neighborhood-level crime data is not available for this area from federal databases. Search &quot;{cityStr} crime statistics&quot; or contact the local police department&apos;s public records office for current data.
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <p className="mt-2 text-[9px] text-slate-400 italic">State-level crime data from FBI UCR public records. Always verify current crime statistics with local law enforcement for neighborhood-level accuracy.</p>
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
            <section id="price-history" data-toc-section className="mt-8 scroll-mt-20">
              <h2 className="flex items-center gap-2 text-xl font-bold text-white tracking-tight bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF6] px-6 py-4 rounded-t-2xl">
                <History className="h-5 w-5 text-white" />
                Price History
              </h2>

              {/* Side-by-side comparison table */}
              <div className="mt-4 overflow-x-auto rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1A1A2E] shadow-sm">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-gray-400"></th>
                      {propertyStats.map((ps, idx) => (
                        <th key={idx} className="px-4 py-2.5 text-left font-semibold text-slate-700 dark:text-gray-200">
                          <div className="flex items-center gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[idx] }} />
                            <span className="truncate max-w-[200px]">{ps.address.length > 35 ? ps.address.slice(0, 35) + '...' : ps.address}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <td className="px-4 py-2 font-medium text-slate-600 dark:text-gray-400">Last Sale Price</td>
                      {propertyStats.map((ps, idx) => {
                        const best = propertyStats.every(other => ps.lastSalePrice == null || other.lastSalePrice == null || ps.lastSalePrice <= (other.lastSalePrice ?? Infinity));
                        return (
                          <td key={idx} className={`px-4 py-2 text-slate-700 dark:text-gray-300 ${best && ps.lastSalePrice != null ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}>
                            {ps.lastSalePrice != null ? `$${ps.lastSalePrice.toLocaleString()}` : 'Not available'}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <td className="px-4 py-2 font-medium text-slate-600 dark:text-gray-400">Last Sale Date</td>
                      {propertyStats.map((ps, idx) => (
                        <td key={idx} className="px-4 py-2 text-slate-700 dark:text-gray-300">
                          {ps.lastSaleDate ? (() => { try { return new Date(ps.lastSaleDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }); } catch { return ps.lastSaleDate; } })() : '\u2014'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <td className="px-4 py-2 font-medium text-slate-600 dark:text-gray-400">Total Appreciation</td>
                      {propertyStats.map((ps, idx) => {
                        const best = propertyStats.every(other => other.appreciationPct == null || (ps.appreciationPct != null && ps.appreciationPct >= (other.appreciationPct ?? -Infinity)));
                        return (
                          <td key={idx} className={`px-4 py-2 text-slate-700 dark:text-gray-300 ${best && ps.appreciation != null ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}>
                            {ps.appreciation != null && ps.appreciationPct != null
                              ? <span className={ps.appreciation >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                                  {ps.appreciation >= 0 ? '+' : ''}${Math.abs(ps.appreciation).toLocaleString()} ({ps.appreciation >= 0 ? '+' : ''}{ps.appreciationPct.toFixed(1)}%)
                                </span>
                              : '\u2014'}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <td className="px-4 py-2 font-medium text-slate-600 dark:text-gray-400">Price Reductions</td>
                      {propertyStats.map((ps, idx) => {
                        const best = ps.reductionCount === 0 && ps.events.length > 0;
                        return (
                          <td key={idx} className={`px-4 py-2 text-slate-700 dark:text-gray-300 ${best ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}>
                            {ps.events.length > 0
                              ? (ps.reductionCount > 0
                                ? `${ps.reductionCount} reduction${ps.reductionCount > 1 ? 's' : ''} (-$${ps.totalReduction.toLocaleString()})`
                                : 'No reductions')
                              : 'Unknown'}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-600 dark:text-gray-400">Days on Market</td>
                      {propertyStats.map((ps, idx) => {
                        const best = propertyStats.every(other => other.daysOnMarket == null || (ps.daysOnMarket != null && ps.daysOnMarket <= (other.daysOnMarket ?? Infinity)));
                        return (
                          <td key={idx} className={`px-4 py-2 text-slate-700 dark:text-gray-300 ${best && ps.daysOnMarket != null ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}>
                            {ps.daysOnMarket != null ? `${ps.daysOnMarket} days` : 'Unknown'}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* AI narrative comparison */}
              {report.priceHistoryComparison && (
                <div className="mt-4 bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-gray-300">{report.priceHistoryComparison}</p>
                </div>
              )}

              {/* Per-property sales history and insights */}
              <div className={`mt-4 grid gap-4 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                {properties.map((prop, idx) => {
                  const listing = listings[idx];
                  const events = listing?.priceHistory?.slice(0, 8) ?? [];
                  const insights = report.priceHistoryInsights?.[idx] ?? [];
                  const ph = paidData?.priceHistory?.[idx];
                  const lastSalePrice = listing?.lastSalePrice ?? ph?.lastSalePrice ?? null;
                  const lastSaleDate = listing?.lastSaleDate ?? ph?.lastSaleDate ?? null;

                  return (
                    <div key={idx} className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[idx] }} />
                        <h3 className="text-sm font-semibold text-indigo-950 dark:text-gray-100 truncate">{prop.address}</h3>
                      </div>

                      {/* Sales History Table */}
                      {events.length > 0 ? (
                        <div className="mb-4">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">Sales History</p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                  <th className="px-2 py-1.5 text-left font-semibold text-slate-600 dark:text-gray-400">Date</th>
                                  <th className="px-2 py-1.5 text-left font-semibold text-slate-600 dark:text-gray-400">Event</th>
                                  <th className="px-2 py-1.5 text-right font-semibold text-slate-600 dark:text-gray-400">Price</th>
                                  <th className="px-2 py-1.5 text-right font-semibold text-slate-600 dark:text-gray-400">Change</th>
                                </tr>
                              </thead>
                              <tbody>
                                {events.map((ev, evi) => {
                                  const rowBg = ev.event === "Sold" ? ''
                                    : ev.event === "Listed" || ev.event === "Relisted" ? 'bg-blue-50 dark:bg-blue-900/10'
                                    : ev.event === "Price Reduced" ? 'bg-red-50 dark:bg-red-900/10'
                                    : ev.event === "Price Increased" ? 'bg-orange-50 dark:bg-orange-900/10'
                                    : '';
                                  return (
                                    <tr key={evi} className={`border-b border-gray-100 dark:border-gray-800 ${rowBg}`}>
                                      <td className="px-2 py-1.5 text-slate-700 dark:text-gray-300">{ev.date || '\u2014'}</td>
                                      <td className="px-2 py-1.5 text-slate-700 dark:text-gray-300 font-medium">{ev.event}</td>
                                      <td className="px-2 py-1.5 text-right text-slate-700 dark:text-gray-300">
                                        {ev.price != null ? `$${ev.price.toLocaleString()}` : '\u2014'}
                                      </td>
                                      <td className={`px-2 py-1.5 text-right ${ev.event === 'Price Reduced' ? 'text-red-600' : 'text-slate-700 dark:text-gray-300'}`}>
                                        {ev.priceChange != null ? `${ev.priceChange >= 0 ? '+' : ''}$${ev.priceChange.toLocaleString()}` : '\u2014'}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : lastSalePrice != null ? (
                        <div className="mb-4">
                          <div className="rounded-lg bg-gray-50 dark:bg-[#15152A] p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Last Sold</p>
                            <p className="text-xs text-slate-700 dark:text-gray-300">
                              {lastSaleDate ? (() => { try { return new Date(lastSaleDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }); } catch { return lastSaleDate; } })() : 'Date unknown'} for ${lastSalePrice.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic mb-4">Price history could not be retrieved for this property. The property may not have recent sale records in public databases, or this may be a new construction. We recommend requesting the seller&apos;s disclosure for ownership history.</p>
                      )}

                      {/* Appreciation from paidData if available */}
                      {ph && ph.appreciationAmount !== null && ph.appreciationPercent !== null && (
                        <div className="rounded-lg bg-gray-50 dark:bg-[#15152A] p-3 mb-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Appreciation</p>
                          <p className="text-xs text-slate-700 dark:text-gray-300">
                            <span className={ph.appreciationAmount >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                              {ph.appreciationAmount >= 0 ? '+' : ''}${Math.abs(ph.appreciationAmount).toLocaleString()} ({ph.appreciationAmount >= 0 ? '+' : ''}{ph.appreciationPercent}%)
                            </span> since purchase
                          </p>
                        </div>
                      )}

                      {/* Key Insights */}
                      {insights.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">Key Insights</p>
                          <ul className="space-y-1.5">
                            {insights.map((insight, ii) => (
                              <li key={ii} className="flex items-start gap-2 text-xs text-slate-700 dark:text-gray-300">
                                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                {insight}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
            );
          })()}

          {/* ─── MAINTENANCE AND AGE ANALYSIS (paid) ─── */}
          {report.maintenanceAnalysis && report.maintenanceAnalysis.length > 0 && (
            <section id="maintenance-analysis" data-toc-section className="mt-8 scroll-mt-20">
              <h2 className="flex items-center gap-2 text-xl font-bold text-white tracking-tight bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF6] px-6 py-4 rounded-t-2xl">
                <Wrench className="h-5 w-5 text-white" />
                Maintenance and Age Analysis
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">Based on year built, which systems may need attention?</p>
              <div className={`mt-4 grid gap-4 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                {report.maintenanceAnalysis.map((propItems, pi) => {
                  const totalRisk = propItems.filter(item => item.riskLevel === "red" || item.riskLevel === "yellow").length;
                  return (
                    <div key={pi} className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[pi] }} />
                        <h3 className="text-sm font-semibold text-indigo-950 dark:text-gray-100 truncate">{properties[pi]?.address ?? `Property ${pi + 1}`}</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-[#6C5CE7]">
                              <th className="px-4 py-3 text-left font-bold text-white uppercase tracking-wider">System</th>
                              <th className="px-4 py-3 text-left font-bold text-white uppercase tracking-wider">Lifespan</th>
                              <th className="px-4 py-3 text-center font-bold text-white uppercase tracking-wider">Risk</th>
                              <th className="px-4 py-3 text-right font-bold text-white uppercase tracking-wider">Est. Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                            {propItems.map((item, ii) => (
                              <tr key={ii} className={`border-b border-gray-300 dark:border-gray-600 ${ii % 2 === 0 ? "bg-white dark:bg-[#1A1A2E]" : "bg-gray-50 dark:bg-[#15152A]"}`}>
                                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-gray-200 bg-gray-50 dark:bg-[#15152A]">{item.system}</td>
                                <td className="px-4 py-3 text-slate-600 dark:text-gray-400">{item.typicalLifespan}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${item.riskLevel === "green" ? "bg-emerald-500" : item.riskLevel === "yellow" ? "bg-amber-500" : "bg-red-500"}`} />
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600 dark:text-gray-400">{item.estimatedCost}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-[10px] text-slate-500">
                          {totalRisk === 0
                            ? "No major maintenance concerns identified for the next 5 years."
                            : `${totalRisk} system${totalRisk > 1 ? "s" : ""} may need attention in the next 5 years.`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-[9px] text-slate-400 italic">Cost estimates are industry standard ranges, not property-specific quotes. Always get professional inspections before purchasing.</p>
            </section>
          )}

          {/* ─── INVESTMENT OUTLOOK (paid) ─── */}
          {(report.investmentOutlook || report.investmentPerspective || report.investmentOutlookStructured) && (
            <section id="investment-outlook" data-toc-section className="mt-8 scroll-mt-20">
              <h2 className="flex items-center gap-2 text-xl font-bold text-white tracking-tight bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF6] px-6 py-4 rounded-t-2xl">
                <TrendingUp className="h-5 w-5 text-white" />
                Investment Outlook
              </h2>
              {report.investmentOutlookStructured && report.investmentOutlookStructured.length > 0 ? (
                <>
                  <div className={`mt-4 grid gap-4 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                    {report.investmentOutlookStructured.map((data, pi) => (
                      <div key={pi} className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[pi] }} />
                          <h3 className="text-sm font-semibold" style={{ color: PROPERTY_COLORS[pi] }}>{properties[pi]?.address ?? `Property ${pi + 1}`}</h3>
                        </div>
                        <ul className="space-y-2">
                          {data.bullets.map((bullet, bi) => (
                            <li key={bi} className="flex items-start gap-2 text-xs text-slate-700 dark:text-gray-300">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: PROPERTY_COLORS[pi] }} />
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  {report.investmentOutlookStructured[0]?.verdict && (
                    <div className="mt-3 rounded-xl border border-[#6C5CE7]/20 bg-[#6C5CE7]/5 px-4 py-3">
                      <p className="text-xs font-semibold text-[#6C5CE7]">Comparison Verdict</p>
                      <p className="text-sm text-slate-700 dark:text-gray-300 mt-1">{report.investmentOutlookStructured[0].verdict}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-4 bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-gray-300">{report.investmentOutlook || report.investmentPerspective}</p>
                </div>
              )}
            </section>
          )}

          {/* ─── DETAILED SIDE-BY-SIDE COMPARISON (paid) ─── */}
          {report.detailedComparison && report.detailedComparison.length > 0 && (
            <section id="side-by-side" data-toc-section className="mt-8 scroll-mt-20">
              <h2 className="text-xl font-bold text-white tracking-tight bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF6] px-6 py-4 rounded-t-2xl">Detailed Side-by-Side Comparison</h2>
              <div className="mt-4 overflow-x-auto rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1A1A2E] shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#6C5CE7]">
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white">Category</th>
                      {properties.map((p, i) => (
                        <th key={i} className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[i] }} />
                            {shortAddr(p.address)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.detailedComparison.map((row, ri) => (
                      <tr key={ri} className={`border-b border-gray-100 dark:border-gray-700 ${ri % 2 === 0 ? "bg-white dark:bg-[#1A1A2E]" : "bg-gray-50/50 dark:bg-[#15152A]"}`}>
                        <td className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-gray-400">{row.label}</td>
                        {row.values.map((val, vi) => (
                          <td key={vi} className="px-4 py-2.5 text-center text-xs font-medium text-slate-700 dark:text-gray-300">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
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
              <section id="buyer-checklist" data-toc-section className="mt-8 scroll-mt-20">
                <h2 className="flex items-center gap-2 text-xl font-bold text-white tracking-tight bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF6] px-6 py-4 rounded-t-2xl">
                  <Shield className="h-5 w-5 text-white" />
                  Buyer Protection Checklist
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">{isDefault ? "Essential items to verify before making an offer on any property." : "Things to verify before making an offer, personalized to these properties."}</p>
                <div className={`mt-4 ${isDefault ? "" : `grid gap-4 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}`}>
                  {checklistData.map((items, pi) => (
                    <div key={pi} className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-300 dark:border-gray-600 p-6 shadow-sm hover:shadow-md transition-shadow">
                      {!isDefault && (
                        <div className="flex items-center gap-2 mb-4">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[pi] }} />
                          <h3 className="text-sm font-semibold text-indigo-950 dark:text-gray-100 truncate">{properties[pi]?.address ?? `Property ${pi + 1}`}</h3>
                        </div>
                      )}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-[#6C5CE7]">
                              <th className="px-4 py-3 text-left font-bold text-white uppercase tracking-wider">Item to Verify</th>
                              <th className="px-4 py-3 text-left font-bold text-white uppercase tracking-wider">Why It Matters</th>
                              <th className="px-4 py-3 text-left font-bold text-white uppercase tracking-wider">How to Find Out</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item, ii) => (
                              <tr key={ii} className={`border-b border-gray-300 dark:border-gray-600 ${ii % 2 === 0 ? "bg-white dark:bg-[#1A1A2E]" : "bg-gray-50 dark:bg-[#15152A]"}`}>
                                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-gray-200 bg-gray-50 dark:bg-[#15152A]">{item.item}</td>
                                <td className="px-4 py-3 text-slate-600 dark:text-gray-400">{item.why}</td>
                                <td className="px-4 py-3 text-slate-600 dark:text-gray-400">{item.howToFind}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })()}

          {/* ─── QUESTIONS TO ASK YOUR AGENT (paid) ─── */}
          {(() => {
            const categoryColors: Record<string, string> = {
              'Financial': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
              'Condition': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
              'HOA': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
              'Legal': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
              'Neighborhood': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
              'Disclosure': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
              'Negotiation': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
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
              <section id="questions-to-ask" data-toc-section className="mt-8 scroll-mt-20">
                <h2 className="flex items-center gap-2 text-xl font-bold text-white tracking-tight bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF6] px-6 py-4 rounded-t-2xl">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  Smart Questions to Ask Your Agent
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">Based on the data we gathered for these properties, here are the most important questions a buyer should ask before making an offer.</p>
                <div className="mt-4 space-y-4">
                  {Object.entries(grouped).map(([propName, qs]) => (
                    <div key={propName}>
                      <h4 className="text-sm font-semibold text-indigo-950 dark:text-gray-100 mb-2">{propName}</h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {qs.map((q, qi) => (
                          <div key={qi} className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1A1A2E] p-4 shadow-sm">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold mb-2 ${categoryColors[q.category] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>{q.category}</span>
                            <p className="text-xs font-semibold text-slate-700 dark:text-gray-300">{q.question}</p>
                            <p className="mt-1.5 text-[10px] text-slate-400">Why it matters: {q.whyItMatters}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })()}

          {/* ─── OUR RECOMMENDATION (combined Our Pick + Final Verdict) ─── */}
          <section id="our-pick" data-toc-section className="mt-8 scroll-mt-20">
            {report.ourPick ? (
              <div className="bg-gradient-to-br from-[#6C5CE7] to-[#4834D4] rounded-2xl p-8 text-white shadow-xl">
                <div className="flex flex-col items-center text-center">
                  <Trophy className="h-12 w-12 text-amber-300" />
                  <p className="mt-3 text-sm font-bold uppercase tracking-widest text-purple-200">Our Pick</p>
                  <p className="mt-2 text-2xl font-black text-white">
                      {report.ourPick.address || properties[report.ourPick.winner - 1]?.address || `Property ${report.ourPick.winner}`}
                    </p>
                </div>
                <div className="mt-6 border-t border-white/20 pt-6 text-left">
                  <p className="text-xs font-bold uppercase tracking-widest text-purple-200 mb-3">Why We Chose This</p>
                  {report.ourPick.bullets && report.ourPick.bullets.length > 0 ? (
                    <ul className="space-y-1.5">
                      {report.ourPick.bullets.map((b, bi) => (
                        <li key={bi} className="flex items-start gap-2 text-sm text-white/90">
                          <Check className="mt-0.5 h-4 w-4 text-emerald-300 shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <div className="mt-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-purple-200 mb-3">Our Analysis</p>
                  <p className="text-sm leading-relaxed text-purple-100">
                    {report.ourPick.narrative || report.ourPick.reasoning}
                  </p>
                </div>
                {report.ourPick.caveat && (
                  <div className="mt-4 rounded-xl bg-white/10 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-purple-200 mb-1">One Thing to Watch</p>
                    <p className="text-sm text-white/90">{report.ourPick.caveat}</p>
                  </div>
                )}
                {report.finalVerdict && (
                  <div className="mt-6 border-t border-white/20 pt-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-purple-200 mb-3">Final Verdict</p>
                    <p className="text-sm leading-relaxed text-purple-100">
                      {report.finalVerdict}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gradient-to-br from-[#6C5CE7]/80 to-[#4834D4]/80 rounded-2xl p-8 text-white shadow-xl text-center">
                <Trophy className="mx-auto h-12 w-12 text-amber-300/50" />
                <p className="mt-3 text-sm font-bold uppercase tracking-widest text-purple-200">Our Pick</p>
                <p className="mt-4 text-sm text-purple-100">Analysis is being generated. Please refresh in a moment.</p>
              </div>
            )}
            {!report.ourPick && report.finalVerdict && (
              <div className="mt-4 bg-gradient-to-br from-[#6C5CE7] to-[#4834D4] rounded-2xl p-6 text-white shadow-xl">
                <p className="text-xs font-bold uppercase tracking-widest text-purple-200 mb-3">Final Verdict</p>
                <p className="text-sm leading-relaxed text-purple-100">
                  {report.finalVerdict}
                </p>
              </div>
            )}
          </section>
        </>
      ) : (
        /* ─── BLURRED OUR PICK + UPGRADE CTA for free users ─── */
        <>
        <section id="our-pick" data-toc-section className="mt-8 scroll-mt-20 relative">
          <div className="bg-gradient-to-br from-[#6C5CE7] to-[#4834D4] rounded-2xl p-8 text-white shadow-xl blur-sm select-none pointer-events-none" aria-hidden="true">
            <div className="flex flex-col items-center text-center">
              <Trophy className="h-12 w-12 text-amber-300" />
              <p className="mt-3 text-sm font-bold uppercase tracking-widest text-purple-200">Our Pick</p>
              <p className="mt-2 text-2xl font-black text-white">Upgrade to see our recommendation</p>
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Lock className="h-8 w-8 text-[#6C5CE7]" />
            <p className="mt-2 text-sm font-semibold text-indigo-950 dark:text-gray-100">Upgrade to unlock Our Pick</p>
          </div>
        </section>
        <section className="mt-8">
          <div className="rounded-2xl border-l-4 border-l-[#6C5CE7] bg-gray-50 dark:bg-[#15152A] p-8 shadow-sm text-center">
            <Lock className="mx-auto h-10 w-10 text-[#6C5CE7]" />
            <h3 className="mt-4 text-xl font-bold text-indigo-950 dark:text-gray-100">Upgrade to Full Report: {upgradePrice}</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">Unlock everything you need to make a confident decision:</p>
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
                <div key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-gray-300">
                  <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                  {item}
                </div>
              ))}
            </div>
            <button
              onClick={handleUpgradeCheckout}
              disabled={upgradeLoading}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
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
        <section id="listing-agent" data-toc-section className="mt-8 scroll-mt-20">
          <h2 className="flex items-center gap-2 text-xl font-bold text-white tracking-tight bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF6] px-6 py-4 rounded-t-2xl">
            <Building2 className="h-5 w-5 text-white" />
            Listing Information
          </h2>
          <div className={`mt-3 grid gap-3 ${properties.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
            {properties.map((prop, bii) => {
              const bi = paidData?.brokerageInfo?.[bii];
              const hasData = bi && (bi.agentName || bi.brokerageName);
              return (
                <div key={bii} className="rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#15152A] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: PROPERTY_COLORS[bii] }} />
                    <span className="text-[10px] font-medium text-slate-500 dark:text-gray-400 truncate">{prop.address}</span>
                  </div>
                  {hasData ? (
                    <>
                      {bi.agentName && <p className="text-xs text-slate-700 dark:text-gray-300">Listed by: {getBrokerageName(bi.agentName)}</p>}
                      {bi.brokerageName && <p className="text-xs text-slate-700 dark:text-gray-300 mt-1">Brokerage: {getBrokerageName(bi.brokerageName)}</p>}
                  {bi && bi.googleRating && (
                    <div className="mt-2 flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-gray-300">{bi.googleRating}</span>
                      <span className="text-[10px] text-slate-400">({bi.googleReviewCount} brokerage reviews)</span>
                    </div>
                  )}
                      <p className="mt-2 text-[10px] text-slate-400 dark:text-gray-500">
                        Verify this agent&apos;s license at your state&apos;s real estate commission (e.g.,{" "}
                        <a href="https://www.dpor.virginia.gov/LicenseLookup/" target="_blank" rel="noopener noreferrer" className="text-[#00D2FF] hover:underline">VA DPOR</a>).
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-gray-400 italic">Listing agent information not available from this listing. Verify agent details on the listing platform or your state&apos;s real estate commission website.</p>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[9px] text-slate-400 italic">Brokerage ratings from Google Reviews. Individual agent reviews and license verification are available through your state&apos;s real estate commission.</p>
        </section>
      )}

      {/* ─── LEGAL DISCLAIMER ─── */}
      <section className="mt-10 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#15152A] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700 text-slate-500 dark:text-gray-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-slate-600 dark:text-gray-400">Important Disclaimer</h2>
        </div>
        <div className="space-y-3 text-xs leading-relaxed text-slate-500 dark:text-gray-400">
          <p>This report is generated by rivvl.ai for informational and educational purposes only. It does not constitute real estate advice, financial advice, legal advice, or a professional property appraisal.</p>
          <p>rivvl.ai is a technology platform that aggregates and analyzes publicly available data. We are not licensed real estate agents, brokers, appraisers, attorneys, or financial advisors. Nothing in this report should be interpreted as a recommendation to buy, sell, or avoid any specific property.</p>
          <p>Property scores and ratings are generated by automated analysis and reflect our interpretation of available data. They may not account for all factors relevant to your specific situation. Data accuracy depends on third-party sources including public records, government databases, and listing platforms, which may contain errors or outdated information.</p>
          <p>Risk data (flood zones, earthquake history, environmental hazards, wildfire risk) is sourced from federal government databases and is provided for informational purposes only. This data may not reflect the most recent changes and should not replace a professional environmental assessment, property inspection, or certified flood determination.</p>
          <p>Always conduct independent due diligence. Hire a licensed property inspector, consult a licensed real estate attorney, and work with a qualified real estate professional before making any purchasing decision. rivvl.ai assumes no liability for decisions made based on information in this report.</p>
          <p>By downloading or using this report, you acknowledge that you have read and understood this disclaimer.</p>
        </div>
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-[10px] text-slate-400 dark:text-gray-500">
            Data sourced from: FEMA, EPA, USGS, US Forest Service, OpenStreetMap, Rentcast
          </p>
          <p className="mt-2 text-[10px] font-medium text-slate-400 dark:text-gray-600">
            rivvl.ai. Before you choose, Rivvl.
          </p>
        </div>
      </section>
      </div>{/* end flex-1 main content */}
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
          <Loader2 className="h-8 w-8 animate-spin text-[#00D2FF]" />
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}
