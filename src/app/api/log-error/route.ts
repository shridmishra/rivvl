import { NextRequest, NextResponse } from "next/server";
import { logCrash } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { location, message, stack, digest } = body as {
      location?: string;
      message?: string;
      stack?: string;
      digest?: string;
    };

    logCrash(location || "client-error", new Error(message || "Unknown client error"), {
      stack: stack || undefined,
      digest: digest || undefined,
    } as Record<string, unknown>);

    return NextResponse.json({ logged: true });
  } catch {
    return NextResponse.json({ logged: false }, { status: 500 });
  }
}
