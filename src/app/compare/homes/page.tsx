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
  // Info,
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _BUYER_SITUATIONS = [
  { value: "Primary Home", desc: "We will live here full time" },
  { value: "Investment Property", desc: "Rental income or flip" },
  { value: "Vacation or Second Home", desc: "" },
  { value: "Downsizing", desc: "" },
  { value: "First-Time Buyer", desc: "" },
] as const;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _MUST_HAVES = [
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_homePlanTier, setHomePlanTier] = useState<string>("free");
  const [selectedPlan, setSelectedPlan] = useState<string>("free");
  const [redirectingToStripe, setRedirectingToStripe] = useState(false);
  const [priorities, setPriorities] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [buyerSituation, _setBuyerSituation] = useState("");
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
      const savedRaw = sessionStorage.getItem("rivvl_home_pending_data");
      sessionStorage.removeItem("rivvl_home_pending_data");

      if (savedRaw) {
        try {
          const saved = JSON.parse(savedRaw);
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
        } catch { /* ignore */ }
      }
      setPendingPayment({ planType: stripePlan, stripeSessionId });
      setSelectedPlan(stripePlan);
    }
  }, [router]);

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function _toggleMustHave(value: string) {
    setMustHaves((prev) =>
      prev.includes(value)
        ? prev.filter((p) => p !== value)
        : prev.length < 3
          ? [...prev, value]
          : prev
    );
  }

  useEffect(() => {
    if (properties.length > maxProperties) {
      setProperties((prev) => prev.slice(0, maxProperties));
    }
  }, [maxProperties, properties.length]);

  const redirectToStripeCheckout = useCallback(async (planTier: string) => {
    setRedirectingToStripe(true);
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
      if (!res.ok) throw new Error("Failed to create checkout session");
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      setRedirectingToStripe(false);
      setError(err instanceof Error ? err.message : "Payment initialization failed.");
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
      setError("Please provide at least 2 properties.");
      return;
    }
    if (selectedPlan !== "free" && !pendingPayment) {
      const supabase = createClient();
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      const currentPlan = profile?.home_plan_tier ?? "free";
      const used = profile?.home_reports_used ?? 0;
      const max = profile?.home_max_reports ?? 0;
      const hasCredits = currentPlan !== "free" && max > 0 && used < max;
      if (!hasCredits) {
        await redirectToStripeCheckout(selectedPlan);
        return;
      }
    }
    setIsLoading(true);
    const compareData = {
      urls, mlsNumbers,
      preferences: { priorities, buyerSituation, mustHaves },
      ...(pendingPayment ? { planType: pendingPayment.planType, stripeSessionId: pendingPayment.stripeSessionId } : {}),
    };
    sessionStorage.setItem("rivvl_home_pending_compare", JSON.stringify(compareData));
    router.push("/homes/report/progress");
  }

  const hasAtLeastTwoInputs = properties.filter((p) => (p.inputMode === 'url' && p.url.trim().length > 0) || (p.inputMode === 'mls' && p.mlsNumber.trim().length > 0)).length >= 2;

  if (authReady && !user) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 bg-mesh-gradient">
        <div className="max-w-md w-full glass-morphism p-12 rounded-[2.5rem] text-center shadow-2xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-zinc-100 dark:bg-zinc-800">
            <Lock className="h-10 w-10 text-black dark:text-white" />
          </div>
          <h1 className="mt-8 text-4xl font-black tracking-tight text-black dark:text-white">Sign in</h1>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400 font-medium">Create a free account to start comparing.</p>
          <div className="mt-10 flex flex-col gap-3">
            <Link href="/login?redirect=/compare/homes" className="h-14 flex items-center justify-center rounded-2xl bg-black text-white dark:bg-white dark:text-black font-bold">Log in</Link>
            <Link href="/signup?redirect=/compare/homes" className="h-14 flex items-center justify-center rounded-2xl border border-border bg-white/50 text-black font-bold">Sign up free</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!authReady) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-mesh-gradient">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="bg-mesh-gradient min-h-screen py-16 px-4">
      <div className="mx-auto max-w-3xl">
        <Link href="/homes" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Real Estate
        </Link>

        <div className="text-center mb-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-black dark:bg-white shadow-xl">
            <Home className="h-10 w-10 text-white dark:text-black" />
          </div>
          <h1 className="mt-8 text-4xl font-black tracking-tight text-black dark:text-white sm:text-5xl">Compare Properties</h1>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400 font-medium">Paste listings from Zillow, Redfin, or Realtor.com</p>
        </div>

        <section className="glass-morphism p-8 sm:p-10 rounded-[2.5rem] shadow-2xl mb-8">
          <h2 className="text-xl font-bold text-black dark:text-white">Choose Your Plan</h2>
          <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {["free", "home_standard", "home_premium", "home_pro10"].map((p) => {
              const works = { free: { name: "Free", price: "$0" }, home_standard: { name: "Standard", price: "$9.99" }, home_premium: { name: "Premium", price: "$19.99" }, home_pro10: { name: "Pro 10", price: "$99.99" } }[p];
              const isSelected = selectedPlan === p;
              const isPopular = p === "home_premium";
              return (
                <button
                  key={p}
                  onClick={() => setSelectedPlan(p)}
                  className={`relative flex flex-col rounded-2xl border p-5 text-left transition-all duration-300 ${
                    isSelected
                      ? "border-zinc-400 bg-white/80 shadow-2xl scale-105 z-10 dark:border-zinc-600 dark:bg-black/80"
                      : "border-border bg-white/20 hover:border-zinc-300 dark:border-zinc-800 dark:bg-black/20"
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black px-3 py-1 text-[8px] font-black uppercase tracking-widest text-white shadow-lg dark:bg-white dark:text-black">
                      MOST POPULAR
                    </span>
                  )}
                  {isSelected && (
                    <div className="absolute -right-1.5 -top-1.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black shadow-lg">
                        <Check className="h-3 w-3" />
                      </div>
                    </div>
                  )}
                  <p className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? "text-zinc-500" : "text-zinc-400"}`}>{works?.name}</p>
                  <p className={`mt-2 text-2xl font-black ${isSelected ? "text-black dark:text-white" : "text-black/60 dark:text-white/60"}`}>{works?.price}</p>
                </button>
              );
            })}
          </div>
        </section>

        <div className="space-y-6">
          {properties.map((p, index) => (
            <div key={p.id} className="glass-morphism p-8 rounded-[2rem] shadow-xl border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">Property {index + 1}</h3>
                {properties.length > 2 && <button onClick={() => removeProperty(p.id)} className="text-zinc-400 hover:text-red-500"><X className="h-5 w-5"/></button>}
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-border bg-white/50 px-5 py-4 dark:border-zinc-800 dark:bg-black/50">
                {p.inputMode === 'url' ? <Link2 className="h-5 w-5 text-zinc-400" /> : <Home className="h-5 w-5 text-zinc-400" />}
                <input
                  type={p.inputMode === 'url' ? "url" : "text"}
                  placeholder={p.inputMode === 'url' ? "Paste listing URL" : "MLS number"}
                  value={p.inputMode === 'url' ? p.url : p.mlsNumber}
                  onChange={(e) => p.inputMode === 'url' ? updateProperty(p.id, e.target.value) : updateMlsNumber(p.id, e.target.value)}
                  className="w-full bg-transparent text-sm font-bold placeholder:text-zinc-300 focus:outline-none"
                />
              </div>
              <button onClick={() => toggleInputMode(p.id)} className="mt-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black dark:hover:text-white">Switch to {p.inputMode === 'url' ? "MLS" : "URL"}</button>
            </div>
          ))}
        </div>

        {properties.length < maxProperties && (
          <button onClick={addProperty} className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-6 text-xs font-black uppercase tracking-widest text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 transition-all">
            <Plus className="h-5 w-5" /> Add Property
          </button>
        )}

        <section className="mt-12 glass-morphism p-10 rounded-[2.5rem] shadow-2xl">
          <h2 className="text-xl font-bold text-black dark:text-white">Preferences</h2>
          <div className="mt-8 space-y-8">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4">Top Priorities (Max 3)</p>
              <div className="flex flex-wrap gap-2">
                {HOME_PRIORITIES.map(opt => (
                  <button key={opt.value} onClick={() => togglePriority(opt.value)} className={`px-4 py-2.5 rounded-full text-xs font-bold border transition-all ${priorities.includes(opt.value) ? "bg-black text-white dark:bg-white dark:text-black" : "border-border bg-white/50 text-zinc-600 dark:border-zinc-800 dark:bg-black/50"}`}>{opt.value}</button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {error && <div className="mt-8 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex gap-2"><AlertCircle className="h-5 w-5"/>{error}</div>}

        <Button onClick={handleCompare} disabled={!hasAtLeastTwoInputs} loading={isLoading || redirectingToStripe} className="mt-12 w-full py-10 rounded-full text-xl font-black uppercase tracking-widest shadow-2xl bg-black text-white dark:bg-white dark:text-black">
          {selectedPlan === "free" ? "Start Free Comparison" : "Purchase & Compare"}
        </Button>
      </div>
    </div>
  );
}
