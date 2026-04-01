"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, AlertCircle, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";
import { Suspense } from "react";

/* ─── Live Pricing Types ─── */
interface LivePrice {
  role: string;
  displayPrice: string;
  productName: string;
}

/* ─── Plan Definitions ─── */
interface PlanDef {
  name: string;
  role: string | null; // null = free (no checkout)
  fallbackPrice: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
  badge?: string;
  savingsBadge?: string;
}

const vehiclePlans: PlanDef[] = [
  {
    name: "Free",
    role: null,
    fallbackPrice: "$0",
    period: "forever",
    description: "Basic report for 2 cars.",
    features: [
      "Compare 2 vehicles",
      "Scores, Key Facts, Pros & Cons",
      "Upgrade anytime for full report",
    ],
    cta: "Compare Vehicles",
    highlighted: false,
  },
  {
    name: "Single Report",
    role: "car_single",
    fallbackPrice: "$4.99",
    period: "one-time",
    description: "Full report for 2 cars, 1 use.",
    features: [
      "Full report for 2 vehicles",
      "All 11 report sections",
      "Our Pick & Final Verdict",
      "Downloadable PDF",
    ],
    cta: "Compare Vehicles",
    highlighted: false,
  },
  {
    name: "Pro Report",
    role: "car_pro_report",
    fallbackPrice: "$9.99",
    period: "one-time",
    description: "Full report for up to 4 cars, 1 use.",
    features: [
      "Full report for up to 4 vehicles",
      "Everything in Single Report",
      "Side-by-side multi-car view",
      "Best for multiple options",
    ],
    cta: "Compare Vehicles",
    highlighted: true,
    badge: "MOST POPULAR",
  },
  {
    name: "Pro 10",
    role: "car_pro10",
    fallbackPrice: "$59.99",
    period: "one-time",
    description: "10 Pro reports, best value.",
    features: [
      "10 Pro reports included",
      "Up to 4 vehicles each",
      "All 11 report sections",
      "Credits never expire",
    ],
    cta: "Compare Vehicles",
    highlighted: false,
    badge: "BEST VALUE",
    savingsBadge: "Save 40%",
  },
];

const homePlans: PlanDef[] = [
  {
    name: "Free",
    role: null,
    fallbackPrice: "$0",
    period: "forever",
    description: "Basic report for 2 properties.",
    features: [
      "Compare 2 properties",
      "Scores, Key Facts, Pros & Cons",
      "Risk Report included",
      "Upgrade anytime for full report",
    ],
    cta: "Compare Real Estate",
    highlighted: false,
  },
  {
    name: "Standard",
    role: "home_standard",
    fallbackPrice: "$9.99",
    period: "one-time",
    description: "Full report for 2 properties, 1 use.",
    features: [
      "Full report for 2 properties",
      "All 10 report sections",
      "Our Pick & Final Verdict",
      "School & flood risk analysis",
    ],
    cta: "Compare Real Estate",
    highlighted: false,
  },
  {
    name: "Premium",
    role: "home_premium",
    fallbackPrice: "$19.99",
    period: "one-time",
    description: "Full report for up to 3 properties, 1 use.",
    features: [
      "Full report for up to 3 properties",
      "Everything in Standard",
      "Side-by-side comparison view",
      "Best for comparing multiple properties",
    ],
    cta: "Compare Real Estate",
    highlighted: true,
    badge: "MOST POPULAR",
  },
  {
    name: "Pro 10",
    role: "home_pro10",
    fallbackPrice: "$99.99",
    period: "one-time",
    description: "10 Premium reports, best value.",
    features: [
      "10 Premium reports included",
      "Up to 3 properties each",
      "All 10 report sections",
      "Credits never expire",
    ],
    cta: "Compare Real Estate",
    highlighted: false,
    badge: "BEST VALUE",
    savingsBadge: "Save 50%",
  },
];

