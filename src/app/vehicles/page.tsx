"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  AlertCircle,
  X,
  Star,
  AlertTriangle,

  DollarSign,
  Trophy,
  MessageSquareWarning,
  Scale,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";

/* ─── Pricing plans ─── */
interface PlanDef {
  name: string;
  role: string | null;
  price: string;
  period: string;
  vehicles: string;
  sections: string;
  features: string[];
  cta: string;
  highlighted: boolean;
  badge?: string;
  savingsBadge?: string;
}

const plans: PlanDef[] = [
  {
    name: "Free",
    role: null,
    price: "$0",
    period: "forever",
    vehicles: "2 vehicles",
    sections: "Basic report",
    features: [
      "Compare 2 vehicles",
      "Scores, Key Facts, Pros & Cons",
      "Upgrade anytime for full report",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Single Report",
    role: "car_single",
    price: "$4.99",
    period: "one-time",
    vehicles: "2 vehicles",
    sections: "All 11 sections",
    features: [
      "Full report for 2 vehicles",
      "All 11 report sections",
      "Our Pick & Final Verdict",
      "Downloadable PDF",
      "Shareable link",
    ],
    cta: "Buy Report",
    highlighted: false,
  },
  {
    name: "Pro Report",
    role: "car_pro_report",
    price: "$9.99",
    period: "one-time",
    vehicles: "4 vehicles",
    sections: "All 11 sections",
    features: [
      "Full report for up to 4 vehicles",
      "Everything in Single Report",
      "Side-by-side multi-car view",
      "Best for multiple options",
    ],
    cta: "Buy Report",
    highlighted: true,
    badge: "MOST POPULAR",
  },
  {
    name: "Pro 10",
    role: "car_pro10",
    price: "$59.99",
    period: "one-time",
    vehicles: "4 vehicles",
    sections: "All 11 sections",
    features: [
      "10 Pro reports included",
      "Up to 4 vehicles each",
      "All 11 report sections",
      "Credits never expire",
    ],
    cta: "Buy Pro 10",
    highlighted: false,
    badge: "BEST VALUE",
    savingsBadge: "Save 40%",
  },
];

export default function VehiclesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  async function handleCheckout(role: string) {
    if (!user) {
      router.push("/login?redirect=/vehicles");
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
      if (!res.ok) throw new Error(data.error || "Failed to start checkout");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoadingRole(null);
    }
  }

  return (
    <div className="flex flex-col">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-white px-4 py-24 sm:py-32 lg:py-40">
        {/* gradient orbs — subtle for light theme */}
        <div className="pointer-events-none absolute -left-32 top-16 h-[420px] w-[420px] rounded-full bg-purple-200/30 blur-[120px]" />
        <div className="pointer-events-none absolute right-[-80px] top-48 h-[360px] w-[360px] rounded-full bg-cyan-200/20 blur-[100px]" />

        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-[56px]">
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              The Smarter Way to Compare Cars.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#4A4A6A]">
            NHTSA safety ratings, recall history, EPA fuel economy, and 5-year
            ownership projections, all in one report.
          </p>
          <div className="mt-10">
            <Link
              href="/compare"
              className="inline-flex items-center rounded-xl bg-purple-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-purple-500 hover:shadow-xl hover:-translate-y-0.5"
            >
              Compare Vehicles Free&nbsp;&rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURE BENTO GRID ── */}
      <section className="bg-[#F4F4F8] px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-5 md:grid-cols-2">
            {/* Card 1 — col-span-2: AI Head-to-Head Comparison */}
            <div className="md:col-span-2 rounded-2xl border border-[#E5E5F0] bg-white shadow-md p-8">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-purple-400">
                <Scale className="h-4 w-4" /> Head-to-Head Comparison
              </div>
              <p className="mt-2 text-sm text-[#4A4A6A]">
                Side-by-side scoring across 6 categories. See exactly where each vehicle wins.
              </p>
              <div className="mt-5 space-y-3">
                {[
                  { label: "Safety", v1: 92, v2: 85 },
                  { label: "Reliability", v1: 78, v2: 88 },
                  { label: "Value", v1: 80, v2: 74 },
                  { label: "Fuel Economy", v1: 70, v2: 85 },
                  { label: "Features", v1: 88, v2: 82 },
                  { label: "Ownership Cost", v1: 72, v2: 80 },
                ].map((cat) => (
                  <div key={cat.label}>
                    <div className="flex justify-between text-xs text-[#4A4A6A]/70 mb-1">
                      <span>{cat.label}</span>
                      <span>{cat.v1} vs {cat.v2}</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-3 rounded-full bg-purple-500" style={{ width: `${cat.v1}%` }} />
                      <div className="h-3 rounded-full bg-cyan-400" style={{ width: `${cat.v2}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2 — Our Pick Recommendation */}
            <div className="rounded-2xl border border-[#E5E5F0] bg-white shadow-md p-8">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-yellow-500">
                <Trophy className="h-4 w-4" /> Our Pick Recommendation
              </div>
              <p className="mt-2 text-sm text-[#4A4A6A]">
                Intelligent recommendation based on YOUR priorities: budget, reliability, fuel economy, and safety.
              </p>
              <div className="mt-5 rounded-xl bg-[#F8F9FA] p-5">
                <div className="flex items-center gap-3">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-sm font-semibold text-[#0F0F1A]">Vehicle 2 is the stronger choice</p>
                    <p className="mt-1 text-xs text-[#4A4A6A]/70">Based on your priorities: reliability and fuel economy ranked highest.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3 — AI Pros and Cons */}
            <div className="rounded-2xl border border-[#E5E5F0] bg-white shadow-md p-8">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-500">
                <Zap className="h-4 w-4" /> Pros and Cons
              </div>
              <p className="mt-2 text-sm text-[#4A4A6A]">
                Intelligently generated strengths and weaknesses for each vehicle, so you know exactly what you are getting.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-[#F8F9FA] p-4">
                  <p className="text-xs font-semibold text-emerald-600 mb-2">Pros</p>
                  <ul className="space-y-1.5">
                    {["Top-tier safety ratings", "Lower 5-year ownership cost", "Better fuel economy"].map((item) => (
                      <li key={item} className="flex items-start gap-1.5 text-xs text-[#4A4A6A]">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />{item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl bg-[#F8F9FA] p-4">
                  <p className="text-xs font-semibold text-red-500 mb-2">Cons</p>
                  <ul className="space-y-1.5">
                    {["Higher base price", "Fewer tech features", "Smaller cargo space"].map((item) => (
                      <li key={item} className="flex items-start gap-1.5 text-xs text-[#4A4A6A]">
                        <X className="mt-0.5 h-3 w-3 shrink-0 text-red-400" />{item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Card 4 — col-span-2: True Cost of Ownership */}
            <div className="md:col-span-2 rounded-2xl border border-[#E5E5F0] bg-white shadow-md p-8">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-500">
                <DollarSign className="h-4 w-4" /> True Cost of Ownership
              </div>
              <p className="mt-2 text-sm text-[#4A4A6A]">
                5-year projection including depreciation, insurance estimate, fuel costs, and maintenance. What Carfax won&apos;t tell you.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-[#F8F9FA] p-5">
                  <p className="text-sm font-semibold text-[#0F0F1A]">Vehicle 1</p>
                  <p className="mt-1 text-2xl font-bold text-purple-500">$42,300</p>
                  <div className="mt-3 space-y-1.5 text-xs text-[#4A4A6A]/70">
                    <div className="flex justify-between"><span>Depreciation</span><span>$18,200</span></div>
                    <div className="flex justify-between"><span>Insurance</span><span>$9,600</span></div>
                    <div className="flex justify-between"><span>Fuel</span><span>$8,500</span></div>
                    <div className="flex justify-between"><span>Maintenance</span><span>$6,000</span></div>
                  </div>
                </div>
                <div className="rounded-xl bg-[#F8F9FA] p-5">
                  <p className="text-sm font-semibold text-[#0F0F1A]">Vehicle 2</p>
                  <p className="mt-1 text-2xl font-bold text-cyan-500">$38,700</p>
                  <div className="mt-3 space-y-1.5 text-xs text-[#4A4A6A]/70">
                    <div className="flex justify-between"><span>Depreciation</span><span>$15,800</span></div>
                    <div className="flex justify-between"><span>Insurance</span><span>$9,200</span></div>
                    <div className="flex justify-between"><span>Fuel</span><span>$7,200</span></div>
                    <div className="flex justify-between"><span>Maintenance</span><span>$6,500</span></div>
                  </div>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <div>
                  <p className="mb-1 text-xs text-[#4A4A6A]/70">Vehicle 1</p>
                  <div className="h-4 rounded-full bg-purple-500/80" style={{ width: "88%" }} />
                </div>
                <div>
                  <p className="mb-1 text-xs text-[#4A4A6A]/70">Vehicle 2</p>
                  <div className="h-4 rounded-full bg-cyan-400/80" style={{ width: "76%" }} />
                </div>
              </div>
            </div>

            {/* Card 5 — Government Safety Data */}
            <div className="rounded-2xl border border-[#E5E5F0] bg-white shadow-md p-8">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-400">
                <AlertTriangle className="h-4 w-4" /> Government Safety Data
              </div>
              <p className="mt-2 text-sm text-[#4A4A6A]">
                NHTSA safety ratings, recall history, and real owner complaints in one place.
              </p>
              <div className="mt-5 rounded-xl bg-[#F8F9FA] p-5">
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="ml-2 text-xs text-[#4A4A6A]/70">5 / 5 Overall</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-xs text-[#4A4A6A]">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-red-400" />
                    <span>3 active recalls flagged</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-[#4A4A6A]">
                    <MessageSquareWarning className="mt-0.5 h-3 w-3 shrink-0 text-orange-400" />
                    <span>47 NHTSA complaints filed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 6 — Final Verdict */}
            <div className="rounded-2xl border border-[#E5E5F0] bg-white shadow-md p-8">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-purple-500">
                <Star className="h-4 w-4" /> Final Verdict
              </div>
              <p className="mt-2 text-sm text-[#4A4A6A]">
                rivvl tells you which car to buy. A clear winner with reasoning you can trust.
              </p>
              <div className="mt-5 rounded-xl bg-[#F8F9FA] p-5">
                <p className="text-sm font-semibold text-[#0F0F1A]">
                  Winner: Vehicle 2
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[#4A4A6A]">
                  Vehicle 2 edges ahead with better reliability scores, lower projected ownership costs, and superior fuel economy. While Vehicle 1 has a slight safety advantage, Vehicle 2 offers the best overall value for most buyers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#0F0F1A] sm:text-4xl">
              <span className="gradient-text">Vehicle Comparison Pricing</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[#4A4A6A]">
              Start free. Upgrade when you need the full picture.
            </p>
          </div>

          {error && (
            <div className="mx-auto mt-8 flex max-w-xl items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4 text-red-500" /></button>
            </div>
          )}

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const isLoading = loadingRole === plan.role;
              return (
                <div key={plan.name} className={`card-hover relative flex flex-col rounded-xl border p-8 ${plan.highlighted ? "gradient-border scale-105 bg-white shadow-xl z-10" : "border-gray-300 bg-white shadow-sm"}`}>
                  {plan.badge && (
                    <span className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1 text-[10px] font-bold tracking-wide text-white shadow-md ${plan.badge === "BEST VALUE" ? "bg-[#F59E0B]" : "bg-[#6C5CE7]"}`}>{plan.badge}</span>
                  )}
                  <div className={`flex items-center gap-1.5 ${plan.badge ? "mt-2" : ""}`}>
                    <h3 className="text-base font-bold text-[#0F0F1A]">{plan.name}</h3>
                    {plan.savingsBadge && (
                      <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white leading-tight whitespace-nowrap">{plan.savingsBadge}</span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#0F0F1A]">{plan.price}</span>
                    <span className="text-sm text-[#4A4A6A]/70">{plan.period}</span>
                  </div>
                  <p className="mt-2 text-xs text-[#4A4A6A]/70">{plan.vehicles} &middot; {plan.sections}</p>
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-[#4A4A6A]">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />{f}
                      </li>
                    ))}
                  </ul>
                  {plan.role === null ? (
                    <Button variant="outline" asChild className="mt-6 w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300">
                      <Link href="/compare">{plan.cta}</Link>
                    </Button>
                  ) : plan.highlighted ? (
                    <Button 
                      onClick={() => handleCheckout(plan.role!)} 
                      loading={isLoading}
                      loadingText="Redirecting..."
                      disabled={loadingRole !== null && !isLoading}
                      className="gradient-bg-hover mt-6 w-full text-white"
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
                      className="mt-6 w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300"
                    >
                      {plan.cta}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-16 text-center">
            <Link href="/compare" className="gradient-bg-hover inline-flex items-center rounded-xl px-10 py-4 text-base font-semibold text-white shadow-lg">
              Start Comparing Vehicles
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#F4F4F8] px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-8 sm:flex-row sm:items-start">
            <div>
              <Image src="/images/rivvl-logo-black.png" alt="rivvl" width={100} height={33} className="h-7 w-auto" />
              <p className="mt-2 text-sm text-[#4A4A6A]">Intelligent Comparison Reports</p>
            </div>
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[#4A4A6A]">
              <Link href="/" className="transition-colors hover:text-[#0F0F1A]">Home</Link>
              <Link href="/vehicles" className="transition-colors hover:text-[#0F0F1A]">Vehicles</Link>
              <Link href="/homes" className="transition-colors hover:text-[#0F0F1A]">Real Estate</Link>
              <Link href="/contact" className="transition-colors hover:text-[#0F0F1A]">Contact</Link>
              <Link href="/privacy" className="transition-colors hover:text-[#0F0F1A]">Privacy Policy</Link>
              <Link href="/terms" className="transition-colors hover:text-[#0F0F1A]">Terms of Service</Link>
            </nav>
          </div>
          <div className="mt-10 border-t border-[#E5E5F0] pt-6 text-center text-sm text-[#4A4A6A]/60">&copy; 2026 rivvl. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
