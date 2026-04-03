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
import { Button } from "@/components/ui/button";

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
      <section className="relative overflow-hidden bg-background px-4 py-24 sm:py-32 lg:py-40">
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tighter text-foreground sm:text-6xl lg:text-7xl">
            The Smarter Way to <br/>
            <span className="text-black dark:text-white">Compare Real Estate.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground font-medium">
            Risk reports, financial projections, school data, crime context,
            price history, and negotiation intelligence—all delivered with
            algorithmic certainty before you make an offer.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link
              href="/compare/homes"
              className="inline-flex items-center rounded-3xl bg-foreground px-10 py-5 text-base font-bold text-background shadow-2xl transition-all hover:scale-105 active:scale-[0.98]"
            >
              Compare Real Estate Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="#pricing"
              className="inline-flex items-center rounded-full border border-border bg-background px-10 py-5 text-base font-bold text-foreground shadow-md transition-all hover:bg-neutral-50 dark:hover:bg-neutral-900 active:scale-[0.98]"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURE BENTO GRID ── */}
      <section className="bg-secondary/30 dark:bg-background px-4 py-20 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid w-full items-stretch gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6">
            {/* Card 1: Property Risk Report */}
            <div className="sm:col-span-1 lg:col-span-2 flex flex-col rounded-3xl border border-border bg-card shadow-sm p-8 transition-all hover:shadow-xl hover:border-foreground/10">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-foreground">
                <ShieldAlert className="h-4 w-4" /> Property Risk Report
              </div>
              <div className="mt-8 flex-1 space-y-3">
                {[
                  { label: "Flood Zone", level: "Moderate", color: "bg-neutral-400" },
                  { label: "Wildfire Risk", level: "Low", color: "bg-neutral-200" },
                  { label: "Earthquake", level: "High", color: "bg-neutral-600" },
                  { label: "Environmental Hazards", level: "Low", color: "bg-neutral-200" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between rounded-2xl bg-secondary dark:bg-muted/50 px-5 py-3">
                    <span className="text-sm font-bold text-foreground">{row.label}</span>
                    <span className="flex items-center gap-2 text-xs font-extrabold text-foreground">
                      <span className={`h-2.5 w-2.5 rounded-full ${row.color} shadow-sm`} />
                      {row.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Negotiation Intelligence */}
            <div className="lg:col-span-2 flex flex-col rounded-3xl border border-border bg-card shadow-sm p-8 transition-all hover:shadow-xl">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-foreground">
                <TrendingUp className="h-4 w-4" /> Negotiation Intelligence
              </div>
              <div className="flex-1 flex flex-col items-center justify-center">
                <p className="mt-6 text-center text-5xl font-black text-foreground tracking-tighter">STRONG</p>
                <p className="mt-2 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">Buyer Position</p>
              </div>
            </div>

            {/* Card 3: Price & Transaction History */}
            <div className="lg:col-span-2 flex flex-col rounded-3xl border border-border bg-card shadow-sm p-8 transition-all hover:shadow-xl">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-foreground">
                <History className="h-4 w-4" /> Transaction History
              </div>
              <div className="mt-6 flex-1 overflow-hidden rounded-2xl border border-border">
                <table className="w-full text-left text-[11px] font-bold">
                  <thead>
                    <tr className="border-b border-border bg-secondary dark:bg-muted/50 shadow-sm">
                      <th className="px-4 py-3 text-muted-foreground uppercase tracking-widest">Date</th>
                      <th className="px-4 py-3 text-foreground uppercase tracking-widest text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground">
                    <tr className="border-b border-border hover:bg-secondary dark:hover:bg-muted transition-colors">
                      <td className="px-4 py-3">2024</td>
                      <td className="px-4 py-3 text-right">$485,000</td>
                    </tr>
                    <tr className="border-b border-border hover:bg-secondary dark:hover:bg-muted transition-colors">
                      <td className="px-4 py-3">2021</td>
                      <td className="px-4 py-3 text-right">$390,000</td>
                    </tr>
                    <tr className="hover:bg-secondary dark:hover:bg-muted transition-colors">
                      <td className="px-4 py-3">2017</td>
                      <td className="px-4 py-3 text-right">$310,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Card 4: 5-Year Financial Projection */}
            <div className="sm:col-span-1 lg:col-span-2 flex flex-col rounded-3xl border border-border bg-card shadow-sm p-8 transition-all hover:shadow-xl hover:border-foreground/10">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <DollarSign className="h-4 w-4" /> 5-Year Financial Projection
              </div>
              <div className="flex-1">
                <p className="mt-4 text-lg font-semibold text-foreground">
                  5-Year Total Cost: <span className="text-muted-foreground">$312,000</span> vs{" "}
                  <span className="text-foreground">$287,000</span>
                </p>
                <div className="mt-5 space-y-3">
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Property A</p>
                    <div className="h-4 rounded-full bg-neutral-600" style={{ width: "90%" }} />
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Property B</p>
                    <div className="h-4 rounded-full bg-neutral-300" style={{ width: "78%" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 5: Nearby Schools */}
            <div className="lg:col-span-2 flex flex-col rounded-3xl border border-border bg-card shadow-sm p-8 transition-all hover:shadow-xl hover:border-foreground/10">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <GraduationCap className="h-4 w-4" /> Nearby Schools
              </div>
              <div className="mt-4 flex-1 space-y-3">
                {[
                  { name: "Lincoln Elementary", rating: "9/10", dist: "0.3 mi" },
                  { name: "Washington Middle", rating: "7/10", dist: "0.8 mi" },
                  { name: "Jefferson High", rating: "8/10", dist: "1.2 mi" },
                ].map((school) => (
                  <div key={school.name} className="flex items-center justify-between rounded-2xl bg-secondary dark:bg-muted/50 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{school.name}</p>
                    <p className="text-[10px] text-muted-foreground">{school.dist}</p>
                    </div>
                    <span className="text-sm font-bold text-foreground">{school.rating}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 6: Crime Context */}
            <div className="lg:col-span-2 flex flex-col rounded-3xl border border-border bg-card shadow-sm p-8 transition-all hover:shadow-xl hover:border-foreground/10">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <Shield className="h-4 w-4" /> Crime Context
              </div>
              <div className="mt-5 flex-1 space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Property Crime</span>
                    <span className="text-foreground">Moderate</span>
                  </div>
                  <div className="mt-1.5 h-3 w-full rounded-full bg-secondary dark:bg-black/20">
                    <div className="h-3 rounded-full bg-neutral-400" style={{ width: "55%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Violent Crime</span>
                    <span className="text-foreground">Low</span>
                  </div>
                  <div className="mt-1.5 h-3 w-full rounded-full bg-secondary dark:bg-black/20">
                    <div className="h-3 rounded-full bg-neutral-200" style={{ width: "25%" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 7: Smart Questions to Ask Agent */}
            <div className="lg:col-span-3 flex flex-col rounded-3xl border border-border bg-card shadow-sm p-8 transition-all hover:shadow-xl hover:border-foreground/10">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <MessageSquare className="h-4 w-4" /> Smart Questions to Ask Agent
              </div>
              <div className="mt-4 flex-1 space-y-3">
                {[
                  "Why is the seller moving, and how long has the home been on the market?",
                  "Are there any known issues with the foundation, roof, or major systems?",
                  "What are the HOA fees and what do they cover?",
                  "Have there been any insurance claims or permits pulled in the last 5 years?",
                ].map((q, i) => (
                  <div key={i} className="rounded-2xl bg-secondary dark:bg-muted/50 px-4 py-3">
                    <p className="text-sm leading-relaxed text-muted-foreground">{q}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 8: Buyer Protection Checklist */}
            <div className="lg:col-span-3 flex flex-col rounded-3xl border border-border bg-card shadow-sm p-8 transition-all hover:shadow-xl hover:border-foreground/10">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
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
                  <label key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border">
                      <Check className="h-3 w-3 text-foreground" />
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
      <section id="pricing" className="bg-background px-4 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold tracking-tighter text-foreground sm:text-5xl">
              Investment Protection <br/>
              <span className="text-black/40 dark:text-white/40">Pricing & Plans</span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground font-medium">
              Start free. Upgrade when you need the full picture of your potential home.
            </p>
          </div>

          {error && (
            <div className="mx-auto mt-8 flex max-w-xl items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4 text-red-500" /></button>
            </div>
          )}

          <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const isLoading = loadingRole === plan.role;
              return (
                <div 
                  key={plan.name} 
                  className={`card-hover relative flex flex-col rounded-[2.5rem] border p-10 transition-all duration-500 shadow-sm ${
                    plan.highlighted 
                      ? "border-foreground/10 ring-1 ring-foreground/10 bg-foreground text-background scale-105 z-10 shadow-2xl" 
                      : "border-border bg-card hover:border-foreground/10"
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground px-5 py-2 text-[9px] font-black uppercase tracking-widest text-background shadow-xl">
                      {plan.badge}
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <h3 className={`text-xl font-black uppercase tracking-tighter ${plan.highlighted ? "text-background" : "text-foreground"}`}>{plan.name}</h3>
                    {plan.savingsBadge && (
                      <span className={`rounded-full px-2 py-0.5 text-[8px] font-black leading-tight uppercase tracking-widest shadow-sm ${plan.highlighted ? "bg-background text-foreground" : "bg-foreground text-background"}`}>
                        {plan.savingsBadge}
                      </span>
                    )}
                  </div>
                  <div className="mt-6 flex items-baseline gap-2">
                    <span className={`text-4xl font-black ${plan.highlighted ? "text-background" : "text-foreground"}`}>{plan.price}</span>
                    <span className={`text-xs font-bold uppercase tracking-widest ${plan.highlighted ? "text-white/60 dark:text-black/60" : "text-muted-foreground"}`}>
                      {plan.period}
                    </span>
                  </div>
                  
                  <ul className="mt-10 flex-1 space-y-4">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm font-bold">
                        <Check className={`mt-0.5 h-4 w-4 shrink-0 ${plan.highlighted ? "text-background" : "text-foreground"}`} />
                        <span className={plan.highlighted ? "text-background/80" : "text-foreground"}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.role === null ? (
                    <Button 
                      variant="outline" 
                      asChild 
                      className={`mt-10 w-full h-14 rounded-full font-black uppercase tracking-widest transition-all ${
                        plan.highlighted 
                          ? "bg-background text-foreground hover:bg-secondary" 
                          : "border-border bg-secondary/50 text-foreground hover:bg-foreground hover:text-background"
                      }`}
                    >
                      <Link href="/compare/homes">{plan.cta}</Link>
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleCheckout(plan.role!)} 
                      loading={isLoading}
                      loadingText="Redirecting..."
                      disabled={loadingRole !== null && !isLoading}
                      className={`mt-10 w-full h-14 rounded-full font-black uppercase tracking-widest shadow-xl transition-all ${
                        plan.highlighted 
                          ? "bg-background text-foreground hover:bg-secondary" 
                          : "bg-foreground text-background hover:opacity-90"
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-16 text-center">
            <Link href="/compare/homes" className="inline-flex items-center rounded-3xl bg-foreground px-10 py-4 text-base font-bold text-background shadow-lg transition-all hover:opacity-90 hover:shadow-xl hover:-translate-y-0.5">
              Start Comparing Real Estate Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary/50 dark:bg-card px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-8 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <Link href="/" className="inline-block">
                <Image
                  src="/images/rivvl-logo-black.png"
                  alt="rivvl"
                  width={100}
                  height={33}
                  className="h-7 w-auto dark:hidden"
                />
                <Image
                  src="/images/rivvl-logo-white.png"
                  alt="rivvl"
                  width={100}
                  height={33}
                  className="hidden h-7 w-auto dark:block"
                />
              </Link>
              <p className="mt-2 text-sm text-muted-foreground font-medium">Intelligent Comparison Reports</p>
            </div>
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
              <Link href="/vehicles" className="transition-colors hover:text-foreground">Vehicles</Link>
              <Link href="/homes" className="transition-colors hover:text-foreground">Real Estate</Link>
              <Link href="/contact" className="transition-colors hover:text-foreground">Contact</Link>
              <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy Policy</Link>
              <Link href="/terms" className="transition-colors hover:text-foreground">Terms of Service</Link>
            </nav>
          </div>
          <div className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground/60">&copy; 2026 rivvl. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
