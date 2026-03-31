"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  showManualReload: boolean;
}

const SESSION_KEY = "chunkErrorReloads";
const WINDOW_MS = 60_000;
const MAX_RELOADS = 3;

/**
 * Bulletproof chunk error boundary.
 *
 * Strategy:
 *  - Catches ChunkLoadError and related dynamic-import failures
 *  - Immediately triggers a silent page reload (no error UI)
 *  - Tracks reloads in sessionStorage with a 60-second sliding window
 *  - If 3+ reloads happen within 60 seconds (infinite-loop protection),
 *    shows a friendly manual-reload UI instead
 */
export class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, showManualReload: false };
  }

  static getDerivedStateFromError(error: Error): State | null {
    if (isChunkError(error)) {
      return { hasError: true, showManualReload: false };
    }
    return null;
  }

  componentDidCatch(error: Error) {
    if (isChunkError(error)) {
      if (shouldAutoReload()) {
        recordReload();
        window.location.reload();
      } else {
        this.setState({ showManualReload: true });
      }
    }
  }

  render() {
    if (this.state.hasError && this.state.showManualReload) {
      return (
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-slate-800">
              The app needs a refresh after a recent update.
            </h2>
            <button
              onClick={() => {
                clearReloads();
                window.location.href = window.location.href;
              }}
              className="mt-4 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isChunkError(error: Error): boolean {
  const name = error.name || "";
  const msg = (error.message || "").toLowerCase();
  return (
    name === "ChunkLoadError" ||
    msg.includes("loading chunk") ||
    msg.includes("failed to fetch dynamically imported module") ||
    (msg.includes("missing") && msg.includes("chunk"))
  );
}

interface ReloadData {
  count: number;
  time: number;
}

function getReloadData(): ReloadData {
  try {
    return JSON.parse(
      sessionStorage.getItem(SESSION_KEY) || '{"count":0,"time":0}'
    );
  } catch {
    return { count: 0, time: 0 };
  }
}

function shouldAutoReload(): boolean {
  const data = getReloadData();
  const now = Date.now();
  // Window expired — treat as first reload
  if (now - data.time > WINDOW_MS) return true;
  // Still within window — allow if under limit
  return data.count < MAX_RELOADS;
}

function recordReload(): void {
  try {
    const data = getReloadData();
    const now = Date.now();
    if (now - data.time > WINDOW_MS) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ count: 1, time: now }));
    } else {
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ count: data.count + 1, time: data.time })
      );
    }
  } catch {
    // sessionStorage unavailable
  }
}

function clearReloads(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // sessionStorage unavailable
  }
}
