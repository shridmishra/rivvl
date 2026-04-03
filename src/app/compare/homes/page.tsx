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
import { Button } from "@/components/ui/button";

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
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-black dark:bg-white shadow-2xl">
            <Lock className="h-10 w-10 text-white dark:text-black" />
          </div>
          <h1 className="mt-8 text-4xl font-extrabold tracking-tighter text-foreground sm:text-5xl">
            Sign in to <br/> <span className="text-black/40 dark:text-white/40">Compare Real Estate</span>
          </h1>
          <p className="mt-3 text-slate-600 dark:text-gray-400">
            Create a free account to start comparing properties.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login?redirect=/compare/homes"
              className="inline-flex h-14 items-center justify-center rounded-full bg-black px-10 py-3 text-base font-bold text-white shadow-xl transition-all hover:bg-neutral-800 dark:bg-white dark:text-black"
            >
              Log in
            </Link>
            <Link
              href="/signup?redirect=/compare/homes"
              className="inline-flex h-14 items-center justify-center rounded-full border border-black/10 bg-neutral-50 px-10 py-3 text-base font-bold text-black transition-all hover:bg-black hover:text-white dark:border-white/10 dark:bg-neutral-900 dark:text-white"
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
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-black dark:bg-white shadow-2xl">
          <Home className="h-10 w-10 text-white dark:text-black" />
        </div>
        <h1 className="mt-8 text-4xl font-extrabold tracking-tighter text-foreground sm:text-5xl">
          Compare Any Two <br/>
          <span className="text-black/40 dark:text-white/40">Properties, Side by Side</span>
        </h1>
        <p className="mt-4 text-base text-muted-foreground font-medium">
          Paste listings from Zillow, Redfin, or Realtor.com
        </p>

        {/* Feature strip */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {["Risk Report", "Financial Analysis", "Schools", "Crime Data", "Price History", "Smart Questions"].map((f) => (
            <span key={f} className="inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-neutral-100 dark:bg-neutral-800 px-4 py-1.5 text-[10px] font-extrabold text-black dark:text-white uppercase tracking-widest">
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* ═══ PLAN SELECTOR ═══ */}
      <section className="mt-12 rounded-3xl border border-border bg-card p-8 shadow-sm">
        <h2 className="text-xl font-extrabold text-foreground tracking-tight">Choose Your Plan</h2>
        <p className="mt-1 text-sm text-muted-foreground font-medium">
          Select the depth of analysis you need.
        </p>

        {homePlanTier !== "free" && (
          <div className="mt-4 rounded-2xl border border-black/10 bg-neutral-100 dark:bg-neutral-800 px-5 py-4 text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3">
            <Check className="h-4 w-4" />
            Your current plan: {homePlanTier === "home_standard" ? "Standard" : homePlanTier === "home_premium" ? "Premium" : homePlanTier === "home_pro10" ? "Pro 10" : "Free"}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Free */}
          <button
            type="button"
            onClick={() => setSelectedPlan("free")}
            className={`relative flex flex-col rounded-2xl border p-6 text-left transition-all duration-300 ${
              selectedPlan === "free"
                ? "border-black dark:border-white ring-4 ring-black/5 dark:ring-white/5 bg-neutral-50 dark:bg-neutral-900 shadow-xl"
                : "border-border bg-background hover:border-black/10 dark:hover:border-white/10"
            }`}
          >
            {selectedPlan === "free" && (
              <div className="absolute -right-1.5 -top-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black shadow-lg">
                  <Check className="h-3.5 w-3.5" />
                </div>
              </div>
            )}
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">Free</p>
            <div className="mt-2">
              <span className="text-3xl font-black text-foreground">$0</span>
            </div>
            <div className="mt-6 flex-1 space-y-2 text-[11px] font-bold text-muted-foreground">
              <p className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-foreground" /> 2 properties</p>
              <p className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-foreground" /> Basic report</p>
            </div>
          </button>

          {/* Standard */}
          <button
            type="button"
            onClick={() => setSelectedPlan("home_standard")}
            className={`relative flex flex-col rounded-2xl border p-6 text-left transition-all duration-300 ${
              selectedPlan === "home_standard"
                ? "border-black dark:border-white ring-4 ring-black/5 dark:ring-white/5 bg-neutral-50 dark:bg-neutral-900 shadow-xl"
                : "border-border bg-background hover:border-black/10 dark:hover:border-white/10"
            }`}
          >
            {selectedPlan === "home_standard" && (
              <div className="absolute -right-1.5 -top-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black shadow-lg">
                  <Check className="h-3.5 w-3.5" />
                </div>
              </div>
            )}
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">Standard</p>
            <div className="mt-2">
              <span className="text-3xl font-black text-foreground">$9.99</span>
            </div>
            <div className="mt-6 flex-1 space-y-2 text-[11px] font-bold text-muted-foreground">
              <p className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-foreground" /> 2 properties</p>
              <p className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-foreground" /> All sections</p>
              <p className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-foreground" /> PDF Export</p>
            </div>
          </button>

          {/* Premium */}
          <button
            type="button"
            onClick={() => setSelectedPlan("home_premium")}
            className={`relative flex flex-col rounded-2xl border p-6 text-left transition-all duration-300 ${
              selectedPlan === "home_premium"
                ? "border-black dark:border-white ring-4 ring-black/5 dark:ring-white/5 bg-black text-white dark:bg-white dark:text-black shadow-2xl"
                : "border-border bg-background hover:border-black/10 dark:hover:border-white/10 hover:shadow-md"
            }`}
          >
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground px-5 py-2 text-[9px] font-black uppercase tracking-widest text-background shadow-xl">
              MOST POPULAR
            </span>
            {selectedPlan === "home_premium" && (
              <div className="absolute -right-1.5 -top-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black dark:bg-black dark:text-white shadow-lg">
                  <Check className="h-3.5 w-3.5" />
                </div>
              </div>
            )}
            <p className={`text-[10px] font-extrabold uppercase tracking-[0.2em] ${selectedPlan === "home_premium" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>Premium</p>
            <div className={`mt-2 ${selectedPlan === "home_premium" ? "text-primary-foreground" : "text-foreground"}`}>
              <span className="text-3xl font-black">$19.99</span>
            </div>
            <div className={`mt-6 flex-1 space-y-2 text-[11px] font-bold ${selectedPlan === "home_premium" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
              <p className="flex items-center gap-2"><Check className={`h-3.5 w-3.5 shrink-0 ${selectedPlan === "home_premium" ? "text-primary-foreground" : "text-foreground"}`} /> 3 properties</p>
              <p className="flex items-center gap-2"><Check className={`h-3.5 w-3.5 shrink-0 ${selectedPlan === "home_premium" ? "text-primary-foreground" : "text-foreground"}`} /> All sections</p>
              <p className="flex items-center gap-2"><Check className={`h-3.5 w-3.5 shrink-0 ${selectedPlan === "home_premium" ? "text-primary-foreground" : "text-foreground"}`} /> PDF Export</p>
            </div>
          </button>

          {/* Pro 10 */}
          <button
            type="button"
            onClick={() => setSelectedPlan("home_pro10")}
            className={`relative flex flex-col rounded-2xl border p-6 text-left transition-all duration-300 ${
              selectedPlan === "home_pro10"
                ? "border-black dark:border-white ring-4 ring-black/5 dark:ring-white/5 bg-neutral-50 dark:bg-neutral-900 shadow-xl"
                : "border-border bg-background hover:border-black/10 dark:hover:border-white/10"
            }`}
          >
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-500 px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-white shadow-xl">
              BEST VALUE
            </span>
            {selectedPlan === "home_pro10" && (
              <div className="absolute -right-1.5 -top-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black shadow-lg">
                  <Check className="h-3.5 w-3.5" />
                </div>
              </div>
            )}
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">Pro 10</p>
            <div className="mt-2">
              <span className="text-3xl font-black text-foreground">$99.99</span>
            </div>
            <div className="mt-1">
              <span className="rounded-full bg-foreground px-2 py-0.5 text-[8px] font-black text-background leading-tight uppercase tracking-widest">50% OFF</span>
            </div>
            <div className="mt-4 flex-1 space-y-2 text-[11px] font-bold text-muted-foreground">
              <p className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-foreground" /> 10 Reports</p>
              <p className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-foreground" /> Extended comparisons</p>
            </div>
          </button>
        </div>
      </section>

      {/* Supported sites note */}
      <div className="mt-12 flex items-start gap-3 rounded-2xl border border-black/5 bg-neutral-100 dark:bg-neutral-800/50 px-6 py-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-black dark:text-white" />
        <p className="text-sm text-muted-foreground font-medium">
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

              {property.inputMode === 'url' ? (
                <div className="flex items-center gap-3 rounded-full border border-border bg-neutral-50 dark:bg-neutral-900 px-5 py-3.5 focus-within:border-black dark:focus-within:border-white focus-within:ring-4 focus-within:ring-black/5 dark:focus-within:ring-white/5 transition-all">
                  <Link2 className="h-5 w-5 shrink-0 text-neutral-400" />
                  <input
                    type="url"
                    placeholder="Paste listing URL here"
                    value={property.url}
                    onChange={(e) => updateProperty(property.id, e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-transparent text-sm font-bold text-foreground placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-50"
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 rounded-full border border-border bg-neutral-50 dark:bg-neutral-900 px-5 py-3.5 focus-within:border-black dark:focus-within:border-white focus-within:ring-4 focus-within:ring-black/5 dark:focus-within:ring-white/5 transition-all">
                    <Home className="h-5 w-5 shrink-0 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="e.g. VAFX2123456"
                      value={property.mlsNumber}
                      onChange={(e) => updateMlsNumber(property.id, e.target.value)}
                      disabled={isLoading}
                      className="w-full bg-transparent text-sm font-bold text-foreground placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-5">
                    <Info className="h-3 w-3" />
                    Enter the MLS number from your listing sheet
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={() => toggleInputMode(property.id)}
                disabled={isLoading}
                className="mt-3 px-5 text-[10px] font-extrabold text-black dark:text-white uppercase tracking-widest hover:underline transition-all disabled:opacity-50"
              >
                {property.inputMode === 'url' ? 'Use MLS number' : 'Use listing URL'}
              </button>
          </div>
        ))}
      </div>

      {/* Add property button */}
      {properties.length < MAX_PROPERTIES_PREMIUM && !isLoading && (
        canAddThird ? (
          properties.length < maxProperties && (
            <button
              onClick={addProperty}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-border py-4 text-xs font-extrabold uppercase tracking-widest text-muted-foreground transition-all hover:border-black hover:text-black dark:hover:border-white dark:hover:text-white"
            >
              <Plus className="h-4 w-4" />
              Add Third Property
            </button>
          )
        ) : (
          <div className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-border py-4 text-xs font-extrabold uppercase tracking-widest text-muted-foreground/30 cursor-not-allowed">
            <Lock className="h-4 w-4" />
            Selection Premium plan for 3 properties
          </div>
        )
      )}

      {/* ═══ BUYER PREFERENCES ═══ */}
      <section className="mt-12 rounded-3xl border border-border bg-card p-8 shadow-sm">
        <h2 className="text-xl font-extrabold text-foreground tracking-tight">Your Preferences</h2>
        <p className="mt-1 text-sm text-muted-foreground font-medium">
          Help us tailor the analysis to what matters most to you.
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
      <div className="mt-12">
        <Button
          onClick={handleCompare}
          disabled={!hasAtLeastTwoInputs}
          loading={isLoading || redirectingToStripe}
          loadingText={redirectingToStripe ? "Redirecting..." : "Preparing..."}
          className="w-full py-8 text-lg font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99] rounded-full bg-black text-white dark:bg-white dark:text-black"
        >
          <div className="flex items-center gap-3">
            <Home className="h-6 w-6" />
            {selectedPlan === "free" ? "Start Free Comparison" : `Purchase & Compare: ${selectedPlan === "home_standard" ? "$9.99" : selectedPlan === "home_premium" ? "$19.99" : selectedPlan === "home_pro10" ? "$99.99" : "$0"}`}
          </div>
        </Button>
      </div>

    </div>
  );
}
