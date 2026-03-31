"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  Loader2,
  AlertCircle,
  X,
  ShieldAlert,
  TrendingUp,
  DollarSign,
  GraduationCap,
  Shield,
  MessageSquare,
  CheckSquare,
  History,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

/* ─── Pricing plans ─── */
interface PlanDef {
  name: string;
  role: string | null;
  price: string;
  period: string;
  properties: string;
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
    properties: "2 properties",
    sections: "Basic report",
    features: [
      "Compare 2 properties",
      "Scores, Key Facts, Pros & Cons",
      "Risk Report included",
      "Upgrade anytime for full report",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Standard",
    role: "home_standard",
    price: "$9.99",
    period: "one-time",
    properties: "2 properties",
    sections: "All sections",
    features: [
      "Full report for 2 properties",
      "All 10 report sections",
      "Our Pick & Final Verdict",
      "School ratings & flood risk",
      "Downloadable PDF",
    ],
    cta: "Buy Report",
    highlighted: false,
  },
  {
    name: "Premium",
    role: "home_premium",
    price: "$19.99",
    period: "one-time",
    properties: "3 properties",
    sections: "All sections",
    features: [
      "Full report for up to 3 properties",
      "Everything in Standard",
      "Side-by-side comparison view",
      "Best for comparing multiple properties",
      "Downloadable PDF",
    ],
    cta: "Buy Report",
    highlighted: true,
    badge: "MOST POPULAR",
  },
  {
    name: "Pro 10",
    role: "home_pro10",
    price: "$99.99",
    period: "one-time",
    properties: "3 properties",
    sections: "All sections",
    features: [
      "10 Premium reports included",
      "Up to 3 properties each",
      "All 10 report sections",
      "Credits never expire",
    ],
    cta: "Buy Pro 10",
    highlighted: false,
    badge: "BEST VALUE",
    savingsBadge: "Save 50%",
  },
];

