import React from "react";
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
import type { StoredReport, AIAnalysisReport } from "@/types";
import { VEHICLE_COLORS, isValidNumeric } from "@/lib/vehicle-colors";

/* ═══════════════════════════════════════════════════════════════════════ */
/*                        LOGO (base64-embedded)                          */
/* ═══════════════════════════════════════════════════════════════════════ */

const logoPath = path.join(process.cwd(), "public/images/rivvl-logo-black.png");
const logoBase64 = fs.readFileSync(logoPath).toString("base64");
const logoDataUri = `data:image/png;base64,${logoBase64}`;
const LOGO_RATIO = 458 / 1415; // height / width from source image

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
  // Header (top of every page)
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
  // Footer
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
  // Cover page
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
  coverBrandBox: {
    backgroundColor: C.indigo,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginBottom: 36,
  },
  coverBrandText: {
    fontSize: 32,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    letterSpacing: 1,
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
  // Watermark for free reports
  watermark: {
    position: "absolute",
    top: "45%",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 70,
    fontFamily: "Helvetica-Bold",
    color: "#E2E8F0",
    opacity: 0.30,
    transform: "rotate(-45deg)",
  },
  // Section headings
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: C.indigo,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: C.indigo,
  },
  sectionSummary: {
    fontSize: 10,
    color: C.slate600,
    lineHeight: 1.6,
    marginBottom: 12,
  },
  // Tables
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.indigoLight,
    borderBottomWidth: 1,
    borderBottomColor: C.indigo,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.slate200,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.slate200,
    paddingVertical: 5,
    paddingHorizontal: 6,
    backgroundColor: C.slate50,
  },
  thText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.indigo,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tdText: {
    fontSize: 9,
    color: C.slate700,
  },
  tdBold: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.slate900,
  },
  tdWinner: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.emerald,
  },
  // Score display
  scoreBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  scoreBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  scoreNumber: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },
  scoreLabel: {
    fontSize: 10,
    color: C.slate600,
  },
  // Cards for side-by-side comparison
  cardsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.slate200,
    borderRadius: 8,
    padding: 10,
  },
  cardTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.slate900,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: C.indigo,
  },
  cardSub: {
    fontSize: 8,
    color: C.slate500,
    marginTop: 2,
  },
  // Bullets
  bulletRow: {
    flexDirection: "row",
    marginBottom: 3,
    paddingLeft: 4,
  },
  bulletDot: {
    fontSize: 9,
    color: C.indigo,
    marginRight: 6,
    marginTop: 1,
  },
  bulletText: {
    fontSize: 9,
    color: C.slate600,
    flex: 1,
    lineHeight: 1.5,
  },
  // Stars representation
  starsText: {
    fontSize: 10,
    color: C.amber,
    fontFamily: "Helvetica-Bold",
  },
  // Verdict
  verdictWinner: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: C.emerald,
    textAlign: "center",
    marginBottom: 6,
  },
  verdictLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.slate400,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 4,
  },
  // Upgrade page
  upgradeBox: {
    borderWidth: 2,
    borderColor: C.indigo,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 30,
    alignItems: "center",
    marginTop: 20,
  },
  upgradeTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: C.indigo,
    marginBottom: 8,
    textAlign: "center",
  },
  upgradeText: {
    fontSize: 11,
    color: C.slate600,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 1.6,
  },
  upgradeCta: {
    backgroundColor: C.indigo,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  upgradeCtaText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },
  // Vehicle History Tip
  tipCard: {
    borderLeftWidth: 4,
    borderLeftColor: C.indigo,
    backgroundColor: "#EFF6FF", // blue-50
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
  },
  tipTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: C.slate900,
    marginBottom: 10,
  },
  tipIcon: {
    fontSize: 12,
    color: C.indigo,
    marginRight: 6,
  },
  tipText: {
    fontSize: 9,
    color: C.slate700,
    lineHeight: 1.6,
    marginBottom: 8,
  },
  tipBulletLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.slate700,
    marginBottom: 6,
  },
  // Disclaimer
  disclaimerCard: {
    borderWidth: 1,
    borderColor: C.slate200,
    backgroundColor: C.slate50,
    borderRadius: 8,
    padding: 20,
  },
  disclaimerTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: C.slate500,
    marginBottom: 10,
  },
  disclaimerText: {
    fontSize: 8,
    color: C.slate500,
    lineHeight: 1.7,
    marginBottom: 6,
  },
});

/* ═══════════════════════════════════════════════════════════════════════ */
/*                        HELPER COMPONENTS                               */
/* ═══════════════════════════════════════════════════════════════════════ */

function Header({ title }: { title: string }) {
  return (
    <View style={s.header} fixed>
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image src={logoDataUri} style={{ width: 80, height: 80 * LOGO_RATIO }} />
      <Text style={s.headerPage}>{title}</Text>
    </View>
  );
}

function Footer({ date }: { date: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>Generated by rivvl.ai</Text>
      <Text style={s.footerText}>{date}</Text>
    </View>
  );
}

function FreeWatermark() {
  return (
    <Text style={s.watermark} fixed>
      FREE REPORT | www.rivvl.ai
    </Text>
  );
}

function SectionHeading({ title }: { title: string }) {
  return <Text style={s.sectionTitle}>{title}</Text>;
}

function ScoreBadge({
  score,
  max = 10,
  label,
}: {
  score?: number;
  max?: number;
  label: string;
}) {
  const displayScore = score != null && score >= 0 ? score : null;
  const pct = displayScore != null ? displayScore / max : 0;
  const bg = displayScore == null ? "#94A3B8" : pct >= 0.8 ? C.emerald : pct >= 0.6 ? C.amber : C.red;
  return (
    <View style={s.scoreBox}>
      <View style={[s.scoreBadge, { backgroundColor: bg }]}>
        <Text style={s.scoreNumber}>
          {displayScore != null ? `${displayScore}/${max}` : "\u2014"}
        </Text>
      </View>
      <Text style={s.scoreLabel}>{label}</Text>
    </View>
  );
}

function Stars({ rating }: { rating: number | null | undefined }) {
  if (rating == null || rating === 0) {
    return (
      <Text style={{ fontSize: 9, color: C.slate400 }}>Not Rated</Text>
    );
  }
  const full = Math.round(rating);
  return (
    <Text style={s.starsText}>
      {"★".repeat(full)}
      {"☆".repeat(5 - full)} ({rating}/5)
    </Text>
  );
}

