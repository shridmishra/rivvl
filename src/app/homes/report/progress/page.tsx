"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

const GENERATION_STEPS = [
  { label: "Gathering property listings...", done: "Property listings gathered" },
  { label: "Retrieving property details...", done: "Property details retrieved" },
  { label: "Analyzing flood and environmental risk...", done: "Flood and environmental risk analyzed" },
  { label: "Checking earthquake and wildfire data...", done: "Earthquake and wildfire data checked" },
  { label: "Calculating neighborhood scores...", done: "Neighborhood scores calculated" },
  { label: "Generating your comparison report...", done: "Comparison report generated" },
  { label: "Finalizing your report...", done: "Report finalized" },
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
  return "Taking longer than expected. Please keep this window open.";
}

export default function HomesProgressPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [propertyLabel, setPropertyLabel] = useState("");
  const started = useRef(false);
  const elapsed = useElapsedSeconds();

  const isComplete = step >= GENERATION_STEPS.length;

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const raw = sessionStorage.getItem("rivvl_home_pending_compare");
    if (!raw) {
      router.replace("/compare/homes");
      return;
    }

    let formData: {
      urls: string[];
      mlsNumbers?: string[];
      preferences?: Record<string, unknown>;
      planType?: string;
      stripeSessionId?: string;
    };
    try {
      formData = JSON.parse(raw);
    } catch {
      router.replace("/compare/homes");
      return;
    }

    // Build a label from the URLs
    const labels = (formData.urls || []).map((url: string) => {
      try {
        return new URL(url).pathname.split("/").filter(Boolean).slice(-2, -1)[0]?.replace(/-/g, " ") || "Property";
      } catch { return "Property"; }
    });
    const mlsLabels = (formData.mlsNumbers || []).map((m: string) => `MLS ${m}`);
    setPropertyLabel([...labels, ...mlsLabels].join(" vs "));

    // Start timed progress steps
    const timers: NodeJS.Timeout[] = [];
    const stepDelays = [0, 5000, 12000, 20000, 30000, 45000, 60000];
    for (let i = 1; i < stepDelays.length; i++) {
      timers.push(setTimeout(() => setStep(i), stepDelays[i]));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180_000);

    (async () => {
      try {
        const res = await fetch("/api/homes/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Something went wrong. Please try again.");
        }

        // Store report data
        sessionStorage.setItem(
          "rivvl_home_report",
          JSON.stringify({
            report: data.report,
            listings: data.listings,
            reportId: data.reportId,
            plan: data.plan,
            paidData: data.paidData,
          })
        );
        sessionStorage.removeItem("rivvl_home_pending_compare");

        // Complete all remaining steps rapidly
        const animateRemaining = (currentStep: number): Promise<void> => {
          return new Promise((resolve) => {
            if (currentStep >= GENERATION_STEPS.length) {
              resolve();
              return;
            }
            setTimeout(() => {
              setStep(currentStep + 1);
              animateRemaining(currentStep + 1).then(resolve);
            }, 300);
          });
        };

        timers.forEach(clearTimeout);
        clearTimeout(timeoutId);
        await animateRemaining(step);
        setStep(GENERATION_STEPS.length);

        // Navigate to report page after a brief pause
        setTimeout(() => {
          router.push(`/homes/report/${data.reportId}`);
        }, 1200);
      } catch (err) {
        timers.forEach(clearTimeout);
        clearTimeout(timeoutId);
        setError(
          err instanceof Error ? err.message : "Something went wrong. Please try again."
        );
      }
    })();

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(timeoutId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prevent accidental navigation during generation
  useEffect(() => {
    if (isComplete || error) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isComplete, error]);

  if (error) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-8 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
            <h2 className="mt-4 text-lg font-bold text-red-800 dark:text-red-300">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => router.push("/compare/homes")}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#00D2FF] px-6 py-2.5 text-sm font-semibold text-[#0F0F1A]"
            >
              <ArrowLeft className="h-4 w-4" /> Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50/30 dark:from-[#0F0F1A] dark:via-[#0F0F1A] dark:to-[#1A1A2E] px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center">
          {isComplete ? (
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500 shadow-xl shadow-emerald-200/50 transition-all duration-700">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
          ) : (
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#00D2FF] to-[#6C5CE7] shadow-xl shadow-sky-200/50">
              <Loader2 className="h-10 w-10 animate-spin text-white" />
            </div>
          )}
          <h1 className="mt-6 text-2xl font-bold text-indigo-950 dark:text-gray-100">
            {isComplete ? (
              "Your Report is Ready!"
            ) : (
              <span className="inline-flex items-center gap-1.5">
                Generating Your{" "}
                <Image src="/images/rivvl-logo-black.png" alt="rivvl" width={70} height={23} className="inline-block align-middle dark:invert" />
                {" "}Report
              </span>
            )}
          </h1>
          {propertyLabel && (
            <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">{propertyLabel}</p>
          )}
        </div>

        {/* Steps card */}
        <div className="mt-10 rounded-2xl border border-[#00D2FF]/20 dark:border-gray-600 bg-white dark:bg-[#1A1A2E] p-6 shadow-lg">
          <div className="space-y-3">
            {GENERATION_STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                {i < step ? (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                ) : i === step && !isComplete ? (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-[#00D2FF]" />
                  </div>
                ) : (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                    <div className="h-4 w-4 rounded-full border-2 border-slate-200 dark:border-gray-600" />
                  </div>
                )}
                <span
                  className={`text-sm transition-colors duration-300 ${
                    i < step
                      ? "font-medium text-emerald-700 dark:text-emerald-400"
                      : i === step && !isComplete
                        ? "font-medium text-indigo-950 dark:text-gray-100"
                        : "text-slate-400 dark:text-gray-500"
                  }`}
                >
                  {i < step ? s.done : s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-gray-700">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                isComplete ? "bg-emerald-500" : "bg-gradient-to-r from-[#00D2FF] to-[#6C5CE7]"
              }`}
              style={{
                width: `${Math.min(
                  ((step + 1) / GENERATION_STEPS.length) * 100,
                  100
                )}%`,
              }}
            />
          </div>

          {/* Timing message */}
          <p className="mt-4 text-center text-xs text-slate-400 dark:text-gray-500">
            {isComplete ? "Redirecting to your report..." : getTimingMessage(elapsed)}
          </p>
        </div>
      </div>
    </div>
  );
}
