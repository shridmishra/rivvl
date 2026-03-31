"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Home,
  Car,
  ArrowRight,
  Check,
  ChevronDown,
} from "lucide-react";

const faqs = [
  {
    question: "What is rivvl?",
    answer:
      "rivvl is an intelligent comparison platform for two of the biggest purchases you will make: vehicles and real estate. You paste in listing URLs or enter details, and rivvl generates a structured report using government data, real listing information, and intelligent analysis to help you make a confident decision.",
  },
  {
    question: "How is rivvl different from Carfax or Zillow?",
    answer:
      "Those tools show you data about one property or vehicle at a time. rivvl compares multiple options side by side and tells you which one is the better choice based on your preferences, budget, and verified data. It also layers in risk data, government sources, and intelligently generated insights that listing sites do not provide.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. rivvl uses Supabase with row-level security, meaning your reports and personal data are only accessible to your account. Payments are processed entirely through Stripe and rivvl never stores your card details.",
  },
  {
    question: "Do I need to create an account to use rivvl?",
    answer:
      "You can view a basic comparison without an account. To save your report or access the full paid report, you will need to sign up. It takes under a minute.",
  },
  {
    question: "What does the free version include?",
    answer:
      "The free tier gives you a basic comparison with scores, key facts, and a limited set of sections so you can see how rivvl works before deciding to upgrade. Full analysis, recommendations, and all data sections are included in paid reports.",
  },
  {
    question: "How does rivvl get its data?",
    answer:
      "rivvl pulls data from government APIs including NHTSA, EPA, FEMA, USGS, FBI, and Census sources. Listing data is retrieved directly from the listing URL you provide. Intelligent analysis is layered on top to synthesize everything into a clear recommendation. See our data sources page for full details.",
  },
  {
    question: "Can I compare more than two properties or vehicles?",
    answer:
      "Yes. Depending on your plan, you can compare up to 3 or 4 properties or vehicles at once in a single report.",
  },
  {
    question: "What if I am not happy with my report?",
    answer:
      "Contact us at support@rivvl.ai and we will make it right. Data accuracy is our top priority, and we stand behind the quality of every report.",
  },
];

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="flex flex-col">
      {/* ─── 1. HERO SECTION ─── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white px-4 py-24 sm:py-32">
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <h1 className="text-[36px] sm:text-[48px] md:text-[56px] lg:text-[64px] font-bold leading-tight tracking-tight">
            <span className="bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] bg-clip-text text-transparent">
              Make your biggest decisions with confidence.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-[600px] text-[18px] sm:text-[22px] leading-relaxed text-[#4A4A6A]">
            rivvl compares vehicles and real estate side by side using verified government data, real listing information, and intelligent analysis so you know exactly which one to choose.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/homes"
              className="inline-flex items-center rounded-xl bg-[#6C5CE7] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#5A4BD5] hover:-translate-y-0.5"
            >
              <Home className="mr-2 h-5 w-5" />
              Compare Real Estate
            </Link>
            <Link
              href="/vehicles"
              className="inline-flex items-center rounded-xl border-2 border-[#00D2FF] px-8 py-4 text-base font-semibold text-[#00D2FF] shadow-lg transition-all hover:bg-[#00D2FF]/10 hover:-translate-y-0.5"
            >
              <Car className="mr-2 h-5 w-5" />
              Compare Vehicles
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-16">
            {[
              { value: "50+", label: "Data Points Analyzed" },
              { value: "Smart", label: "Powered Analysis" },
              { value: "Gov", label: "Verified Data" },
              { value: "Minutes", label: "Not Hours" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-[#4A4A6A]/60">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 2. SOCIAL PROOF STRIP ─── */}
      <section className="bg-[#F8F9FA] px-4 py-8">
        <div className="mx-auto max-w-6xl text-center">
          <p className="mb-4 text-sm font-medium text-slate-500 uppercase tracking-wider">
            Powered by official data from:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              "FEMA",
              "EPA",
              "USGS",
              "US Forest Service",
              "FBI Crime Data",
              "US Census Bureau",
              "Dept. of Education",
              "NHTSA",
              "EPA FuelEconomy.gov",
            ].map((source) => (
              <span
                key={source}
                className="inline-block rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600"
              >
                {source}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. PRODUCT TRACKS ─── */}
      <section className="bg-white px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#6C5CE7]">WHAT YOU GET</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0F0F1A] sm:text-4xl">
              Everything you need to decide with confidence
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-[#4A4A6A]">
              Every rivvl report is packed with verified data, intelligent analysis, and clear recommendations so you stop second-guessing and start deciding.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
            {/* Homes Card */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col">
              <div className="h-1.5 w-full bg-gradient-to-r from-[#6C5CE7] to-[#9B59B6]" />
              <div className="p-8 sm:p-10">
                <Home className="h-12 w-12 text-[#6C5CE7]" />
                <h3 className="mt-5 text-2xl font-bold text-slate-900">
                  Real Estate
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Get a comprehensive comparison of any two properties, including
                  risks sellers never disclose, financial projections, school
                  ratings, crime data, and negotiation leverage.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "Risk Report",
                    "Financial Analysis",
                    "Price History",
                    "School Data",
                    "Crime Context",
                    "Negotiation Intelligence",
                    "Smart Agent Questions",
                  ].map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-slate-700"
                    >
                      <Check className="h-4 w-4 shrink-0 text-[#6C5CE7]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/compare/homes"
                  className="mt-8 inline-flex items-center text-base font-semibold text-[#6C5CE7] transition-colors hover:text-[#5A4BD5]"
                >
                  Compare Real Estate Free
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Vehicles Card */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col">
              <div className="h-1.5 w-full bg-gradient-to-r from-[#00D2FF] to-[#0098B8]" />
              <div className="p-8 sm:p-10">
                <Car className="h-12 w-12 text-[#00D2FF]" />
                <h3 className="mt-5 text-2xl font-bold text-slate-900">
                  Vehicles &amp; Cars
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Compare any two vehicles with safety ratings, recall history,
                  fuel economy, cost of ownership projections, and a clear
                  recommendation on which to buy.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "Safety Ratings",
                    "Recall History",
                    "Fuel Economy",
                    "Cost of Ownership",
                    "Complaint Data",
                    "Our Pick",
                  ].map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-slate-700"
                    >
                      <Check className="h-4 w-4 shrink-0 text-[#00D2FF]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/compare"
                  className="mt-8 inline-flex items-center text-base font-semibold text-[#00D2FF] transition-colors hover:text-[#0098B8]"
                >
                  Compare Vehicles Free
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. HOW IT WORKS ─── */}
      <section className="bg-white px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            How It Works
          </h2>

          <div className="relative mt-16 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-0">
            {/* Dotted connector line (desktop only) */}
            <div className="pointer-events-none absolute left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] top-10 hidden border-t-2 border-dashed border-slate-300 md:block" />

            {[
              {
                step: "1",
                title: "Paste Your Links",
                desc: "Drop in listing URLs from Zillow, Redfin, Cars.com, AutoTrader, or any major listing site.",
              },
              {
                step: "2",
                title: "We Gather Everything",
                desc: "Multiple data sources analyzed in under 60 seconds so you do not have to.",
              },
              {
                step: "3",
                title: "Get Your Full Report",
                desc: "Risk, financials, schools, crime, history, and Our Pick, all in one place.",
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center px-6">
                <div className="relative z-10 mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md border border-slate-100">
                  <span className="text-3xl font-bold bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] bg-clip-text text-transparent">
                    {item.step}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. FAQ SECTION ─── */}
      <section className="bg-white px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#0F0F1A] sm:text-4xl">
            Frequently Asked Questions
          </h2>

          <div className="mt-12 divide-y divide-slate-200 border-t border-b border-slate-200">
            {faqs.map((faq, index) => (
              <div key={index}>
                <button
                  onClick={() =>
                    setOpenFaq(openFaq === index ? null : index)
                  }
                  className="flex w-full items-center justify-between py-5 text-left"
                >
                  <span className="text-base font-semibold text-[#0F0F1A] pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-[#4A4A6A] transition-transform duration-300 ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{
                    maxHeight: openFaq === index ? "500px" : "0px",
                  }}
                >
                  <p className="pb-5 text-sm leading-relaxed text-[#4A4A6A]">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. FINAL CTA ─── */}
      <section className="bg-[#F4F4F8] px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[36px] sm:text-[48px] font-bold leading-tight tracking-tight text-[#0F0F1A]">
            The biggest purchase of your life deserves the best research.
          </h2>
          <p className="mt-6 text-lg text-[#4A4A6A]">
            Start free. Upgrade only when you want the full picture.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/compare/homes"
              className="inline-flex items-center rounded-xl bg-[#6C5CE7] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#5A4BD5] hover:-translate-y-0.5"
            >
              Compare Real Estate
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center rounded-xl border-2 border-[#00D2FF] px-8 py-4 text-base font-semibold text-[#00D2FF] shadow-lg transition-all hover:bg-[#00D2FF]/10 hover:-translate-y-0.5"
            >
              Compare Vehicles
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 7. FOOTER ─── */}
      <footer className="bg-[#F4F4F8] px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-8 sm:flex-row sm:items-start">
            <div>
              <Image
                src="/images/rivvl-logo-black.png"
                alt="rivvl"
                width={100}
                height={33}
                className="h-7 w-auto"
              />
              <p className="mt-2 text-sm text-[#4A4A6A]">
                Before you choose, Rivvl.
              </p>
            </div>
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[#4A4A6A]">
              <Link href="/" className="transition-colors hover:text-[#0F0F1A]">
                Home
              </Link>
              <Link href="/vehicles" className="transition-colors hover:text-[#0F0F1A]">
                Vehicles
              </Link>
              <Link href="/homes" className="transition-colors hover:text-[#0F0F1A]">
                Real Estate
              </Link>
              <Link href="/contact" className="transition-colors hover:text-[#0F0F1A]">
                Contact
              </Link>
              <Link href="/privacy" className="transition-colors hover:text-[#0F0F1A]">
                Privacy Policy
              </Link>
              <Link href="/terms" className="transition-colors hover:text-[#0F0F1A]">
                Terms of Service
              </Link>
            </nav>
          </div>
          <div className="mt-10 border-t border-gray-200 pt-6 text-center text-sm text-[#4A4A6A]">
            &copy; 2026 rivvl. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