/* ─── Inner component ─── */
function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("payment") === "cancelled";

  const [tab, setTab] = useState<"vehicles" | "homes">("vehicles");
  const [user, setUser] = useState<User | null>(null);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCancelled, setShowCancelled] = useState(cancelled);
  const [livePrices, setLivePrices] = useState<Record<string, string>>({});
  const [pricesLoading, setPricesLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  // Fetch live prices from Stripe
  useEffect(() => {
    fetch("/api/stripe/plans")
      .then((res) => res.json())
      .then((data) => {
        const priceMap: Record<string, string> = {};
        if (data.plans && Array.isArray(data.plans)) {
          for (const p of data.plans as LivePrice[]) {
            priceMap[p.role] = p.displayPrice;
          }
        }
        setLivePrices(priceMap);
      })
      .catch(() => {
        // Fall back to hardcoded prices
      })
      .finally(() => setPricesLoading(false));
  }, []);

  function getPrice(plan: PlanDef): string {
    if (!plan.role) return plan.fallbackPrice;
    if (pricesLoading) return "--";
    return livePrices[plan.role] || plan.fallbackPrice;
  }

  async function handleCheckout(role: string) {
    if (!user) {
      router.push("/login?redirect=/pricing");
      return;
    }

    setLoadingRole(role);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to start checkout");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoadingRole(null);
    }
  }

  const plans = tab === "vehicles" ? vehiclePlans : homePlans;
  const compareHref = tab === "vehicles" ? "/compare" : "/compare/homes";

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      {/* Cancelled Banner */}
      {showCancelled && (
        <div className="mb-8 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 px-4 py-3">
          <p className="text-sm text-amber-800">
            Payment was cancelled. You can try again anytime.
          </p>
          <button onClick={() => setShowCancelled(false)}>
            <X className="h-4 w-4 text-amber-600" />
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-8 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20 px-4 py-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4 text-red-500" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-indigo-950 dark:text-gray-100 sm:text-4xl lg:text-5xl">
          <span className="gradient-text">Simple, Transparent Pricing</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-700 dark:text-gray-300">
          One-time purchases, no subscriptions. Pick the report that fits your needs.
        </p>
      </div>

      {/* Tab Toggle */}
      <div className="mt-10 flex justify-center">
        <div className="inline-flex rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-[#1A1A2E] p-1">
          <button
            onClick={() => setTab("vehicles")}
            className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-all ${
              tab === "vehicles"
                ? "bg-white dark:bg-[#2A2A40] text-indigo-600 shadow-sm"
                : "text-slate-500 dark:text-gray-400 hover:text-slate-700"
            }`}
          >
            Vehicles
          </button>
          <button
            onClick={() => setTab("homes")}
            className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-all ${
              tab === "homes"
                ? "bg-white dark:bg-[#2A2A40] text-indigo-600 shadow-sm"
                : "text-slate-500 dark:text-gray-400 hover:text-slate-700"
            }`}
          >
            Real Estate
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const isLoading = loadingRole === plan.role;
          const price = getPrice(plan);

          return (
            <div
              key={plan.name + tab}
              className={`card-hover relative flex flex-col rounded-xl border p-6 ${
                plan.highlighted
                  ? "gradient-border scale-105 bg-white dark:bg-[#1A1A2E] shadow-xl z-10"
                  : "border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1A1A2E] shadow-sm"
              }`}
            >
              {plan.badge && (
                <span className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1 text-[10px] font-bold tracking-wide text-white shadow-md ${
                  plan.badge === "BEST VALUE" ? "bg-[#F59E0B]" : "bg-[#6C5CE7]"
                }`}>
                  {plan.badge}
                </span>
              )}
              <div className={`flex items-center gap-1.5 ${plan.badge ? "mt-2" : ""}`}>
                <h3 className="text-base font-bold text-indigo-950 dark:text-gray-100">{plan.name}</h3>
                {plan.savingsBadge && (
                  <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white leading-tight whitespace-nowrap">
                    {plan.savingsBadge}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">{plan.description}</p>
              <div className="mt-5 flex items-baseline gap-2">
                {pricesLoading && plan.role ? (
                  <div className="h-9 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                ) : (
                  <span className="text-3xl font-bold text-indigo-950 dark:text-gray-100">{price}</span>
                )}
                <span className="text-sm text-slate-500 dark:text-gray-400">/{plan.period}</span>
              </div>
              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-600 dark:text-gray-400">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>

              {plan.role === null ? (
                <Button
                  asChild
                  variant="outline"
                  className="mt-6 w-full border-indigo-200 dark:border-gray-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 transition-all font-semibold"
                >
                  <Link href={compareHref}>{plan.cta}</Link>
                </Button>
              ) : plan.highlighted ? (
                <Button
                  onClick={() => handleCheckout(plan.role!)}
                  loading={isLoading}
                  loadingText="Redirecting..."
                  disabled={loadingRole !== null && !isLoading}
                  className="gradient-bg-hover mt-6 w-full text-white font-semibold transition-all hover:opacity-90"
                >
                  {plan.cta}
                </Button>
              ) : (
                <Button
                  onClick={() => handleCheckout(plan.role!)}
                  loading={isLoading}
                  loadingText="Redirecting..."
                  disabled={loadingRole !== null && !isLoading}
                  variant="outline"
                  className="mt-6 w-full border-indigo-200 dark:border-gray-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 transition-all font-semibold"
                >
                  {plan.cta}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <section className="mt-24 rounded-2xl gradient-bg px-8 py-16 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Ready to compare?
        </h2>
        <p className="mt-3 text-indigo-100">
          Start with a free comparison, no credit card required.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/compare"
            className="inline-flex items-center rounded-xl bg-white px-10 py-4 text-base font-bold text-indigo-600 shadow-lg transition-all hover:shadow-xl hover:scale-105"
          >
            Compare Vehicles
          </Link>
          <Link
            href="/compare/homes"
            className="inline-flex items-center rounded-xl bg-white px-10 py-4 text-base font-bold text-indigo-600 shadow-lg transition-all hover:shadow-xl hover:scale-105"
          >
            Compare Real Estate
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
