"use client";

import { useEffect, useState, useRef, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Trophy,
  Shield,
  Fuel,
  DollarSign,
  TrendingDown,
  Wrench,
  Star,
  BarChart3,
  Zap,
  Target,
  Loader2,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Lock,
  Menu,
  X,
  Printer,
  Share2,
  Car,
  Leaf,
  ChevronDown,
  Link2,
  Download,
  Lightbulb,
  ShieldAlert,
  HelpCircle,
  Info,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { StoredReport, AIAnalysisReport } from "@/types";
import {
  VEHICLE_COLORS,
  VEHICLE_LIGHT_COLORS,
  VEHICLE_BORDER_CLASSES,
  VEHICLE_BG_CLASSES,
  VEHICLE_TEXT_CLASSES,
  VEHICLE_ICON_CLASSES,
  VEHICLE_PILL_BG,
  isValidNumeric,
  safeDollars,
} from "@/lib/vehicle-colors";

/* ═══════════════════════════════════════════════════════════════════════ */
/*                         COLOR CONSTANTS                                */
/* ═══════════════════════════════════════════════════════════════════════ */

const CAR_COLORS = VEHICLE_COLORS as unknown as string[];
const CAR_LIGHT_COLORS = VEHICLE_LIGHT_COLORS as unknown as string[];
const CAR_BORDER_CLASSES = VEHICLE_BORDER_CLASSES as unknown as string[];
const CAR_BG_CLASSES = VEHICLE_BG_CLASSES as unknown as string[];
const CAR_TEXT_CLASSES = VEHICLE_TEXT_CLASSES as unknown as string[];
const CAR_ICON_CLASSES = VEHICLE_ICON_CLASSES as unknown as string[];
const CAR_PILL_BG = VEHICLE_PILL_BG as unknown as string[];

function toTitleCase(str: string): string {
  return str
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                     CIRCULAR SCORE GAUGE (SVG)                         */
/* ═══════════════════════════════════════════════════════════════════════ */

function ScoreGauge({
  score,
  max = 10,
  size = 100,
  strokeWidth = 8,
  label,
  color,
}: {
  score: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score / max, 1);
  const offset = circumference * (1 - pct);
  const resolvedColor =
    color || (pct >= 0.8 ? "#10B981" : pct >= 0.6 ? "#F59E0B" : "#EF4444");

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={resolvedColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          <span className="text-2xl font-bold text-slate-900 dark:text-gray-100">{score}</span>
          <span className="text-xs text-muted-foreground dark:text-gray-500">/{max}</span>
        </div>
      </div>
      {label && (
        <p className="mt-1 text-xs font-medium text-muted-foreground dark:text-gray-400">{label}</p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                          STAR RATINGS                                  */
/* ═══════════════════════════════════════════════════════════════════════ */

function Stars({ rating, size = 16 }: { rating: number | null | undefined; size?: number }) {
  // If no rating data, show "Not Rated" text instead of empty gray stars
  if (rating == null || rating === 0) {
    return (
      <span className="text-xs font-medium text-muted-foreground dark:text-gray-500 italic">Not Rated</span>
    );
  }

  const starColor = (i: number) => {
    if (i >= rating) return "fill-gray-200 text-gray-200";
    if (rating >= 5) return "fill-emerald-400 text-emerald-400";
    if (rating >= 4) return "fill-lime-400 text-lime-400";
    if (rating >= 3) return "fill-amber-400 text-amber-400";
    if (rating >= 2) return "fill-orange-400 text-orange-400";
    return "fill-red-400 text-red-400";
  };

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} style={{ width: size, height: size }} className={starColor(i)} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                        LOCKED SECTION OVERLAY                          */
/* ═══════════════════════════════════════════════════════════════════════ */

function LockedSection({ title, icon, teaser, onUpgrade }: { title: string; icon: React.ReactNode; teaser?: string; onUpgrade?: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border glass-morphism">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <h2 className="text-lg font-black text-foreground/70">{title}</h2>
        <Lock className="ml-auto h-4 w-4 text-primary" />
      </div>
      <div className="relative px-6 pb-6">
        {/* Blurred preview - tantalizing content */}
        <div className="pointer-events-none select-none blur-[8px] opacity-40">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-28 rounded-lg bg-gradient-to-br from-primary/10 to-violet-500/10 p-4">
              <div className="h-3 w-2/3 rounded bg-primary/20" />
              <div className="mt-3 h-6 w-1/2 rounded bg-primary/30" />
              <div className="mt-2 h-3 w-3/4 rounded bg-primary/20" />
            </div>
            <div className="h-28 rounded-lg bg-gradient-to-br from-violet-500/10 to-primary/10 p-4">
              <div className="h-3 w-2/3 rounded bg-violet-500/20" />
              <div className="mt-3 h-6 w-1/2 rounded bg-violet-500/30" />
              <div className="mt-2 h-3 w-3/4 rounded bg-violet-500/20" />
            </div>
          </div>
          <div className="mt-3 h-4 w-full rounded bg-muted/50" />
          <div className="mt-2 h-4 w-4/5 rounded bg-muted/50" />
        </div>
        {/* Upgrade overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/40 backdrop-blur-[4px]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 mb-4">
            <Lock className="h-7 w-7" />
          </div>
          <p className="text-base font-black text-foreground tracking-tight">
            {teaser || "Unlock with Full Report"}
          </p>
          <Button
            onClick={onUpgrade}
            className="mt-4 rounded-xl bg-primary px-8 py-6 text-base font-black text-white shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
          >
            Unlock Full Report
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                      GENERATION PROGRESS VIEW                          */
/* ═══════════════════════════════════════════════════════════════════════ */

const GENERATION_STEPS = [
  { label: "Pulling vehicle data...", done: "Vehicle data retrieved" },
  { label: "Fetching safety ratings...", done: "Safety ratings fetched" },
  { label: "Checking recall history...", done: "Recall history checked" },
  { label: "Analyzing fuel economy...", done: "Fuel economy analyzed" },
  { label: "Running analysis...", done: "Analysis complete" },
  { label: "Generating your report...", done: "Report generated" },
];

function useElapsedSeconds() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  return elapsed;
}

function getTimingMessage(elapsed: number): string {
  if (elapsed < 30) return "Your report is being generated and will be ready shortly.";
  if (elapsed < 60) return "Still working on your report. This usually takes about a minute.";
  if (elapsed < 90) return "Almost there! Complex comparisons take a bit longer.";
  if (elapsed < 130) return "Finishing up your analysis. Thank you for your patience.";
  if (elapsed < 190) return "Taking longer than expected. Retrying analysis. Please keep this window open.";
  if (elapsed < 280) return "Still analyzing. Complex multi-car comparisons can take up to 4 minutes.";
  return "Finalizing your report. Thank you for your patience, almost there!";
}

function GeneratingView({
  step,
  carLabel,
  error,
}: {
  step: number;
  carLabel: string;
  error: string | null;
}) {
  const router = useRouter();
  const isComplete = step >= GENERATION_STEPS.length;
  const elapsed = useElapsedSeconds();

  if (error === "LIMIT_REACHED") {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1A1A2E] p-8 shadow-2xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl gradient-bg shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50">
            <Lock className="h-7 w-7 text-white" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-indigo-950 dark:text-gray-100">
            Report Limit Reached
          </h2>
          <p className="mt-2 text-sm text-muted-foreground dark:text-gray-400">
            You&apos;ve used all your available reports. Upgrade your plan to
            generate more comparisons.
          </p>
          <div className="mt-6 space-y-3">
            <a
              href="/pricing"
              className="gradient-bg-hover flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold text-white"
            >
              View Plans &amp; Upgrade
            </a>
            <button
              onClick={() => router.push("/compare")}
              className="w-full rounded-xl border border-border dark:border-gray-600 py-3 text-sm font-semibold text-muted-foreground dark:text-gray-400 transition-colors hover:bg-muted/30 dark:hover:bg-primary/10"
            >
              Back to Compare
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-8 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
            <h2 className="mt-4 text-lg font-bold text-red-800 dark:text-red-300">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-red-600">{error}</p>
            <button
              onClick={() => {
                // Preserve preferences so the user doesn't have to re-enter them
                try {
                  const pending = localStorage.getItem("rivvl_pending_comparison");
                  if (pending) {
                    const data = JSON.parse(pending);
                    if (data.preferences) {
                      sessionStorage.setItem("rivvl_retry_preferences", JSON.stringify(data.preferences));
                    }
                  }
                } catch { /* ignore */ }
                router.push("/compare");
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-lg gradient-bg px-6 py-2.5 text-sm font-semibold text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-mesh-gradient px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center">
          {isComplete ? (
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-zinc-100 dark:bg-zinc-800 shadow-xl transition-all duration-700">
              <CheckCircle2 className="h-12 w-12 text-black dark:text-white" />
            </div>
          ) : (
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-black dark:bg-white shadow-xl">
              <Loader2 className="h-12 w-12 animate-spin text-white dark:text-black" />
            </div>
          )}
          <h1 className="mt-10 text-3xl font-black tracking-tight text-black dark:text-white sm:text-4xl">
            {isComplete ? (
              "Ready!"
            ) : (
              <span className="inline-flex items-center gap-2">
                Generating Report
              </span>
            )}
          </h1>
          {carLabel && (
            <p className="mt-2 text-sm text-muted-foreground dark:text-gray-400">{carLabel}</p>
          )}
        </div>

        {/* Steps card */}
        <div className="mt-10 rounded-2xl border border-border dark:border-gray-600 bg-white dark:bg-[#1A1A2E] p-6 shadow-lg">
          <div className="space-y-3">
            {GENERATION_STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                {i < step ? (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                ) : i === step && !isComplete ? (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                  </div>
                ) : (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                    <div className="h-4 w-4 rounded-full border-2 border-border dark:border-gray-600" />
                  </div>
                )}
                <span
                  className={`text-sm transition-colors duration-300 ${
                    i < step
                      ? "font-medium text-emerald-700"
                      : i === step && !isComplete
                        ? "font-medium text-indigo-950 dark:text-gray-100"
                        : "text-muted-foreground dark:text-gray-500"
                  }`}
                >
                  {i < step ? s.done : s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted/50 dark:bg-gray-700">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                isComplete ? "bg-emerald-500" : "gradient-bg"
              }`}
              style={{
                width: `${Math.min(
                  ((step + 1) / GENERATION_STEPS.length) * 100,
                  100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Warning banner */}
        {!isComplete && (
          <div className="mt-6 rounded-xl border border-amber-200/60 dark:border-amber-700/40 bg-amber-50/80 dark:bg-amber-900/20 px-5 py-4">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Please don&apos;t close this window or navigate away
                </p>
                <p className="mt-1 text-xs text-amber-600">
                  {getTimingMessage(elapsed)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                       SIDEBAR NAV CONFIG                               */
/* ═══════════════════════════════════════════════════════════════════════ */

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  paidOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "summary", label: "Our Pick", icon: <Trophy className="h-4 w-4" />, paidOnly: true },
  { id: "specs", label: "Specifications", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "safety", label: "Safety", icon: <Shield className="h-4 w-4" /> },
  { id: "fuel", label: "Fuel Economy", icon: <Fuel className="h-4 w-4" /> },
  { id: "reliability", label: "Reliability", icon: <Wrench className="h-4 w-4" />, paidOnly: true },
  { id: "price", label: "Price Analysis", icon: <DollarSign className="h-4 w-4" />, paidOnly: true },
  { id: "cost", label: "Cost of Ownership", icon: <DollarSign className="h-4 w-4" />, paidOnly: true },
  { id: "depreciation", label: "Depreciation", icon: <TrendingDown className="h-4 w-4" />, paidOnly: true },
  { id: "features", label: "Features", icon: <Zap className="h-4 w-4" />, paidOnly: true },
  { id: "priority", label: "Priority Match", icon: <Target className="h-4 w-4" />, paidOnly: true },
  { id: "verdict", label: "Final Verdict", icon: <Trophy className="h-4 w-4" />, paidOnly: true },
];

/* ═══════════════════════════════════════════════════════════════════════ */
/*                          SHARE MODAL                                   */
/* ═══════════════════════════════════════════════════════════════════════ */

function ShareModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const url = typeof window !== "undefined" ? window.location.href : "";
  const shareText = "I just compared cars with rivvl! Check out my report:";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments where clipboard API is blocked
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareEmail = () => {
    window.open(
      `mailto:?subject=${encodeURIComponent("Check out my rivvl Car Comparison")}&body=${encodeURIComponent(`${shareText}\n\n${url}`)}`,
      "_self"
    );
  };

  const shareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`,
      "_blank",
      "width=550,height=420"
    );
  };

  const shareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
      "width=550,height=420"
    );
  };

  const shareWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`,
      "_blank"
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 mx-4 w-full max-w-sm animate-in fade-in zoom-in rounded-2xl border border-indigo-200 dark:border-gray-600 bg-white dark:bg-[#1A1A2E] p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-indigo-950 dark:text-gray-100">Share Report</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground dark:text-gray-500 hover:bg-muted/50 dark:hover:bg-primary/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-2.5">
          <button
            onClick={copyLink}
            className="flex w-full items-center gap-3 rounded-xl border border-border dark:border-gray-600 px-4 py-3 text-left text-sm font-medium text-foreground dark:text-gray-300 transition-all hover:border-indigo-300 dark:hover:border-gray-500 hover:bg-primary/5 dark:hover:bg-primary/10"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <Link2 className="h-4 w-4" />
            </div>
            {copied ? (
              <span className="font-semibold text-emerald-600">Copied!</span>
            ) : (
              "Copy Link"
            )}
          </button>

          <button
            onClick={shareEmail}
            className="flex w-full items-center gap-3 rounded-xl border border-border dark:border-gray-600 px-4 py-3 text-left text-sm font-medium text-foreground dark:text-gray-300 transition-all hover:border-indigo-300 dark:hover:border-gray-500 hover:bg-primary/5 dark:hover:bg-primary/10"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            Email
          </button>

          <button
            onClick={shareTwitter}
            className="flex w-full items-center gap-3 rounded-xl border border-border dark:border-gray-600 px-4 py-3 text-left text-sm font-medium text-foreground dark:text-gray-300 transition-all hover:border-indigo-300 dark:hover:border-gray-500 hover:bg-primary/5 dark:hover:bg-primary/10"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </div>
            Twitter / X
          </button>

          <button
            onClick={shareFacebook}
            className="flex w-full items-center gap-3 rounded-xl border border-border dark:border-gray-600 px-4 py-3 text-left text-sm font-medium text-foreground dark:text-gray-300 transition-all hover:border-indigo-300 dark:hover:border-gray-500 hover:bg-primary/5 dark:hover:bg-primary/10"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
            </div>
            Facebook
          </button>

          <button
            onClick={shareWhatsApp}
            className="flex w-full items-center gap-3 rounded-xl border border-border dark:border-gray-600 px-4 py-3 text-left text-sm font-medium text-foreground dark:text-gray-300 transition-all hover:border-indigo-300 dark:hover:border-gray-500 hover:bg-primary/5 dark:hover:bg-primary/10"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
            </div>
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                        MAIN REPORT PAGE                                */
/* ═══════════════════════════════════════════════════════════════════════ */

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [report, setReport] = useState<StoredReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("summary");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // Generation state (when id === "generating")
  const isGeneratingRoute = id === "generating";
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [genError, setGenError] = useState<string | null>(null);
  const [genCarLabel, setGenCarLabel] = useState("");
  const genStarted = useRef(false);

  const handleDownloadPdf = async () => {
    if (!report || pdfLoading) return;
    setPdfLoading(true);
    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: report.id }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate PDF");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const defaultFilename = report.cars
        .filter(Boolean)
        .map((c) => `${c.make || ""}-${c.model || ""}`)
        .filter(Boolean)
        .join("-vs-");
      const filename = report.customName
        ? `rivvl-${report.customName}-Report.pdf`
        : `rivvl-${defaultFilename}-Report.pdf`;
      a.href = url;
      a.download = filename.replace(/\s+/g, "-");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download error:", err);
      alert(err instanceof Error ? err.message : "Failed to generate PDF. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  useEffect(() => {
    if (!id || isGeneratingRoute) return;

    // Check if returning from payment
    const urlParams = new URLSearchParams(window.location.search);
    const isPaymentReturn = urlParams.get("payment") === "success";
    const stripeSessionId = urlParams.get("session_id") || null;
    if (isPaymentReturn) {
      setPaymentSuccess(true);
      // Clean up URL params
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }

    async function tryUnlockReport(): Promise<boolean> {
      // Call our unlock API which verifies payment with Stripe directly
      try {
        const res = await fetch(`/api/report/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: stripeSessionId }),
        });
        if (res.ok) {
          const data = await res.json();
          return data.unlocked === true;
        }
      } catch {
        // Unlock attempt failed — will fall through to normal fetch
      }
      return false;
    }

    async function loadReport(): Promise<void> {
      try {
        // If returning from payment, actively try to unlock the report first
        if (isPaymentReturn) {
          const unlocked = await tryUnlockReport();
          // If the unlock API confirmed success, add a tiny delay for DB consistency
          if (unlocked) {
            await new Promise((r) => setTimeout(r, 150));
          }
        }

        // Fetch the (now hopefully unlocked) report
        const res = await fetch(`/api/report/${id}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Report not found");
        }
        const data: StoredReport = await res.json();

        // If still locked after payment, retry with fast polling
        // (unlock may still be propagating or webhook may be in flight)
        if (isPaymentReturn && data.analysis?.reportType === "free") {
          const delays = [500, 500, 1000];
          for (const delay of delays) {
            await new Promise((r) => setTimeout(r, delay));
            await tryUnlockReport();
            const retryRes = await fetch(`/api/report/${id}`);
            if (retryRes.ok) {
              const retryData: StoredReport = await retryRes.json();
              if (retryData.analysis?.reportType !== "free") {
                setReport(retryData);
                setLoading(false);
                return;
              }
            }
          }
          // All retries exhausted — show what we have but don't show success toast
          setPaymentSuccess(false);
        }

        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load report");
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [id, isGeneratingRoute]);

  // Track which section is in view
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
    const sections = document.querySelectorAll("[data-section]");
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [report]);

  // ═══ REPORT GENERATION (when id === "generating") ═══
  useEffect(() => {
    if (!isGeneratingRoute) return;
    if (genStarted.current) return;
    genStarted.current = true;
    setLoading(false);

    const raw = localStorage.getItem("rivvl_pending_comparison");
    if (!raw) {
      router.replace("/compare");
      return;
    }

    let formData: {
      urls: string[];
      manualEntries: { year: string; make: string; model: string; trim?: string }[];
      preferences: { priorities: string[]; budget: string; usage: string; keepDuration: string };
      plan: string;
      stripeSessionId?: string;
    };
    try {
      formData = JSON.parse(raw);
    } catch {
      router.replace("/compare");
      return;
    }

    // Build car display label from manual entries
    const labels: string[] = [];
    if (formData.manualEntries?.length > 0) {
      for (const entry of formData.manualEntries) {
        if (entry.make && entry.model) {
          labels.push(
            `${entry.year || ""} ${toTitleCase(entry.make)} ${entry.model}`.trim()
          );
        }
      }
    }
    setGenCarLabel(
      labels.length >= 2
        ? `${labels[0]} vs ${labels[1]}`
        : labels.length === 1
          ? labels[0]
          : ""
    );

    setIsGenerating(true);
    setGenStep(0);

    // Timed progress steps
    const timers: NodeJS.Timeout[] = [];
    const stepDelays = [0, 8000, 18000, 30000, 45000, 65000];
    for (let i = 1; i < stepDelays.length; i++) {
      timers.push(setTimeout(() => setGenStep(i), stepDelays[i]));
    }

    const controller = new AbortController();
    // Must be long enough to allow server-side retries: 3 attempts × 120s + delays ≈ 370s
    const timeoutId = setTimeout(() => controller.abort(), 400_000);

    (async () => {
      try {
        // ── Step 0: If returning from Stripe checkout, verify payment BEFORE
        // calling analyze. This ensures the plan_tier in the DB is correct
        // without relying on the async webhook. The verify-session endpoint
        // retrieves the Stripe session, confirms payment_status === "paid",
        // and updates the profile in the database synchronously.
        if (formData.stripeSessionId) {
          try {
            const verifyRes = await fetch("/api/stripe/verify-session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sessionId: formData.stripeSessionId }),
            });
            if (!verifyRes.ok) {
              const verifyData = await verifyRes.json().catch(() => ({}));
              // Hard-fail on auth/ownership errors — these are not transient
              if (verifyRes.status === 401 || verifyRes.status === 403) {
                timers.forEach(clearTimeout);
                clearTimeout(timeoutId);
                setGenError(
                  verifyData.error ||
                    "Payment verification failed. Please sign in and try again."
                );
                setIsGenerating(false);
                return;
              }
              // For 402 (payment incomplete) or 500 (Stripe API error), log and
              // fall through — the inline fallback in /api/analyze will retry,
              // or the webhook may have already updated the DB.
              console.warn(
                `verify-session returned ${verifyRes.status}:`,
                verifyData.error
              );
            }
          } catch (verifyErr) {
            // Network error contacting verify-session — proceed optimistically
            console.warn("verify-session request failed:", verifyErr);
          }

          // NOTE: stripeSessionId is intentionally NOT deleted from formData even when
          // verify-session succeeds. The analyze endpoint uses it to verify the plan
          // directly from Stripe, bypassing any DB read-after-write timing issues.
          // This is the key fix: analyze uses planFromStripe (Stripe-verified) instead
          // of the DB-read plan for the car count check.
        }

        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          if (errData.code === "AUTH_REQUIRED") {
            localStorage.setItem("rivvl_compare_form", JSON.stringify(formData));
            router.replace("/login?redirect=/compare");
            return;
          }
          if (errData.code === "LIMIT_REACHED" || errData.code === "CAR_LIMIT_EXCEEDED") {
            timers.forEach(clearTimeout);
            clearTimeout(timeoutId);
            setGenError(errData.code === "CAR_LIMIT_EXCEEDED"
              ? errData.error || "Too many cars for your plan."
              : "LIMIT_REACHED");
            setIsGenerating(false);
            return;
          }
          throw new Error(errData.error || `Server error: ${res.status}`);
        }

        const data = await res.json();
        if (!data.reportId) {
          throw new Error("No report ID returned");
        }

        // Clear all fake timers — we'll animate steps ourselves
        timers.forEach(clearTimeout);
        clearTimeout(timeoutId);

        // Animate through remaining steps one-by-one (400ms each)
        const animateRemaining = (currentStep: number): Promise<void> => {
          return new Promise((resolve) => {
            if (currentStep >= GENERATION_STEPS.length) {
              resolve();
              return;
            }
            setTimeout(() => {
              setGenStep(currentStep + 1);
              animateRemaining(currentStep + 1).then(resolve);
            }, 400);
          });
        };

        // Get current step via a ref-safe approach: read from DOM-state by
        // wrapping in a setState callback to read latest value
        await new Promise<void>((resolve) => {
          setGenStep((prev) => {
            animateRemaining(prev).then(resolve);
            return prev;
          });
        });

        // Brief pause on "all complete" state, then transition to report
        await new Promise((r) => setTimeout(r, 1000));

        const stored: StoredReport = {
          id: data.reportId,
          createdAt: new Date().toISOString(),
          cars: data.cars,
          analysis: data.analysis,
          preferences: formData.preferences,
          plan: formData.plan,
          enrichmentContext: data.enrichmentContext,
        };

        setReport(stored);
        setIsGenerating(false);

        // Update URL to permanent report link
        window.history.replaceState({}, "", `/report/${data.reportId}`);

        // Clean up localStorage
        localStorage.removeItem("rivvl_pending_comparison");
      } catch (err) {
        timers.forEach(clearTimeout);
        clearTimeout(timeoutId);
        if (err instanceof Error && err.name === "AbortError") {
          setGenError(
            "The analysis is taking longer than expected. Please try again. The servers may be busy."
          );
        } else {
          setGenError(
            err instanceof Error
              ? err.message
              : "Something went wrong. Please try again."
          );
        }
        setIsGenerating(false);
      }
    })();

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(timeoutId);
    };
  }, [isGeneratingRoute, router]);

  // Prevent accidental navigation during generation
  useEffect(() => {
    if (!isGenerating) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isGenerating]);

  const scrollTo = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setSidebarOpen(false);
  };

  // Show generation progress UI
  if (isGenerating || genError) {
    return (
      <GeneratingView
        step={genStep}
        carLabel={genCarLabel}
        error={genError}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-indigo-600" />
          <p className="mt-4 text-sm text-muted-foreground dark:text-gray-400">Loading your report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
          <h2 className="mt-4 text-lg font-bold text-red-800 dark:text-red-300">Report Not Found</h2>
          <p className="mt-2 text-sm text-red-600">
            {error && error !== "Report not found"
              ? error
              : "This report may have been removed or you may not have permission to view it."}
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-2 rounded-lg gradient-bg px-6 py-2.5 text-sm font-semibold text-white"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => router.push("/compare")}
              className="inline-flex items-center gap-2 rounded-lg border border-border dark:border-gray-600 bg-white dark:bg-[#1A1A2E] px-6 py-2.5 text-sm font-semibold text-foreground dark:text-gray-300"
            >
              <ArrowLeft className="h-4 w-4" /> New Comparison
            </button>
          </div>
        </div>
      </div>
    );
  }

  const a = report.analysis;
  const isFree = a.reportType === "free";
  const numCars = report.cars.length;
  const carNames = report.cars.map(
    (c) => c && c.year && c.make && c.model ? `${c.year} ${toTitleCase(c.make)} ${c.model}` : `Unknown Vehicle`
  );
  const shortCarNames = report.cars.map(
    (c) => c && c.make && c.model ? `${toTitleCase(c.make)} ${c.model}` : `Unknown Vehicle`
  );

  // Detect manually-entered cars without VIN
  const manualCarsWithoutVin = report.cars
    .map((c, i) => ({ car: c, name: carNames[i] }))
    .filter((item) => item.car?.url?.startsWith("manual://") && !item.car?.vin);
  const hasManualWithoutVin = manualCarsWithoutVin.length > 0;

  // Determine contextual upgrade plan based on car count
  const upgradePlan = numCars <= 2 ? "car_single" : "car_pro_report";
  const upgradePrice = numCars <= 2 ? "$4.99" : "$9.99";
  const upgradePlanLabel = numCars <= 2 ? "Full Report" : "Pro Report";

  const handleUpgradeCheckout = async () => {
    setUpgradeLoading(true);
    setUpgradeError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: upgradePlan, reportId: report.id, source: "report" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start checkout");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : "Something went wrong");
      setUpgradeLoading(false);
    }
  };

  const openUpgradeModal = () => {
    // If already unlocked, don't show
    if (!isFree) return;
    setShowUpgradeModal(true);
  };

  return (
    <div className="flex min-h-screen bg-mesh-gradient">
      {/* ═══ MOBILE SIDEBAR OVERLAY ═══ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ═══ SIDEBAR ═══ */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col glass-morphism transition-transform duration-300 lg:sticky lg:top-0 lg:z-0 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar header */}
        <div className="border-b border-border px-5 py-5">
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground dark:text-gray-500 hover:bg-muted/50 dark:hover:bg-primary/10 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
          <p className="text-xs font-black uppercase tracking-widest text-zinc-500">
            Comparison Report
          </p>
          <h2 className="mt-1 text-sm font-black text-black dark:text-white leading-tight">
            {report.customName || shortCarNames.join(" vs ")}
          </h2>
          {/* Car thumbnails */}
          <div className={`mt-3 grid gap-2 ${numCars > 2 ? "grid-cols-2" : "grid-cols-2"}`}>
            {report.cars.map((car, i) => (
              <div
                key={i}
                className={`rounded-lg border p-2 text-center text-xs ${CAR_BORDER_CLASSES[i] || "border-border dark:border-gray-600"} ${CAR_BG_CLASSES[i] || "bg-muted/30 dark:bg-[#1E1E30]"}`}
              >
                <Car className={`mx-auto h-5 w-5 ${CAR_ICON_CLASSES[i] || "text-muted-foreground dark:text-gray-500"}`} />
                <p className="mt-1 font-semibold text-foreground dark:text-gray-300 truncate">
                  {car.make ? toTitleCase(car.make) : ""} {car.model}
                </p>
                <p className="text-muted-foreground dark:text-gray-400">
                  {car.price ? `$${car.price.toLocaleString()}` : "Price not listed"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            const isLocked = isFree && item.paidOnly;
            return (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`flex w-full items-center gap-3 px-5 py-2.5 text-left text-sm transition-all ${
                  isActive
                    ? "border-l-[3px] border-primary bg-primary/5 font-bold text-primary"
                    : "border-l-[3px] border-transparent text-muted-foreground hover:bg-primary/5 hover:text-primary"
                } ${isLocked ? "opacity-50" : ""}`}
              >
                <span className={isActive ? "text-primary" : "text-muted-foreground"}>
                  {item.icon}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {isLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-border px-5 py-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/compare")}
            className="flex w-full items-center gap-2 text-xs text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> New Comparison
          </Button>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <main ref={mainRef} className="flex-1 min-w-0 bg-mesh-gradient">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border glass-morphism px-4 py-3 sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-primary/5 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
            isFree
              ? "bg-muted/50 dark:bg-gray-700 text-muted-foreground dark:text-gray-300"
              : "gradient-bg text-white"
          }`}>
            {isFree ? "Free Report" : a.reportType === "pro" ? "Pro Report" : "Full Report"}
          </div>
          <span className="hidden text-xs text-muted-foreground dark:text-gray-500 sm:block">
            {new Date(report.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              onClick={handleDownloadPdf}
              loading={pdfLoading}
              loadingText="Generating..."
              className="hidden sm:inline-flex items-center gap-2 rounded-lg gradient-bg px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            >
              {!pdfLoading && <Download className="h-4 w-4" />}
              Download PDF
            </Button>
            <Button
              onClick={handleDownloadPdf}
              loading={pdfLoading}
              loadingText=""
              variant="ghost"
              className="sm:hidden rounded-lg p-2 text-muted-foreground dark:text-gray-500 hover:bg-primary/5 dark:hover:bg-primary/10 hover:text-primary dark:hover:text-primary transition-colors"
            >
              {!pdfLoading && <Download className="h-4 w-4" />}
            </Button>
            <button
              onClick={() => window.print()}
              title="Print report"
              className="rounded-lg p-2 text-muted-foreground dark:text-gray-500 hover:bg-muted/30 dark:hover:bg-primary/10 hover:text-primary dark:hover:text-primary transition-all border border-transparent hover:border-border dark:hover:border-primary/50"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShareOpen(true)}
              title="Share report"
              className="rounded-lg p-2 text-muted-foreground dark:text-gray-400 hover:bg-muted/30 dark:hover:bg-primary/10 hover:text-primary dark:hover:text-primary transition-all border border-transparent hover:border-border dark:hover:border-primary/50"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Payment success banner */}
        {paymentSuccess && !isFree && (
          <div className="no-print border-b border-emerald-200 dark:border-emerald-700/40 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 text-center text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="inline h-3.5 w-3.5 mr-1" />
            Payment successful! Your full report is now unlocked.
          </div>
        )}

        {/* Payment processing banner — payment went through but unlock is still pending */}
        {paymentSuccess && isFree && (
          <div className="no-print border-b border-indigo-200 dark:border-indigo-700/40 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 text-center text-xs text-indigo-700 dark:text-indigo-300">
            <Loader2 className="inline h-3.5 w-3.5 mr-1 animate-spin" />
            Payment received! Your report is being unlocked.{" "}
            <button onClick={() => window.location.reload()} className="font-bold underline">Refresh</button> if sections don&apos;t appear shortly.
          </div>
        )}

        {/* Free banner */}
        {isFree && !paymentSuccess && (
          <div className="no-print border-b border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 text-center text-xs text-amber-700 dark:text-amber-300">
            Free Report: Some sections are locked.{" "}
            <button onClick={openUpgradeModal} className="font-bold underline">Upgrade for {upgradePrice}</button> to unlock all 11 sections.
          </div>
        )}

        {/* Manual entry without VIN disclaimer */}
        {hasManualWithoutVin && (
          <div className="border-b border-amber-200 dark:border-amber-700/40 bg-amber-50/80 dark:bg-amber-900/20 px-4 py-3">
            <div className="mx-auto max-w-4xl flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div className="flex-1 text-sm text-amber-800 dark:text-amber-300">
                <p>
                  <span className="font-semibold">Note:</span>{" "}
                  {manualCarsWithoutVin.length === 1
                    ? `${manualCarsWithoutVin[0].name} was entered manually without a VIN number.`
                    : `${manualCarsWithoutVin.map((c) => c.name).join(" and ")} were entered manually without VIN numbers.`
                  }{" "}
                  Some data such as exact specifications, safety ratings, recall history, and fuel economy may be limited or estimated.
                  For the most accurate comparison, provide the car&apos;s VIN number or paste a listing URL.
                </p>
                <details className="mt-1.5">
                  <summary className="cursor-pointer text-xs font-medium text-amber-600 hover:text-amber-800">
                    How to find your VIN
                  </summary>
                  <p className="mt-1 text-xs text-amber-600">
                    The VIN is a 17-character code found on the driver&apos;s side dashboard (visible through the windshield) or on the driver&apos;s door jamb sticker.
                  </p>
                </details>
              </div>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 space-y-8">
          {/* ──────── 1. OUR PICK / EXECUTIVE SUMMARY (paid) ──────── */}
          <section id="summary" data-section className="scroll-mt-20">
            {isFree ? (
              <LockedSection
                title="Our Pick / Executive Summary"
                icon={<Trophy className="h-4 w-4" />}
                teaser="Which car should you buy? Upgrade to see our intelligent recommendation."
                onUpgrade={openUpgradeModal}
              />
            ) : (
              <ExecutiveSummary
                summary={a.executiveSummary}
                verdict={a.finalVerdict}
                cars={report.cars}
                isFree={isFree}
                carNames={carNames}
              />
            )}
          </section>

          {/* ──────── 2. VEHICLE SPECS (free) ──────── */}
          <section id="specs" data-section className="scroll-mt-20">
            <SectionCard title="Vehicle Specifications" icon={<BarChart3 className="h-4 w-4" />}>
              <SpecsTable specs={a.vehicleSpecs} shortCarNames={shortCarNames} numCars={numCars} />
            </SectionCard>
          </section>

          {/* ──────── 3. SAFETY (free) ──────── */}
          <section id="safety" data-section className="scroll-mt-20">
            <SectionCard title="Safety Analysis" icon={<Shield className="h-4 w-4" />}>
              <SafetyVisual data={a.safety} />
            </SectionCard>
          </section>

          {/* ──────── 4. FUEL ECONOMY (free) ──────── */}
          <section id="fuel" data-section className="scroll-mt-20">
            {a.fuelEconomy ? (
              <SectionCard title="Fuel Economy" icon={<Fuel className="h-4 w-4" />}>
                <FuelVisual data={a.fuelEconomy} shortCarNames={shortCarNames} />
              </SectionCard>
            ) : null}
          </section>

          {/* ──────── 5. RELIABILITY (paid) ──────── */}
          <section id="reliability" data-section className="scroll-mt-20">
            {isFree ? (
              <LockedSection title="Reliability & Maintenance" icon={<Wrench className="h-4 w-4" />} onUpgrade={openUpgradeModal} />
            ) : a.reliability ? (
              <SectionCard title="Reliability & Maintenance" icon={<Wrench className="h-4 w-4" />}>
                <ReliabilityVisual data={a.reliability} enrichedCars={report.cars} />
              </SectionCard>
            ) : null}
          </section>

          {/* ──────── 6. PRICE ANALYSIS (paid) ──────── */}
          <section id="price" data-section className="scroll-mt-20">
            {isFree ? (
              <LockedSection title="Price & Market Analysis" icon={<DollarSign className="h-4 w-4" />} onUpgrade={openUpgradeModal} />
            ) : a.priceAnalysis ? (
              <SectionCard title="Price & Market Analysis" icon={<DollarSign className="h-4 w-4" />}>
                <PriceSection data={a.priceAnalysis} />
              </SectionCard>
            ) : null}
          </section>

          {/* ──────── 7. COST OF OWNERSHIP (paid) ──────── */}
          <section id="cost" data-section className="scroll-mt-20">
            {isFree ? (
              <LockedSection title="Cost of Ownership" icon={<DollarSign className="h-4 w-4" />} onUpgrade={openUpgradeModal} />
            ) : a.costOfOwnership ? (
              <SectionCard title="Cost of Ownership" icon={<DollarSign className="h-4 w-4" />}>
                <CostSection data={a.costOfOwnership} />
              </SectionCard>
            ) : null}
          </section>

          {/* ──────── 8. DEPRECIATION (paid) ──────── */}
          <section id="depreciation" data-section className="scroll-mt-20">
            {isFree ? (
              <LockedSection title="Depreciation Forecast" icon={<TrendingDown className="h-4 w-4" />} onUpgrade={openUpgradeModal} />
            ) : a.depreciation ? (
              <SectionCard title="Depreciation Forecast" icon={<TrendingDown className="h-4 w-4" />}>
                {report.cars.some((c) => !c.price) && (
                  <p className="mb-3 text-xs text-muted-foreground dark:text-gray-400 italic">
                    * Starting values for vehicles without a listed price are based on market estimates.
                  </p>
                )}
                <DepreciationChart data={a.depreciation} />
              </SectionCard>
            ) : null}
          </section>

          {/* ──────── 9. FEATURES (paid) ──────── */}
          <section id="features" data-section className="scroll-mt-20">
            {isFree ? (
              <LockedSection title="Features & Technology" icon={<Zap className="h-4 w-4" />} onUpgrade={openUpgradeModal} />
            ) : a.features ? (
              <SectionCard title="Features & Technology" icon={<Zap className="h-4 w-4" />}>
                <FeaturesGrid data={a.features} shortCarNames={shortCarNames} />
              </SectionCard>
            ) : null}
          </section>

          {/* ──────── 10. PRIORITY MATCH + FINAL VERDICT (paid) ──────── */}
          <section id="priority" data-section className="scroll-mt-20">
            {isFree ? (
              <LockedSection title="Priority Match" icon={<Target className="h-4 w-4" />} onUpgrade={openUpgradeModal} />
            ) : a.userPriorityMatch ? (
              <SectionCard title="Priority Match" icon={<Target className="h-4 w-4" />}>
                <PriorityRadar data={a.userPriorityMatch} shortCarNames={shortCarNames} />
              </SectionCard>
            ) : null}
          </section>

          {/* ──────── 11. FINAL VERDICT (paid) ──────── */}
          <section id="verdict" data-section className="scroll-mt-20">
            {isFree ? (
              <LockedSection
                title="Final Verdict"
                icon={<Trophy className="h-4 w-4" />}
                teaser="Ready to see the winner? Upgrade for the complete analysis."
                onUpgrade={openUpgradeModal}
              />
            ) : (
              <FinalVerdictVisual verdict={a.finalVerdict} onShare={() => setShareOpen(true)} numCars={numCars} />
            )}
          </section>

          {/* ──────── FREE UPSELL ──────── */}
          {isFree && (
            <div className="no-print rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-[#1A1A2E] dark:via-[#1A1A2E] dark:to-[#1E1E30] p-8 text-center">
              <Lock className="mx-auto h-8 w-8 text-indigo-400" />
              <h3 className="mt-3 text-xl font-bold text-indigo-950 dark:text-gray-100">
                Want the Full Picture?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground dark:text-gray-400 max-w-md mx-auto">
                Unlock all 11 sections: our pick, price analysis, cost of ownership,
                depreciation forecast, features, priority matching, and the final verdict.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {NAV_ITEMS.filter((n) => n.paidOnly).map((n) => (
                  <span
                    key={n.id}
                    className="inline-flex items-center gap-1 rounded-full border border-indigo-200 dark:border-gray-600 bg-white dark:bg-[#1E1E30] px-3 py-1 text-xs text-indigo-700 dark:text-indigo-300"
                  >
                    {n.icon} {n.label}
                  </span>
                ))}
              </div>
              <button
                onClick={openUpgradeModal}
                className="mt-6 inline-flex items-center rounded-xl gradient-bg px-8 py-3 text-sm font-bold text-white shadow-lg"
              >
                Unlock Full Report &mdash; {upgradePrice}
              </button>
            </div>
          )}

          {/* ──────── VEHICLE HISTORY REPORT TIP ──────── */}
          <section data-section className="scroll-mt-20">
            <div className="bg-green-50 dark:bg-indigo-900/20 border-l-4 border-green-400 rounded-r-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-indigo-950 dark:text-gray-100">
                  Before You Buy: Get a Vehicle History Report
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-foreground dark:text-gray-300 mb-4">
                rivvl provides comprehensive data-driven analysis based on publicly
                available data, but we do not include accident history or salvage
                title information in our reports. Before making a purchase decision,
                we strongly recommend obtaining a vehicle history report from a
                trusted provider such as Carfax, AutoCheck, or a similar service.
              </p>
              <p className="text-sm font-semibold text-foreground dark:text-gray-300 mb-2">
                A vehicle history report can reveal:
              </p>
              <ul className="space-y-1.5 text-sm text-foreground dark:text-gray-300 ml-1">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-500" />
                  Previous accidents and damage reports
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-500" />
                  Title issues (salvage, rebuilt, flood damage)
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-500" />
                  Odometer rollback or discrepancies
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-500" />
                  Number of previous owners
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-500" />
                  Service and maintenance records
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-500" />
                  Recall history and completion status
                </li>
              </ul>
              <p className="mt-4 text-sm leading-relaxed text-foreground dark:text-gray-300">
                This additional step, combined with your rivvl analysis and a
                professional mechanic inspection, will give you the most complete
                picture before making your decision.
              </p>
            </div>
          </section>

          {/* ──────── LEGAL DISCLAIMER ──────── */}
          <section data-section data-print-disclaimer className="scroll-mt-20">
            <div className="bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-400 rounded-r-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <h2 className="text-base font-bold text-gray-700 dark:text-gray-300">
                  Important Disclaimer
                </h2>
              </div>
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground dark:text-gray-400">
                <p>This report is generated by rivvl.ai for informational and educational purposes only. It does not constitute automotive advice, financial advice, or a professional vehicle appraisal.</p>
                <p>rivvl.ai is a technology platform that aggregates and analyzes publicly available vehicle data. We are not licensed automotive dealers, mechanics, appraisers, or financial advisors. Nothing in this report should be interpreted as a recommendation to buy or avoid any specific vehicle.</p>
                <p>Vehicle scores and ratings are generated by automated analysis using data from government databases, manufacturer information, and public listing sources. They may not account for all factors relevant to your specific needs. Data accuracy depends on third-party sources which may contain errors or outdated information.</p>
                <p>Safety, recall, and complaint data is sourced from NHTSA federal databases. Fuel economy data is sourced from EPA records. This data reflects published figures and may differ from real-world performance based on driving conditions, vehicle history, and maintenance.</p>
                <p>Always conduct independent due diligence. Have any vehicle inspected by a qualified mechanic before purchase, obtain a vehicle history report, and consult appropriate professionals for financing decisions. rivvl.ai assumes no liability for decisions made based on information in this report.</p>
                <p>By downloading or using this report, you acknowledge that you have read and understood this disclaimer.</p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="pb-8 pt-4 text-center text-xs text-muted-foreground dark:text-gray-500">
            <p>Report ID: {report.id}</p>
            <p className="mt-1">
              Data sourced from NHTSA, FuelEconomy.gov, and listing analysis
            </p>
          </div>
        </div>
      </main>

      {/* Share Modal */}
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1A1A2E] p-8 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl gradient-bg shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-indigo-950 dark:text-gray-100">
                Unlock All 11 Sections
              </h3>
              <p className="mt-2 text-sm text-muted-foreground dark:text-gray-400">
                Get the complete analysis for this report.
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-indigo-200 dark:border-gray-600 bg-indigo-50/50 dark:bg-[#1E1E30] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-indigo-950 dark:text-gray-100">{upgradePlanLabel}</p>
                  <p className="text-xs text-muted-foreground dark:text-gray-400">One-time payment</p>
                </div>
                <p className="text-2xl font-bold text-indigo-600">{upgradePrice}</p>
              </div>
              <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground dark:text-gray-400">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> All 11 report sections</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Charts, tables & scoring</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Intelligent recommendation</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Downloadable PDF</li>
              </ul>
            </div>

            {upgradeError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20 px-3 py-2 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {upgradeError}
              </div>
            )}

            <div className="mt-6 space-y-3">
              <button
                onClick={handleUpgradeCheckout}
                disabled={upgradeLoading}
                className="gradient-bg-hover flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {upgradeLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {upgradeLoading ? "Redirecting to checkout..." : `Upgrade Now for ${upgradePrice}`}
              </button>
              <button
                onClick={() => { setShowUpgradeModal(false); setUpgradeError(null); }}
                className="w-full rounded-xl border border-border dark:border-gray-600 py-3 text-sm font-semibold text-muted-foreground dark:text-gray-400 transition-colors hover:bg-muted/30 dark:hover:bg-primary/10"
              >
                Maybe Later
              </button>
            </div>

            <p className="mt-4 text-center text-[11px] text-muted-foreground dark:text-gray-500">
              Need to compare more cars?{" "}
              <a href="/compare" className="font-medium text-indigo-600 hover:underline">
                Start a new comparison with a Pro plan.
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                       SECTION CARD WRAPPER                             */
/* ═══════════════════════════════════════════════════════════════════════ */

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-morphism rounded-3xl shadow-sm border border-border overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-primary/20">
      <div className="bg-gradient-to-r from-violet-500/10 to-transparent rounded-t-lg px-6 py-5 border-b border-border/50">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-600/20">
            {icon}
          </div>
          <h2 className="text-xl font-black text-foreground tracking-tight border-l-4 border-violet-600 pl-4 uppercase">{title}</h2>
        </div>
      </div>
      <div className="px-6 py-8">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                       1. EXECUTIVE SUMMARY                             */
/* ═══════════════════════════════════════════════════════════════════════ */

function ExecutiveSummary({
  summary,
  verdict,
  cars,
  isFree,
  carNames,
}: {
  summary: AIAnalysisReport["executiveSummary"];
  verdict: AIAnalysisReport["finalVerdict"];
  cars: StoredReport["cars"];
  isFree: boolean;
  carNames: string[];
}) {
  return (
    <div className="glass-morphism rounded-3xl shadow-xl border border-border p-8">
      {/* Report type badge */}
      <div className="flex items-center gap-3 mb-6">
        <span className="rounded-full px-5 py-1.5 bg-violet-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-violet-600/20">
          Comparison Report
        </span>
      </div>
      {/* Winner banner — only show for multi-car comparisons */}
      {cars.length >= 2 && (
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-5 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">
            <Trophy className="h-4 w-4" /> Our Pick
          </span>
          <h1 className="mt-4 text-3xl font-black text-foreground sm:text-4xl lg:text-5xl tracking-tight">
            {verdict.winner}
          </h1>
        </div>
      )}

      {/* Car cards with gauges for ALL cars — equal height, score circle anchored to bottom */}
      <div className={`mt-6 grid gap-4 items-stretch ${cars.length > 2 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2"}`}>
        {cars.map((car, i) => {
          const name = carNames[i] || `Car ${i + 1}`;
          const score = verdict.scores[i];
          const isWinner = cars.length >= 2 && name === verdict.winner;
          const color = isWinner ? "#10B981" : (CAR_COLORS[i] || CAR_COLORS[0]);
          const bg = isWinner ? "#ECFDF5" : (CAR_LIGHT_COLORS[i] || CAR_LIGHT_COLORS[0]);
          const borderClass = isWinner ? "border-emerald-400 border-2 shadow-lg shadow-emerald-100" : (CAR_BORDER_CLASSES[i] || CAR_BORDER_CLASSES[0]);
          return (
            <div
              key={i}
              className={`relative rounded-xl border ${borderClass} p-5 text-center flex flex-col justify-between`}
              style={{ backgroundColor: bg }}
            >
              {isWinner && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold text-white shadow-md">
                    <Trophy className="h-3 w-3" /> WINNER
                  </span>
                </div>
              )}
              <div>
                <Car className="mx-auto h-10 w-10" style={{ color }} />
                <h3 className="mt-2 text-sm font-bold text-indigo-950 dark:text-gray-100">{name}</h3>
                {car?.price && (
                  <p className="mt-1 text-lg font-bold" style={{ color }}>
                    ${car.price.toLocaleString()}
                  </p>
                )}
                {car?.mileage && (
                  <p className="text-xs text-muted-foreground dark:text-gray-400">{car.mileage.toLocaleString()} mi</p>
                )}
              </div>
              {score && (
                <div className="relative mt-3 inline-block">
                  <ScoreGauge score={score.overall} max={10} size={80} strokeWidth={6} color={color} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick verdict */}
      <div className="mt-5 rounded-lg border border-indigo-200 dark:border-gray-600 bg-white dark:bg-[#1E1E30] px-5 py-3">
        <p className="text-sm font-bold text-indigo-900 dark:text-gray-200 leading-relaxed">
          {summary.quickVerdict}
        </p>
      </div>

      {/* Confidence bar */}
      {!isFree && summary.confidenceScore != null && (
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-muted-foreground dark:text-gray-400 dark:text-gray-400">Confidence</span>
          <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-gray-700">
            <div
              className="h-2 rounded-full gradient-bg transition-all duration-700"
              style={{ width: `${summary.confidenceScore}%` }}
            />
          </div>
          <span className="text-xs font-bold text-indigo-700">{summary.confidenceScore}%</span>
        </div>
      )}

      {/* Overview */}
      <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground dark:text-gray-400">
        {summary.overview}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                       2. SPECS TABLE                                   */
/* ═══════════════════════════════════════════════════════════════════════ */

function SpecsTable({
  specs,
  shortCarNames,
  numCars,
}: {
  specs: AIAnalysisReport["vehicleSpecs"];
  shortCarNames: string[];
  numCars: number;
}) {
  // Normalize rows: support both old (car1Value/car2Value) and new (values[]) formats
  const getValues = (row: (typeof specs.comparisonTable)[0]): string[] => {
    if (row.values && row.values.length > 0) return row.values;
    // Legacy fallback
    const vals: string[] = [];
    if (row.car1Value != null) vals.push(row.car1Value);
    if (row.car2Value != null) vals.push(row.car2Value);
    return vals;
  };

  return (
    <div className="overflow-x-auto -mx-6 px-6">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-[#1E1E30]">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400" style={{ width: numCars > 2 ? "25%" : "33%" }}>Specification</th>
            {shortCarNames.map((name, i) => (
              <th key={i} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${CAR_TEXT_CLASSES[i] || "text-gray-500 dark:text-gray-400"}`}>{name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {specs.comparisonTable.map((row, i) => {
            const values = getValues(row);
            return (
              <tr key={i} className={`border-b border-gray-100 dark:border-border ${i % 2 === 0 ? "bg-white dark:bg-[#1A1A2E]" : "bg-gray-50/50 dark:bg-[#1E1E30]/50"}`}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{row.category}</td>
                {shortCarNames.map((_, ci) => {
                  const isWinner = row.advantage === `car${ci + 1}`;
                  return (
                    <td key={ci} className={`px-4 py-3 text-sm ${isWinner ? "rounded-md bg-green-50 dark:bg-emerald-900/20 font-semibold text-emerald-700 dark:text-emerald-400" : "text-gray-700 dark:text-gray-400"}`}>
                      {values[ci] || "-"}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                      3. PRICE SECTION                                  */
/* ═══════════════════════════════════════════════════════════════════════ */

function PriceSection({
  data,
}: {
  data: NonNullable<AIAnalysisReport["priceAnalysis"]>;
}) {
  // Filter out invalid listed prices for chart display
  const hasAnyListedPrice = data.cars.some((c) => isValidNumeric(c.listedPrice));

  const chartData = data.cars.map((c) => ({
    name: c.name.split(" ").slice(1).join(" "),
    listed: isValidNumeric(c.listedPrice) ? c.listedPrice : undefined,
    market: isValidNumeric(c.estimatedMarketValue) ? c.estimatedMarketValue : undefined,
  }));

  const verdictColor = (v: string) => {
    if (v === "Good deal" || v === "Great deal") return "bg-emerald-100 text-emerald-700";
    if (v === "Overpriced") return "bg-red-100 text-red-700";
    return "bg-amber-100 text-amber-700";
  };

  return (
    <div>
      {/* Price comparison bars */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="name" tick={{ fontSize: 13 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
            {hasAnyListedPrice && (
              <Bar dataKey="listed" name="Listed Price" fill={CAR_COLORS[0]} radius={[4, 4, 0, 0]} />
            )}
            <Bar dataKey="market" name="Market Value" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Legend />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Price cards — equal height */}
      <div className={`mt-5 grid gap-4 items-stretch ${data.cars.length > 2 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2"}`}>
        {data.cars.map((car, i) => {
          const hasListed = isValidNumeric(car.listedPrice);
          return (
            <div key={i} className={`rounded-xl border p-4 flex flex-col justify-between ${CAR_BORDER_CLASSES[i] || "border-border dark:border-gray-600"} ${CAR_BG_CLASSES[i] || "bg-muted/30 dark:bg-[#1E1E30]"}`}>
              <div>
                <h4 className="text-sm font-bold text-indigo-950 dark:text-gray-100">{car.name}</h4>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-indigo-950 dark:text-gray-100">
                    {hasListed ? `$${car.listedPrice.toLocaleString()}` : "Price not listed"}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${verdictColor(car.priceVerdict)}`}>
                    {car.priceVerdict}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground dark:text-gray-400">
                Market: {safeDollars(car.estimatedMarketValue)} | Negotiate: {car.negotiationRoom}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-[15px] text-muted-foreground dark:text-gray-400 leading-relaxed">{data.summary}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                   4. COST OF OWNERSHIP                                 */
/* ═══════════════════════════════════════════════════════════════════════ */

function CostSection({
  data,
}: {
  data: NonNullable<AIAnalysisReport["costOfOwnership"]>;
}) {
  const categories = ["depreciation", "fuel", "insurance", "maintenance", "repairs"] as const;
  const labels: Record<string, string> = {
    depreciation: "Depreciation",
    fuel: "Fuel",
    insurance: "Insurance",
    maintenance: "Maintenance",
    repairs: "Repairs",
  };

  const numCars = data.fiveYear.cars.length;

  const fiveYearData = categories.map((cat) => {
    const row: Record<string, string | number> = { name: labels[cat] };
    data.fiveYear.cars.forEach((c, i) => { row[`car${i}`] = c[cat] || 0; });
    return row;
  });

  const cheaperIdx = data.fiveYear.cars.reduce((best, c, i) =>
    (c.total || Infinity) < (data.fiveYear.cars[best]?.total || Infinity) ? i : best, 0);

  return (
    <div>
      <h4 className="text-sm font-semibold text-muted-foreground dark:text-gray-400 mb-3">5-Year Cost Breakdown</h4>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={fiveYearData} layout="vertical" barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 13 }} width={110} />
            <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
            {Array.from({ length: numCars }, (_, i) => (
              <Bar key={i} dataKey={`car${i}`} name={data.fiveYear.cars[i]?.name || `Car ${i + 1}`} fill={CAR_COLORS[i] || CAR_COLORS[0]} radius={[0, 4, 4, 0]} />
            ))}
            <Legend />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={`mt-4 grid gap-3 ${numCars > 2 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2"}`}>
        {data.fiveYear.cars.map((c, i) => (
          <div key={i} className={`rounded-lg border p-4 text-center ${
            i === cheaperIdx ? "border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20" : "border-border dark:border-gray-600 bg-muted/30 dark:bg-[#1E1E30]"
          }`}>
            {numCars >= 2 && i === cheaperIdx && (
              <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-bold text-white">Cheapest</span>
            )}
            <p className="mt-1 text-xs text-muted-foreground dark:text-gray-400">{c.name}: 5-Year Total</p>
            <p className={`text-2xl font-bold ${i === cheaperIdx ? "text-emerald-700 dark:text-emerald-400" : "text-foreground dark:text-gray-300"}`}>
              ${c.total.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[15px] text-muted-foreground dark:text-gray-400 leading-relaxed">{data.summary}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                     5. DEPRECIATION CHART                              */
/* ═══════════════════════════════════════════════════════════════════════ */

function DepreciationChart({
  data,
}: {
  data: NonNullable<AIAnalysisReport["depreciation"]>;
}) {
  const years = ["Now", "Year 1", "Year 3", "Year 5"] as const;
  const valueKeys = ["currentValue", "year1Value", "year3Value", "year5Value"] as const;

  const chartData = years.map((year, yi) => {
    const row: Record<string, string | number | undefined> = { year };
    data.cars.forEach((c, i) => { row[`car${i}`] = c[valueKeys[yi]]; });
    return row;
  });

  return (
    <div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="year" tick={{ fontSize: 13 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
            {data.cars.map((c, i) => (
              <Line key={i} type="monotone" dataKey={`car${i}`} name={c.name || `Car ${i + 1}`} stroke={CAR_COLORS[i] || CAR_COLORS[0]} strokeWidth={3} dot={{ r: 5 }} />
            ))}
            <Legend />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 justify-center">
        {data.cars.map((c, i) => (
          <div key={i} className="text-center">
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${CAR_PILL_BG[i] || "bg-muted/50 dark:bg-gray-700"} ${CAR_TEXT_CLASSES[i] || "text-foreground dark:text-gray-300"}`}>
              {c.retentionRate5Year} retained
            </span>
            <p className="mt-1 text-xs text-muted-foreground dark:text-gray-400">{c.name}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[15px] text-muted-foreground dark:text-gray-400 leading-relaxed">{data.summary}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                         6. SAFETY                                      */
/* ═══════════════════════════════════════════════════════════════════════ */

function SafetyVisual({
  data,
}: {
  data: AIAnalysisReport["safety"];
}) {
  const [expandedRecalls, setExpandedRecalls] = useState<number | null>(null);
  const numCars = data.cars.length;

  return (
    <div>
      <div className={`grid gap-4 ${numCars > 2 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2"}`}>
        {data.cars.map((car, i) => (
          <div
            key={i}
            className={`rounded-xl border p-5 ${CAR_BORDER_CLASSES[i] || "border-border dark:border-gray-600"} ${CAR_BG_CLASSES[i] || "bg-muted/30 dark:bg-[#1E1E30]"}`}
          >
            <h4 className="text-sm font-bold text-indigo-950 dark:text-gray-100">{car.name}</h4>

            <div className="mt-3">
              <Stars rating={car.overallRating} size={20} />
              <p className="mt-1 text-xs text-muted-foreground dark:text-gray-400">Overall NHTSA Rating</p>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: "Frontal", rating: car.frontalCrash },
                { label: "Side", rating: car.sideCrash },
                { label: "Rollover", rating: car.rollover },
              ].map((c) => (
                <div key={c.label}>
                  <Stars rating={c.rating} size={14} />
                  <p className="mt-0.5 text-xs text-muted-foreground dark:text-gray-400">{c.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                car.recallCount === 0 ? "bg-emerald-100 text-emerald-700" : car.recallCount <= 3 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
              }`}>
                {car.recallCount} Recalls
              </span>
            </div>

            {car.majorRecalls.length > 0 && (
              <div className="mt-3">
                <button
                  onClick={() => setExpandedRecalls(expandedRecalls === i ? null : i)}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                >
                  <ChevronDown className={`h-3 w-3 transition-transform ${expandedRecalls === i ? "rotate-180" : ""}`} />
                  {expandedRecalls === i ? "Hide" : "View"} recall details
                </button>
                {expandedRecalls === i && (
                  <ul className="mt-2 space-y-1 text-xs text-amber-700">
                    {car.majorRecalls.map((r, ri) => (
                      <li key={ri} className="flex gap-1.5">
                        <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" /> {r}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {car.safetyFeatures.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {car.safetyFeatures.map((f, fi) => (
                  <span key={fi} className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 text-[15px] text-muted-foreground dark:text-gray-400 leading-relaxed">{data.summary}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                       7. FUEL ECONOMY                                  */
/* ═══════════════════════════════════════════════════════════════════════ */

function FuelVisual({
  data,
  shortCarNames,
}: {
  data: NonNullable<AIAnalysisReport["fuelEconomy"]>;
  shortCarNames: string[];
}) {
  const numCars = data.cars.length;

  // Check which vehicles have valid MPG data
  const carsWithValidMPG = data.cars.map(
    (c) => isValidNumeric(c.cityMPG) || isValidNumeric(c.highwayMPG) || isValidNumeric(c.combinedMPG)
  );
  const anyValidMPG = carsWithValidMPG.some(Boolean);
  const allMissing = !anyValidMPG;
  // Mixed case: some cars have EPA data, some don't
  const hasMixedMPG = anyValidMPG && !carsWithValidMPG.every(Boolean);

  const mpgChart = ["City", "Highway", "Combined"].map((label) => {
    const row: Record<string, string | number> = { name: label };
    data.cars.forEach((car, i) => {
      const val =
        label === "City" ? car.cityMPG :
        label === "Highway" ? car.highwayMPG :
        car.combinedMPG;
      row[`car${i}`] = isValidNumeric(val) ? val : 0;
    });
    return row;
  });

  // Check if chart would be completely empty
  const chartHasData = mpgChart.some((row) =>
    Object.entries(row).some(([k, v]) => k.startsWith("car") && typeof v === "number" && v > 0)
  );

  return (
    <div>
      {/* Empty state notice when all MPG data missing */}
      {allMissing && (
        <div className="mb-4 rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4 text-center">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">EPA data unavailable. Estimates shown.</p>
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">Official EPA fuel economy data was not available. Values shown are estimates based on typical performance.</p>
        </div>
      )}

      {/* Notice when some cars have EPA data and some don't */}
      {hasMixedMPG && (
        <div className="mb-4 rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4 text-center">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
            EPA data partially available
          </p>
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
            {data.cars.filter((_, i) => !carsWithValidMPG[i]).map((c) => c.name).join(", ")} {data.cars.filter((_, i) => !carsWithValidMPG[i]).length === 1 ? "does" : "do"} not have official EPA data. Estimated values (Est.) are shown based on vehicle specifications.
          </p>
        </div>
      )}

      {/* MPG comparison bars */}
      {chartHasData ? (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mpgChart} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 13 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 'auto']} />
              <Tooltip />
              {Array.from({ length: numCars }, (_, i) => (
                <Bar key={i} dataKey={`car${i}`} name={shortCarNames[i] || `Car ${i + 1}`} fill={CAR_COLORS[i] || CAR_COLORS[0]} radius={[4, 4, 0, 0]} />
              ))}
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center rounded-lg border border-border dark:border-gray-600 bg-muted/30 dark:bg-[#1E1E30]">
          <p className="text-sm text-muted-foreground dark:text-gray-400">Data unavailable from government sources</p>
        </div>
      )}

      {/* Fuel cards — equal height with aligned metrics */}
      <div className={`mt-4 grid gap-4 items-stretch ${numCars > 2 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2"}`}>
        {data.cars.map((car, i) => {
          const hasCombined = isValidNumeric(car.combinedMPG);
          const hasCost = isValidNumeric(car.annualFuelCost);
          const hasCO2 = isValidNumeric(car.co2Emissions);
          return (
            <div key={i} className={`rounded-xl border p-4 flex flex-col ${CAR_BORDER_CLASSES[i] || "border-border dark:border-gray-600"} ${CAR_BG_CLASSES[i] || "bg-muted/30 dark:bg-[#1E1E30]"}`}>
              <h4 className="text-sm font-bold text-indigo-950 dark:text-gray-100">{car.name}</h4>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center flex-1 items-start">
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{hasCombined ? car.combinedMPG : "N/A"}</p>
                  <p className="text-xs text-muted-foreground dark:text-gray-400">Combined MPG</p>
                  {!hasCombined && <p className="text-[10px] text-muted-foreground">EPA data unavailable</p>}
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground dark:text-gray-300">{hasCost ? `$${car.annualFuelCost.toLocaleString()}` : "N/A"}</p>
                  <p className="text-xs text-muted-foreground dark:text-gray-400">Annual Cost</p>
                  {!hasCost && <p className="text-[10px] text-muted-foreground">EPA data unavailable</p>}
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <Leaf className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-lg font-bold text-foreground dark:text-gray-300">{hasCO2 ? car.co2Emissions : "N/A"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground dark:text-gray-400">g/mi CO2</p>
                  {!hasCO2 && <p className="text-[10px] text-muted-foreground">EPA data unavailable</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-[15px] text-muted-foreground dark:text-gray-400 leading-relaxed">{data.summary}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                     8. RELIABILITY                                     */
/* ═══════════════════════════════════════════════════════════════════════ */

function ReliabilityVisual({
  data,
  enrichedCars,
}: {
  data: NonNullable<AIAnalysisReport["reliability"]>;
  enrichedCars?: import("@/types").EnrichedCar[];
}) {
  const numCars = data.cars.length;

  // Determine which cars had complaint data retrieved vs not
  const complaintDataRetrieved = data.cars.map((_, i) =>
    enrichedCars?.[i]?.complaintData !== undefined && enrichedCars?.[i]?.complaintData !== null
  );
  const anyMissingComplaintData = complaintDataRetrieved.some((v) => !v);

  // Horizontal bar data for top problems — merge all cars
  const allComponents = new Set<string>();
  data.cars.forEach((c) => c.topProblems.forEach((p) => allComponents.add(p.component)));
  const totalCategories = allComponents.size;
  const shownComponents = Array.from(allComponents).slice(0, 6);
  const problemData = shownComponents.map((comp) => {
    const row: Record<string, string | number> = { name: toTitleCase(comp) };
    data.cars.forEach((car, i) => {
      row[`car${i}`] = complaintDataRetrieved[i]
        ? (car.topProblems.find((p) => p.component === comp)?.count ?? 0)
        : 0;
    });
    return row;
  });

  return (
    <div>
      {/* Reliability gauges — 2x2 grid for 4 cars, responsive layout */}
      <div className={`grid gap-6 justify-items-center ${
        numCars === 2 ? "grid-cols-2" :
        numCars === 3 ? "grid-cols-3" :
        "grid-cols-2"
      }`}>
        {data.cars.map((car, i) => (
          <div key={i} className="text-center relative flex flex-col items-center">
            <ScoreGauge
              score={car.reliabilityScore >= 0 ? car.reliabilityScore : 0}
              max={10}
              size={90}
              strokeWidth={7}
              color={CAR_COLORS[i] || CAR_COLORS[0]}
            />
            <p className="mt-2 text-xs font-semibold text-foreground dark:text-gray-300">{car.name}</p>
            <p className="text-[10px] text-gray-400">
              {complaintDataRetrieved[i] ? "Based on NHTSA data" : "Estimate (based on historical brand/model data)"}
            </p>
            <p className="text-xs text-muted-foreground dark:text-gray-400">
              {complaintDataRetrieved[i] ? `${car.complaintCount} complaints` : "\u2014"}
            </p>
          </div>
        ))}
      </div>

      {/* Problem breakdown chart */}
      {problemData.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-muted-foreground dark:text-gray-400 mb-2">Complaints by Component</h4>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={problemData} layout="vertical" barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={180} />
                <Tooltip />
                {Array.from({ length: numCars }, (_, i) => (
                  <Bar key={i} dataKey={`car${i}`} name={data.cars[i]?.name || `Car ${i + 1}`} fill={CAR_COLORS[i] || CAR_COLORS[0]} radius={[0, 3, 3, 0]} />
                ))}
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* FIX 4: Top categories footnote */}
          {totalCategories > shownComponents.length && (
            <p className="mt-1 text-xs text-gray-400">
              Showing top complaint categories by volume. View the full complaint history at NHTSA.gov.
            </p>
          )}
        </div>
      )}
      {/* FIX 1: Missing data footnote */}
      {anyMissingComplaintData && (
        <p className="mt-2 text-xs text-gray-400 italic">
          NHTSA complaint data could not be retrieved for this vehicle. This may reflect a data availability limitation, not zero complaints. Verify at NHTSA.gov.
        </p>
      )}
      <p className="mt-4 text-[15px] text-muted-foreground dark:text-gray-400 leading-relaxed">{data.summary}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                       9. FEATURES GRID                                 */
/* ═══════════════════════════════════════════════════════════════════════ */

function FeaturesGrid({
  data,
  shortCarNames,
}: {
  data: NonNullable<AIAnalysisReport["features"]>;
  shortCarNames: string[];
}) {
  const numCars = shortCarNames.length;

  // Normalize: support legacy booleans, new "yes"/"no"/"unverified"/"ai_enriched" strings, and car1/car2 fields
  const getHasFeature = (row: (typeof data.comparisonTable)[0], carIdx: number): "yes" | "no" | "unverified" | "ai_enriched" => {
    if (row.hasFeature && row.hasFeature.length > carIdx) {
      const v = row.hasFeature[carIdx];
      if (v === true || v === "yes") return "yes";
      if (v === false || v === "no") return "no";
      if (v === "unverified") return "unverified";
      if (v === "ai_enriched") return "ai_enriched";
      return v == null ? "unverified" : "unverified";
    }
    // Legacy fallback
    if (carIdx === 0 && row.car1 !== undefined) return row.car1 ? "yes" : "no";
    if (carIdx === 1 && row.car2 !== undefined) return row.car2 ? "yes" : "no";
    return "unverified";
  };

  const total = data.comparisonTable.length;
  const featureCounts = Array.from({ length: numCars }, (_, i) =>
    data.comparisonTable.filter((r) => {
      const v = getHasFeature(r, i);
      return v === "yes" || v === "ai_enriched";
    }).length
  );

  // Group features by category based on keywords
  const categorize = (feature: string): string => {
    const f = feature.toLowerCase();
    if (f.includes("camera") || f.includes("parking") || f.includes("blind") || f.includes("collision") || f.includes("lane") || f.includes("cruise") || f.includes("brake") || f.includes("airbag") || f.includes("safety")) return "Safety & Driver Assist";
    if (f.includes("screen") || f.includes("apple") || f.includes("android") || f.includes("bluetooth") || f.includes("usb") || f.includes("wireless") || f.includes("navigation") || f.includes("audio") || f.includes("speaker") || f.includes("carplay")) return "Technology & Connectivity";
    if (f.includes("leather") || f.includes("heated") || f.includes("ventilated") || f.includes("seat") || f.includes("climate") || f.includes("sunroof") || f.includes("moonroof") || f.includes("panoramic")) return "Comfort & Interior";
    if (f.includes("wheel") || f.includes("suspension") || f.includes("engine") || f.includes("turbo") || f.includes("awd") || f.includes("4wd") || f.includes("sport") || f.includes("performance")) return "Performance";
    if (f.includes("keyless") || f.includes("remote") || f.includes("start") || f.includes("power") || f.includes("automatic") || f.includes("light") || f.includes("led") || f.includes("mirror")) return "Convenience";
    return "Other Features";
  };

  const grouped = data.comparisonTable.reduce<Record<string, typeof data.comparisonTable>>((acc, row) => {
    const cat = categorize(row.feature);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(row);
    return acc;
  }, {});

  const categoryOrder = ["Safety & Driver Assist", "Technology & Connectivity", "Comfort & Interior", "Performance", "Convenience", "Other Features"];
  const sortedCategories = categoryOrder.filter((c) => grouped[c]?.length);

  return (
    <div>
      {/* Feature count header */}
      <div className={`grid gap-4 mb-5 ${numCars > 2 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2"}`}>
        {shortCarNames.map((name, i) => (
          <div key={i} className={`rounded-xl border p-4 text-center ${CAR_BORDER_CLASSES[i] || "border-border dark:border-gray-600"} ${CAR_BG_CLASSES[i] || "bg-muted/30 dark:bg-[#1E1E30]"}`}>
            <p className={`text-2xl font-bold ${CAR_TEXT_CLASSES[i] || "text-foreground dark:text-gray-300"}`}>{featureCounts[i]}<span className="text-base font-normal text-muted-foreground dark:text-gray-500">/{total}</span></p>
            <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">{name}</p>
          </div>
        ))}
      </div>

      {/* Feature comparison table grouped by category */}
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border dark:border-border">
              <th className="py-2.5 pr-4 text-left text-sm font-semibold text-muted-foreground dark:text-gray-400">Feature</th>
              {shortCarNames.map((name, i) => (
                <th key={i} className={`w-24 px-2 py-2.5 text-center text-sm font-semibold ${CAR_TEXT_CLASSES[i] || "text-foreground dark:text-gray-300"}`}>{name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedCategories.map((category) => (
              <Fragment key={category}>
                <tr>
                  <td colSpan={1 + numCars} className="pt-4 pb-2 px-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">{category}</span>
                  </td>
                </tr>
                {grouped[category].map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? "bg-muted/30/60 dark:bg-[#1E1E30]/60" : ""}>
                    <td className="py-2.5 pr-4 text-sm text-foreground dark:text-gray-300">{row.feature}</td>
                    {Array.from({ length: numCars }, (_, ci) => {
                      const val = getHasFeature(row, ci);
                      return (
                        <td key={ci} className="px-2 py-2.5 text-center">
                          {val === "ai_enriched" ? (
                            <span title="Likely standard equipment. Estimate, not verified from this listing.">
                              <Info className="mx-auto h-5 w-5 text-blue-400" />
                            </span>
                          ) : val === "yes" ? (
                            <span title="Confirmed available">
                              <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500" />
                            </span>
                          ) : val === "no" ? (
                            <span title="Not available">
                              <XCircle className="mx-auto h-5 w-5 text-red-400" />
                            </span>
                          ) : (
                            <span title="Unverified, could not confirm from available data">
                              <HelpCircle className="mx-auto h-5 w-5 text-amber-400" />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {/* Feature legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground dark:text-gray-400">
        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Confirmed</span>
        <span className="flex items-center gap-1.5"><XCircle className="h-4 w-4 text-red-400" /> Not Available</span>
        <span className="flex items-center gap-1.5"><HelpCircle className="h-4 w-4 text-amber-400" /> Unverified</span>
        <span className="flex items-center gap-1.5"><Info className="h-4 w-4 text-blue-400" /> Estimate (standard equipment)</span>
      </div>
      <p className="mt-3 text-[15px] text-muted-foreground dark:text-gray-400 leading-relaxed">{data.summary}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                     10. PRIORITY RADAR                                 */
/* ═══════════════════════════════════════════════════════════════════════ */

function PriorityRadar({
  data,
  shortCarNames,
}: {
  data: NonNullable<AIAnalysisReport["userPriorityMatch"]>;
  shortCarNames: string[];
}) {
  const numCars = data.cars.length;
  const categories = [
    { key: "safety", label: "Safety" },
    { key: "fuelEconomy", label: "Fuel Economy" },
    { key: "reliability", label: "Reliability" },
    { key: "resaleValue", label: "Resale" },
    { key: "performance", label: "Performance" },
    { key: "technology", label: "Tech" },
    { key: "comfort", label: "Comfort" },
    { key: "maintenanceCost", label: "Maint. Cost" },
  ] as const;

  const radarData = categories.map((c) => {
    const row: Record<string, string | number> = { subject: c.label };
    data.cars.forEach((car, i) => {
      row[`car${i}`] = car.scores[c.key] || 0;
    });
    return row;
  });

  return (
    <div>
      {/* Match percentages */}
      <div className="flex justify-center gap-8 mb-4 flex-wrap">
        {data.cars.map((car, i) => (
          <div key={i} className="text-center relative">
            <ScoreGauge
              score={car.overallMatch}
              max={100}
              size={90}
              strokeWidth={7}
              color={CAR_COLORS[i] || CAR_COLORS[0]}
              label={car.name}
            />
          </div>
        ))}
      </div>

      {/* Radar chart */}
      <div className="h-72 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="#E2E8F0" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 11 }} />
            {Array.from({ length: numCars }, (_, i) => (
              <Radar key={i} name={shortCarNames[i] || `Car ${i + 1}`} dataKey={`car${i}`} stroke={CAR_COLORS[i] || CAR_COLORS[0]} fill={CAR_COLORS[i] || CAR_COLORS[0]} fillOpacity={0.15} strokeWidth={2} />
            ))}
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Best for badges — only render for multi-car comparisons */}
      {numCars >= 2 && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {data.cars.map((car, i) => (
            <span key={i} className={`rounded-full px-3 py-1 text-xs font-medium ${CAR_PILL_BG[i] || "bg-muted/50 dark:bg-gray-700"} ${CAR_TEXT_CLASSES[i] || "text-foreground dark:text-gray-300"}`}>
              {car.name}: {car.bestFor}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                      11. FINAL VERDICT                                 */
/* ═══════════════════════════════════════════════════════════════════════ */

function FinalVerdictVisual({
  verdict,
  onShare,
  numCars,
}: {
  verdict: AIAnalysisReport["finalVerdict"];
  onShare: () => void;
  numCars: number;
}) {
  return (
    <div className="glass-morphism rounded-3xl shadow-2xl border border-border overflow-hidden">
      <div className="bg-gradient-to-r from-violet-500/10 to-transparent px-6 py-6 border-b border-border/50">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-xl shadow-violet-600/20">
            <Trophy className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black text-foreground border-l-4 border-violet-600 pl-4 uppercase tracking-tight">Final Verdict</h2>
        </div>
      </div>
      <div className="p-8">

        {/* Winner — only show for multi-car comparisons */}
        {numCars >= 2 && (
          <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-2 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-emerald-500/20">
              <Trophy className="h-4 w-4" /> Winner
            </span>
            <h3 className="mt-4 text-3xl font-black text-emerald-600 lg:text-4xl tracking-tight">{verdict.winner}</h3>
          </div>
        )}

        {/* Score gauges for all cars */}
        <div className="flex justify-center gap-10 flex-wrap">
          {verdict.scores.map((sc, i) => {
            const isWinner = numCars >= 2 && sc.name === verdict.winner;
            return (
            <div key={i} className={`text-center relative rounded-2xl p-6 transition-all duration-300 ${isWinner ? "bg-emerald-500/5 ring-2 ring-emerald-500/20 shadow-2xl shadow-emerald-500/10 scale-110 z-10" : "bg-muted/30"}`}>
              {isWinner && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-[9px] font-black tracking-widest text-white shadow-lg">
                    <Trophy className="h-3 w-3" /> WINNER
                  </span>
                </div>
              )}
              <ScoreGauge
                score={sc.overall}
                max={10}
                size={110}
                strokeWidth={8}
                color={isWinner ? "#10B981" : "#94A3B8"}
              />
              <p className={`mt-3 text-sm font-black uppercase tracking-wider ${isWinner ? "text-emerald-600" : "text-foreground/60"}`}>{sc.name}</p>
            </div>
            );
          })}
        </div>

        {/* Best for scenarios — only render for multi-car comparisons */}
        {numCars >= 2 && verdict.bestForScenarios && verdict.bestForScenarios.length > 0 && (
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {verdict.bestForScenarios.map((s, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-4 py-2 text-xs shadow-sm transition-all hover:border-primary/30"
              >
                <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">{s.scenario}:</span>
                <span className="font-black text-primary">{s.winner}</span>
              </span>
            ))}
          </div>
        )}

        {/* Final statement */}
        <p className="mt-8 text-base leading-relaxed text-foreground/80 font-medium text-center max-w-2xl mx-auto">
          {verdict.finalStatement}
        </p>

        {/* Action buttons */}
        <div className="mt-10 flex justify-center gap-4 no-print">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-6 py-3 text-sm font-black uppercase tracking-widest text-foreground hover:bg-muted/30 transition-all active:scale-95"
          >
            <Printer className="h-4 w-4" /> Print
          </button>
          <button
            onClick={onShare}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all active:scale-95"
          >
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>
      </div>
    </div>
  );
}
