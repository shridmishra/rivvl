"use client";

import { useEffect } from "react";

const SESSION_KEY = "chunkReloads";
const WINDOW_MS = 60_000;
const MAX_RELOADS = 3;

/**
 * Global safety net for chunk load errors that occur outside the React tree.
 *
 * Listens for both window "error" and "unhandledrejection" events.
 * Auto-reloads silently up to 3 times within a 60-second window,
 * then stops to prevent infinite reload loops.
 *
 * Place this component in the root layout OUTSIDE of any error boundary
 * so it always runs regardless of React component tree state.
 */
export function ChunkErrorHandler() {
  useEffect(() => {
    const isChunkError = (message: string) => {
      if (!message) return false;
      const lower = message.toLowerCase();
      return (
        lower.includes("chunkloaderror") ||
        lower.includes("loading chunk") ||
        lower.includes("failed to fetch dynamically imported module") ||
        (lower.includes("missing") && lower.includes("chunk"))
      );
    };

    const getReloadData = () => {
      try {
        const data = JSON.parse(
          sessionStorage.getItem(SESSION_KEY) || '{"count":0,"time":0}'
        );
        return data;
      } catch {
        return { count: 0, time: 0 };
      }
    };

    const tryReload = () => {
      const data = getReloadData();
      const now = Date.now();
      if (now - data.time > WINDOW_MS) {
        sessionStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ count: 1, time: now })
        );
        window.location.reload();
      } else if (data.count < MAX_RELOADS) {
        sessionStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ count: data.count + 1, time: data.time })
        );
        window.location.reload();
      }
    };

    const handleError = (event: ErrorEvent) => {
      if (isChunkError(event.message)) {
        event.preventDefault();
        event.stopPropagation();
        tryReload();
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message || String(event.reason);
      if (isChunkError(message)) {
        event.preventDefault();
        tryReload();
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
