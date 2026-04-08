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
import { Button } from "@/components/ui/button";

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

    const labels = (formData.urls || []).map((url: string) => {
      try {
        return new URL(url).pathname.split("/").filter(Boolean).slice(-2, -1)[0]?.replace(/-/g, " ") || "Property";
      } catch { return "Property"; }
    });
    const mlsLabels = (formData.mlsNumbers || []).map((m: string) => `MLS ${m}`);
    setPropertyLabel([...labels, ...mlsLabels].join(" vs "));

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
        if (!res.ok) throw new Error(data.error || "Something went wrong.");

        sessionStorage.setItem("rivvl_home_report", JSON.stringify({
          report: data.report,
          listings: data.listings,
          reportId: data.reportId,
          plan: data.plan,
          paidData: data.paidData,
        }));
        sessionStorage.removeItem("rivvl_home_pending_compare");

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

        setTimeout(() => {
          router.push(`/homes/report/${data.reportId}`);
        }, 1200);
      } catch (err) {
        timers.forEach(clearTimeout);
        clearTimeout(timeoutId);
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    })();

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(timeoutId);
    };
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-mesh-gradient">
        <div className="w-full max-w-lg glass-morphism p-10 rounded-[2.5rem] shadow-2xl text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-6 text-xl font-black text-black dark:text-white">Something went wrong</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 font-medium">{error}</p>
          <Button
            onClick={() => router.push("/compare/homes")}
            className="mt-8 rounded-full h-14 px-10 bg-black text-white dark:bg-white dark:text-black font-bold"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-mesh-gradient px-4">
      <div className="w-full max-w-lg">
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
          {propertyLabel && (
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest">{propertyLabel}</p>
          )}
        </div>

        <div className="mt-12 glass-morphism p-8 sm:p-10 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-black/20">
          <div className="space-y-4">
            {GENERATION_STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-4">
                {i < step ? (
                  <CheckCircle2 className="h-5 w-5 text-black dark:text-white shrink-0" />
                ) : i === step && !isComplete ? (
                  <Loader2 className="h-5 w-5 animate-spin text-black dark:text-white shrink-0" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-zinc-200 dark:border-zinc-800 shrink-0" />
                )}
                <span className={`text-sm font-bold transition-all ${i <= step ? "text-black dark:text-white" : "text-zinc-400"}`}>
                  {i < step ? s.done : s.label}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-10 h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
            <div
              className="h-full bg-black dark:bg-white transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(((step + 1) / GENERATION_STEPS.length) * 100, 100)}%` }}
            />
          </div>

          <p className="mt-6 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
            {isComplete ? "Redirecting..." : getTimingMessage(elapsed)}
          </p>
        </div>
      </div>
    </div>
  );
}