export default function HomesPage() {
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
      router.push("/login?redirect=/homes");
      return;
    }
    setLoadingRole(role);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, source: "compare" }),
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
        {/* gradient orbs */}
        <div className="pointer-events-none absolute -left-32 top-16 h-[420px] w-[420px] rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="pointer-events-none absolute right-[-80px] top-48 h-[360px] w-[360px] rounded-full bg-purple-600/5 blur-[100px]" />

        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-[56px]">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              The Smarter Way to Compare Real Estate.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#4A4A6A]">
            Risk reports, financial projections, school data, crime context,
            price history, and negotiation intelligence, all before you
            make an offer.
          </p>
          <div className="mt-10">
            <Link
              href="/compare/homes"
              className="inline-flex items-center rounded-xl bg-cyan-500 px-8 py-4 text-base font-semibold text-[#0F0F1A] shadow-lg transition-all hover:bg-cyan-400 hover:shadow-xl hover:-translate-y-0.5"
            >
              Compare Real Estate Free&nbsp;&rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURE BENTO GRID ── */}
      <section className="bg-[#F4F4F8] px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid w-full items-stretch gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6">
            {/* Card 1: Property Risk Report */}
            <div className="sm:col-span-1 lg:col-span-2 flex flex-col rounded-2xl border border-[#E5E5F0] bg-white shadow-md p-8">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-400">
                <ShieldAlert className="h-4 w-4" /> Property Risk Report
              </div>
              <div className="mt-4 flex-1 space-y-2.5">
                {[
                  { label: "Flood Zone", level: "Moderate", color: "bg-yellow-400" },
                  { label: "Wildfire Risk", level: "Low", color: "bg-emerald-400" },
                  { label: "Earthquake", level: "High", color: "bg-red-400" },
                  { label: "Environmental Hazards", level: "Low", color: "bg-emerald-400" },
                  { label: "Foundation Risk", level: "Moderate", color: "bg-yellow-400" },
                  { label: "Radon Levels", level: "Low", color: "bg-emerald-400" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between rounded-lg bg-[#F8F9FA] px-4 py-2">
                    <span className="text-sm text-[#4A4A6A]">{row.label}</span>
                    <span className="flex items-center gap-2 text-xs font-semibold text-[#0F0F1A]">
                      <span className={`h-2 w-2 rounded-full ${row.color}`} />
                      {row.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Negotiation Intelligence */}
            <div className="lg:col-span-2 flex flex-col rounded-2xl border border-[#E5E5F0] bg-white shadow-md p-8">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400">
                <TrendingUp className="h-4 w-4" /> Negotiation Intelligence
              </div>
              <div className="flex-1">
                <p className="mt-6 text-center text-3xl font-bold text-emerald-400">STRONG</p>
                <p className="mt-1 text-center text-sm text-[#4A4A6A]/70">Buyer Position</p>
                <p className="mt-4 text-xs leading-relaxed text-[#4A4A6A]/70">
                  Based on days on market, price history, and local comps.
                </p>
              </div>
            </div>

            {/* Card 3: Price & Transaction History */}
            <div className="lg:col-span-2 flex flex-col rounded-2xl border border-[#E5E5F0] bg-white shadow-md p-8">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-purple-400">
                <History className="h-4 w-4" /> Price & Transaction History
              </div>
              <div className="mt-4 flex-1 overflow-hidden rounded-lg border border-[#E5E5F0]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E5F0] bg-[#F8F9FA] text-[#4A4A6A]/70">
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 font-medium">Event</th>
                      <th className="px-3 py-2 font-medium text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#4A4A6A]">
                    <tr className="border-b border-[#E5E5F0]">
                      <td className="px-3 py-2">2024</td>
                      <td className="px-3 py-2">Listed</td>
                      <td className="px-3 py-2 text-right">$485,000</td>
                    </tr>
                    <tr className="border-b border-[#E5E5F0]">
                      <td className="px-3 py-2">2021</td>
                      <td className="px-3 py-2">Sold</td>
                      <td className="px-3 py-2 text-right">$390,000</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2">2017</td>
                      <td className="px-3 py-2">Sold</td>
                      <td className="px-3 py-2 text-right">$310,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Card 4: 5-Year Financial Projection */}
            <div className="sm:col-span-1 lg:col-span-2 flex flex-col rounded-2xl border border-[#E5E5F0] bg-white shadow-md p-8">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400">
                <DollarSign className="h-4 w-4" /> 5-Year Financial Projection
              </div>
              <div className="flex-1">
                <p className="mt-4 text-lg font-semibold text-[#0F0F1A]">
                  5-Year Total Cost: <span className="text-purple-400">$312,000</span> vs{" "}
                  <span className="text-cyan-400">$287,000</span>
                </p>
                <div className="mt-5 space-y-3">
                  <div>
                    <p className="mb-1 text-xs text-[#4A4A6A]/70">Property A</p>
                    <div className="h-4 rounded-full bg-purple-500/80" style={{ width: "90%" }} />
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-[#4A4A6A]/70">Property B</p>
                    <div className="h-4 rounded-full bg-cyan-400/80" style={{ width: "78%" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 5: Nearby Schools */}
            <div className="lg:col-span-2 flex flex-col rounded-2xl border border-[#E5E5F0] bg-white shadow-md p-8">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-400">
                <GraduationCap className="h-4 w-4" /> Nearby Schools
              </div>
              <div className="mt-4 flex-1 space-y-3">
                {[
                  { name: "Lincoln Elementary", rating: "9/10", dist: "0.3 mi" },
                  { name: "Washington Middle", rating: "7/10", dist: "0.8 mi" },
                  { name: "Jefferson High", rating: "8/10", dist: "1.2 mi" },
                ].map((school) => (
                  <div key={school.name} className="flex items-center justify-between rounded-lg bg-[#F8F9FA] px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-[#0F0F1A]">{school.name}</p>
                      <p className="text-[10px] text-[#4A4A6A]/70">{school.dist}</p>
                    </div>
                    <span className="text-sm font-bold text-blue-400">{school.rating}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 6: Crime Context */}
            <div className="lg:col-span-2 flex flex-col rounded-2xl border border-[#E5E5F0] bg-white shadow-md p-8">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-orange-400">
                <Shield className="h-4 w-4" /> Crime Context
              </div>
              <div className="mt-5 flex-1 space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-[#4A4A6A]">
                    <span>Property Crime</span>
                    <span className="text-yellow-400">Moderate</span>
                  </div>
                  <div className="mt-1.5 h-3 w-full rounded-full bg-[#F8F9FA]">
                    <div className="h-3 rounded-full bg-yellow-400/70" style={{ width: "55%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-[#4A4A6A]">
                    <span>Violent Crime</span>
                    <span className="text-emerald-400">Low</span>
                  </div>
                  <div className="mt-1.5 h-3 w-full rounded-full bg-[#F8F9FA]">
                    <div className="h-3 rounded-full bg-emerald-400/70" style={{ width: "25%" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 7: Smart Questions to Ask Agent */}
            <div className="lg:col-span-3 flex flex-col rounded-2xl border border-[#E5E5F0] bg-white shadow-md p-8">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-400">
                <MessageSquare className="h-4 w-4" /> Smart Questions to Ask Agent
              </div>
              <div className="mt-4 flex-1 space-y-3">
                {[
                  "Why is the seller moving, and how long has the home been on the market?",
                  "Are there any known issues with the foundation, roof, or major systems?",
                  "What are the HOA fees and what do they cover?",
                  "Have there been any insurance claims or permits pulled in the last 5 years?",
                ].map((q, i) => (
                  <div key={i} className="rounded-lg bg-[#F8F9FA] px-4 py-3">
                    <p className="text-sm leading-relaxed text-[#4A4A6A]">{q}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 8: Buyer Protection Checklist */}
            <div className="lg:col-span-3 flex flex-col rounded-2xl border border-[#E5E5F0] bg-white shadow-md p-8">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400">
                <CheckSquare className="h-4 w-4" /> Buyer Protection Checklist
              </div>
              <div className="mt-4 flex-1 space-y-2.5">
                {[
                  "Get a home inspection",
                  "Review seller disclosures",
                  "Check title & lien status",
                  "Confirm flood zone classification",
                  "Verify property tax history",
                ].map((item, i) => (
                  <label key={i} className="flex items-start gap-2.5 text-sm text-[#4A4A6A]">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-gray-300">
                      <Check className="h-3 w-3 text-emerald-400" />
                    </span>
                    {item}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#0F0F1A] sm:text-4xl">
              <span className="bg-gradient-to-r from-[#00D2FF] to-[#6C5CE7] bg-clip-text text-transparent">Real Estate Comparison Pricing</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[#4A4A6A]">Start free. Upgrade when you need the full picture.</p>
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
                <div key={plan.name} className={`card-hover relative flex flex-col rounded-xl border p-8 ${plan.highlighted ? "border-[#00D2FF] scale-105 bg-white shadow-xl z-10" : "border-gray-300 bg-white shadow-sm"}`}>
                  {plan.badge && (
                    <span className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1 text-[10px] font-bold tracking-wide text-white shadow-md ${plan.badge === "BEST VALUE" ? "bg-[#F59E0B]" : "bg-[#00D2FF] text-[#0F0F1A]"}`}>{plan.badge}</span>
                  )}
                  <div className={`flex items-center gap-1.5 ${plan.badge ? "mt-2" : ""}`}>
                    <h3 className="text-base font-bold text-[#0F0F1A]">{plan.name}</h3>
                    {plan.savingsBadge && (
                      <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white leading-tight whitespace-nowrap">{plan.savingsBadge}</span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#0F0F1A]">{plan.price}</span>
                    <span className="text-sm text-slate-500">{plan.period}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{plan.properties} &middot; {plan.sections}</p>
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />{f}
                      </li>
                    ))}
                  </ul>
                  {plan.role === null ? (
                    <Link href="/compare/homes" className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-[#00D2FF] py-2.5 text-sm font-semibold text-[#00D2FF] transition-all hover:bg-[#00D2FF]/10">{plan.cta}</Link>
                  ) : plan.highlighted ? (
                    <button onClick={() => handleCheckout(plan.role!)} disabled={isLoading || loadingRole !== null} className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#00D2FF] to-[#6C5CE7] py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isLoading ? "Redirecting..." : plan.cta}
                    </button>
                  ) : (
                    <button onClick={() => handleCheckout(plan.role!)} disabled={isLoading || loadingRole !== null} className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-[#00D2FF] py-2.5 text-sm font-semibold text-[#00D2FF] transition-all hover:bg-[#00D2FF]/10 disabled:opacity-50">
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isLoading ? "Redirecting..." : plan.cta}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-16 text-center">
            <Link href="/compare/homes" className="inline-flex items-center rounded-xl bg-[#00D2FF] px-10 py-4 text-base font-semibold text-[#0F0F1A] shadow-lg transition-all hover:bg-[#00B8E0] hover:shadow-xl hover:-translate-y-0.5">
              Start Comparing Real Estate Free
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
