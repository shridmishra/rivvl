"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Plus,
  X,
  Link2,
  Loader2,
  Lock,
  ArrowLeft,
  Info,
  AlertCircle,
  Check,
  DollarSign,
  MapPin,
  TrendingUp,
  Maximize2,
  Shield,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const MAX_PROPERTIES_PREMIUM = 3;
const MAX_PROPERTIES_FREE = 2;

interface PropertyInput {
  id: number;
  url: string;
  inputMode: 'url' | 'mls';
  mlsNumber: string;
}

const HOME_PRIORITIES = [
  { value: "Best Value for Money", icon: <DollarSign className="h-4 w-4" /> },
  { value: "Location and Neighborhood", icon: <MapPin className="h-4 w-4" /> },
  { value: "Move-In Ready Condition", icon: <Check className="h-4 w-4" /> },
  { value: "Long-Term Investment", icon: <TrendingUp className="h-4 w-4" /> },
  { value: "Space and Layout", icon: <Maximize2 className="h-4 w-4" /> },
  { value: "Low Monthly Costs", icon: <DollarSign className="h-4 w-4" /> },
  { value: "Safety and Risk", icon: <Shield className="h-4 w-4" /> },
  { value: "Community and Lifestyle", icon: <Users className="h-4 w-4" /> },
] as const;

const BUYER_SITUATIONS = [
  { value: "Primary Home", desc: "We will live here full time" },
  { value: "Investment Property", desc: "Rental income or flip" },
  { value: "Vacation or Second Home", desc: "" },
  { value: "Downsizing", desc: "" },
  { value: "First-Time Buyer", desc: "" },
] as const;

const MUST_HAVES = [
  "Garage or Covered Parking",
  "Private Outdoor Space (yard, deck, or balcony)",
  "Good School District",
  "Home Office or Bonus Room",
  "Basement or Extra Storage",
  "Pet Friendly Building or Community",
  "Low Maintenance Lifestyle (condo or newer construction)",
  "Proximity to Public Transit",
] as const;

