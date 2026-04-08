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
    <div className="flex flex-col bg-mesh-gradient min-h-screen">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-4 py-24 sm:py-32 lg:py-40">
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-[56px]">
            The Smarter Way to Compare Cars.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground font-medium">
            NHTSA safety ratings, recall history, EPA fuel economy, and 5-year
            ownership projections, all in one report.
          </p>
          <div className="mt-10">
            <Link
              href="/compare"
              className="inline-flex items-center rounded-3xl bg-foreground px-8 py-4 text-base font-bold text-background shadow-2xl transition-all hover:scale-105 active:scale-[0.98]"
            >
              Compare Vehicles Free&nbsp;&rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURE BENTO GRID ── */}
      <section className="bg-secondary/30 dark:bg-background px-4 py-20 sm:py-28 border-y border-border">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-5 md:grid-cols-2">
            {/* Card 1 — col-span-2: AI Head-to-Head Comparison */}
            <div className="md:col-span-2 rounded-3xl border border-border bg-card shadow-sm p-8 transition-all hover:shadow-xl hover:border-foreground/10">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground">
                <Scale className="h-4 w-4" /> Head-to-Head Comparison
              </div>
              <p className="mt-2 text-sm text-muted-foreground font-medium">
                Side-by-side scoring across 6 categories. See exactly where each vehicle wins.
              </p>
              <div className="mt-6 space-y-4">
                {[
                  { label: "Safety", v1: 92, v2: 85 },
                  { label: "Reliability", v1: 78, v2: 88 },
                  { label: "Value", v1: 80, v2: 74 },
                  { label: "Fuel Economy", v1: 70, v2: 85 },
                  { label: "Features", v1: 88, v2: 82 },
                  { label: "Ownership Cost", v1: 72, v2: 80 },
                ].map((cat) => (
                  <div key={cat.label}>
                    <div className="flex justify-between text-xs font-bold text-foreground/80 mb-1.5">
                      <span>{cat.label}</span>
                      <span>{cat.v1} vs {cat.v2}</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-2 rounded-full bg-foreground" style={{ width: `${cat.v1}%` }} />
                      <div className="h-2 rounded-full bg-foreground" style={{ width: `${cat.v2}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2 — Our Pick Recommendation */}
            <div className="rounded-3xl border border-zinc-200 bg-white/40 backdrop-blur-sm shadow-sm p-8 transition-all hover:bg-white/60 dark:border-zinc-800 dark:bg-black/40 dark:hover:bg-black/60">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                <Trophy className="h-4 w-4" /> Our Pick Recommendation
              </div>
              <p className="mt-2 text-sm text-muted-foreground font-medium">
                Intelligent recommendation based on YOUR priorities: budget, reliability, fuel economy, and safety.
              </p>
              <div className="mt-6 rounded-2xl bg-secondary dark:bg-muted/50 p-5 border border-border">
                <div className="flex items-center gap-3">
                  <Trophy className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-bold text-foreground">Vehicle 2 is the stronger choice</p>
                    <p className="mt-1 text-xs text-muted-foreground font-medium">Based on your priorities: reliability and fuel economy ranked highest.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3 — AI Pros and Cons */}
            <div className="rounded-3xl border border-zinc-200 bg-white/40 backdrop-blur-sm shadow-sm p-8 transition-all hover:bg-white/60 dark:border-zinc-800 dark:bg-black/40 dark:hover:bg-black/60">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground">
                <Zap className="h-4 w-4" /> Pros and Cons
              </div>
              <p className="mt-2 text-sm text-muted-foreground font-medium">
                Intelligently generated strengths and weaknesses for each vehicle, so you know exactly what you are getting.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-secondary/50 dark:bg-muted/50 p-4 border border-border">
                  <p className="text-xs font-bold text-foreground mb-2 uppercase tracking-wide">Pros</p>
                  <ul className="space-y-1.5">
                    {["Top-tier safety ratings", "Lower 5-year ownership cost", "Better fuel economy"].map((item) => (
                      <li key={item} className="flex items-start gap-1.5 text-xs text-foreground/80 font-medium">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-foreground" />{item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl bg-secondary/50 dark:bg-muted/50 p-4 border border-border">
                  <p className="text-xs font-bold text-foreground/60 mb-2 uppercase tracking-wide">Cons</p>
                  <ul className="space-y-1.5">
                    {["Higher base price", "Fewer tech features", "Smaller cargo space"].map((item) => (
                      <li key={item} className="flex items-start gap-1.5 text-xs text-foreground/60 font-medium">
                        <X className="mt-0.5 h-3 w-3 shrink-0 text-foreground/40" />{item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Card 4 — col-span-2: True Cost of Ownership */}
            <div className="md:col-span-2 rounded-3xl border border-border bg-card shadow-sm p-8 transition-all hover:shadow-xl hover:border-foreground/10">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground">
                <DollarSign className="h-4 w-4" /> True Cost of Ownership
              </div>
              <p className="mt-2 text-sm text-muted-foreground font-medium">
                5-year projection including depreciation, insurance estimate, fuel costs, and maintenance. What Carfax won&apos;t tell you.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-secondary dark:bg-muted/50 p-5 border border-border">
                  <p className="text-sm font-bold text-foreground">Vehicle 1</p>
                  <p className="mt-1 text-2xl font-extrabold text-foreground">$42,300</p>
                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground font-medium">
                    <div className="flex justify-between"><span>Depreciation</span><span>$18,200</span></div>
                    <div className="flex justify-between"><span>Insurance</span><span>$9,600</span></div>
                    <div className="flex justify-between"><span>Fuel</span><span>$8,500</span></div>
                    <div className="flex justify-between"><span>Maintenance</span><span>$6,000</span></div>
                  </div>
                </div>
                <div className="rounded-2xl bg-foreground text-background p-5 border border-foreground shadow-xl">
                  <p className="text-sm font-bold text-background/80">Vehicle 2</p>
                  <p className="mt-1 text-2xl font-extrabold text-background">$38,700</p>
                  <div className="mt-3 space-y-1.5 text-xs text-background/60 font-medium">
                    <div className="flex justify-between"><span>Depreciation</span><span>$15,800</span></div>
                    <div className="flex justify-between"><span>Insurance</span><span>$9,200</span></div>
                    <div className="flex justify-between"><span>Fuel</span><span>$7,200</span></div>
                    <div className="flex justify-between"><span>Maintenance</span><span>$6,500</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 5 — Government Safety Data */}
            <div className="rounded-3xl border border-border bg-card shadow-sm p-8 transition-all hover:shadow-xl hover:border-foreground/10">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <AlertTriangle className="h-4 w-4" /> Government Safety Data
              </div>
              <p className="mt-2 text-sm text-muted-foreground font-medium">
                NHTSA safety ratings, recall history, and real owner complaints in one place.
              </p>
              <div className="mt-6 rounded-2xl bg-secondary dark:bg-muted/50 p-5 border border-border">
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-5 w-5 fill-foreground text-foreground" />
                  ))}
                  <span className="ml-2 text-xs font-bold text-foreground/70">5 / 5 Overall</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-xs text-foreground font-bold">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>3 active recalls flagged</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-foreground/70 font-bold">
                    <MessageSquareWarning className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>47 NHTSA complaints filed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 6 — Final Verdict */}
            <div className="rounded-3xl border border-border bg-card shadow-sm p-8 transition-all hover:shadow-xl hover:border-foreground/10">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                <Star className="h-4 w-4" /> Final Verdict
              </div>
              <p className="mt-2 text-sm text-muted-foreground font-medium">
                rivvl tells you which car to buy. A clear winner with reasoning you can trust.
              </p>
              <div className="mt-6 rounded-2xl bg-primary/5 p-5 border border-primary/10">
                <p className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Check className="h-4 w-4 text-foreground" />
                  Winner: Vehicle 2
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground font-medium">
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
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Vehicle Comparison Pricing
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground font-medium">
              Start free. Upgrade when you need the full picture.
            </p>
          </div>

          {error && (
            <div className="mx-auto mt-8 flex max-w-xl items-center gap-3 rounded-xl border border-error/20 bg-error/10 px-4 py-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-error" />
              <p className="text-sm text-error font-medium">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4 text-error" /></button>
            </div>
          )}

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const isLoading = loadingRole === plan.role;
              return (
                <div key={plan.name} className={`card-hover relative flex flex-col rounded-[2.5rem] border p-8 shadow-sm transition-all duration-300 ${plan.highlighted ? "border-zinc-400 bg-white/80 backdrop-blur-md scale-105 z-10 shadow-2xl dark:border-zinc-600 dark:bg-black/80" : "border-zinc-200 bg-white/40 backdrop-blur-sm hover:border-zinc-300 dark:border-zinc-800 dark:bg-black/40 dark:hover:border-zinc-700"}`}>
                  {plan.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground px-5 py-2 text-[9px] font-black uppercase tracking-widest text-background shadow-xl">
                      {plan.badge}
                    </span>
                  )}
                  <div className={`flex items-center gap-1.5 ${plan.badge ? "mt-2" : ""}`}>
                    <h3 className={`text-base font-bold ${plan.highlighted ? "text-background" : "text-foreground"}`}>{plan.name}</h3>
                    {plan.savingsBadge && (
                      <span className={`rounded-full px-2 py-0.5 text-[8px] font-black leading-tight uppercase tracking-widest shadow-sm ${plan.highlighted ? "bg-background text-foreground" : "bg-foreground text-background"}`}>{plan.savingsBadge}</span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className={`text-3xl font-extrabold ${plan.highlighted ? "text-background" : "text-foreground"}`}>{plan.price}</span>
                    <span className={`text-sm font-bold ${plan.highlighted ? "text-background/60" : "text-muted-foreground"}`}>{plan.period}</span>
                  </div>
                  <p className={`mt-2 text-xs font-medium ${plan.highlighted ? "text-background/60" : "text-muted-foreground"}`}>{plan.vehicles} &middot; {plan.sections}</p>
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
                      className={`mt-6 w-full h-12 rounded-full font-bold transition-all ${
                        plan.highlighted 
                          ? "bg-background text-foreground hover:bg-secondary" 
                          : "border-border bg-secondary/50 text-foreground hover:bg-foreground hover:text-background"
                      }`}
                    >
                      <Link href="/compare">{plan.cta}</Link>
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleCheckout(plan.role!)} 
                      loading={isLoading}
                      loadingText="Redirecting..."
                      disabled={loadingRole !== null && !isLoading}
                      className={`mt-6 w-full h-12 rounded-full font-bold shadow-xl transition-all ${
                        plan.highlighted ? "bg-background text-foreground hover:bg-secondary" : "bg-foreground text-background hover:opacity-90"
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
            <Link href="/compare" className="inline-flex items-center justify-center rounded-3xl bg-foreground px-10 py-4 text-base font-bold text-background shadow-lg transition-all hover:scale-105 active:scale-[0.98]">
              Start Comparing Vehicles Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary/50 dark:bg-card px-4 py-14 border-t border-border">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-8 sm:flex-row sm:items-start">
            <div className="text-center sm:text-left">
              <Link href="/" className="inline-block">
                <Image
                  src="/images/rivvl-logo-black.png"
                  alt="rivvl"
                  width={100}
                  height={33}
                  className="h-7 w-auto mx-auto sm:mx-0 dark:hidden"
                />
                <Image
                  src="/images/rivvl-logo-white.png"
                  alt="rivvl"
                  width={100}
                  height={33}
                  className="hidden h-7 w-auto mx-auto sm:mx-0 dark:block"
                />
              </Link>
              <p className="mt-2 text-sm text-muted-foreground font-medium">Intelligent Comparison Reports</p>
            </div>
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground font-medium">
              <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
              <Link href="/vehicles" className="transition-colors hover:text-foreground">Vehicles</Link>
              <Link href="/homes" className="transition-colors hover:text-foreground">Real Estate</Link>
              <Link href="/contact" className="transition-colors hover:text-foreground">Contact</Link>
              <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
              <Link href="/terms" className="transition-colors hover:text-foreground">Terms</Link>
            </nav>
          </div>
          <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground font-medium">&copy; 2026 rivvl. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
