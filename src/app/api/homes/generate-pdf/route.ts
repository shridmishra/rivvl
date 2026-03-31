import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import fs from "fs";
import path from "path";
import { createClient } from "@/lib/supabase/server";
import { rateLimitResponse } from "@/lib/rate-limit";

export const maxDuration = 30;

/* ═══════════════════════════════════════════════════════════════════════ */
/*                        LOGO (base64-embedded)                          */
/* ═══════════════════════════════════════════════════════════════════════ */

const logoPath = path.join(process.cwd(), "public/images/rivvl-logo-black.png");
const logoBase64 = fs.readFileSync(logoPath).toString("base64");
const logoDataUri = `data:image/png;base64,${logoBase64}`;
const LOGO_RATIO = 458 / 1415;

/* ═══════════════════════════════════════════════════════════════════════ */
/*                          BRAND COLORS                                  */
/* ═══════════════════════════════════════════════════════════════════════ */

const C = {
  indigo: "#4F46E5",
  violet: "#7C3AED",
  indigoLight: "#EEF2FF",
  violetLight: "#F5F3FF",
  emerald: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
  slate50: "#F8FAFC",
  slate100: "#F1F5F9",
  slate200: "#E2E8F0",
  slate400: "#94A3B8",
  slate500: "#64748B",
  slate600: "#475569",
  slate700: "#334155",
  slate900: "#0F172A",
  white: "#FFFFFF",
};

/* ═══════════════════════════════════════════════════════════════════════ */
/*                          TYPES                                         */
/* ═══════════════════════════════════════════════════════════════════════ */

interface RiskProfile {
  floodZone: { code: string | null; isSFHA: boolean; riskLevel: string };
  superfundSites: { count1mile: number; count3mile: number };
  earthquakeRisk: {
    riskLevel: string;
    eventCount: number;
    maxMagnitude: number | null;
  };
  wildfireRisk: { riskLevel: string };
  airQuality: { score: number | null; description: string | null };
  radonZone: { zone: number | null; riskLabel: string };
  leadPaintRisk: boolean;
  asbestosRisk: boolean;
}

interface HomeProperty {
  address: string;
  priceScore: number;
  locationScore: number;
  valueScore: number;
  riskScore: number | null;
  overallScore: number;
  pros: string[];
  cons: string[];
  riskSummary: string;
  estimatedMonthlyOwnership: string;
  keyFacts: Array<{ label: string; value: string }>;
  riskProfile: RiskProfile | null;
}

interface HomeReport {
  summary: string;
  property1Summary?: string;
  property2Summary?: string;
  properties: HomeProperty[];
  ourPick: { winner: number; reasoning: string; address?: string; bullets?: string[]; narrative?: string; caveat?: string } | null;
  finalVerdict: string | null;
  generatedAt: string;
  isPremium?: boolean;
  questionsToAskAgent?: { property: string; category: string; question: string; whyItMatters: string }[];
  buyerProtectionChecklist?: { item: string; why: string; howToFind: string }[][];
}

interface HomeListing {
  address: string | null;
  fullAddress: string | null;
  price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  yearBuilt: number | null;
  hoaFee: number | null;
  hoaStatus?: 'confirmed' | 'confirmed_none' | 'not_listed';
  propertyType: string | null;
  pricePerSqft: number | null;
}

interface HomeReportData {
  report: HomeReport;
  listings: HomeListing[];
  plan: string;
  paidData?: {
    schools?: { name: string; level: string; enrollment: number | null; distanceMiles: number; greatSchoolsSearchUrl: string }[][];
    crimeData?: ({ jurisdiction: string; year: number; violentCrimeRate: number; propertyCrimeRate: number; vsNationalViolent: string; vsNationalProperty: string; dataNote: string } | null)[];
    priceHistory?: ({ lastSalePrice: number | null; lastSaleDate: string | null; assessedValue: number | null; appreciationAmount: number | null; appreciationPercent: number | null; annualAppreciationRate: number | null } | null)[];
    brokerageInfo?: ({ agentName: string | null; brokerageName: string | null; googleRating: number | null; googleReviewCount: number | null; googleSearchUrl: string | null })[];
  };
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                          STYLES                                        */
/* ═══════════════════════════════════════════════════════════════════════ */

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.slate700,
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 40,
  },
  header: {
    position: "absolute",
    top: 16,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: C.slate200,
    paddingBottom: 8,
  },
  headerBrand: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.indigo,
    letterSpacing: 0.5,
  },
  headerPage: {
    fontSize: 8,
    color: C.slate400,
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: C.slate200,
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: C.slate400,
  },
  /* Cover page */
  coverPage: {
    fontFamily: "Helvetica",
    backgroundColor: C.white,
    paddingHorizontal: 50,
    paddingVertical: 40,
  },
  coverInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  coverTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: C.slate900,
    textAlign: "center",
    marginBottom: 6,
  },
  coverSubtitle: {
    fontSize: 13,
    color: C.slate500,
    textAlign: "center",
    marginBottom: 28,
  },
  coverDivider: {
    width: 80,
    height: 3,
    backgroundColor: C.violet,
    borderRadius: 2,
    marginBottom: 28,
  },
  coverMeta: {
    fontSize: 10,
    color: C.slate500,
    textAlign: "center",
    marginBottom: 4,
  },
  coverBadge: {
    marginTop: 16,
    backgroundColor: C.indigoLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  coverBadgeText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.indigo,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  /* Watermark for free reports */
  watermark: {
    position: "absolute",
    top: "45%",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 70,
    fontFamily: "Helvetica-Bold",
    color: "#E2E8F0",
    opacity: 0.3,
    transform: "rotate(-45deg)",
  },
  /* Section headings */
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: C.indigo,
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: C.violet,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: C.slate900,
    marginBottom: 6,
    marginTop: 10,
  },
  /* Body text */
  bodyText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: C.slate700,
    marginBottom: 6,
  },
  /* Score display */
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: C.slate50,
    borderRadius: 6,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.slate200,
  },
  scoreLabel: {
    fontSize: 8,
    color: C.slate500,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
  },
  scoreCaption: {
    fontSize: 7,
    color: C.slate400,
    marginTop: 2,
  },
  /* Table */
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.indigo,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.slate200,
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.slate200,
    backgroundColor: C.slate50,
  },
  tableCell: {
    fontSize: 9,
    color: C.slate700,
  },
  /* Pros/Cons */
  prosConsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  prosBox: {
    flex: 1,
    backgroundColor: "#F0FDF4",
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  consBox: {
    flex: 1,
    backgroundColor: "#FEF2F2",
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  prosConsTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  prosConsItem: {
    fontSize: 9,
    lineHeight: 1.4,
    color: C.slate700,
    marginBottom: 3,
  },
  /* Risk items */
  riskGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  riskItem: {
    width: "48%",
    backgroundColor: C.slate50,
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: C.slate200,
    marginBottom: 4,
  },
  riskItemLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.slate600,
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  riskItemValue: {
    fontSize: 9,
    color: C.slate700,
  },
  /* Verdict */
  verdictBox: {
    backgroundColor: C.indigoLight,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: C.indigo,
    marginBottom: 12,
  },
  verdictTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: C.indigo,
    marginBottom: 8,
  },
  verdictText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: C.slate700,
  },
  /* Disclaimer */
  disclaimerBox: {
    marginTop: 16,
    padding: 10,
    backgroundColor: C.slate50,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.slate200,
  },
  disclaimerText: {
    fontSize: 7,
    color: C.slate400,
    lineHeight: 1.4,
  },
  /* Property header */
  propertyHeader: {
    backgroundColor: C.violetLight,
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.slate200,
  },
  propertyHeaderText: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: C.violet,
  },
  propertyHeaderSub: {
    fontSize: 9,
    color: C.slate500,
    marginTop: 2,
  },
});

/* ═══════════════════════════════════════════════════════════════════════ */
/*                          HELPERS                                       */
/* ═══════════════════════════════════════════════════════════════════════ */

function scoreColor(score: number | null | undefined): string {
  if (score == null) return C.slate400;
  if (score >= 8) return C.emerald;
  if (score >= 6) return C.amber;
  return C.red;
}

function riskLevelColor(level: string): string {
  const l = level.toLowerCase();
  if (l === "low" || l === "minimal" || l === "none") return C.emerald;
  if (l === "moderate" || l === "medium") return C.amber;
  return C.red;
}