export default function CompareHomesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [properties, setProperties] = useState<PropertyInput[]>([
    { id: 1, url: "", inputMode: 'url', mlsNumber: "" },
    { id: 2, url: "", inputMode: 'url', mlsNumber: "" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingPayment, setPendingPayment] = useState<{
    planType: string;
    stripeSessionId: string;
  } | null>(null);
  const [homePlanTier, setHomePlanTier] = useState<string>("free");
  const [selectedPlan, setSelectedPlan] = useState<string>("free");
  const [redirectingToStripe, setRedirectingToStripe] = useState(false);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [buyerSituation, setBuyerSituation] = useState("");
  const [mustHaves, setMustHaves] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        setUser(user);
        if (user) {
          supabase
            .from("profiles")
            .select("home_plan_tier")
            .eq("id", user.id)
            .single()
            .then(({ data }) => {
              if (data?.home_plan_tier) {
                setHomePlanTier(data.home_plan_tier);
                if (data.home_plan_tier !== "free") {
                  setSelectedPlan(data.home_plan_tier);
                }
              }
            });
        }
      })
      .catch(() => {})
      .finally(() => setAuthReady(true));
  }, []);

  // Handle return from Stripe checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    if (!payment) return;

    const stripeSessionId = params.get("session_id") || null;
    const stripePlan = params.get("plan") || null;

    // Clean URL params
    window.history.replaceState({}, "", "/compare/homes");

    if (payment === "success" && stripeSessionId && stripePlan) {
      // Restore saved data and AUTO-START comparison (don't make user click again)
      const savedRaw = sessionStorage.getItem("rivvl_home_pending_data");
      sessionStorage.removeItem("rivvl_home_pending_data");

      if (savedRaw) {
        try {
          const saved = JSON.parse(savedRaw);

          // Support both new format (with preferences) and old format (array of properties)
          const propArray = Array.isArray(saved) ? saved : saved.properties || [];
          const prefs = saved.preferences || {};

          const urls = propArray
            .filter((p: { inputMode?: string }) => (p.inputMode || "url") === "url")
            .map((p: { url?: string }) => (p.url || "").trim())
            .filter((u: string) => u.length > 0);
          const mlsNumbers = propArray
            .filter((p: { inputMode?: string }) => p.inputMode === "mls")
            .map((p: { mlsNumber?: string }) => (p.mlsNumber || "").trim())
            .filter((m: string) => m.length > 0);

          if (urls.length + mlsNumbers.length >= 2) {
            // Build the compare payload and auto-navigate to progress page
            const compareData = {
              urls,
              mlsNumbers,
              preferences: {
                priorities: prefs.priorities || [],
                buyerSituation: prefs.buyerSituation || "",
                mustHaves: prefs.mustHaves || [],
              },
              planType: stripePlan,
              stripeSessionId,
            };
            sessionStorage.setItem("rivvl_home_pending_compare", JSON.stringify(compareData));
            router.push("/homes/report/progress");
            return;
          }
        } catch { /* ignore parse errors, fall through to form restore */ }
      }

      // Fallback: restore from old URL-only format
      const savedUrls = sessionStorage.getItem("rivvl_home_pending_urls");
      if (savedUrls) {
        try {
          const urls = JSON.parse(savedUrls) as string[];
          if (urls.filter((u) => u.trim()).length >= 2) {
            const compareData = {
              urls: urls.filter((u) => u.trim()),
              mlsNumbers: [] as string[],
              preferences: { priorities: [], buyerSituation: "", mustHaves: [] },
              planType: stripePlan,
              stripeSessionId,
            };
            sessionStorage.setItem("rivvl_home_pending_compare", JSON.stringify(compareData));
            sessionStorage.removeItem("rivvl_home_pending_urls");
            router.push("/homes/report/progress");
            return;
          }
        } catch { /* ignore */ }
        sessionStorage.removeItem("rivvl_home_pending_urls");
      }

      // Last resort: if no saved data, just set state and let user click Compare
      setPendingPayment({ planType: stripePlan, stripeSessionId });
      setSelectedPlan(stripePlan);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canAddThird = selectedPlan === "home_premium" || selectedPlan === "home_pro10" || (pendingPayment && (pendingPayment.planType === "home_premium" || pendingPayment.planType === "home_pro10"));
  const maxProperties = canAddThird ? MAX_PROPERTIES_PREMIUM : MAX_PROPERTIES_FREE;

  function addProperty() {
    if (properties.length >= maxProperties) return;
    setProperties((prev) => [...prev, { id: Date.now(), url: "", inputMode: 'url', mlsNumber: "" }]);
  }

  function removeProperty(id: number) {
    if (properties.length <= 2) return;
    setProperties((prev) => prev.filter((p) => p.id !== id));
  }

  function updateProperty(id: number, value: string) {
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, url: value } : p))
    );
  }

  function toggleInputMode(id: number) {
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, inputMode: p.inputMode === 'url' ? 'mls' : 'url' } : p))
    );
  }

  function updateMlsNumber(id: number, value: string) {
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, mlsNumber: value } : p))
    );
  }

  function togglePriority(value: string) {
    setPriorities((prev) =>
      prev.includes(value)
        ? prev.filter((p) => p !== value)
        : prev.length < 3
          ? [...prev, value]
          : prev
    );
  }

  function toggleMustHave(value: string) {
    setMustHaves((prev) =>
      prev.includes(value)
        ? prev.filter((p) => p !== value)
        : prev.length < 3
          ? [...prev, value]
          : prev
    );
  }

  // Trim properties when downgrading plan
  useEffect(() => {
    if (properties.length > maxProperties) {
      setProperties((prev) => prev.slice(0, maxProperties));
    }
  }, [maxProperties, properties.length]);

  const redirectToStripeCheckout = useCallback(async (planTier: string) => {
    setRedirectingToStripe(true);

    // Save FULL form data (properties + preferences) so comparison can auto-start after Stripe redirect
    const savedData = {
      properties: properties.map((p) => ({
        inputMode: p.inputMode,
        url: p.url,
        mlsNumber: p.mlsNumber,
      })),
      preferences: { priorities, buyerSituation, mustHaves },
    };
    sessionStorage.setItem("rivvl_home_pending_data", JSON.stringify(savedData));

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: planTier, source: "compare" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create checkout session");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      setRedirectingToStripe(false);
      setError(err instanceof Error ? err.message : "Payment initialization failed. Please try again.");
    }
  }, [properties, priorities, buyerSituation, mustHaves]);

  async function handleCompare() {
    if (!user) {
      router.push("/login?redirect=/compare/homes");
      return;
    }

    const urls = properties
      .filter((p) => p.inputMode === 'url')
      .map((p) => p.url.trim())
      .filter((u) => u.length > 0);

    const mlsNumbers = properties
      .filter((p) => p.inputMode === 'mls')
      .map((p) => p.mlsNumber.trim())
      .filter((m) => m.length > 0);

    if (urls.length + mlsNumbers.length < 2) {
      setError("Please provide at least 2 property listing URLs or MLS numbers.");
      return;
    }

    // If paid plan selected and user hasn't paid yet, redirect to Stripe
    if (selectedPlan !== "free" && !pendingPayment) {
      // Check if user already has this plan active
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("home_plan_tier, home_reports_used, home_max_reports")
        .eq("id", user.id)
        .single();

      const currentPlan = profile?.home_plan_tier ?? "free";
      const used = profile?.home_reports_used ?? 0;
      const max = profile?.home_max_reports ?? 0;
      const hasCredits = currentPlan !== "free" && max > 0 && used < max;

      const planHierarchy: Record<string, number> = {
        free: 0, home_standard: 1, home_premium: 2, home_pro10: 3,
      };

      if (!hasCredits || (planHierarchy[currentPlan] ?? 0) < (planHierarchy[selectedPlan] ?? 0)) {
        await redirectToStripeCheckout(selectedPlan);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    // Save comparison data and navigate to progress page
    const compareData = {
      urls,
      mlsNumbers,
      preferences: {
        priorities,
        buyerSituation,
        mustHaves,
      },
      ...(pendingPayment
        ? {
            planType: pendingPayment.planType,
            stripeSessionId: pendingPayment.stripeSessionId,
          }
        : {}),
    };

    sessionStorage.setItem("rivvl_home_pending_compare", JSON.stringify(compareData));
    router.push("/homes/report/progress");
  }

  const hasAtLeastTwoInputs =
    properties.filter((p) => (p.inputMode === 'url' && p.url.trim().length > 0) || (p.inputMode === 'mls' && p.mlsNumber.trim().length > 0)).length >= 2;

  /* ─── Auth gate ─── */
  if (authReady && !user) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00D2FF] to-[#6C5CE7]">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-indigo-950 dark:text-gray-100">
            Sign in to Compare Real Estate
          </h1>
          <p className="mt-3 text-slate-600 dark:text-gray-400">
            Create a free account to start comparing properties.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login?redirect=/compare/homes"
              className="inline-flex items-center justify-center rounded-xl bg-[#00D2FF] px-8 py-3 text-sm font-semibold text-[#0F0F1A] transition-all hover:bg-[#00B8E0]"
            >
              Log in
            </Link>
            <Link
              href="/signup?redirect=/compare/homes"
              className="inline-flex items-center justify-center rounded-xl border border-[#00D2FF] px-8 py-3 text-sm font-semibold text-[#00D2FF] transition-all hover:bg-[#00D2FF]/10"
            >
              Sign up free
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Loading state ─── */
  if (!authReady) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00D2FF]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      {/* Back link */}
      <Link
        href="/homes"
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-[#00D2FF] dark:text-gray-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Real Estate
      </Link>

      {/* Header */}
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00D2FF] to-[#6C5CE7]">
          <Home className="h-7 w-7 text-white" />
        </div>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-indigo-950 dark:text-gray-100 sm:text-4xl">
          <span className="bg-gradient-to-r from-[#00D2FF] to-[#6C5CE7] bg-clip-text text-transparent">
            Compare Any Two Properties, Side by Side
          </span>
        </h1>
        <p className="mt-3 text-slate-600 dark:text-gray-400">
          Paste listings from Zillow, Redfin, or Realtor.com
        </p>

        {/* Feature strip */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {["Risk Report", "Financial Analysis", "Schools", "Crime Data", "Price History", "Smart Questions"].map((f) => (
            <span key={f} className="inline-flex items-center gap-1.5 rounded-full border border-[#00D2FF]/30 bg-[#00D2FF]/5 px-3 py-1 text-[11px] font-medium text-[#00D2FF]">
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* ═══ PLAN SELECTOR ═══ */}
      <section className="mt-10 rounded-2xl border border-[#00D2FF]/30 dark:border-gray-600 bg-white dark:bg-[#1A1A2E] p-6 shadow-sm">
        <h2 className="text-lg font-bold text-indigo-950 dark:text-gray-100">Choose Your Plan</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
          Select the depth of analysis you need.
        </p>

        {homePlanTier !== "free" && (
          <div className="mt-3 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
            <Check className="mr-1.5 inline h-3.5 w-3.5" />
            Your current plan: <span className="font-bold">{homePlanTier === "home_standard" ? "Standard" : homePlanTier === "home_premium" ? "Premium" : homePlanTier === "home_pro10" ? "Pro 10" : "Free"}</span>
          </div>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Free */}
          <button
            type="button"
            onClick={() => setSelectedPlan("free")}
            className={`relative flex flex-col rounded-xl border p-5 text-left transition-all duration-200 ${
              selectedPlan === "free"
                ? "border-[#00D2FF] ring-2 ring-[#00D2FF]/30 shadow-lg"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
            }`}
          >
            {selectedPlan === "free" && (
              <div className="absolute -right-1.5 -top-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00D2FF] shadow">
                  <Check className="h-3 w-3 text-white" />
                </div>
              </div>
            )}
            <p className="text-sm font-bold text-indigo-950 dark:text-gray-100">Free</p>
            <div className="mt-2">
              <span className="text-2xl font-bold text-indigo-950 dark:text-gray-100">$0</span>
              <span className="ml-1 text-xs text-slate-500 dark:text-gray-400">/forever</span>
            </div>
            <div className="mt-4 flex-1 space-y-1.5 text-xs text-slate-500 dark:text-gray-400">
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> Compare 2 properties</p>
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> Scores, Key Facts, Risk Report</p>
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> Basic report (no Our Pick)</p>
            </div>
          </button>

          {/* Standard */}
          <button
            type="button"
            onClick={() => setSelectedPlan("home_standard")}
            className={`relative flex flex-col rounded-xl border p-5 text-left transition-all duration-200 ${
              selectedPlan === "home_standard"
                ? "border-[#00D2FF] ring-2 ring-[#00D2FF]/30 shadow-lg"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
            }`}
          >
            {selectedPlan === "home_standard" && (
              <div className="absolute -right-1.5 -top-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00D2FF] shadow">
                  <Check className="h-3 w-3 text-white" />
                </div>
              </div>
            )}
            <p className="text-sm font-bold text-indigo-950 dark:text-gray-100">Standard</p>
            <div className="mt-2">
              <span className="text-2xl font-bold text-indigo-950 dark:text-gray-100">$9.99</span>
              <span className="ml-1 text-xs text-slate-500 dark:text-gray-400">/one-time</span>
            </div>
            <div className="mt-4 flex-1 space-y-1.5 text-xs text-slate-500 dark:text-gray-400">
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> Compare 2 properties</p>
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> All report sections</p>
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> Our Pick & Final Verdict</p>
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> Downloadable PDF</p>
            </div>
          </button>

          {/* Premium */}
          <button
            type="button"
            onClick={() => setSelectedPlan("home_premium")}
            className={`relative flex flex-col rounded-xl border pt-8 p-5 text-left transition-all duration-200 ${
              selectedPlan === "home_premium"
                ? "border-[#00D2FF] ring-2 ring-[#00D2FF]/30 shadow-lg"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
            }`}
          >
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#00D2FF] px-4 py-1 text-[11px] font-bold text-[#0F0F1A] shadow-md">
              Most Popular
            </span>
            {selectedPlan === "home_premium" && (
              <div className="absolute -right-1.5 -top-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00D2FF] shadow">
                  <Check className="h-3 w-3 text-white" />
                </div>
              </div>
            )}
            <p className="text-sm font-bold text-indigo-950 dark:text-gray-100">Premium</p>
            <div className="mt-2">
              <span className="text-2xl font-bold text-indigo-950 dark:text-gray-100">$19.99</span>
              <span className="ml-1 text-xs text-slate-500 dark:text-gray-400">/one-time</span>
            </div>
            <div className="mt-4 flex-1 space-y-1.5 text-xs text-slate-500 dark:text-gray-400">
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> Up to 3 properties</p>
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> All report sections</p>
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> Our Pick & Final Verdict</p>
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> Downloadable PDF</p>
            </div>
          </button>

          {/* Pro 10 */}
          <button
            type="button"
            onClick={() => setSelectedPlan("home_pro10")}
            className={`relative flex flex-col rounded-xl border pt-8 p-5 text-left transition-all duration-200 ${
              selectedPlan === "home_pro10"
                ? "border-[#00D2FF] ring-2 ring-[#00D2FF]/30 shadow-lg"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
            }`}
          >
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#F59E0B] px-4 py-1 text-[11px] font-bold text-white shadow-md">
              Best Value
            </span>
            {selectedPlan === "home_pro10" && (
              <div className="absolute -right-1.5 -top-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00D2FF] shadow">
                  <Check className="h-3 w-3 text-white" />
                </div>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-indigo-950 dark:text-gray-100">Pro 10</p>
              <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white leading-tight whitespace-nowrap">50% Off</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-indigo-950 dark:text-gray-100">$99.99</span>
              <span className="text-xs text-slate-500 dark:text-gray-400">/one-time</span>
            </div>
            <div className="mt-4 flex-1 space-y-1.5 text-xs text-slate-500 dark:text-gray-400">
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> 10 Premium reports</p>
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> Up to 3 properties each</p>
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> All report sections</p>
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> Credits never expire</p>
            </div>
          </button>
        </div>
      </section>

      {/* Supported sites note */}
      <div className="mt-8 flex items-start gap-2 rounded-xl border border-[#00D2FF]/20 bg-[#00D2FF]/5 px-4 py-3 dark:border-[#00D2FF]/10 dark:bg-[#00D2FF]/5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#00D2FF]" />
        <p className="text-sm text-slate-600 dark:text-gray-400">
          We support listings from Zillow, Redfin, Realtor.com, and most major
          real estate sites.
        </p>
      </div>

      {/* Property inputs */}
      <div className="mt-8 space-y-6">
        {properties.map((property, index) => (
          <div
            key={property.id}
            className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1A1A2E] p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-indigo-950 dark:text-gray-100">
                Property {index + 1}
              </h3>
              {properties.length > 2 && (
                <button
                  onClick={() => removeProperty(property.id)}
                  className="rounded-md p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mt-3">
              {property.inputMode === 'url' ? (
                <div className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#14142A] px-3 py-2.5 focus-within:border-[#00D2FF] focus-within:ring-1 focus-within:ring-[#00D2FF]/30">
                  <Link2 className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    type="url"
                    placeholder="Paste Zillow, Redfin, or Realtor.com link here"
                    value={property.url}
                    onChange={(e) => updateProperty(property.id, e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-transparent text-sm text-indigo-950 dark:text-gray-100 placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#14142A] px-3 py-2.5 focus-within:border-[#00D2FF] focus-within:ring-1 focus-within:ring-[#00D2FF]/30">
                    <Home className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. VAFX2123456"
                      value={property.mlsNumber}
                      onChange={(e) => updateMlsNumber(property.id, e.target.value)}
                      disabled={isLoading}
                      className="w-full bg-transparent text-sm text-indigo-950 dark:text-gray-100 placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-400 dark:text-gray-500">
                    <Info className="h-3 w-3" />
                    Enter the MLS number from your listing sheet or agent
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={() => toggleInputMode(property.id)}
                disabled={isLoading}
                className="mt-2 text-xs font-medium text-[#00D2FF] hover:text-[#00B8E0] transition-colors disabled:opacity-50"
              >
                {property.inputMode === 'url' ? 'Use MLS number instead' : 'Use listing URL instead'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add property button */}
      {properties.length < MAX_PROPERTIES_PREMIUM && !isLoading && (
        canAddThird ? (
          properties.length < maxProperties && (
            <button
              onClick={addProperty}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 py-4 text-sm font-medium text-slate-500 transition-colors hover:border-[#00D2FF] hover:text-[#00D2FF] dark:text-gray-400"
            >
              <Plus className="h-4 w-4" />
              + Add Third Property
            </button>
          )
        ) : (
          <div className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-4 text-sm font-medium text-slate-400 dark:text-gray-500 cursor-not-allowed" title="Select Premium or Pro 10 plan to compare up to 3 properties">
            <Lock className="h-4 w-4" />
            Select Premium plan to compare 3 properties
          </div>
        )
      )}

      {/* ═══ BUYER PREFERENCES ═══ */}
      <section className="mt-8 rounded-2xl border border-[#00D2FF]/30 dark:border-gray-600 bg-white dark:bg-[#1A1A2E] p-6 shadow-sm">
        <h2 className="text-lg font-bold text-indigo-950 dark:text-gray-100">Your Preferences</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
          Help us tailor the analysis to what matters most to you. (Optional but recommended)
        </p>

        {/* Priorities */}
        <div className="mt-6">
          <p className="text-sm font-semibold text-indigo-950 dark:text-gray-100">
            What matters most to you?
          </p>
          <p className="mb-3 text-xs text-slate-500 dark:text-gray-400">Select up to 3 ({priorities.length}/3)</p>
          <div className="flex flex-wrap gap-2.5">
            {(() => { const atLimit = priorities.length >= 3; return HOME_PRIORITIES.map((p) => {
              const isSelected = priorities.includes(p.value);
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => togglePriority(p.value)}
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? "bg-[#00D2FF] border-transparent text-[#0F0F1A] shadow-md"
                      : `border-slate-300 dark:border-gray-600 bg-white dark:bg-[#1E1E30] text-slate-600 dark:text-gray-300 hover:border-[#00D2FF] hover:shadow-sm${atLimit ? " opacity-50 cursor-not-allowed" : ""}`
                  }`}
                >
                  <span className={isSelected ? "text-[#0F0F1A]/70" : "text-slate-400"}>
                    {p.icon}
                  </span>
                  {p.value}
                </button>
              );
            }); })()}
          </div>
        </div>

        {/* Buyer Situation */}
        <div className="mt-8">
          <p className="text-sm font-semibold text-indigo-950 dark:text-gray-100">Buyer situation</p>
          <p className="mb-3 text-xs text-slate-500 dark:text-gray-400">Select exactly 1</p>
          <div className="flex flex-wrap gap-2">
            {BUYER_SITUATIONS.map((opt) => {
              const isSelected = buyerSituation === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBuyerSituation(isSelected ? "" : opt.value)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? "bg-[#00D2FF] border-transparent text-[#0F0F1A] shadow-md"
                      : "border-slate-300 dark:border-gray-600 bg-white dark:bg-[#1E1E30] text-slate-600 dark:text-gray-300 hover:border-[#00D2FF]"
                  }`}
                >
                  {opt.value}
                  {opt.desc && <span className="text-xs opacity-70">({opt.desc})</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Must Haves */}
        <div className="mt-8">
          <p className="text-sm font-semibold text-indigo-950 dark:text-gray-100">Must haves</p>
          <p className="mb-3 text-xs text-slate-500 dark:text-gray-400">Select up to 3 ({mustHaves.length}/3)</p>
          <div className="flex flex-wrap gap-2">
            {(() => { const atMustHaveLimit = mustHaves.length >= 3; return MUST_HAVES.map((item) => {
              const isSelected = mustHaves.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleMustHave(item)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? "bg-[#00D2FF] border-transparent text-[#0F0F1A] shadow-md"
                      : `border-slate-300 dark:border-gray-600 bg-white dark:bg-[#1E1E30] text-slate-600 dark:text-gray-300 hover:border-[#00D2FF]${atMustHaveLimit ? " opacity-50 cursor-not-allowed" : ""}`
                  }`}
                >
                  {isSelected && <Check className="h-3.5 w-3.5" />}
                  {item}
                </button>
              );
            }); })()}
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4 text-red-500" />
          </button>
        </div>
      )}

      {/* Compare button */}
      <div className="mt-8">
        <button
          onClick={handleCompare}
          disabled={!hasAtLeastTwoInputs || isLoading || redirectingToStripe}
          className="inline-flex w-full items-center justify-center rounded-xl bg-[#00D2FF] px-8 py-4 text-base font-semibold text-[#0F0F1A] shadow-lg transition-all hover:bg-[#00B8E0] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#00D2FF] disabled:hover:shadow-lg"
        >
          {redirectingToStripe ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Redirecting to checkout...
            </>
          ) : isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Preparing...
            </>
          ) : (
            <>
              <Home className="mr-2 h-5 w-5" />
              {selectedPlan === "free" ? "Compare Now" : `Compare Now: ${selectedPlan === "home_standard" ? "$9.99" : selectedPlan === "home_premium" ? "$19.99" : selectedPlan === "home_pro10" ? "$99.99" : "$0"}`}
            </>
          )}
        </button>
      </div>

    </div>
  );
}