function toTitleCase(str: string): string {
  return str
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDollars(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

/** Horizontal bar chart for PDF — renders bars as colored View rectangles */
const CAR_PDF_BAR_COLORS = VEHICLE_COLORS as unknown as string[];

function PdfBarChart({
  items,
  maxValue,
}: {
  items: { label: string; values: { value: number; color: string }[] }[];
  maxValue: number;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      {items.map((item, i) => (
        <View key={i} style={{ marginBottom: 6 }}>
          <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: C.slate700, marginBottom: 3 }}>
            {item.label}
          </Text>
          {item.values.map((v, vi) => {
            const pct = maxValue > 0 ? Math.max((v.value / maxValue) * 100, 2) : 2;
            return (
              <View key={vi} style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
                <View
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    height: 10,
                    backgroundColor: v.color,
                    borderRadius: 3,
                  }}
                />
                <Text style={{ fontSize: 7, color: C.slate600, marginLeft: 4 }}>
                  {fmtDollars(v.value)}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/** Legend row for PDF bar charts */
function PdfBarLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <View style={{ flexDirection: "row", gap: 14, marginBottom: 8 }}>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ width: 8, height: 8, backgroundColor: item.color, borderRadius: 2 }} />
          <Text style={{ fontSize: 7, color: C.slate600 }}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                        COVER PAGE                                      */
/* ═══════════════════════════════════════════════════════════════════════ */

function CoverPage({
  report,
  car1Name,
  car2Name,
  dateStr,
  coverTitle,
  coverSubtitle,
  numCars,
  carNames,
  isFree,
}: {
  report: StoredReport;
  car1Name: string;
  car2Name: string;
  dateStr: string;
  coverTitle?: string;
  coverSubtitle?: string;
  numCars?: number;
  carNames?: string[];
  isFree?: boolean;
}) {
  const planLabels: Record<string, string> = {
    free: "Free Report",
    single: "Full Report",
    pro: "Pro Report",
  };
  const planLabel =
    planLabels[report.analysis.reportType] || "Comparison Report";
  const nc = numCars || 2;
  const title = coverTitle || `${car1Name} vs ${car2Name}`;

  return (
    <Page size="A4" style={s.coverPage}>
      {isFree && <FreeWatermark />}
      <View style={s.coverInner}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={logoDataUri} style={{ width: 200, height: 200 * LOGO_RATIO, marginBottom: 36 }} />
        <Text style={s.coverTitle}>
          {nc > 2 ? title : "Car Comparison Report"}
        </Text>
        {nc <= 2 ? (
          <Text style={s.coverSubtitle}>{title}</Text>
        ) : carNames ? (
          <View style={{ alignItems: "center", marginBottom: 28 }}>
            {carNames.map((name, i) => (
              <Text key={i} style={{ fontSize: 11, color: C.slate600, marginBottom: 2, textAlign: "center" }}>
                {name}{i < carNames.length - 1 ? " vs" : ""}
              </Text>
            ))}
          </View>
        ) : coverSubtitle ? (
          <Text style={[s.coverSubtitle, { fontSize: 10 }]}>{coverSubtitle}</Text>
        ) : null}
        <View style={s.coverDivider} />
        <Text style={s.coverMeta}>Generated on {dateStr}</Text>
        <Text style={s.coverMeta}>Report ID: {report.id}</Text>
        <View style={s.coverBadge}>
          <Text style={s.coverBadgeText}>{planLabel}</Text>
        </View>
      </View>
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                 1. EXECUTIVE SUMMARY PAGE                              */
/* ═══════════════════════════════════════════════════════════════════════ */

function ExecutiveSummaryPage({
  a,
  car1Name,
  car2Name,
  dateStr,
  isFree,
  carNames,
}: {
  a: AIAnalysisReport;
  car1Name: string;
  car2Name: string;
  dateStr: string;
  isFree: boolean;
  carNames?: string[];
}) {
  const allNames = carNames || [car1Name, car2Name];

  return (
    <Page size="A4" style={s.page}>
      <Header title="Executive Summary" />
      <Footer date={dateStr} />
      {isFree && <FreeWatermark />}

      <SectionHeading title="Our Pick / Executive Summary" />

      {/* Winner */}
      <View
        style={{
          backgroundColor: C.indigoLight,
          borderRadius: 8,
          padding: 14,
          marginBottom: 14,
          alignItems: "center",
        }}
      >
        <Text style={s.verdictLabel}>Our Pick</Text>
        <Text style={s.verdictWinner}>{a.finalVerdict.winner}</Text>
        <Text
          style={{ fontSize: 10, color: C.slate600, textAlign: "center" }}
        >
          {a.executiveSummary.quickVerdict}
        </Text>
      </View>

      {/* Score cards for ALL cars — equal height, score anchored bottom */}
      <View style={[s.cardsRow, { flexWrap: "wrap" }]}>
        {a.finalVerdict.scores.map((sc, i) => {
          const color = CAR_PDF_BAR_COLORS[i] || CAR_PDF_BAR_COLORS[0];
          const isWinner = sc.name === a.finalVerdict.winner;
          return (
            <View key={i} style={[s.card, { borderColor: isWinner ? C.emerald : color, justifyContent: "space-between" }]}>
              <View>
                <Text style={[s.cardTitle, { color: isWinner ? C.emerald : color }]}>{sc.name || allNames[i] || `Car ${i + 1}`}</Text>
                {isWinner && (
                  <View style={{ marginTop: 4, marginBottom: 4, backgroundColor: "#ECFDF5", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start" }}>
                    <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: C.emerald, textTransform: "uppercase", letterSpacing: 1 }}>Winner</Text>
                  </View>
                )}
              </View>
              <ScoreBadge
                score={sc.overall}
                max={10}
                label="Overall Score"
              />
            </View>
          );
        })}
      </View>

      {/* Confidence */}
      {!isFree && a.executiveSummary.confidenceScore != null && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 9, color: C.slate500, marginRight: 8 }}>
            AI Confidence:
          </Text>
          <View
            style={{
              flex: 1,
              height: 6,
              backgroundColor: C.slate200,
              borderRadius: 3,
            }}
          >
            <View
              style={{
                height: 6,
                width: `${a.executiveSummary.confidenceScore}%`,
                backgroundColor: C.indigo,
                borderRadius: 3,
              }}
            />
          </View>
          <Text
            style={{
              fontSize: 9,
              fontFamily: "Helvetica-Bold",
              color: C.indigo,
              marginLeft: 8,
            }}
          >
            {a.executiveSummary.confidenceScore}%
          </Text>
        </View>
      )}

      {/* Overview text */}
      <Text style={s.sectionSummary}>{a.executiveSummary.overview}</Text>
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                 2. VEHICLE SPECS PAGE                                   */
/* ═══════════════════════════════════════════════════════════════════════ */

function SpecsPage({
  a,
  shortCar1,
  shortCar2,
  dateStr,
  isFree,
  shortCarNames,
  numCars,
}: {
  a: AIAnalysisReport;
  shortCar1: string;
  shortCar2: string;
  dateStr: string;
  isFree: boolean;
  shortCarNames?: string[];
  numCars?: number;
}) {
  const nc = numCars || 2;
  const names = shortCarNames || [shortCar1, shortCar2];
  const specWidth = nc > 2 ? "25%" : "34%";
  const carColWidth = nc > 2 ? `${75 / nc}%` : "33%";

  // Helper to get values from row (support both legacy and new format)
  const getValues = (row: (typeof a.vehicleSpecs.comparisonTable)[0]): string[] => {
    if (row.values && row.values.length > 0) return row.values;
    const vals: string[] = [];
    if (row.car1Value != null) vals.push(row.car1Value);
    if (row.car2Value != null) vals.push(row.car2Value);
    return vals;
  };

  return (
    <Page size="A4" style={s.page}>
      <Header title="Vehicle Specifications" />
      <Footer date={dateStr} />
      {isFree && <FreeWatermark />}

      <SectionHeading title="Vehicle Specifications" />

      {/* Table */}
      <View style={s.tableHeader}>
        <Text style={[s.thText, { width: specWidth }]}>Specification</Text>
        {names.map((name, i) => (
          <Text key={i} style={[s.thText, { width: carColWidth }]}>{name}</Text>
        ))}
      </View>
      {a.vehicleSpecs.comparisonTable.map((row, i) => {
        const values = getValues(row);
        return (
          <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
            <Text style={[s.tdBold, { width: specWidth }]}>{row.category}</Text>
            {names.map((_, ci) => (
              <Text
                key={ci}
                style={[
                  row.advantage === `car${ci + 1}` ? s.tdWinner : s.tdText,
                  { width: carColWidth },
                ]}
              >
                {values[ci] || "-"}
              </Text>
            ))}
          </View>
        );
      })}
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                 3. PRICE ANALYSIS PAGE                                  */
/* ═══════════════════════════════════════════════════════════════════════ */

function PricePage({
  data,
  dateStr,
}: {
  data: NonNullable<AIAnalysisReport["priceAnalysis"]>;
  dateStr: string;
}) {
  return (
    <Page size="A4" style={s.page}>
      <Header title="Price & Market Analysis" />
      <Footer date={dateStr} />

      <SectionHeading title="Price & Market Analysis" />

      {/* Price cards */}
      <View style={s.cardsRow}>
        {data.cars.map((car, i) => {
          const borderColor = CAR_PDF_BAR_COLORS[i] || CAR_PDF_BAR_COLORS[0];
          const hasListed = isValidNumeric(car.listedPrice);
          return (
            <View key={i} style={[s.card, { borderColor }]}>
              <Text style={s.cardTitle}>{car.name}</Text>
              <Text style={s.cardValue}>{hasListed ? fmtDollars(car.listedPrice) : "Price not listed"}</Text>
              <Text style={s.cardSub}>
                Market Value: {isValidNumeric(car.estimatedMarketValue) ? fmtDollars(car.estimatedMarketValue) : "N/A"}
              </Text>
              <View
                style={{
                  marginTop: 6,
                  backgroundColor:
                    car.priceVerdict.includes("Good") ||
                    car.priceVerdict.includes("Great")
                      ? "#ECFDF5"
                      : car.priceVerdict === "Overpriced"
                        ? "#FEF2F2"
                        : "#FFFBEB",
                  borderRadius: 4,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  alignSelf: "flex-start",
                }}
              >
                <Text
                  style={{
                    fontSize: 8,
                    fontFamily: "Helvetica-Bold",
                    color:
                      car.priceVerdict.includes("Good") ||
                      car.priceVerdict.includes("Great")
                        ? C.emerald
                        : car.priceVerdict === "Overpriced"
                          ? C.red
                          : C.amber,
                  }}
                >
                  {car.priceVerdict}
                </Text>
              </View>
              <Text style={{ fontSize: 8, color: C.slate500, marginTop: 4 }}>
                Negotiation room: {car.negotiationRoom}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Price comparison bar chart */}
      {(() => {
        const hasAnyListed = data.cars.some((c) => isValidNumeric(c.listedPrice));
        const allPrices = data.cars.flatMap((c) => [
          ...(isValidNumeric(c.listedPrice) ? [c.listedPrice] : []),
          ...(isValidNumeric(c.estimatedMarketValue) ? [c.estimatedMarketValue] : []),
        ]);
        const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 1;
        return (
          <>
            <PdfBarLegend
              items={[
                ...(hasAnyListed ? [{ label: "Listed Price", color: CAR_PDF_BAR_COLORS[0] }] : []),
                { label: "Market Value", color: C.emerald },
              ]}
            />
            <PdfBarChart
              items={data.cars.map((car) => ({
                label: car.name.split(" ").slice(1).join(" "),
                values: [
                  ...(isValidNumeric(car.listedPrice) ? [{ value: car.listedPrice, color: CAR_PDF_BAR_COLORS[0] }] : []),
                  ...(isValidNumeric(car.estimatedMarketValue) ? [{ value: car.estimatedMarketValue, color: C.emerald }] : []),
                ],
              }))}
              maxValue={maxPrice}
            />
          </>
        );
      })()}

      {/* Price comparison table */}
      <View style={s.tableHeader}>
        <Text style={[s.thText, { width: "34%" }]}>Metric</Text>
        {data.cars.map((car, i) => (
          <Text key={i} style={[s.thText, { width: `${66 / data.cars.length}%` }]}>
            {car.name.split(" ").slice(1).join(" ")}
          </Text>
        ))}
      </View>
      {["Listed Price", "Market Value", "Price vs Market"].map((label, ri) => (
        <View key={ri} style={ri % 2 === 0 ? s.tableRow : s.tableRowAlt}>
          <Text style={[s.tdBold, { width: "34%" }]}>{label}</Text>
          {data.cars.map((car, ci) => (
            <Text key={ci} style={[s.tdText, { width: `${66 / data.cars.length}%` }]}>
              {ri === 0
                ? (isValidNumeric(car.listedPrice) ? fmtDollars(car.listedPrice) : "Not listed")
                : ri === 1
                  ? (isValidNumeric(car.estimatedMarketValue) ? fmtDollars(car.estimatedMarketValue) : "N/A")
                  : car.priceVsMarket}
            </Text>
          ))}
        </View>
      ))}

      <Text style={[s.sectionSummary, { marginTop: 12 }]}>{data.summary}</Text>
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                 4. COST OF OWNERSHIP PAGE                               */
/* ═══════════════════════════════════════════════════════════════════════ */

function CostPage({
  data,
  dateStr,
}: {
  data: NonNullable<AIAnalysisReport["costOfOwnership"]>;
  dateStr: string;
}) {
  const categories = [
    "depreciation",
    "fuel",
    "insurance",
    "maintenance",
    "repairs",
  ] as const;
  const labels: Record<string, string> = {
    depreciation: "Depreciation",
    fuel: "Fuel",
    insurance: "Insurance",
    maintenance: "Maintenance",
    repairs: "Repairs",
  };

  return (
    <Page size="A4" style={s.page}>
      <Header title="Cost of Ownership" />
      <Footer date={dateStr} />

      <SectionHeading title="Cost of Ownership" />

      {/* 5-Year total cost bar chart */}
      {(() => {
        const maxTotal = Math.max(...data.fiveYear.cars.map((c) => c.total));
        return (
          <>
            <PdfBarLegend
              items={data.fiveYear.cars.map((c, i) => ({
                label: c.name,
                color: CAR_PDF_BAR_COLORS[i] || C.indigo,
              }))}
            />
            <View style={{ marginBottom: 10 }}>
              {data.fiveYear.cars.map((car, i) => {
                const pct = maxTotal > 0 ? Math.max((car.total / maxTotal) * 100, 2) : 2;
                return (
                  <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                    <Text style={{ fontSize: 8, color: C.slate700, width: "25%", fontFamily: "Helvetica-Bold" }}>
                      {car.name}
                    </Text>
                    <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                      <View
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          height: 12,
                          backgroundColor: CAR_PDF_BAR_COLORS[i] || C.indigo,
                          borderRadius: 3,
                        }}
                      />
                      <Text style={{ fontSize: 8, color: C.slate600, marginLeft: 4, fontFamily: "Helvetica-Bold" }}>
                        {fmtDollars(car.total)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        );
      })()}

      {/* 5-Year breakdown table */}
      <Text
        style={{
          fontSize: 11,
          fontFamily: "Helvetica-Bold",
          color: C.slate900,
          marginBottom: 6,
        }}
      >
        5-Year Cost Breakdown
      </Text>
      <View style={s.tableHeader}>
        <Text style={[s.thText, { width: "30%" }]}>Category</Text>
        {data.fiveYear.cars.map((c, i) => (
          <Text key={i} style={[s.thText, { width: `${70 / data.fiveYear.cars.length}%` }]}>
            {c.name}
          </Text>
        ))}
      </View>
      {categories.map((cat, ri) => (
        <View key={cat} style={ri % 2 === 0 ? s.tableRow : s.tableRowAlt}>
          <Text style={[s.tdBold, { width: "30%" }]}>{labels[cat]}</Text>
          {data.fiveYear.cars.map((c, ci) => (
            <Text key={ci} style={[s.tdText, { width: `${70 / data.fiveYear.cars.length}%` }]}>
              {fmtDollars(c[cat])}
            </Text>
          ))}
        </View>
      ))}
      {/* Total row */}
      <View
        style={[
          s.tableRow,
          { backgroundColor: C.indigoLight, borderBottomWidth: 2, borderBottomColor: C.indigo },
        ]}
      >
        <Text style={[s.tdBold, { width: "30%", color: C.indigo }]}>
          TOTAL
        </Text>
        {data.fiveYear.cars.map((c, ci) => (
          <Text
            key={ci}
            style={{
              width: `${70 / data.fiveYear.cars.length}%`,
              fontSize: 10,
              fontFamily: "Helvetica-Bold",
              color: C.indigo,
            }}
          >
            {fmtDollars(c.total)}
          </Text>
        ))}
      </View>

      <Text style={[s.sectionSummary, { marginTop: 12 }]}>{data.summary}</Text>
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                 5. DEPRECIATION PAGE                                    */
/* ═══════════════════════════════════════════════════════════════════════ */

function DepreciationPage({
  data,
  dateStr,
}: {
  data: NonNullable<AIAnalysisReport["depreciation"]>;
  dateStr: string;
}) {
  return (
    <Page size="A4" style={s.page}>
      <Header title="Depreciation Forecast" />
      <Footer date={dateStr} />

      <SectionHeading title="Depreciation Forecast" />

      {/* Depreciation bar chart — current vs year 5 */}
      {(() => {
        const maxVal = Math.max(...data.cars.map((c) => c.currentValue));
        return (
          <>
            <PdfBarLegend
              items={[
                { label: "Current Value", color: C.indigo },
                { label: "Year 5 Value", color: C.amber },
              ]}
            />
            <PdfBarChart
              items={data.cars.map((car) => ({
                label: car.name,
                values: [
                  { value: car.currentValue, color: C.indigo },
                  { value: car.year5Value, color: C.amber },
                ],
              }))}
              maxValue={maxVal}
            />
          </>
        );
      })()}

      {/* Value over time table */}
      <View style={s.tableHeader}>
        <Text style={[s.thText, { width: "25%" }]}>Timeframe</Text>
        {data.cars.map((c, i) => (
          <Text key={i} style={[s.thText, { width: `${75 / data.cars.length}%` }]}>
            {c.name}
          </Text>
        ))}
      </View>
      {[
        { label: "Current Value", key: "currentValue" as const },
        { label: "Year 1", key: "year1Value" as const },
        { label: "Year 3", key: "year3Value" as const },
        { label: "Year 5", key: "year5Value" as const },
      ].map((row, ri) => (
        <View key={ri} style={ri % 2 === 0 ? s.tableRow : s.tableRowAlt}>
          <Text style={[s.tdBold, { width: "25%" }]}>{row.label}</Text>
          {data.cars.map((c, ci) => (
            <Text key={ci} style={[s.tdText, { width: `${75 / data.cars.length}%` }]}>
              {fmtDollars(c[row.key])}
            </Text>
          ))}
        </View>
      ))}

      {/* Retention rates */}
      <View style={[s.cardsRow, { marginTop: 12 }]}>
        {data.cars.map((c, i) => (
          <View
            key={i}
            style={[
              s.card,
              { borderColor: CAR_PDF_BAR_COLORS[i] || CAR_PDF_BAR_COLORS[0], alignItems: "center" },
            ]}
          >
            <Text style={s.cardTitle}>{c.name}</Text>
            <Text
              style={{
                fontSize: 16,
                fontFamily: "Helvetica-Bold",
                color: CAR_PDF_BAR_COLORS[i] || CAR_PDF_BAR_COLORS[0],
              }}
            >
              {c.retentionRate5Year}
            </Text>
            <Text style={s.cardSub}>5-Year Value Retention</Text>
          </View>
        ))}
      </View>

      <Text style={[s.sectionSummary, { marginTop: 8 }]}>{data.summary}</Text>
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                 6. SAFETY PAGE                                          */
/* ═══════════════════════════════════════════════════════════════════════ */

function SafetyPage({
  data,
  dateStr,
  isFree,
}: {
  data: AIAnalysisReport["safety"];
  dateStr: string;
  isFree: boolean;
}) {
  return (
    <Page size="A4" style={s.page}>
      <Header title="Safety Analysis" />
      <Footer date={dateStr} />
      {isFree && <FreeWatermark />}

      <SectionHeading title="Safety Analysis" />

      {/* Safety cards */}
      <View style={s.cardsRow}>
        {data.cars.map((car, i) => (
          <View
            key={i}
            style={[
              s.card,
              {
                borderColor: CAR_PDF_BAR_COLORS[i] || CAR_PDF_BAR_COLORS[0],
                backgroundColor: i === 0 ? C.indigoLight : C.violetLight,
              },
            ]}
          >
            <Text style={s.cardTitle}>{car.name}</Text>
            <View style={{ marginTop: 4, marginBottom: 6 }}>
              <Stars rating={car.overallRating} />
              <Text style={{ fontSize: 8, color: C.slate500, marginTop: 2 }}>
                Overall NHTSA Rating
              </Text>
            </View>

            {/* Category ratings */}
            <View style={s.tableHeader}>
              <Text style={[s.thText, { width: "50%" }]}>Test</Text>
              <Text style={[s.thText, { width: "50%" }]}>Rating</Text>
            </View>
            {[
              { label: "Frontal Crash", val: car.frontalCrash },
              { label: "Side Crash", val: car.sideCrash },
              { label: "Rollover", val: car.rollover },
            ].map((row, ri) => (
              <View
                key={ri}
                style={ri % 2 === 0 ? s.tableRow : s.tableRowAlt}
              >
                <Text style={[s.tdText, { width: "50%" }]}>{row.label}</Text>
                <Text style={row.val ? [s.tdText, { width: "50%" }] : [s.tdText, { width: "50%", color: C.slate400 }]}>
                  {row.val
                    ? `${"★".repeat(row.val)}${"☆".repeat(5 - row.val)} (${row.val}/5)`
                    : "Not Rated"}
                </Text>
              </View>
            ))}

            {/* Recalls */}
            <View
              style={{
                marginTop: 6,
                backgroundColor:
                  car.recallCount === 0
                    ? "#ECFDF5"
                    : car.recallCount <= 3
                      ? "#FFFBEB"
                      : "#FEF2F2",
                borderRadius: 4,
                paddingHorizontal: 8,
                paddingVertical: 3,
                alignSelf: "flex-start",
              }}
            >
              <Text
                style={{
                  fontSize: 8,
                  fontFamily: "Helvetica-Bold",
                  color:
                    car.recallCount === 0
                      ? C.emerald
                      : car.recallCount <= 3
                        ? C.amber
                        : C.red,
                }}
              >
                {car.recallCount} Recalls
              </Text>
            </View>

            {/* Recall details */}
            {!isFree && car.majorRecalls.length > 0 && (
              <View style={{ marginTop: 6 }}>
                {car.majorRecalls.map((r, ri) => (
                  <View key={ri} style={s.bulletRow}>
                    <Text style={s.bulletDot}>!</Text>
                    <Text style={s.bulletText}>{r}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Safety features */}
            {!isFree && car.safetyFeatures.length > 0 && (
              <View style={{ marginTop: 6 }}>
                <Text
                  style={{
                    fontSize: 8,
                    fontFamily: "Helvetica-Bold",
                    color: C.slate500,
                    marginBottom: 3,
                  }}
                >
                  SAFETY FEATURES
                </Text>
                {car.safetyFeatures.map((f, fi) => (
                  <View key={fi} style={s.bulletRow}>
                    <Text style={[s.bulletDot, { color: C.emerald }]}>+</Text>
                    <Text style={s.bulletText}>{f}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>

      {!isFree && data.summary && (
        <Text style={s.sectionSummary}>{data.summary}</Text>
      )}
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                 7. FUEL ECONOMY PAGE                                    */
/* ═══════════════════════════════════════════════════════════════════════ */

function FuelPage({
  data,
  dateStr,
  isFree,
}: {
  data: NonNullable<AIAnalysisReport["fuelEconomy"]>;
  dateStr: string;
  isFree: boolean;
}) {
  return (
    <Page size="A4" style={s.page}>
      <Header title="Fuel Economy" />
      <Footer date={dateStr} />
      {isFree && <FreeWatermark />}

      <SectionHeading title="Fuel Economy" />

      {/* Combined MPG bar chart */}
      {(() => {
        const maxMPG = Math.max(...data.cars.map((c) => c.combinedMPG >= 0 ? c.combinedMPG : 0));
        return (
          <>
            <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: C.slate900, marginBottom: 4 }}>
              Combined MPG Comparison
            </Text>
            <View style={{ marginBottom: 10 }}>
              {data.cars.map((car, i) => {
                const mpgVal = car.combinedMPG >= 0 ? car.combinedMPG : 0;
                const pct = maxMPG > 0 ? Math.max((mpgVal / maxMPG) * 100, 5) : 5;
                return (
                  <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                    <Text style={{ fontSize: 8, color: C.slate700, width: "25%", fontFamily: "Helvetica-Bold" }}>
                      {car.name}
                    </Text>
                    <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                      <View
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          height: 12,
                          backgroundColor: CAR_PDF_BAR_COLORS[i] || C.indigo,
                          borderRadius: 3,
                        }}
                      />
                      <Text style={{ fontSize: 8, color: C.slate600, marginLeft: 4, fontFamily: "Helvetica-Bold" }}>
                        {car.combinedMPG >= 0 ? `${car.combinedMPG} MPG` : "Data unavailable"}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        );
      })()}

      {/* MPG comparison table */}
      <View style={s.tableHeader}>
        <Text style={[s.thText, { width: "25%" }]}>Metric</Text>
        {data.cars.map((c, i) => (
          <Text key={i} style={[s.thText, { width: `${75 / data.cars.length}%` }]}>
            {c.name}
          </Text>
        ))}
      </View>
      {[
        {
          label: "City MPG",
          vals: data.cars.map((c) => c.cityMPG >= 0 ? `${c.cityMPG} MPG` : "Data unavailable"),
        },
        {
          label: "Highway MPG",
          vals: data.cars.map((c) => c.highwayMPG >= 0 ? `${c.highwayMPG} MPG` : "Data unavailable"),
        },
        {
          label: "Combined MPG",
          vals: data.cars.map((c) => c.combinedMPG >= 0 ? `${c.combinedMPG} MPG` : "Data unavailable"),
        },
        ...(!isFree
          ? [
              {
                label: "Annual Fuel Cost",
                vals: data.cars.map((c) =>
                  isValidNumeric(c.annualFuelCost) ? fmtDollars(c.annualFuelCost) : "N/A"
                ),
              },
              {
                label: "CO2 Emissions",
                vals: data.cars.map((c) => isValidNumeric(c.co2Emissions) ? `${c.co2Emissions} g/mi` : "N/A"),
              },
              {
                label: "Fuel Type",
                vals: data.cars.map((c) => c.fuelType),
              },
            ]
          : []),
      ].map((row, ri) => (
        <View key={ri} style={ri % 2 === 0 ? s.tableRow : s.tableRowAlt}>
          <Text style={[s.tdBold, { width: "25%" }]}>{row.label}</Text>
          {row.vals.map((v, vi) => (
            <Text key={vi} style={[s.tdText, { width: `${75 / data.cars.length}%` }]}>
              {v}
            </Text>
          ))}
        </View>
      ))}

      {/* Highlight cards — equal height, aligned metrics */}
      <View style={[s.cardsRow, { marginTop: 12 }]}>
        {data.cars.map((car, i) => {
          const hasCombined = isValidNumeric(car.combinedMPG);
          return (
            <View
              key={i}
              style={[s.card, { borderColor: CAR_PDF_BAR_COLORS[i] || CAR_PDF_BAR_COLORS[0], alignItems: "center", justifyContent: "space-between" }]}
            >
              <Text style={s.cardTitle}>{car.name}</Text>
              <Text
                style={{
                  fontSize: 22,
                  fontFamily: "Helvetica-Bold",
                  color: hasCombined ? C.emerald : C.slate400,
                }}
              >
                {hasCombined ? car.combinedMPG : "N/A"}
              </Text>
              <Text style={s.cardSub}>Combined MPG</Text>
              {!hasCombined && (
                <Text style={{ fontSize: 6, color: C.slate400, marginTop: 2 }}>EPA data unavailable</Text>
              )}
            </View>
          );
        })}
      </View>

      {!isFree && data.summary && (
        <Text style={[s.sectionSummary, { marginTop: 8 }]}>
          {data.summary}
        </Text>
      )}
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                 8. RELIABILITY PAGE                                     */
/* ═══════════════════════════════════════════════════════════════════════ */

function ReliabilityPage({
  data,
  dateStr,
  enrichedCars,
}: {
  data: NonNullable<AIAnalysisReport["reliability"]>;
  dateStr: string;
  enrichedCars?: import("@/types").EnrichedCar[];
}) {
  // Determine which cars had complaint data retrieved vs not
  const complaintDataRetrieved = data.cars.map((_, i) =>
    enrichedCars?.[i]?.complaintData !== undefined && enrichedCars?.[i]?.complaintData !== null
  );
  const anyMissingComplaintData = complaintDataRetrieved.some((v) => !v);
  return (
    <Page size="A4" style={s.page}>
      <Header title="Reliability & Maintenance" />
      <Footer date={dateStr} />

      <SectionHeading title="Reliability & Maintenance" />

      {/* Score cards — use consistent vehicle colors */}
      <View style={[s.cardsRow, { flexWrap: "wrap" }]}>
        {data.cars.map((car, i) => (
          <View
            key={i}
            style={[s.card, { borderColor: CAR_PDF_BAR_COLORS[i] || CAR_PDF_BAR_COLORS[0], alignItems: "center", justifyContent: "space-between", minWidth: "45%" }]}
          >
            <Text style={s.cardTitle}>{car.name}</Text>
            <ScoreBadge
              score={car.reliabilityScore >= 0 ? car.reliabilityScore : undefined}
              max={10}
              label="Reliability Score"
            />
            {/* FIX 2: Label AI-estimated vs data-backed scores */}
            <Text style={{ fontSize: 6.5, color: "#94A3B8", marginTop: 2 }}>
              {complaintDataRetrieved[i] ? "Based on NHTSA data" : "AI Estimate (based on historical brand/model data)"}
            </Text>
            {/* FIX 1: Show dash when data was not retrieved */}
            <Text style={[s.cardSub, { marginTop: 4 }]}>
              {complaintDataRetrieved[i]
                ? `${car.complaintCount} NHTSA complaints`
                : "\u2014"}
            </Text>
          </View>
        ))}
      </View>

      {/* Top problems table */}
      {(() => {
        const allComps = new Set<string>();
        data.cars.forEach((c) =>
          c.topProblems.forEach((p) => allComps.add(p.component))
        );
        const problems = Array.from(allComps).slice(0, 8);

        if (problems.length === 0) return null;

        return (
          <View style={{ marginTop: 8 }}>
            <Text
              style={{
                fontSize: 11,
                fontFamily: "Helvetica-Bold",
                color: C.slate900,
                marginBottom: 6,
              }}
            >
              Complaints by Component
            </Text>
            <View style={s.tableHeader}>
              <Text style={[s.thText, { width: "40%" }]}>Component</Text>
              {data.cars.map((c, i) => (
                <Text
                  key={i}
                  style={[s.thText, { width: `${60 / data.cars.length}%` }]}
                >
                  {c.name}
                </Text>
              ))}
            </View>
            {problems.map((comp, ri) => (
              <View
                key={ri}
                style={ri % 2 === 0 ? s.tableRow : s.tableRowAlt}
              >
                <Text style={[s.tdBold, { width: "40%" }]}>
                  {toTitleCase(comp)}
                </Text>
                {data.cars.map((c, ci) => (
                  <Text
                    key={ci}
                    style={[
                      s.tdText,
                      { width: `${60 / data.cars.length}%` },
                    ]}
                  >
                    {complaintDataRetrieved[ci]
                      ? (c.topProblems.find((p) => p.component === comp)?.count ?? 0)
                      : "\u2014"}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        );
      })()}

      {/* FIX 4: Top categories footnote */}
      {(() => {
        const allCompsCount = new Set<string>();
        data.cars.forEach((c) => c.topProblems.forEach((p) => allCompsCount.add(p.component)));
        const totalCategories = allCompsCount.size;
        const shownCategories = Math.min(totalCategories, 8);
        if (shownCategories > 0 && totalCategories > shownCategories) {
          return (
            <Text style={{ fontSize: 7, color: "#94A3B8", marginTop: 4 }}>
              Showing top complaint categories by volume. View the full complaint history at NHTSA.gov.
            </Text>
          );
        }
        return null;
      })()}

      {/* FIX 1: Missing data footnote */}
      {anyMissingComplaintData && (
        <Text style={{ fontSize: 7, color: "#94A3B8", marginTop: 4 }}>
          NHTSA complaint data could not be retrieved for this vehicle. This may reflect a data availability limitation, not zero complaints. Verify at NHTSA.gov.
        </Text>
      )}

      <Text style={[s.sectionSummary, { marginTop: 12 }]}>
        {data.summary}
      </Text>
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                 9. FEATURES PAGE                                        */
/* ═══════════════════════════════════════════════════════════════════════ */

function FeaturesPage({
  data,
  shortCar1,
  shortCar2,
  dateStr,
  shortCarNames,
  numCars,
}: {
  data: NonNullable<AIAnalysisReport["features"]>;
  shortCar1: string;
  shortCar2: string;
  dateStr: string;
  shortCarNames?: string[];
  numCars?: number;
}) {
  const nc = numCars || 2;
  const names = shortCarNames || [shortCar1, shortCar2];
  const total = data.comparisonTable.length;

  // Helper to get feature value for a car — supports "yes"/"no"/"unverified"/"ai_enriched" strings and legacy booleans
  const getHas = (row: (typeof data.comparisonTable)[0], ci: number): "yes" | "no" | "unverified" | "ai_enriched" => {
    if (row.hasFeature && row.hasFeature.length > ci) {
      const v = row.hasFeature[ci];
      if (v === true || v === "yes") return "yes";
      if (v === false || v === "no") return "no";
      if (v === "unverified") return "unverified";
      if (v === "ai_enriched") return "ai_enriched";
      return "unverified";
    }
    if (ci === 0 && row.car1 !== undefined) return row.car1 ? "yes" : "no";
    if (ci === 1 && row.car2 !== undefined) return row.car2 ? "yes" : "no";
    return "unverified";
  };

  const featureCounts = Array.from({ length: nc }, (_, i) =>
    data.comparisonTable.filter((r) => {
      const v = getHas(r, i);
      return v === "yes" || v === "ai_enriched";
    }).length
  );

  const featureWidth = nc > 2 ? "35%" : "50%";
  const carColWidth = nc > 2 ? `${65 / nc}%` : "25%";

  return (
    <Page size="A4" style={s.page}>
      <Header title="Features & Technology" />
      <Footer date={dateStr} />

      <SectionHeading title="Features & Technology" />

      {/* Score summary */}
      <View style={s.cardsRow}>
        {names.map((name, i) => (
          <View key={i} style={[s.card, { borderColor: CAR_PDF_BAR_COLORS[i] || CAR_PDF_BAR_COLORS[0], alignItems: "center" }]}>
            <Text style={[s.cardValue, { color: CAR_PDF_BAR_COLORS[i] || CAR_PDF_BAR_COLORS[0] }]}>
              {featureCounts[i]}/{total}
            </Text>
            <Text style={s.cardSub}>{name}</Text>
          </View>
        ))}
      </View>

      {/* Feature table */}
      <View style={s.tableHeader}>
        <Text style={[s.thText, { width: featureWidth }]}>Feature</Text>
        {names.map((name, i) => (
          <Text key={i} style={[s.thText, { width: carColWidth, textAlign: "center" }]}>{name}</Text>
        ))}
      </View>
      {data.comparisonTable.map((row, i) => (
        <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
          <Text style={[s.tdText, { width: featureWidth }]}>{row.feature}</Text>
          {Array.from({ length: nc }, (_, ci) => {
            const val = getHas(row, ci);
            return (
              <Text
                key={ci}
                style={{
                  width: carColWidth,
                  textAlign: "center",
                  fontSize: 8,
                  fontFamily: "Helvetica-Bold",
                  color:
                    val === "yes" ? C.emerald
                    : val === "no" ? "#EF4444"
                    : val === "ai_enriched" ? "#3B82F6"
                    : "#F59E0B",
                }}
              >
                {val === "yes" ? "YES" : val === "no" ? "NO" : val === "ai_enriched" ? "AI*" : "?"}
              </Text>
            );
          })}
        </View>
      ))}

      {/* Feature legend */}
      <View style={{ flexDirection: "row", gap: 16, marginTop: 10 }}>
        <Text style={{ fontSize: 8, color: C.emerald, fontFamily: "Helvetica-Bold" }}>YES = Confirmed</Text>
        <Text style={{ fontSize: 8, color: "#EF4444", fontFamily: "Helvetica-Bold" }}>NO = Not Available</Text>
        <Text style={{ fontSize: 8, color: "#F59E0B", fontFamily: "Helvetica-Bold" }}>? = Unverified</Text>
        <Text style={{ fontSize: 8, color: "#3B82F6", fontFamily: "Helvetica-Bold" }}>AI* = AI Estimate (standard equipment)</Text>
      </View>

      <Text style={[s.sectionSummary, { marginTop: 8 }]}>
        {data.summary}
      </Text>
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                 10. PRIORITY MATCH PAGE                                 */
/* ═══════════════════════════════════════════════════════════════════════ */

function PriorityPage({
  data,
  dateStr,
}: {
  data: NonNullable<AIAnalysisReport["userPriorityMatch"]>;
  dateStr: string;
}) {
  const categories = [
    { key: "safety" as const, label: "Safety" },
    { key: "fuelEconomy" as const, label: "Fuel Economy" },
    { key: "reliability" as const, label: "Reliability" },
    { key: "resaleValue" as const, label: "Resale Value" },
    { key: "performance" as const, label: "Performance" },
    { key: "technology" as const, label: "Technology" },
    { key: "comfort" as const, label: "Comfort" },
    { key: "maintenanceCost" as const, label: "Maintenance Cost" },
  ];

  return (
    <Page size="A4" style={s.page}>
      <Header title="Priority Match" />
      <Footer date={dateStr} />

      <SectionHeading title="Priority Match" />

      {/* Overall match cards */}
      <View style={s.cardsRow}>
        {data.cars.map((car, i) => (
          <View
            key={i}
            style={[s.card, { borderColor: CAR_PDF_BAR_COLORS[i] || CAR_PDF_BAR_COLORS[0], alignItems: "center" }]}
          >
            <Text style={s.cardTitle}>{car.name}</Text>
            <ScoreBadge
              score={car.overallMatch}
              max={100}
              label="Overall Match"
            />
            <Text style={[s.cardSub, { marginTop: 4 }]}>
              Best for: {car.bestFor}
            </Text>
          </View>
        ))}
      </View>

      {/* Priority scores table */}
      <View style={s.tableHeader}>
        <Text style={[s.thText, { width: "30%" }]}>Category</Text>
        {data.cars.map((c, i) => (
          <Text key={i} style={[s.thText, { width: `${70 / data.cars.length}%`, textAlign: "center" }]}>
            {c.name}
          </Text>
        ))}
      </View>
      {categories.map((cat, ri) => (
        <View key={cat.key} style={ri % 2 === 0 ? s.tableRow : s.tableRowAlt}>
          <Text style={[s.tdBold, { width: "30%" }]}>{cat.label}</Text>
          {data.cars.map((c, ci) => {
            const val = c.scores[cat.key];
            const color = val >= 8 ? C.emerald : val >= 6 ? C.amber : C.red;
            return (
              <Text
                key={ci}
                style={{
                  width: `${70 / data.cars.length}%`,
                  textAlign: "center",
                  fontSize: 10,
                  fontFamily: "Helvetica-Bold",
                  color,
                }}
              >
                {val}/10
              </Text>
            );
          })}
        </View>
      ))}
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                 11. FINAL VERDICT PAGE                                  */
/* ═══════════════════════════════════════════════════════════════════════ */

function VerdictPage({
  verdict,
  dateStr,
  isFree,
}: {
  verdict: AIAnalysisReport["finalVerdict"];
  dateStr: string;
  isFree: boolean;
}) {
  return (
    <Page size="A4" style={s.page}>
      <Header title="Final Verdict" />
      <Footer date={dateStr} />
      {isFree && <FreeWatermark />}

      <SectionHeading title="Final Verdict" />

      {/* Winner announcement */}
      <View
        style={{
          backgroundColor: C.indigoLight,
          borderRadius: 10,
          padding: 20,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Text style={s.verdictLabel}>Winner</Text>
        <Text style={s.verdictWinner}>{verdict.winner}</Text>
      </View>

      {/* Score cards */}
      <View style={s.cardsRow}>
        {verdict.scores.map((sc, i) => (
          <View
            key={i}
            style={[
              s.card,
              {
                borderColor:
                  sc.name === verdict.winner ? C.emerald : C.slate200,
                alignItems: "center",
              },
            ]}
          >
            <Text style={s.cardTitle}>{sc.name}</Text>
            <ScoreBadge
              score={sc.overall}
              max={10}
              label="Overall Score"
            />
            {sc.name === verdict.winner && (
              <View
                style={{
                  marginTop: 4,
                  backgroundColor: "#ECFDF5",
                  borderRadius: 4,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{
                    fontSize: 7,
                    fontFamily: "Helvetica-Bold",
                    color: C.emerald,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Winner
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Best-for scenarios */}
      {verdict.bestForScenarios && verdict.bestForScenarios.length > 0 && (
        <View style={{ marginTop: 8, marginBottom: 12 }}>
          <Text
            style={{
              fontSize: 11,
              fontFamily: "Helvetica-Bold",
              color: C.slate900,
              marginBottom: 6,
            }}
          >
            Best For Each Scenario
          </Text>
          {verdict.bestForScenarios.map((sc, i) => (
            <View key={i} style={s.bulletRow}>
              <Text style={s.bulletDot}>•</Text>
              <Text style={s.bulletText}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>
                  {sc.scenario}:
                </Text>{" "}
                {sc.winner}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Final statement */}
      <Text style={[s.sectionSummary, { marginTop: 8 }]}>
        {verdict.finalStatement}
      </Text>

      {/* rivvl footer branding */}
      <View
        style={{
          marginTop: 30,
          borderTopWidth: 2,
          borderTopColor: C.indigo,
          paddingTop: 14,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontFamily: "Helvetica-Bold",
            color: C.indigo,
          }}
        >
          rivvl
        </Text>
        <Text style={{ fontSize: 8, color: C.slate500, marginTop: 2 }}>
          AI-Powered Car Comparison Reports
        </Text>
        <Text style={{ fontSize: 7, color: C.slate400, marginTop: 4 }}>
          Data sourced from NHTSA, FuelEconomy.gov, and listing analysis
        </Text>
      </View>
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                    UPGRADE PROMPT PAGE (free reports)                   */
/* ═══════════════════════════════════════════════════════════════════════ */

function UpgradePage({ dateStr }: { dateStr: string }) {
  return (
    <Page size="A4" style={s.page}>
      <Header title="Unlock Full Report" />
      <FreeWatermark />
      <Footer date={dateStr} />

      <View style={s.upgradeBox}>
        <Text style={s.upgradeTitle}>Want the Full Picture?</Text>
        <Text style={s.upgradeText}>
          Upgrade to unlock all 11 sections including Price Analysis, Cost of
          Ownership, Depreciation Forecast, Reliability, Features comparison,
          and Priority Match scoring.
        </Text>
        <View style={s.upgradeCta}>
          <Text style={s.upgradeCtaText}>Upgrade at rivvl.ai</Text>
        </View>
        <Text
          style={{
            fontSize: 9,
            color: C.slate500,
            marginTop: 12,
            textAlign: "center",
          }}
        >
          Starting at $4.99 for a single full report
        </Text>

        {/* Locked sections list */}
        <View style={{ marginTop: 20, width: "100%" }}>
          <Text
            style={{
              fontSize: 10,
              fontFamily: "Helvetica-Bold",
              color: C.slate700,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Sections included in Full Report:
          </Text>
          {[
            "Price & Market Analysis",
            "Cost of Ownership (3yr & 5yr)",
            "Depreciation Forecast",
            "Reliability & Maintenance",
            "Features & Technology",
            "User Priority Match",
          ].map((section, i) => (
            <View key={i} style={[s.bulletRow, { justifyContent: "center" }]}>
              <Text style={[s.bulletDot, { color: C.indigo }]}>🔒</Text>
              <Text style={[s.bulletText, { color: C.slate700 }]}>
                {section}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                  VEHICLE HISTORY TIP PAGE                               */
/* ═══════════════════════════════════════════════════════════════════════ */

function VehicleHistoryTipPage({ dateStr, isFree }: { dateStr: string; isFree?: boolean }) {
  return (
    <Page size="A4" style={s.page}>
      <Header title="Before You Buy" />
      {isFree && <FreeWatermark />}
      <Footer date={dateStr} />

      <View style={s.tipCard}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          <Text style={s.tipTitle}>Before You Buy: Get a Vehicle History Report</Text>
        </View>

        <Text style={s.tipText}>
          rivvl provides comprehensive AI-powered analysis based on publicly
          available data, but we do not include accident history or salvage title
          information in our reports. Before making a purchase decision, we
          strongly recommend obtaining a vehicle history report from a trusted
          provider such as Carfax, AutoCheck, or a similar service.
        </Text>

        <Text style={s.tipBulletLabel}>A vehicle history report can reveal:</Text>

        {[
          "Previous accidents and damage reports",
          "Title issues (salvage, rebuilt, flood damage)",
          "Odometer rollback or discrepancies",
          "Number of previous owners",
          "Service and maintenance records",
          "Recall history and completion status",
        ].map((item, i) => (
          <View key={i} style={s.bulletRow}>
            <Text style={[s.bulletDot, { color: C.indigo }]}>•</Text>
            <Text style={s.bulletText}>{item}</Text>
          </View>
        ))}

        <Text style={[s.tipText, { marginTop: 8, marginBottom: 0 }]}>
          This additional step, combined with your rivvl analysis and a
          professional mechanic inspection, will give you the most complete
          picture before making your decision.
        </Text>
      </View>
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                    LEGAL DISCLAIMER PAGE                                */
/* ═══════════════════════════════════════════════════════════════════════ */

function DisclaimerPage({ dateStr, isFree }: { dateStr: string; isFree?: boolean }) {
  return (
    <Page size="A4" style={s.page}>
      <Header title="Disclaimer" />
      {isFree && <FreeWatermark />}
      <Footer date={dateStr} />

      <View style={s.disclaimerCard}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          <Text style={{ fontSize: 11, color: C.slate400, marginRight: 6 }}>⚠</Text>
          <Text style={s.disclaimerTitle}>Important Disclaimer</Text>
        </View>

        <Text style={s.disclaimerText}>
          {"IMPORTANT DISCLAIMER\n\nThis report is generated by rivvl.ai for informational and educational purposes only. It does not constitute automotive advice, financial advice, or a professional vehicle appraisal.\n\nrivvl.ai is a technology platform that aggregates and analyzes publicly available vehicle data. We are not licensed automotive dealers, mechanics, appraisers, or financial advisors. Nothing in this report should be interpreted as a recommendation to buy or avoid any specific vehicle.\n\nVehicle scores and ratings are generated by automated analysis using data from government databases, manufacturer information, and public listing sources. They may not account for all factors relevant to your specific needs. Data accuracy depends on third-party sources which may contain errors or outdated information.\n\nSafety, recall, and complaint data is sourced from NHTSA federal databases. Fuel economy data is sourced from EPA records. This data reflects published figures and may differ from real-world performance based on driving conditions, vehicle history, and maintenance.\n\nAlways conduct independent due diligence. Have any vehicle inspected by a qualified mechanic before purchase, obtain a vehicle history report, and consult appropriate professionals for financing decisions. rivvl.ai assumes no liability for decisions made based on information in this report.\n\nBy downloading or using this report, you acknowledge that you have read and understood this disclaimer."}
        </Text>
      </View>

      {/* Footer branding on last page */}
      <View style={{ position: "absolute", bottom: 40, left: 0, right: 0, alignItems: "center" }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={logoDataUri} style={{ width: 100, height: 100 * LOGO_RATIO, marginBottom: 6 }} />
        <Text style={{ fontSize: 8, color: C.slate400 }}>rivvl.ai</Text>
      </View>
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                     MAIN DOCUMENT EXPORT                               */
/* ═══════════════════════════════════════════════════════════════════════ */

export function RivvlPDF({ report }: { report: StoredReport }) {
  const a = report.analysis;
  const isFree = a.reportType === "free";
  const numCars = report.cars.length;

  // Build car names for ALL cars
  const carNames = report.cars.map(
    (c) => c && c.year && c.make && c.model ? `${c.year} ${toTitleCase(c.make)} ${c.model}` : "Unknown Vehicle"
  );
  const shortCarNames = report.cars.map(
    (c) => c && c.make && c.model ? `${toTitleCase(c.make)} ${c.model}` : "Unknown Vehicle"
  );

  // Legacy compat: first two car names
  const car1Name = carNames[0] || "Unknown Vehicle";
  const car2Name = carNames[1] || "Unknown Vehicle";
  const shortCar1 = shortCarNames[0] || "Unknown Vehicle";
  const shortCar2 = shortCarNames[1] || "Unknown Vehicle";

  // Cover title: use custom name if set, otherwise auto-generated
  const coverTitle = report.customName
    ? report.customName
    : numCars <= 2
      ? `${car1Name} vs ${car2Name}`
      : `${numCars}-Vehicle Comparison Report`;
  const coverSubtitle = !report.customName && numCars > 2
    ? carNames.join(" vs ")
    : undefined;

  const dateStr = new Date(report.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Detect manually-entered cars without VIN
  const manualCarsWithoutVin = report.cars
    .map((c, i) => ({ car: c, name: carNames[i] }))
    .filter((item) => item.car?.url?.startsWith("manual://") && !item.car?.vin);
  const hasManualWithoutVin = manualCarsWithoutVin.length > 0;

  return (
    <Document
      title={report.customName ? `rivvl Report: ${report.customName}` : `rivvl Report: ${shortCarNames.join(" vs ")}`}
      author="rivvl"
      subject="Car Comparison Report"
    >
      {/* Cover */}
      <CoverPage
        report={report}
        car1Name={car1Name}
        car2Name={car2Name}
        dateStr={dateStr}
        coverTitle={coverTitle}
        coverSubtitle={coverSubtitle}
        numCars={numCars}
        carNames={carNames}
        isFree={isFree}
      />

      {/* VIN Disclaimer (if manual entries without VIN) */}
      {hasManualWithoutVin && (
        <Page size="LETTER" style={s.page}>
          <Header title="Data Notice" />
          {isFree && <FreeWatermark />}
          <View style={{ backgroundColor: "#FFFBEB", borderRadius: 8, padding: 16, borderWidth: 1, borderColor: "#FDE68A" }}>
            <Text style={{ fontSize: 11, fontWeight: 700, color: "#92400E", marginBottom: 6 }}>
              Manual Entry Notice
            </Text>
            <Text style={{ fontSize: 9, color: "#92400E", lineHeight: 1.5 }}>
              {manualCarsWithoutVin.length === 1
                ? `${manualCarsWithoutVin[0].name} was entered manually without a VIN number.`
                : `${manualCarsWithoutVin.map((c) => c.name).join(" and ")} were entered manually without VIN numbers.`
              }{" "}
              Some data such as exact specifications, safety ratings, recall history, and fuel economy may be limited or estimated. For the most accurate comparison, provide the car&apos;s VIN number or paste a listing URL.
            </Text>
            <Text style={{ fontSize: 8, color: "#B45309", marginTop: 8 }}>
              How to find your VIN: The VIN is a 17-character code found on the driver&apos;s side dashboard (visible through the windshield) or on the driver&apos;s door jamb sticker.
            </Text>
          </View>
          <Footer date={dateStr} />
        </Page>
      )}

      {/* 1. Executive Summary (paid) */}
      {!isFree && (
        <ExecutiveSummaryPage
          a={a}
          car1Name={car1Name}
          car2Name={car2Name}
          dateStr={dateStr}
          isFree={isFree}
          carNames={carNames}
        />
      )}

      {/* 2. Vehicle Specs (free) */}
      <SpecsPage
        a={a}
        shortCar1={shortCar1}
        shortCar2={shortCar2}
        dateStr={dateStr}
        isFree={isFree}
        shortCarNames={shortCarNames}
        numCars={numCars}
      />

      {/* 3. Safety (free) */}
      <SafetyPage data={a.safety} dateStr={dateStr} isFree={isFree} />

      {/* 4. Fuel Economy (paid) */}
      {a.fuelEconomy && (
        <FuelPage data={a.fuelEconomy} dateStr={dateStr} isFree={isFree} />
      )}

      {/* 5. Reliability (free) */}
      {a.reliability && (
        <ReliabilityPage data={a.reliability} dateStr={dateStr} enrichedCars={report.cars} />
      )}

      {/* 6. Price Analysis (paid) */}
      {!isFree && a.priceAnalysis && (
        <PricePage data={a.priceAnalysis} dateStr={dateStr} />
      )}

      {/* 7. Cost of Ownership (paid) */}
      {!isFree && a.costOfOwnership && (
        <CostPage data={a.costOfOwnership} dateStr={dateStr} />
      )}

      {/* 8. Depreciation (paid) */}
      {!isFree && a.depreciation && (
        <DepreciationPage data={a.depreciation} dateStr={dateStr} />
      )}

      {/* 9. Features (paid) */}
      {!isFree && a.features && (
        <FeaturesPage
          data={a.features}
          shortCar1={shortCar1}
          shortCar2={shortCar2}
          dateStr={dateStr}
          shortCarNames={shortCarNames}
          numCars={numCars}
        />
      )}

      {/* 10. Priority Match (paid) */}
      {!isFree && a.userPriorityMatch && (
        <PriorityPage data={a.userPriorityMatch} dateStr={dateStr} />
      )}

      {/* 11. Final Verdict (paid) */}
      {!isFree && (
        <VerdictPage verdict={a.finalVerdict} dateStr={dateStr} isFree={isFree} />
      )}

      {/* Upgrade page for free reports */}
      {isFree && <UpgradePage dateStr={dateStr} />}

      {/* Vehicle History Tip (all reports) */}
      <VehicleHistoryTipPage dateStr={dateStr} isFree={isFree} />

      {/* Legal Disclaimer (all reports — always last) */}
      <DisclaimerPage dateStr={dateStr} isFree={isFree} />
    </Document>
  );
}