function formatPrice(price: number | null): string {
  if (price == null) return "N/A";
  return "$" + price.toLocaleString("en-US");
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                   PAGE WRAPPER (header + footer)                       */
/* ═══════════════════════════════════════════════════════════════════════ */

function RPage({
  children,
  isFree,
}: {
  children?: React.ReactNode;
  isFree: boolean;
}) {
  return React.createElement(
    Page,
    { size: "LETTER", style: s.page },
    /* Header */
    React.createElement(
      View,
      { style: s.header, fixed: true },
      React.createElement(Text, { style: s.headerBrand }, "RIVVL"),
      React.createElement(
        Text,
        { style: s.headerPage, render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `${pageNumber} / ${totalPages}` }
      )
    ),
    /* Free banner at top of content pages */
    isFree
      ? React.createElement(
          View,
          { style: { position: "absolute", top: 0, left: 0, right: 0, backgroundColor: "#F5F3FF", paddingVertical: 4, paddingHorizontal: 40, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" }, fixed: true },
          React.createElement(
            Text,
            { style: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6C5CE7", textAlign: "center", letterSpacing: 1.5, textTransform: "uppercase" } },
            "FREE REPORT \u2014 Upgrade at rivvl.ai"
          )
        )
      : null,
    /* Free watermark */
    isFree
      ? React.createElement(
          Text,
          { style: s.watermark, fixed: true },
          "FREE REPORT"
        )
      : null,
    /* Free upgrade footer */
    isFree ? React.createElement(
      Text,
      { style: { position: "absolute", bottom: 35, left: 40, right: 40, textAlign: "center", fontSize: 7, color: "#6C5CE7" }, fixed: true },
      "FREE REPORT — Upgrade at rivvl.ai for full analysis"
    ) : null,
    /* Content */
    children,
    /* Footer */
    React.createElement(
      View,
      { style: s.footer, fixed: true },
      React.createElement(Text, { style: s.footerText }, "rivvl.ai"),
      React.createElement(
        Text,
        { style: s.footerText },
        "Data for informational purposes only"
      )
    )
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                          PDF COMPONENT                                 */
/* ═══════════════════════════════════════════════════════════════════════ */

function HomeComparisonPDF({ data }: { data: HomeReportData }) {
  const { report, listings, plan } = data;
  const isFree = plan === "free";
  const properties = report.properties;
  const paidData = data.paidData;
  const dateStr = formatDate(report.generatedAt);

  const addressList = properties.map((p) => p.address).join("  vs  ");
  const shortAddresses = properties.map((p) => {
    const parts = p.address.split(",");
    return parts[0]?.trim() || p.address;
  });

  return React.createElement(
    Document,
    {
      title: "Real Estate Comparison Report",
      author: "rivvl.ai",
      subject: addressList,
    },

    /* ──────── COVER PAGE ──────── */
    React.createElement(
      Page,
      { size: "LETTER", style: s.coverPage },
      React.createElement(
        View,
        { style: s.coverInner },
        /* Logo */
        React.createElement(Image, {
          src: logoDataUri,
          style: { width: 160, height: 160 * LOGO_RATIO, marginBottom: 24 },
        }),
        /* Title */
        React.createElement(
          Text,
          { style: s.coverTitle },
          "Real Estate Comparison Report"
        ),
        /* Addresses */
        React.createElement(
          Text,
          { style: s.coverSubtitle },
          addressList
        ),
        /* Divider */
        React.createElement(View, { style: s.coverDivider }),
        /* Date */
        React.createElement(Text, { style: s.coverMeta }, dateStr),
        React.createElement(
          Text,
          { style: s.coverMeta },
          `${properties.length} Properties Compared`
        ),
        /* Plan badge */
        React.createElement(
          View,
          { style: s.coverBadge },
          React.createElement(
            Text,
            { style: s.coverBadgeText },
            isFree ? "Free Report" : "Premium Report"
          )
        )
      )
    ),

    /* ──────── EXECUTIVE SUMMARY ──────── */
    React.createElement(
      RPage,
      { isFree },
      React.createElement(Text, { style: s.sectionTitle }, "Executive Summary"),
      // If per-property summaries exist, show two cards side by side
      report.property1Summary && report.property2Summary && !isFree
        ? React.createElement(
            View,
            { style: { flexDirection: "row", gap: 10, marginBottom: 12 } },
            // Property 1 card
            React.createElement(
              View,
              { style: { flex: 1, backgroundColor: "#f3f0ff", borderRadius: 6, padding: 10, borderLeftWidth: 3, borderLeftColor: "#6C5CE7" } },
              React.createElement(Text, { style: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#6C5CE7", marginBottom: 4 } }, properties[0]?.address || "Property 1"),
              React.createElement(Text, { style: { fontSize: 9, lineHeight: 1.4, color: C.slate700 } }, report.property1Summary)
            ),
            // Property 2 card
            React.createElement(
              View,
              { style: { flex: 1, backgroundColor: "#e8fbff", borderRadius: 6, padding: 10, borderLeftWidth: 3, borderLeftColor: "#00D2FF" } },
              React.createElement(Text, { style: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#00A3CC", marginBottom: 4 } }, properties[1]?.address || "Property 2"),
              React.createElement(Text, { style: { fontSize: 9, lineHeight: 1.4, color: C.slate700 } }, report.property2Summary)
            )
          )
        : React.createElement(Text, { style: s.bodyText }, isFree ? report.summary.split(/(?<=[.!?])\s+/).slice(0, 1).join(" ") + "..." : report.summary),
      // Free report upgrade note
      isFree ? React.createElement(
        View,
        { style: { marginTop: 6, padding: 8, backgroundColor: "#f3f0ff", borderRadius: 4 } },
        React.createElement(Text, { style: { fontSize: 8, color: "#6C5CE7" } }, "Upgrade at rivvl.ai for the full analysis")
      ) : null
    ),

    /* ──────── SCORE DASHBOARD ──────── */
    React.createElement(
      RPage,
      { isFree },
      React.createElement(Text, { style: s.sectionTitle }, "Score Dashboard"),
      ...properties.map((prop, idx) =>
        React.createElement(
          View,
          { key: `scores-${idx}`, style: { marginBottom: 16 } },
          React.createElement(
            Text,
            { style: s.sectionSubtitle },
            `${properties[idx]?.address || shortAddresses[idx]}`
          ),
          /* Overall score */
          React.createElement(
            View,
            { style: { alignItems: "center", marginBottom: 8 } },
            React.createElement(
              Text,
              { style: { fontSize: 9, color: C.slate500, marginBottom: 2 } },
              "OVERALL SCORE"
            ),
            React.createElement(
              Text,
              {
                style: {
                  fontSize: 28,
                  fontFamily: "Helvetica-Bold",
                  color: scoreColor(prop.overallScore),
                },
              },
              prop.overallScore != null ? `${prop.overallScore}/10` : "N/A"
            )
          ),
          /* Category scores row */
          React.createElement(
            View,
            { style: s.scoreRow },
            ...[
              { label: "Price", value: prop.priceScore },
              { label: "Location", value: prop.locationScore },
              { label: "Value", value: prop.valueScore },
              { label: "Risk", value: prop.riskScore },
            ].map((sc) =>
              React.createElement(
                View,
                { key: `${idx}-${sc.label}`, style: s.scoreCard },
                React.createElement(Text, { style: s.scoreLabel }, sc.label),
                React.createElement(
                  Text,
                  {
                    style: {
                      ...s.scoreValue,
                      color: scoreColor(sc.value),
                    },
                  },
                  sc.value != null ? `${sc.value}` : "N/A"
                ),
                React.createElement(Text, { style: s.scoreCaption }, sc.value != null ? "/ 10" : "")
              )
            )
          )
        )
      )
    ),

    /* ──────── KEY FACTS COMPARISON ──────── */
    React.createElement(
      RPage,
      { isFree },
      React.createElement(
        Text,
        { style: s.sectionTitle },
        "Key Facts Comparison"
      ),
      /* Listing-based facts table */
      React.createElement(
        View,
        { style: { marginBottom: 14 } },
        /* Table header */
        React.createElement(
          View,
          { style: s.tableHeader },
          React.createElement(
            Text,
            { style: { ...s.tableHeaderCell, width: "30%" } },
            "Attribute"
          ),
          ...shortAddresses.map((addr, i) =>
            React.createElement(
              Text,
              {
                key: `th-${i}`,
                style: {
                  ...s.tableHeaderCell,
                  width: `${70 / shortAddresses.length}%`,
                },
              },
              addr
            )
          )
        ),
        /* Table rows from listings */
        ...(() => {
          const allFactRows = [
            { label: "Price", key: "price" },
            { label: "Beds", key: "beds" },
            { label: "Baths", key: "baths" },
            { label: "Sq Ft", key: "sqft" },
            { label: "Year Built", key: "yearBuilt" },
            { label: "Property Type", key: "propertyType" },
            { label: "Price/Sq Ft", key: "pricePerSqft" },
            { label: "HOA Fee", key: "hoaFee" },
          ];
          const visibleFactRows = isFree ? allFactRows.slice(0, 4) : allFactRows;
          return visibleFactRows;
        })().map((row, rIdx) =>
          React.createElement(
            View,
            {
              key: `row-${rIdx}`,
              style: rIdx % 2 === 0 ? s.tableRow : s.tableRowAlt,
            },
            React.createElement(
              Text,
              {
                style: {
                  ...s.tableCell,
                  width: "30%",
                  fontFamily: "Helvetica-Bold",
                },
              },
              row.label
            ),
            ...listings.map((listing, lIdx) => {
              const raw = listing[row.key as keyof HomeListing];
              let display: string;
              let displayColor: string | undefined;
              if (row.key === "hoaFee") {
                const status = listing.hoaStatus ?? 'not_listed';
                if (status === 'confirmed' && listing.hoaFee != null) {
                  display = formatPrice(listing.hoaFee);
                } else if (status === 'confirmed_none') {
                  display = "None (confirmed)";
                } else {
                  display = "Not listed";
                  displayColor = C.amber;
                }
              } else if (raw == null) {
                display = "N/A";
              } else if (row.key === "price" || row.key === "pricePerSqft") {
                display = formatPrice(raw as number);
              } else if (row.key === "sqft") {
                display = (raw as number).toLocaleString("en-US") + " sq ft";
              } else {
                display = String(raw);
              }
              return React.createElement(
                Text,
                {
                  key: `cell-${rIdx}-${lIdx}`,
                  style: {
                    ...s.tableCell,
                    width: `${70 / shortAddresses.length}%`,
                    ...(displayColor ? { color: displayColor } : {}),
                  },
                },
                display
              );
            })
          )
        )
      ),
      isFree ? React.createElement(
        View,
        { style: { marginTop: 6, padding: 8, backgroundColor: "#f3f0ff", borderRadius: 4, alignItems: "center" } },
        React.createElement(Text, { style: { fontSize: 8, color: "#6C5CE7" } }, "+6 more data points in full report — Upgrade at rivvl.ai")
      ) : null,
      /* AI key facts per property */
      ...properties.map((prop, idx) =>
        prop.keyFacts && prop.keyFacts.length > 0
          ? React.createElement(
              View,
              { key: `kf-${idx}`, style: { marginBottom: 10 } },
              React.createElement(
                Text,
                { style: { ...s.sectionSubtitle, fontSize: 10 } },
                `${shortAddresses[idx]} — Additional Facts`
              ),
              ...prop.keyFacts.map((kf, kIdx) =>
                React.createElement(
                  View,
                  {
                    key: `kf-${idx}-${kIdx}`,
                    style: kIdx % 2 === 0 ? s.tableRow : s.tableRowAlt,
                  },
                  React.createElement(
                    Text,
                    {
                      style: {
                        ...s.tableCell,
                        width: "40%",
                        fontFamily: "Helvetica-Bold",
                      },
                    },
                    kf.label
                  ),
                  React.createElement(
                    Text,
                    { style: { ...s.tableCell, width: "60%" } },
                    kf.value
                  )
                )
              )
            )
          : null
      )
    ),

    /* ──────── PROS & CONS PER PROPERTY ──────── */
    ...properties.map((prop, idx) =>
      React.createElement(
        RPage,
        { key: `proscons-${idx}`, isFree },
        React.createElement(
          View,
          { style: s.propertyHeader },
          React.createElement(
            Text,
            { style: s.propertyHeaderText },
            `${properties[idx]?.address || shortAddresses[idx]}`
          ),
          React.createElement(
            Text,
            { style: s.propertyHeaderSub },
            `Overall Score: ${prop.overallScore}/10  |  Est. Monthly: ${prop.estimatedMonthlyOwnership || "N/A"}`
          )
        ),
        React.createElement(
          Text,
          { style: s.sectionTitle },
          "Pros & Cons"
        ),
        React.createElement(
          View,
          { style: s.prosConsContainer },
          /* Pros */
          React.createElement(
            View,
            { style: s.prosBox },
            React.createElement(
              Text,
              { style: { ...s.prosConsTitle, color: C.emerald } },
              "Pros"
            ),
            ...(() => {
              const visiblePros = isFree ? prop.pros.slice(0, 1) : prop.pros;
              return visiblePros;
            })().map((pro, pIdx) =>
              React.createElement(
                Text,
                { key: `pro-${idx}-${pIdx}`, style: s.prosConsItem },
                `+ ${pro}`
              )
            )
          ),
          /* Cons */
          React.createElement(
            View,
            { style: s.consBox },
            React.createElement(
              Text,
              { style: { ...s.prosConsTitle, color: C.red } },
              "Cons"
            ),
            ...(() => {
              const visibleCons = isFree ? prop.cons.slice(0, 1) : prop.cons;
              return visibleCons;
            })().map((con, cIdx) =>
              React.createElement(
                Text,
                { key: `con-${idx}-${cIdx}`, style: s.prosConsItem },
                `- ${con}`
              )
            )
          )
        ),
        /* Risk summary text */
        prop.riskSummary
          ? React.createElement(
              View,
              { style: { marginTop: 8 } },
              React.createElement(
                Text,
                { style: s.sectionSubtitle },
                "Risk Summary"
              ),
              React.createElement(
                Text,
                { style: s.bodyText },
                prop.riskSummary
              )
            )
          : null
      )
    ),

    /* ──────── RISK REPORT ──────── */
    ...properties.map((prop, idx) =>
      prop.riskProfile
        ? React.createElement(
            RPage,
            { key: `risk-${idx}`, isFree },
            React.createElement(
              View,
              { style: s.propertyHeader },
              React.createElement(
                Text,
                { style: s.propertyHeaderText },
                `Risk Report: ${shortAddresses[idx]}`
              )
            ),
            React.createElement(
              Text,
              { style: s.sectionTitle },
              "Environmental & Safety Risks"
            ),
            React.createElement(
              View,
              { style: s.riskGrid },
              /* Flood Zone */
              React.createElement(
                View,
                { style: s.riskItem },
                React.createElement(
                  Text,
                  { style: s.riskItemLabel },
                  "Flood Zone"
                ),
                React.createElement(
                  Text,
                  {
                    style: {
                      ...s.riskItemValue,
                      color: riskLevelColor(
                        prop.riskProfile.floodZone.riskLevel
                      ),
                    },
                  },
                  `${prop.riskProfile.floodZone.riskLevel}${prop.riskProfile.floodZone.code ? ` (Zone ${prop.riskProfile.floodZone.code})` : ""}`
                ),
                React.createElement(
                  Text,
                  { style: { fontSize: 7, color: C.slate400 } },
                  prop.riskProfile.floodZone.isSFHA
                    ? "In Special Flood Hazard Area"
                    : "Not in Special Flood Hazard Area"
                )
              ),
              /* Superfund Sites (paid only) */
              !isFree ? React.createElement(
                View,
                { style: s.riskItem },
                React.createElement(
                  Text,
                  { style: s.riskItemLabel },
                  "Superfund Sites"
                ),
                React.createElement(
                  Text,
                  { style: s.riskItemValue },
                  `${prop.riskProfile.superfundSites.count1mile} within 1 mi, ${prop.riskProfile.superfundSites.count3mile} within 3 mi`
                )
              ) : null,
              /* Earthquake Risk (paid only) */
              !isFree ? React.createElement(
                View,
                { style: s.riskItem },
                React.createElement(
                  Text,
                  { style: s.riskItemLabel },
                  "Earthquake Risk"
                ),
                React.createElement(
                  Text,
                  {
                    style: {
                      ...s.riskItemValue,
                      color: riskLevelColor(
                        prop.riskProfile.earthquakeRisk.riskLevel
                      ),
                    },
                  },
                  prop.riskProfile.earthquakeRisk.riskLevel
                ),
                React.createElement(
                  Text,
                  { style: { fontSize: 7, color: C.slate400 } },
                  `${prop.riskProfile.earthquakeRisk.eventCount} events${prop.riskProfile.earthquakeRisk.maxMagnitude != null ? `, max ${prop.riskProfile.earthquakeRisk.maxMagnitude}M` : ""}`
                )
              ) : null,
              /* Wildfire Risk (paid only) */
              !isFree ? React.createElement(
                View,
                { style: s.riskItem },
                React.createElement(
                  Text,
                  { style: s.riskItemLabel },
                  "Wildfire Risk"
                ),
                React.createElement(
                  Text,
                  {
                    style: {
                      ...s.riskItemValue,
                      color: riskLevelColor(
                        prop.riskProfile.wildfireRisk.riskLevel
                      ),
                    },
                  },
                  prop.riskProfile.wildfireRisk.riskLevel
                )
              ) : null,
              /* Air Quality (paid only) */
              !isFree ? React.createElement(
                View,
                { style: s.riskItem },
                React.createElement(
                  Text,
                  { style: s.riskItemLabel },
                  "Air Quality"
                ),
                React.createElement(
                  Text,
                  { style: s.riskItemValue },
                  prop.riskProfile.airQuality.score != null
                    ? `AQI ${prop.riskProfile.airQuality.score}`
                    : "N/A"
                ),
                prop.riskProfile.airQuality.description
                  ? React.createElement(
                      Text,
                      { style: { fontSize: 7, color: C.slate400 } },
                      prop.riskProfile.airQuality.description
                    )
                  : null
              ) : null,
              /* Radon Zone */
              React.createElement(
                View,
                { style: s.riskItem },
                React.createElement(
                  Text,
                  { style: s.riskItemLabel },
                  "Radon Risk"
                ),
                React.createElement(
                  Text,
                  {
                    style: {
                      ...s.riskItemValue,
                      color: riskLevelColor(
                        prop.riskProfile.radonZone.riskLabel
                      ),
                    },
                  },
                  prop.riskProfile.radonZone.riskLabel
                ),
                prop.riskProfile.radonZone.zone != null
                  ? React.createElement(
                      Text,
                      { style: { fontSize: 7, color: C.slate400 } },
                      `EPA Zone ${prop.riskProfile.radonZone.zone}`
                    )
                  : null
              ),
              /* Lead Paint */
              React.createElement(
                View,
                { style: s.riskItem },
                React.createElement(
                  Text,
                  { style: s.riskItemLabel },
                  "Lead Paint Risk"
                ),
                React.createElement(
                  Text,
                  {
                    style: {
                      ...s.riskItemValue,
                      color: prop.riskProfile.leadPaintRisk ? C.red : C.emerald,
                    },
                  },
                  prop.riskProfile.leadPaintRisk ? "Possible" : "Unlikely"
                )
              ),
              /* Asbestos (paid only) */
              !isFree ? React.createElement(
                View,
                { style: s.riskItem },
                React.createElement(
                  Text,
                  { style: s.riskItemLabel },
                  "Asbestos Risk"
                ),
                React.createElement(
                  Text,
                  {
                    style: {
                      ...s.riskItemValue,
                      color: prop.riskProfile.asbestosRisk ? C.red : C.emerald,
                    },
                  },
                  prop.riskProfile.asbestosRisk ? "Possible" : "Unlikely"
                )
              ) : null
            )
          )
        : null
    ),

    /* ──────── NEARBY SCHOOLS (paid only) ──────── */
    !isFree && paidData?.schools && paidData.schools.some(sl => sl && sl.length > 0)
      ? React.createElement(
          RPage,
          { isFree },
          React.createElement(Text, { style: s.sectionTitle }, "Nearby Schools"),
          ...properties.map((prop, idx) => {
            const schoolList = paidData.schools?.[idx] ?? [];
            const displaySchools = schoolList.slice(0, 9);
            return React.createElement(
              View,
              { key: `schools-${idx}`, style: { marginBottom: 16 } },
              React.createElement(Text, { style: s.sectionSubtitle }, prop.address),
              displaySchools.length > 0
                ? React.createElement(
                    View,
                    null,
                    // Table header
                    React.createElement(
                      View,
                      { style: s.tableHeader },
                      React.createElement(Text, { style: { ...s.tableHeaderCell, width: '35%' } }, "School"),
                      React.createElement(Text, { style: { ...s.tableHeaderCell, width: '20%' } }, "Level"),
                      React.createElement(Text, { style: { ...s.tableHeaderCell, width: '20%' } }, "Enrollment"),
                      React.createElement(Text, { style: { ...s.tableHeaderCell, width: '25%' } }, "Distance")
                    ),
                    // Table rows
                    ...displaySchools.map((school, si) =>
                      React.createElement(
                        View,
                        { key: `school-${idx}-${si}`, style: si % 2 === 0 ? s.tableRow : s.tableRowAlt },
                        React.createElement(Text, { style: { ...s.tableCell, width: '35%', fontFamily: 'Helvetica-Bold' } }, school.name),
                        React.createElement(Text, { style: { ...s.tableCell, width: '20%' } }, school.level),
                        React.createElement(Text, { style: { ...s.tableCell, width: '20%' } }, school.enrollment ? school.enrollment.toLocaleString() : 'N/A'),
                        React.createElement(Text, { style: { ...s.tableCell, width: '25%' } }, `${school.distanceMiles} mi`)
                      )
                    )
                  )
                : React.createElement(Text, { style: { ...s.bodyText, fontStyle: 'italic', color: C.slate400 } }, "No public schools found within 2 miles.")
            );
          }),
          React.createElement(Text, { style: { ...s.disclaimerText, marginTop: 8, fontStyle: 'italic' } }, "School data from NCES. Confirm attendance boundaries with local school district.")
        )
      : null,

    /* ──────── SAFETY CONTEXT (paid only) ──────── */
    !isFree && paidData?.crimeData && paidData.crimeData.some(c => c !== null)
      ? React.createElement(
          RPage,
          { isFree },
          React.createElement(Text, { style: s.sectionTitle }, "Safety Context"),
          ...properties.map((prop, idx) => {
            const crime = paidData.crimeData?.[idx];
            return React.createElement(
              View,
              { key: `crime-${idx}`, style: { marginBottom: 16 } },
              React.createElement(Text, { style: s.sectionSubtitle }, prop.address),
              crime
                ? React.createElement(
                    View,
                    { style: { flexDirection: 'row', gap: 10 } },
                    // Violent crime card
                    React.createElement(
                      View,
                      { style: { flex: 1, backgroundColor: C.slate50, borderRadius: 6, padding: 10, borderWidth: 1, borderColor: C.slate200 } },
                      React.createElement(Text, { style: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.slate600, marginBottom: 4 } }, "VIOLENT CRIME RATE"),
                      React.createElement(Text, { style: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: crime.vsNationalViolent === 'below' ? C.emerald : crime.vsNationalViolent === 'above' ? C.red : C.amber } }, `${crime.violentCrimeRate.toLocaleString()}`),
                      React.createElement(Text, { style: { fontSize: 7, color: C.slate400, marginTop: 2 } }, "per 100,000 residents"),
                      React.createElement(Text, { style: { fontSize: 7, color: C.slate400, marginTop: 2 } }, crime.vsNationalViolent === 'below' ? 'Below national avg (380)' : crime.vsNationalViolent === 'above' ? 'Above national avg (380)' : 'Near national avg (380)')
                    ),
                    // Property crime card
                    React.createElement(
                      View,
                      { style: { flex: 1, backgroundColor: C.slate50, borderRadius: 6, padding: 10, borderWidth: 1, borderColor: C.slate200 } },
                      React.createElement(Text, { style: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.slate600, marginBottom: 4 } }, "PROPERTY CRIME RATE"),
                      React.createElement(Text, { style: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: crime.vsNationalProperty === 'below' ? C.emerald : crime.vsNationalProperty === 'above' ? C.red : C.amber } }, `${crime.propertyCrimeRate.toLocaleString()}`),
                      React.createElement(Text, { style: { fontSize: 7, color: C.slate400, marginTop: 2 } }, "per 100,000 residents"),
                      React.createElement(Text, { style: { fontSize: 7, color: C.slate400, marginTop: 2 } }, crime.vsNationalProperty === 'below' ? 'Below national avg (2,100)' : crime.vsNationalProperty === 'above' ? 'Above national avg (2,100)' : 'Near national avg (2,100)')
                    )
                  )
                : React.createElement(Text, { style: { ...s.bodyText, fontStyle: 'italic', color: C.slate400 } }, "Crime data not available for this jurisdiction.")
            );
          }),
          React.createElement(Text, { style: { ...s.disclaimerText, marginTop: 8, fontStyle: 'italic' } }, "Crime statistics from FBI Uniform Crime Reporting. City-level data, not neighborhood-specific.")
        )
      : null,

    /* ──────── PRICE HISTORY (paid only) ──────── */
    !isFree && paidData?.priceHistory && paidData.priceHistory.some(p => p !== null)
      ? React.createElement(
          RPage,
          { isFree },
          React.createElement(Text, { style: s.sectionTitle }, "Price History"),
          ...properties.map((prop, idx) => {
            const ph = paidData.priceHistory?.[idx];
            return React.createElement(
              View,
              { key: `price-${idx}`, style: { marginBottom: 16 } },
              React.createElement(Text, { style: s.sectionSubtitle }, prop.address),
              ph && ph.lastSalePrice
                ? React.createElement(
                    View,
                    { style: s.riskGrid },
                    React.createElement(
                      View,
                      { style: s.riskItem },
                      React.createElement(Text, { style: s.riskItemLabel }, "LAST SOLD"),
                      React.createElement(Text, { style: s.riskItemValue }, `${ph.lastSaleDate ? new Date(ph.lastSaleDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'Date unknown'} for $${ph.lastSalePrice.toLocaleString()}`)
                    ),
                    ph.appreciationAmount !== null && ph.appreciationPercent !== null
                      ? React.createElement(
                          View,
                          { style: s.riskItem },
                          React.createElement(Text, { style: s.riskItemLabel }, "APPRECIATION"),
                          React.createElement(Text, { style: { ...s.riskItemValue, color: (ph.appreciationAmount ?? 0) >= 0 ? C.emerald : C.red } }, `${(ph.appreciationAmount ?? 0) >= 0 ? '+' : ''}$${Math.abs(ph.appreciationAmount ?? 0).toLocaleString()} (${(ph.appreciationAmount ?? 0) >= 0 ? '+' : ''}${ph.appreciationPercent}%)`)
                        )
                      : null,
                    ph.annualAppreciationRate !== null
                      ? React.createElement(
                          View,
                          { style: s.riskItem },
                          React.createElement(Text, { style: s.riskItemLabel }, "ANNUALIZED RETURN"),
                          React.createElement(Text, { style: s.riskItemValue }, `${ph.annualAppreciationRate}% per year`)
                        )
                      : null,
                    ph.assessedValue
                      ? React.createElement(
                          View,
                          { style: s.riskItem },
                          React.createElement(Text, { style: s.riskItemLabel }, "ASSESSED VALUE"),
                          React.createElement(Text, { style: s.riskItemValue }, `$${ph.assessedValue.toLocaleString()}`),
                          React.createElement(Text, { style: { fontSize: 7, color: C.slate400 } }, "(county tax assessment)")
                        )
                      : null
                  )
                : React.createElement(Text, { style: { ...s.bodyText, fontStyle: 'italic', color: C.slate400 } }, "No previous sale history available.")
            );
          })
        )
      : null,

    /* ──────── LISTING INFORMATION (paid only) ──────── */
    !isFree && paidData?.brokerageInfo && paidData.brokerageInfo.some(b => b.agentName || b.brokerageName)
      ? React.createElement(
          RPage,
          { isFree },
          React.createElement(Text, { style: s.sectionTitle }, "Listing Information"),
          ...properties.map((prop, idx) => {
            const bi = paidData.brokerageInfo?.[idx];
            if (!bi || (!bi.agentName && !bi.brokerageName)) return null;
            return React.createElement(
              View,
              { key: `listing-${idx}`, style: { marginBottom: 12, backgroundColor: C.slate50, borderRadius: 6, padding: 10, borderWidth: 1, borderColor: C.slate200 } },
              React.createElement(Text, { style: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.slate700, marginBottom: 4 } }, prop.address),
              bi.agentName ? React.createElement(Text, { style: { fontSize: 9, color: C.slate700 } }, `Listed by: ${bi.agentName}`) : null,
              bi.brokerageName ? React.createElement(Text, { style: { fontSize: 9, color: C.slate700, marginTop: 2 } }, `Brokerage: ${bi.brokerageName}`) : null,
              bi.googleRating ? React.createElement(Text, { style: { fontSize: 9, color: C.slate700, marginTop: 2 } }, `Google Rating: ${bi.googleRating} (${bi.googleReviewCount} reviews)`) : null
            );
          }).filter(Boolean),
          React.createElement(Text, { style: { ...s.disclaimerText, marginTop: 8, fontStyle: 'italic' } }, "Brokerage ratings from Google Reviews. Verify licenses through your state's real estate commission.")
        )
      : null,

    /* ──────── RED FLAGS (Sprint 1, Feature 5 — paid only) ──────── */
    !isFree && (report as unknown as Record<string, unknown>).redFlags && Array.isArray((report as unknown as Record<string, unknown>).redFlags)
      ? React.createElement(
          RPage,
          { isFree },
          React.createElement(Text, { style: s.sectionTitle }, "Red Flags in This Listing"),
          ...((report as unknown as Record<string, unknown>).redFlags as { rulesFlags: { text: string; severity: string }[]; aiRedFlags: string[]; noFlagsDetected: boolean }[]).map((rf, ri) =>
            React.createElement(
              View,
              { key: `rf-${ri}`, style: { marginBottom: 12 } },
              React.createElement(Text, { style: s.sectionSubtitle }, properties[ri]?.address || `Property ${ri + 1}`),
              rf.noFlagsDetected
                ? React.createElement(Text, { style: { ...s.bodyText, color: C.emerald } }, "No major red flags detected.")
                : React.createElement(
                    View,
                    null,
                    ...rf.rulesFlags.map((flag, fi) =>
                      React.createElement(
                        View,
                        { key: `rf-${ri}-rule-${fi}`, style: { backgroundColor: flag.severity === "red" ? "#FEF2F2" : "#FFFBEB", borderRadius: 4, padding: 6, marginBottom: 4, borderLeftWidth: 3, borderLeftColor: flag.severity === "red" ? C.red : C.amber } },
                        React.createElement(Text, { style: { fontSize: 9, color: C.slate700 } }, flag.text)
                      )
                    ),
                    ...rf.aiRedFlags.map((flag, fi) =>
                      React.createElement(
                        View,
                        { key: `rf-${ri}-ai-${fi}`, style: { backgroundColor: "#FFFBEB", borderRadius: 4, padding: 6, marginBottom: 4, borderLeftWidth: 3, borderLeftColor: C.amber } },
                        React.createElement(Text, { style: { fontSize: 9, color: C.slate700 } }, flag)
                      )
                    )
                  )
            )
          )
        )
      : null,

    /* ──────── CLOSING COST ESTIMATE (Sprint 1, Feature 1 — paid only) ──────── */
    !isFree && (report as unknown as Record<string, unknown>).closingCosts && Array.isArray((report as unknown as Record<string, unknown>).closingCosts)
      ? React.createElement(
          RPage,
          { isFree },
          React.createElement(Text, { style: s.sectionTitle }, "Closing Cost Estimate"),
          ...((report as unknown as Record<string, unknown>).closingCosts as { loanOriginationFee: number; titleInsurance: number; appraisalFee: number; homeInspection: number; attorneyFee: number; prepaidPropertyTax: number; firstYearInsurance: number; escrowSetup: number; downPayment: number; totalCashToClose: number }[]).map((cc, ci) =>
            React.createElement(
              View,
              { key: `cc-${ci}`, style: { marginBottom: 12 } },
              React.createElement(Text, { style: s.sectionSubtitle }, properties[ci]?.address || `Property ${ci + 1}`),
              React.createElement(
                View,
                null,
                ...[
                  { label: "Down Payment (20%)", value: cc.downPayment },
                  { label: "Loan Origination Fee (1%)", value: cc.loanOriginationFee },
                  { label: "Title Insurance (0.5%)", value: cc.titleInsurance },
                  { label: "Appraisal Fee", value: cc.appraisalFee },
                  { label: "Home Inspection", value: cc.homeInspection },
                  { label: "Attorney/Closing Agent Fee", value: cc.attorneyFee },
                  { label: "Prepaid Property Tax (2 months)", value: cc.prepaidPropertyTax },
                  { label: "First Year Insurance", value: cc.firstYearInsurance },
                  { label: "Escrow Setup", value: cc.escrowSetup },
                ].map((row, ri) =>
                  React.createElement(
                    View,
                    { key: `cc-${ci}-${ri}`, style: ri % 2 === 0 ? s.tableRow : s.tableRowAlt },
                    React.createElement(Text, { style: { ...s.tableCell, width: '60%' } }, row.label),
                    React.createElement(Text, { style: { ...s.tableCell, width: '40%', textAlign: 'right' as const } }, `$${row.value.toLocaleString()}`)
                  )
                ),
                React.createElement(
                  View,
                  { style: { ...s.tableRow, backgroundColor: C.indigoLight } },
                  React.createElement(Text, { style: { ...s.tableCell, width: '60%', fontFamily: 'Helvetica-Bold', color: C.indigo } }, "Total Cash Needed to Close"),
                  React.createElement(Text, { style: { ...s.tableCell, width: '40%', textAlign: 'right' as const, fontFamily: 'Helvetica-Bold', color: C.indigo } }, `$${cc.totalCashToClose.toLocaleString()}`)
                )
              )
            )
          ),
          React.createElement(Text, { style: s.disclaimerText }, "Closing cost estimates are approximations based on national averages. Your actual costs will vary. Consult your lender for a Loan Estimate.")
        )
      : null,

    /* ──────── INSURANCE ESTIMATE (Sprint 1, Feature 2 — paid only) ──────── */
    !isFree && (report as unknown as Record<string, unknown>).insuranceEstimate && Array.isArray((report as unknown as Record<string, unknown>).insuranceEstimate)
      ? React.createElement(
          RPage,
          { isFree },
          React.createElement(Text, { style: s.sectionTitle }, "Insurance Cost Estimate"),
          ...((report as unknown as Record<string, unknown>).insuranceEstimate as { annualRangeLow: number; annualRangeHigh: number; monthlyEstimate: number; floodInsuranceRequired: boolean; floodInsuranceEstimateLow: number | null; floodInsuranceEstimateHigh: number | null; totalAnnualInsuranceLow: number; totalAnnualInsuranceHigh: number; multipliers: string[] }[]).map((ins, ii) =>
            React.createElement(
              View,
              { key: `ins-${ii}`, style: { marginBottom: 12 } },
              React.createElement(Text, { style: s.sectionSubtitle }, properties[ii]?.address || `Property ${ii + 1}`),
              React.createElement(Text, { style: s.bodyText }, `Estimated annual homeowners insurance: $${ins.annualRangeLow.toLocaleString()} to $${ins.annualRangeHigh.toLocaleString()} ($${ins.monthlyEstimate.toLocaleString()}/month)`),
              ...ins.multipliers.map((m, mi) =>
                React.createElement(Text, { key: `ins-${ii}-m-${mi}`, style: { fontSize: 8, color: C.amber, marginBottom: 2 } }, `  \u2022 ${m}`)
              ),
              ins.floodInsuranceRequired && ins.floodInsuranceEstimateLow && ins.floodInsuranceEstimateHigh
                ? React.createElement(Text, { style: { ...s.bodyText, color: C.amber, fontFamily: 'Helvetica-Bold' } }, `Flood insurance required: $${ins.floodInsuranceEstimateLow.toLocaleString()} to $${ins.floodInsuranceEstimateHigh.toLocaleString()}/year`)
                : null,
              React.createElement(Text, { style: { ...s.bodyText, fontFamily: 'Helvetica-Bold' } }, `Total estimated annual insurance: $${ins.totalAnnualInsuranceLow.toLocaleString()} to $${ins.totalAnnualInsuranceHigh.toLocaleString()}`)
            )
          ),
          React.createElement(Text, { style: s.disclaimerText }, "Insurance estimates are approximations. Actual premiums depend on your coverage choices, insurer, and property inspection. Get quotes from at least 3 insurers.")
        )
      : null,

    /* ──────── LOAN PROGRAMS (Sprint 1, Feature 6 — paid only) ──────── */
    !isFree && (report as unknown as Record<string, unknown>).loanPrograms && Array.isArray((report as unknown as Record<string, unknown>).loanPrograms)
      ? React.createElement(
          RPage,
          { isFree },
          React.createElement(Text, { style: s.sectionTitle }, "First-Time Buyer Loan Programs"),
          ...((report as unknown as Record<string, unknown>).loanPrograms as { programs: { name: string; minDownPayment: string; estimatedMonthlyPayment: string; keyRequirement: string }[]; stateProgram: string; state: string }[]).map((lp, li) =>
            React.createElement(
              View,
              { key: `lp-${li}`, style: { marginBottom: 12 } },
              React.createElement(Text, { style: s.sectionSubtitle }, properties[li]?.address || `Property ${li + 1}`),
              React.createElement(
                View,
                null,
                React.createElement(
                  View,
                  { style: s.tableHeader },
                  React.createElement(Text, { style: { ...s.tableHeaderCell, width: '25%' } }, "Program"),
                  React.createElement(Text, { style: { ...s.tableHeaderCell, width: '25%' } }, "Min Down"),
                  React.createElement(Text, { style: { ...s.tableHeaderCell, width: '25%' } }, "Est. Monthly"),
                  React.createElement(Text, { style: { ...s.tableHeaderCell, width: '25%' } }, "Key Requirement")
                ),
                ...lp.programs.map((prog, pi) =>
                  React.createElement(
                    View,
                    { key: `lp-${li}-${pi}`, style: pi % 2 === 0 ? s.tableRow : s.tableRowAlt },
                    React.createElement(Text, { style: { ...s.tableCell, width: '25%', fontFamily: 'Helvetica-Bold' } }, prog.name),
                    React.createElement(Text, { style: { ...s.tableCell, width: '25%' } }, prog.minDownPayment),
                    React.createElement(Text, { style: { ...s.tableCell, width: '25%' } }, prog.estimatedMonthlyPayment),
                    React.createElement(Text, { style: { ...s.tableCell, width: '25%', fontSize: 7 } }, prog.keyRequirement)
                  )
                )
              ),
              React.createElement(
                View,
                { style: { backgroundColor: C.indigoLight, borderRadius: 4, padding: 8, marginTop: 6 } },
                React.createElement(Text, { style: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.indigo, marginBottom: 2 } }, `State Program (${lp.state})`),
                React.createElement(Text, { style: { fontSize: 8, color: C.slate600 } }, lp.stateProgram)
              )
            )
          ),
          React.createElement(Text, { style: s.disclaimerText }, "Loan program eligibility is estimated based on purchase price and location. Consult a HUD-approved housing counselor or licensed mortgage broker.")
        )
      : null,

    /* ──────── TAX REASSESSMENT (Sprint 1, Feature 3 — paid only) ──────── */
    !isFree && (report as unknown as Record<string, unknown>).taxReassessment && Array.isArray((report as unknown as Record<string, unknown>).taxReassessment)
      ? React.createElement(
          RPage,
          { isFree },
          React.createElement(Text, { style: s.sectionTitle }, "Property Tax Reassessment Risk"),
          ...((report as unknown as Record<string, unknown>).taxReassessment as { assessedValue: number | null; listingPrice: number; gapPercentage: number | null; isReassessmentRisk: boolean; estimatedCurrentAnnualTax: number | null; estimatedPostPurchaseAnnualTax: number; estimatedAnnualTaxIncrease: number | null }[]).map((tr, ti) =>
            React.createElement(
              View,
              { key: `tr-${ti}`, style: { marginBottom: 12 } },
              React.createElement(Text, { style: s.sectionSubtitle }, properties[ti]?.address || `Property ${ti + 1}`),
              tr.isReassessmentRisk && tr.assessedValue && tr.gapPercentage !== null
                ? React.createElement(
                    View,
                    { style: { backgroundColor: "#FFFBEB", borderRadius: 4, padding: 8, borderLeftWidth: 3, borderLeftColor: C.amber } },
                    React.createElement(Text, { style: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.amber, marginBottom: 4 } }, "Reassessment Risk Detected"),
                    React.createElement(Text, { style: { fontSize: 9, color: C.slate700, marginBottom: 4 } }, `Listed at $${tr.listingPrice.toLocaleString()}, which is ${tr.gapPercentage}% above assessed value of $${tr.assessedValue.toLocaleString()}.`),
                    React.createElement(Text, { style: { fontSize: 9, color: C.slate700 } }, `Estimated post-purchase annual tax: $${tr.estimatedPostPurchaseAnnualTax.toLocaleString()}${tr.estimatedCurrentAnnualTax ? ` (up from $${tr.estimatedCurrentAnnualTax.toLocaleString()})` : ""}.`)
                  )
                : tr.assessedValue
                  ? React.createElement(Text, { style: { ...s.bodyText, color: C.emerald } }, "Assessed value is close to listing price. Low reassessment risk.")
                  : React.createElement(
                    View,
                    null,
                    React.createElement(Text, { style: { fontSize: 9, color: C.slate700, marginBottom: 4 } },
                      `Assessed value not available from public records. Based on the purchase price of $${tr.listingPrice.toLocaleString()} and the average effective property tax rate of 1.1%, estimated annual property taxes are approximately $${Math.round(tr.listingPrice * 0.011).toLocaleString()} ($${Math.round((tr.listingPrice * 0.011) / 12).toLocaleString()}/month).`
                    ),
                    React.createElement(Text, { style: { fontSize: 8, color: C.slate500, marginTop: 4 } },
                      "Virginia property taxes are reassessed periodically. After purchase, your assessed value will likely adjust toward the sale price over the next 1 to 3 years. Request the actual tax bill from the seller or agent to confirm."
                    )
                  )
            )
          )
        )
      : null,

    /* ──────── BUYER PROTECTION CHECKLIST (paid only) ──────── */
    !isFree && report.buyerProtectionChecklist && report.buyerProtectionChecklist.length > 0
      ? React.createElement(
          RPage,
          { isFree },
          React.createElement(Text, { style: s.sectionTitle }, "Buyer Protection Checklist"),
          ...report.buyerProtectionChecklist.map((items, pi) =>
            React.createElement(
              View,
              { key: `bpc-${pi}`, style: { marginBottom: 12 } },
              React.createElement(Text, { style: s.sectionSubtitle }, properties[pi]?.address || `Property ${pi + 1}`),
              React.createElement(
                View,
                null,
                React.createElement(
                  View,
                  { style: s.tableHeader },
                  React.createElement(Text, { style: { ...s.tableHeaderCell, width: '30%' } }, "Item"),
                  React.createElement(Text, { style: { ...s.tableHeaderCell, width: '40%' } }, "Why It Matters"),
                  React.createElement(Text, { style: { ...s.tableHeaderCell, width: '30%' } }, "How to Find Out")
                ),
                ...items.map((item, ii) =>
                  React.createElement(
                    View,
                    { key: `bpc-${pi}-${ii}`, style: ii % 2 === 0 ? s.tableRow : s.tableRowAlt },
                    React.createElement(Text, { style: { ...s.tableCell, width: '30%', fontFamily: 'Helvetica-Bold' } }, item.item),
                    React.createElement(Text, { style: { ...s.tableCell, width: '40%' } }, item.why),
                    React.createElement(Text, { style: { ...s.tableCell, width: '30%' } }, item.howToFind)
                  )
                )
              )
            )
          )
        )
      : null,

    /* ──────── QUESTIONS TO ASK YOUR AGENT (paid only) ──────── */
    !isFree && report.questionsToAskAgent && report.questionsToAskAgent.length > 0
      ? React.createElement(
          RPage,
          { isFree },
          React.createElement(Text, { style: s.sectionTitle }, "Smart Questions to Ask Your Agent"),
          React.createElement(Text, { style: { ...s.bodyText, marginBottom: 10 } }, "Based on the data we gathered, here are the most important questions to ask before making an offer."),
          ...report.questionsToAskAgent.map((q, qi) =>
            React.createElement(
              View,
              { key: `q-${qi}`, style: { marginBottom: 8, backgroundColor: C.slate50, borderRadius: 6, padding: 8, borderWidth: 1, borderColor: C.slate200 } },
              React.createElement(
                View,
                { style: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 } },
                React.createElement(Text, { style: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.indigo, backgroundColor: C.indigoLight, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 } }, q.category),
                React.createElement(Text, { style: { fontSize: 7, color: C.slate400 } }, q.property)
              ),
              React.createElement(Text, { style: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.slate700, marginBottom: 2 } }, q.question),
              React.createElement(Text, { style: { fontSize: 7, color: C.slate400, fontStyle: 'italic' } }, `Why it matters: ${q.whyItMatters}`)
            )
          )
        )
      : null,

    /* ──────── OUR RECOMMENDATION (paid only) ──────── */
    !isFree && report.ourPick
      ? React.createElement(
          RPage,
          { isFree },
          React.createElement(Text, { style: s.sectionTitle }, "Our Recommendation"),
          React.createElement(
            View,
            { style: { backgroundColor: "#1a1a2e", borderRadius: 8, padding: 16, borderLeftWidth: 4, borderLeftColor: "#6C5CE7" } },
            // Trophy + title
            React.createElement(
              View,
              { style: { flexDirection: "row", alignItems: "center", gap: 8 } },
              React.createElement(Text, { style: { fontSize: 18 } }, "\uD83C\uDFC6"),
              React.createElement(
                View,
                null,
                React.createElement(Text, { style: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#00D2FF", textTransform: "uppercase", letterSpacing: 1 } }, "OUR RECOMMENDATION"),
                React.createElement(Text, { style: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#FFFFFF", marginTop: 2 } },
                  report.ourPick.address || (report.ourPick.winner <= shortAddresses.length ? properties[report.ourPick.winner - 1]?.address || shortAddresses[report.ourPick.winner - 1] : `Property ${report.ourPick.winner}`)
                )
              )
            ),
            // Divider
            React.createElement(View, { style: { height: 1, backgroundColor: "#374151", marginVertical: 10 } }),
            // Why We Chose This
            React.createElement(Text, { style: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#00D2FF", marginBottom: 4 } }, "Why We Chose This"),
            ...(report.ourPick.bullets && report.ourPick.bullets.length > 0
              ? report.ourPick.bullets.map((b, bi) =>
                  React.createElement(Text, { key: `bullet-${bi}`, style: { fontSize: 9, color: "#e2e8f0", marginBottom: 2, paddingLeft: 8 } }, `\u2022 ${b}`)
                )
              : []),
            // Our Analysis
            React.createElement(View, { style: { marginTop: 8 } },
              React.createElement(Text, { style: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#00D2FF", marginBottom: 4 } }, "Our Analysis"),
              React.createElement(Text, { style: { fontSize: 9, lineHeight: 1.5, color: "#e2e8f0" } },
                report.ourPick.narrative || report.ourPick.reasoning
              )
            ),
            // Caveat
            report.ourPick.caveat
              ? React.createElement(
                  View,
                  { style: { marginTop: 8, backgroundColor: "#78350f20", borderRadius: 4, padding: 8 } },
                  React.createElement(Text, { style: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#F59E0B", marginBottom: 2 } }, "One Thing to Watch"),
                  React.createElement(Text, { style: { fontSize: 9, color: "#FDE68A" } }, report.ourPick.caveat)
                )
              : null
          )
        )
      : null,

    /* ──────── NEGOTIATION INTELLIGENCE (paid only) ──────── */
    !isFree && (report as unknown as Record<string, unknown>).negotiationIntelligence && Array.isArray((report as unknown as Record<string, unknown>).negotiationIntelligence)
      ? React.createElement(
          RPage,
          { isFree },
          React.createElement(Text, { style: s.sectionTitle }, "Negotiation Intelligence"),
          ...((report as unknown as Record<string, unknown>).negotiationIntelligence as { marketPosition: string; daysOnMarketAnalysis: string; suggestedOfferRange: string; concessionOpportunities: string; redFlags: string; negotiationStrength: string }[]).map((neg, idx) =>
            React.createElement(
              View,
              { key: `neg-${idx}`, style: { marginBottom: 16 } },
              React.createElement(Text, { style: s.sectionSubtitle }, properties[idx]?.address ?? `Property ${idx + 1}`),
              // Negotiation strength badge
              React.createElement(
                View,
                { style: { flexDirection: 'row', marginBottom: 8 } },
                React.createElement(
                  View,
                  { style: { backgroundColor: neg.negotiationStrength === 'strong_buyer' ? '#10B98120' : neg.negotiationStrength === 'sellers_market' ? '#EF444420' : '#F59E0B20', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 } },
                  React.createElement(Text, { style: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: neg.negotiationStrength === 'strong_buyer' ? C.emerald : neg.negotiationStrength === 'sellers_market' ? C.red : C.amber } },
                    neg.negotiationStrength === 'strong_buyer' ? 'STRONG BUYER LEVERAGE' : neg.negotiationStrength === 'sellers_market' ? "SELLER'S MARKET" : 'BALANCED MARKET')
                )
              ),
              // Grid of fields
              React.createElement(
                View,
                { style: { backgroundColor: C.slate50, borderRadius: 6, padding: 10, borderWidth: 1, borderColor: C.slate200 } },
                React.createElement(
                  View,
                  { style: s.riskItem },
                  React.createElement(Text, { style: s.riskItemLabel }, "MARKET POSITION"),
                  React.createElement(Text, { style: s.riskItemValue }, neg.marketPosition)
                ),
                React.createElement(
                  View,
                  { style: s.riskItem },
                  React.createElement(Text, { style: s.riskItemLabel }, "DAYS ON MARKET ANALYSIS"),
                  React.createElement(Text, { style: s.riskItemValue }, neg.daysOnMarketAnalysis)
                ),
                React.createElement(
                  View,
                  { style: s.riskItem },
                  React.createElement(Text, { style: s.riskItemLabel }, "SUGGESTED OFFER RANGE"),
                  React.createElement(Text, { style: s.riskItemValue }, neg.suggestedOfferRange)
                ),
                React.createElement(
                  View,
                  { style: s.riskItem },
                  React.createElement(Text, { style: s.riskItemLabel }, "CONCESSION OPPORTUNITIES"),
                  React.createElement(Text, { style: s.riskItemValue }, neg.concessionOpportunities)
                ),
                neg.redFlags
                  ? React.createElement(
                      View,
                      { style: s.riskItem },
                      React.createElement(Text, { style: { ...s.riskItemLabel, color: C.red } }, "RED FLAGS"),
                      React.createElement(Text, { style: { ...s.riskItemValue, color: C.red } }, neg.redFlags)
                    )
                  : null
              )
            )
          )
        )
      : null,

    /* ──────── NEIGHBORHOOD INTELLIGENCE (paid only) ──────── */
    !isFree && (report as unknown as Record<string, unknown>).neighborhoodIntelligence && typeof (report as unknown as Record<string, unknown>).neighborhoodIntelligence === 'string'
      ? React.createElement(
          RPage,
          { isFree },
          React.createElement(Text, { style: s.sectionTitle }, "Neighborhood Intelligence"),
          React.createElement(Text, { style: s.bodyText }, (report as unknown as Record<string, unknown>).neighborhoodIntelligence as string)
        )
      : null,

    /* ──────── SCHOOL DISTRICT CONTEXT (paid only) ──────── */
    !isFree && (report as unknown as Record<string, unknown>).schoolDistrictContext && typeof (report as unknown as Record<string, unknown>).schoolDistrictContext === 'string'
      ? React.createElement(
          RPage,
          { isFree },
          React.createElement(Text, { style: s.sectionTitle }, "School District Context"),
          React.createElement(Text, { style: s.bodyText }, (report as unknown as Record<string, unknown>).schoolDistrictContext as string)
        )
      : null,

    /* ──────── MAINTENANCE AGE ANALYSIS (paid only) ──────── */
    !isFree && (report as unknown as Record<string, unknown>).maintenanceAnalysis && Array.isArray((report as unknown as Record<string, unknown>).maintenanceAnalysis)
      ? React.createElement(
          RPage,
          { isFree },
          React.createElement(Text, { style: s.sectionTitle }, "Maintenance Age Analysis"),
          ...((report as unknown as Record<string, unknown>).maintenanceAnalysis as { system: string; typicalLifespan: string; riskLevel: "green" | "yellow" | "red"; estimatedCost: string }[][]).map((items, idx) =>
            React.createElement(
              View,
              { key: `maint-${idx}`, style: { marginBottom: 16 } },
              React.createElement(Text, { style: s.sectionSubtitle }, properties[idx]?.address ?? `Property ${idx + 1}`),
              items && items.length > 0
                ? React.createElement(
                    View,
                    null,
                    // Table header
                    React.createElement(
                      View,
                      { style: s.tableHeader },
                      React.createElement(Text, { style: { ...s.tableHeaderCell, width: '30%' } }, "System"),
                      React.createElement(Text, { style: { ...s.tableHeaderCell, width: '25%' } }, "Typical Lifespan"),
                      React.createElement(Text, { style: { ...s.tableHeaderCell, width: '15%' } }, "Risk"),
                      React.createElement(Text, { style: { ...s.tableHeaderCell, width: '30%' } }, "Est. Cost")
                    ),
                    // Table rows
                    ...items.map((item, mi) =>
                      React.createElement(
                        View,
                        { key: `maint-${idx}-${mi}`, style: mi % 2 === 0 ? s.tableRow : s.tableRowAlt },
                        React.createElement(Text, { style: { ...s.tableCell, width: '30%', fontFamily: 'Helvetica-Bold' } }, item.system),
                        React.createElement(Text, { style: { ...s.tableCell, width: '25%' } }, item.typicalLifespan),
                        React.createElement(Text, { style: { ...s.tableCell, width: '15%', color: item.riskLevel === 'green' ? C.emerald : item.riskLevel === 'yellow' ? C.amber : C.red, fontFamily: 'Helvetica-Bold' } },
                          item.riskLevel === 'green' ? 'Low' : item.riskLevel === 'yellow' ? 'Medium' : 'High'
                        ),
                        React.createElement(Text, { style: { ...s.tableCell, width: '30%' } }, item.estimatedCost)
                      )
                    )
                  )
                : React.createElement(Text, { style: { ...s.bodyText, fontStyle: 'italic', color: C.slate400 } }, "No maintenance data available.")
            )
          ),
          React.createElement(Text, { style: { ...s.disclaimerText, marginTop: 8, fontStyle: 'italic' } }, "Maintenance estimates based on industry averages for typical home systems. Actual condition may vary. Get a professional home inspection.")
        )
      : null,

    /* ──────── INVESTMENT OUTLOOK (paid only) ──────── */
    !isFree && (report as unknown as Record<string, unknown>).investmentOutlook && typeof (report as unknown as Record<string, unknown>).investmentOutlook === 'string'
      ? React.createElement(
          RPage,
          { isFree },
          React.createElement(Text, { style: s.sectionTitle }, "Investment Outlook"),
          React.createElement(Text, { style: s.bodyText }, (report as unknown as Record<string, unknown>).investmentOutlook as string)
        )
      : null,

    /* ──────── DETAILED SIDE-BY-SIDE COMPARISON (paid only) ──────── */
    !isFree && (report as unknown as Record<string, unknown>).detailedComparison && Array.isArray((report as unknown as Record<string, unknown>).detailedComparison) && ((report as unknown as Record<string, unknown>).detailedComparison as { label: string; values: string[] }[]).length > 0
      ? React.createElement(
          RPage,
          { isFree },
          React.createElement(Text, { style: s.sectionTitle }, "Detailed Side-by-Side Comparison"),
          React.createElement(
            View,
            null,
            // Table header
            React.createElement(
              View,
              { style: s.tableHeader },
              React.createElement(Text, { style: { ...s.tableHeaderCell, width: `${100 / (1 + properties.length)}%` } }, "Category"),
              ...properties.map((prop, idx) =>
                React.createElement(Text, { key: `comp-h-${idx}`, style: { ...s.tableHeaderCell, width: `${100 / (1 + properties.length)}%` } }, shortAddresses[idx] ?? `Property ${idx + 1}`)
              )
            ),
            // Table rows
            ...((report as unknown as Record<string, unknown>).detailedComparison as { label: string; values: string[] }[]).map((row, ri) =>
              React.createElement(
                View,
                { key: `comp-${ri}`, style: ri % 2 === 0 ? s.tableRow : s.tableRowAlt },
                React.createElement(Text, { style: { ...s.tableCell, width: `${100 / (1 + properties.length)}%`, fontFamily: 'Helvetica-Bold' } }, row.label),
                ...row.values.map((val, vi) =>
                  React.createElement(Text, { key: `comp-${ri}-${vi}`, style: { ...s.tableCell, width: `${100 / (1 + properties.length)}%` } }, val)
                )
              )
            )
          )
        )
      : null,

    /* ──────── HOA RISK INTELLIGENCE (paid only) ──────── */
    !isFree && (report as unknown as Record<string, unknown>).hoaRisk && Array.isArray((report as unknown as Record<string, unknown>).hoaRisk) && ((report as unknown as Record<string, unknown>).hoaRisk as (unknown | null)[]).some(h => h !== null)
      ? React.createElement(
          RPage,
          { isFree },
          React.createElement(Text, { style: s.sectionTitle }, "HOA Risk Intelligence"),
          ...((report as unknown as Record<string, unknown>).hoaRisk as ({ riskLevel: string; riskObservations: string[]; agentQuestions: string[]; monthlyFee: number } | null)[]).map((hoa, idx) =>
            React.createElement(
              View,
              { key: `hoa-${idx}`, style: { marginBottom: 16 } },
              React.createElement(Text, { style: s.sectionSubtitle }, properties[idx]?.address ?? `Property ${idx + 1}`),
              hoa
                ? React.createElement(
                    View,
                    { style: { backgroundColor: C.slate50, borderRadius: 6, padding: 10, borderWidth: 1, borderColor: C.slate200 } },
                    // Risk level badge and monthly fee
                    React.createElement(
                      View,
                      { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } },
                      React.createElement(
                        View,
                        { style: { backgroundColor: hoa.riskLevel === 'low' ? '#10B98120' : hoa.riskLevel === 'medium' ? '#F59E0B20' : '#EF444420', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 } },
                        React.createElement(Text, { style: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: hoa.riskLevel === 'low' ? C.emerald : hoa.riskLevel === 'medium' ? C.amber : C.red } },
                          `${hoa.riskLevel.toUpperCase()} RISK`)
                      ),
                      React.createElement(Text, { style: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.slate700 } }, `$${hoa.monthlyFee}/mo`)
                    ),
                    // Risk observations
                    React.createElement(Text, { style: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.slate600, marginBottom: 4, marginTop: 4 } }, "RISK OBSERVATIONS"),
                    ...hoa.riskObservations.map((obs, oi) =>
                      React.createElement(Text, { key: `hoa-obs-${idx}-${oi}`, style: { fontSize: 9, color: C.slate700, marginBottom: 2, paddingLeft: 8 } }, `\u2022 ${obs}`)
                    ),
                    // Questions to ask
                    React.createElement(Text, { style: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.slate600, marginBottom: 4, marginTop: 8 } }, "QUESTIONS TO ASK THE HOA"),
                    ...hoa.agentQuestions.map((q, qi) =>
                      React.createElement(Text, { key: `hoa-q-${idx}-${qi}`, style: { fontSize: 9, color: C.slate700, marginBottom: 2, paddingLeft: 8 } }, `${qi + 1}. ${q}`)
                    )
                  )
                : React.createElement(Text, { style: { ...s.bodyText, fontStyle: 'italic', color: C.slate400 } }, "No HOA or HOA data not available.")
            )
          )
        )
      : null,

    /* ──────── COMPARABLE PROPERTIES (paid only) ──────── */
    !isFree && (report as unknown as Record<string, unknown>).comparableContext && typeof (report as unknown as Record<string, unknown>).comparableContext === 'string'
      ? React.createElement(
          RPage,
          { isFree },
          React.createElement(Text, { style: s.sectionTitle }, "Comparable Properties"),
          React.createElement(Text, { style: s.bodyText }, (report as unknown as Record<string, unknown>).comparableContext as string)
        )
      : null,

    /* ──────── DATA SOURCES & DISCLAIMER ──────── */
    React.createElement(
      RPage,
      { isFree },
      React.createElement(
        Text,
        { style: s.sectionTitle },
        "Data Sources & Disclaimer"
      ),
      React.createElement(
        View,
        { style: s.disclaimerBox },
        React.createElement(
          Text,
          { style: { ...s.disclaimerText, fontFamily: "Helvetica-Bold", marginBottom: 4 } },
          "Data Sources"
        ),
        React.createElement(
          Text,
          { style: s.disclaimerText },
          "This report utilizes data from public MLS listings, FEMA flood maps, EPA Superfund and air quality databases, USGS earthquake records, wildfire risk assessments, EPA radon zone maps, and other publicly available government and environmental data sources."
        ),
        React.createElement(
          Text,
          {
            style: {
              ...s.disclaimerText,
              fontFamily: "Helvetica-Bold",
              marginTop: 8,
              marginBottom: 4,
            },
          },
          "Disclaimer"
        ),
        React.createElement(
          Text,
          { style: s.disclaimerText },
          "IMPORTANT DISCLAIMER\n\nThis report is generated by rivvl.ai for informational and educational purposes only. It does not constitute real estate advice, financial advice, legal advice, or a professional property appraisal.\n\nrivvl.ai is a technology platform that aggregates and analyzes publicly available data. We are not licensed real estate agents, brokers, appraisers, attorneys, or financial advisors. Nothing in this report should be interpreted as a recommendation to buy, sell, or avoid any specific property.\n\nProperty scores and ratings are generated by automated analysis and reflect our interpretation of available data. They may not account for all factors relevant to your specific situation. Data accuracy depends on third-party sources including public records, government databases, and listing platforms, which may contain errors or outdated information.\n\nRisk data (flood zones, earthquake history, environmental hazards, wildfire risk) is sourced from federal government databases and is provided for informational purposes only. This data may not reflect the most recent changes and should not replace a professional environmental assessment, property inspection, or certified flood determination.\n\nAlways conduct independent due diligence. Hire a licensed property inspector, consult a licensed real estate attorney, and work with a qualified real estate professional before making any purchasing decision. rivvl.ai assumes no liability for decisions made based on information in this report.\n\nBy downloading or using this report, you acknowledge that you have read and understood this disclaimer."
        )
      ),
      React.createElement(
        View,
        { style: { marginTop: 20, alignItems: "center" } },
        React.createElement(Image, {
          src: logoDataUri,
          style: { width: 80, height: 80 * LOGO_RATIO, marginBottom: 8 },
        }),
        React.createElement(
          Text,
          {
            style: {
              fontSize: 10,
              color: C.indigo,
              fontFamily: "Helvetica-Bold",
            },
          },
          "rivvl.ai"
        ),
        React.createElement(
          Text,
          { style: { fontSize: 8, color: C.slate400, marginTop: 4 } },
          "Smart real estate comparisons, intelligently powered."
        )
      )
    )
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                          ROUTE HANDLER                                 */
/* ═══════════════════════════════════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to download PDFs.", code: "AUTH_REQUIRED" },
        { status: 401 },
      );
    }

    // Rate limit: max 20 PDF generations per hour per user
    const rlResponse = rateLimitResponse(
      { name: "generate-home-pdf", maxRequests: 20 },
      req,
      user.id,
    );
    if (rlResponse) return rlResponse;

    const body = await req.json();
    const { reportId } = body as { reportId?: string };

    if (!reportId) {
      return NextResponse.json(
        { error: "Missing reportId" },
        { status: 400 },
      );
    }

    // Fetch report from home_reports table (RLS enforces ownership)
    const { data: reportRow } = await supabase
      .from("home_reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (!reportRow?.report_data) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 },
      );
    }

    const rd = reportRow.report_data as Record<string, unknown>;
    // Use plan_tier_at_generation (updated on upgrade) rather than report_data.plan (frozen at creation)
    const effectivePlan = reportRow.plan_tier_at_generation || (rd.plan as string) || "free";
    const reportData: HomeReportData = {
      report: rd.report as HomeReport,
      listings: rd.listings as HomeListing[],
      plan: effectivePlan,
      paidData: rd.paidData as HomeReportData['paidData'],
    };

    if (!reportData.report || !reportData.listings) {
      return NextResponse.json(
        { error: "Invalid report data" },
        { status: 400 },
      );
    }

    // Generate PDF buffer
    const element = React.createElement(
      HomeComparisonPDF,
      { data: reportData }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfElement = element as any;
    const pdfBuffer = await renderToBuffer(pdfElement);

    // Build filename: rivvl-home-comparison-YYYY-MM-DD.pdf
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const filename = `rivvl-home-comparison-${yyyy}-${mm}-${dd}.pdf`;

    // Return PDF as downloadable file
    const uint8 = new Uint8Array(pdfBuffer);
    return new NextResponse(uint8, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(uint8.length),
      },
    });
  } catch (err) {
    console.error("Home PDF generation error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to generate PDF",
      },
      { status: 500 },
    );
  }
}
