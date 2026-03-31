import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { RivvlPDF } from "@/lib/pdf-document";
import { createClient } from "@/lib/supabase/server";
import { rateLimitResponse } from "@/lib/rate-limit";
import { getUnlockedSections } from "@/lib/section-access";
import type {
  StoredReport,
  EnrichedCar,
  AIAnalysisReport,
  UserPreferences,
} from "@/types";

export const maxDuration = 30;

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
        { status: 401 }
      );
    }

    // Rate limit: max 20 PDF generations per hour per user
    const rlResponse = rateLimitResponse(
      { name: "generate-pdf", maxRequests: 20 },
      req,
      user.id
    );
    if (rlResponse) return rlResponse;

    const body = await req.json();
    const { reportId } = body as { reportId?: string };

    if (!reportId) {
      return NextResponse.json(
        { error: "Missing reportId" },
        { status: 400 }
      );
    }

    // Fetch report using the user's own client so RLS enforces ownership
    const { data: reportRow } = await supabase
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (!reportRow?.report_data) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    const rd = reportRow.report_data as Record<string, unknown>;
    const report: StoredReport = {
      id: reportRow.id,
      createdAt: reportRow.created_at,
      cars: rd.cars as EnrichedCar[],
      analysis: rd.analysis as AIAnalysisReport,
      preferences: rd.preferences as UserPreferences,
      plan: rd.plan as string,
      enrichmentContext: rd.enrichmentContext as string,
      customName: reportRow.custom_name ?? null,
    };

    if (!report.analysis || !report.cars) {
      return NextResponse.json(
        { error: "Invalid report data" },
        { status: 400 }
      );
    }

    // Server-side section gating: use the DB plan, not client-provided reportType
    // Apply the same filtering as the report API for free reports
    if (report.analysis.reportType === "free") {
      const a = report.analysis;
      const unlocked = getUnlockedSections("free");

      if (!unlocked.includes("executiveSummary")) {
        a.executiveSummary = { overview: "", recommendation: "", quickVerdict: "" };
      }
      if (!unlocked.includes("priceAnalysis")) a.priceAnalysis = undefined;
      if (!unlocked.includes("costOfOwnership")) a.costOfOwnership = undefined;
      if (!unlocked.includes("depreciation")) a.depreciation = undefined;
      if (!unlocked.includes("fuelEconomy")) a.fuelEconomy = undefined;
      if (!unlocked.includes("reliability")) a.reliability = undefined;
      if (!unlocked.includes("features")) a.features = undefined;
      if (!unlocked.includes("userPriorityMatch")) a.userPriorityMatch = undefined;
      if (!unlocked.includes("finalVerdict")) {
        a.finalVerdict = { winner: "", scores: [], bestForScenarios: [], finalStatement: "" };
      }
    }

    // Generate PDF buffer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(RivvlPDF, { report }) as any;
    const pdfBuffer = await renderToBuffer(element);

    // Build filename with all cars
    const carParts = report.cars
      .filter(Boolean)
      .map((c) => `${c.make}-${c.model}`)
      .filter(Boolean);
    const namePart = report.customName
      ? report.customName
      : carParts.join("-vs-");
    const filename = `rivvl-${namePart}-Report.pdf`
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9\-_.]/g, "");

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
    console.error("PDF generation error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to generate PDF",
      },
      { status: 500 }
    );
  }
}
