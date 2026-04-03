"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  ArrowRight,
  Car,
  Home,
  Trash2,
  Pencil,
  Check,
  X,
  Star,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { DbReport, HomeReport } from "@/lib/supabase/types";

/* ─── Plan tier badge config ─── */
/* ─── Plan tier badge config ─── */
const TIER_BADGE: Record<string, { label: string; className: string; icon?: boolean }> = {
  free: { label: "Free", className: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400" },
  single: { label: "Full", className: "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100" },
  pro: { label: "Pro", className: "bg-black text-white dark:bg-white dark:text-black", icon: true },
  // Home plan tiers
  home_standard: { label: "Standard", className: "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100" },
  home_premium: { label: "Premium", className: "bg-black text-white dark:bg-white dark:text-black" },
  home_pro10: { label: "Pro 10", className: "bg-black text-white dark:bg-white dark:text-black", icon: true },
};

function PlanBadge({ tier }: { tier: string }) {
  // Try exact match first, then fall back to mapped key
  let config = TIER_BADGE[tier];
  if (!config) {
    // Map role strings to badge keys
    if (tier.includes("pro10")) config = TIER_BADGE.pro;
    else if (tier.includes("pro")) config = TIER_BADGE.pro;
    else if (tier.includes("premium")) config = TIER_BADGE.home_premium;
    else if (tier.includes("standard")) config = TIER_BADGE.home_standard;
    else if (tier !== "free") config = TIER_BADGE.single;
    else config = TIER_BADGE.free;
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${config.className}`}
    >
      {config.icon && <Star className="h-2.5 w-2.5" />}
      {config.label}
    </span>
  );
}

/* ─── Helper: check if report has manual entries without VIN ─── */
function hasManualWithoutVin(report: DbReport): boolean {
  try {
    const rd = report.report_data;
    const cars = (rd?.cars ?? []) as { url?: string; vin?: string | null }[];
    return cars.some((c) => c?.url?.startsWith("manual://") && !c?.vin);
  } catch {
    return false;
  }
}

/* ─── Helper: title-case make names (TOYOTA → Toyota) ─── */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ─── Helper: normalize car name, fixing ALL CAPS makes and raw placeholders ─── */
function normalizeCarName(name: string): string {
  if (!name || /^Car \d+$/i.test(name)) return "Unknown Vehicle";
  // Title-case the make (first word) if it's ALL CAPS
  const parts = name.split(" ");
  if (parts.length >= 2 && parts[1] && /^[A-Z]{2,}$/.test(parts[1])) {
    // Format: "2022 TOYOTA Camry" — year + MAKE + model
    parts[1] = toTitleCase(parts[1]);
  } else if (parts.length >= 1 && /^[A-Z]{2,}$/.test(parts[0])) {
    // Format: "TOYOTA Camry" — MAKE + model
    parts[0] = toTitleCase(parts[0]);
  }
  return parts.join(" ");
}

/* ─── Helper: build display name ─── */
function getAutoName(report: DbReport): string {
  const names = [
    report.car1_name,
    report.car2_name,
    report.car3_name,
    report.car4_name,
  ].filter(Boolean).map((n) => normalizeCarName(n as string));
  if (names.length <= 3) return names.join(" vs ");
  return `${names[0]} vs ${names[1]} + ${names.length - 2} more`;
}

/* ─── Helper: build display name for home reports ─── */
function getHomeDisplayName(report: HomeReport): string {
  const addresses = [
    report.property1_address,
    report.property2_address,
    report.property3_address,
  ].filter(Boolean);
  // Shorten addresses for display
  const short = addresses.map(a => {
    if (!a) return '';
    // Take just the street address part (before city/state)
    const parts = a.split(',');
    return parts[0]?.trim() || a;
  });
  if (short.length <= 2) return short.join(" vs ");
  return `${short[0]} vs ${short[1]} + ${short.length - 2} more`;
}

export function ReportsList({ initialReports, initialHomeReports }: { initialReports: DbReport[]; initialHomeReports: HomeReport[] }) {
  const [reports, setReports] = useState<DbReport[]>(initialReports);
  const [homeReports, setHomeReports] = useState<HomeReport[]>(initialHomeReports);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing
  useEffect(() => {
    if (editId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editId]);

  /* ─── Delete ─── */
  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("reports").delete().eq("id", id);
    if (!error) {
      setReports((prev) => prev.filter((r) => r.id !== id));
    }
    setDeleteId(null);
  }

  /* ─── Delete Home Report ─── */
  async function handleDeleteHome(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("home_reports").delete().eq("id", id);
    if (!error) {
      setHomeReports((prev) => prev.filter((r) => r.id !== id));
    }
    setDeleteId(null);
  }

  /* ─── Rename ─── */
  function startEdit(report: DbReport) {
    setEditId(report.id);
    setEditValue(report.custom_name || getAutoName(report));
  }

  async function saveEdit(id: string) {
    const trimmed = editValue.trim();
    if (!trimmed) {
      setEditId(null);
      return;
    }
    try {
      const res = await fetch(`/api/report/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_name: trimmed }),
      });
      if (res.ok) {
        setReports((prev) =>
          prev.map((r) => (r.id === id ? { ...r, custom_name: trimmed } : r))
        );
      }
    } catch {
      // Rename failed silently
    }
    setEditId(null);
  }

  function cancelEdit() {
    setEditId(null);
    setEditValue("");
  }

  return (
    <div className="mt-16 space-y-16">
      {/* Vehicle Reports Section */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-foreground tracking-tight sm:text-2xl">
            <Car className="h-6 w-6 text-black dark:text-white" />
            Vehicle Reports
          </h2>
          <Link
            href="/compare"
            className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-100 transition-all active:scale-[0.98]"
          >
            <Car className="h-4 w-4" />
            New Comparison
          </Link>
        </div>

        {reports.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-border bg-secondary/10 p-12 text-center">
            <Car className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-lg font-bold text-foreground">
              No vehicle reports yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground font-medium">
              Start a comparison to get started.
            </p>
            <Link
              href="/compare"
              className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-black dark:text-white hover:underline"
            >
              Compare your first cars <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {reports.map((report) => {
              const autoName = getAutoName(report);
              const displayName = report.custom_name || autoName;
              const isEditing = editId === report.id;
              const isDeleting = deleteId === report.id;

              return (
                <div
                  key={report.id}
                  className="relative rounded-3xl border border-border bg-card p-5 transition-all hover:border-black/10 hover:shadow-md dark:hover:border-white/10"
                >
                  {/* Delete Confirmation Overlay */}
                  {isDeleting && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/95 backdrop-blur-sm">
                      <div className="text-center p-4">
                        <p className="text-sm font-bold text-foreground">
                          Delete this report?
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground font-medium">
                          This action cannot be undone.
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-3">
                          <button
                            onClick={() => setDeleteId(null)}
                            className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-foreground hover:bg-secondary/20 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDelete(report.id)}
                            className="rounded-xl bg-error px-4 py-2 text-xs font-bold text-white hover:bg-error/90 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <Link
                        href={`/report/${report.id}`}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      >
                        <FileText className="h-6 w-6 text-black dark:text-white" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Plan badge */}
                          <PlanBadge tier={report.plan_tier_at_generation} />

                          {/* Manual entry without VIN indicator */}
                          {hasManualWithoutVin(report) && (
                            <span title="Some cars were entered manually without a VIN" className="inline-flex">
                              <AlertCircle className="h-4 w-4 text-warning" />
                            </span>
                          )}

                          {/* Name — editable or link */}
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                              <input
                                ref={editInputRef}
                                type="text"
                                maxLength={200}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEdit(report.id);
                                  if (e.key === "Escape") cancelEdit();
                                }}
                                className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm font-bold focus:border-black focus:ring-4 focus:ring-black/5 dark:focus:border-white dark:focus:ring-white/5 focus:outline-none"
                              />
                              <button
                                onClick={() => saveEdit(report.id)}
                                className="rounded-full p-2 text-success hover:bg-success/10 transition-colors"
                              >
                                <Check className="h-5 w-5" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          ) : (
                            <Link
                              href={`/report/${report.id}`}
                              className="truncate text-base font-bold text-foreground hover:text-black dark:hover:text-white transition-colors"
                            >
                              {displayName}
                            </Link>
                          )}

                          {/* Edit icon */}
                          {!isEditing && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                startEdit(report);
                              }}
                              className="shrink-0 rounded-full p-1.5 text-muted-foreground/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white transition-all"
                              title="Rename report"
                            >
                              <Pencil className="h-4 w-4 text-neutral-400 group-hover:text-black dark:group-hover:text-white" />
                            </button>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                          {new Date(report.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}{" "}
                          &middot; {report.sections_included.length} sections
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteId(report.id);
                        }}
                        className="rounded-lg p-2 text-muted-foreground/40 hover:bg-error/10 hover:text-error transition-all"
                        title="Delete report"
                      >
                        <Trash2 className="h-5 w-5 text-neutral-400 hover:text-red-500" />
                      </button>
                      <Link href={`/report/${report.id}`} className="rounded-lg p-2 hover:bg-secondary/20 transition-all">
                        <ArrowRight className="h-6 w-6 text-neutral-400 hover:text-black dark:hover:text-white" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Real Estate Reports Section */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-foreground tracking-tight sm:text-2xl">
            <Home className="h-6 w-6 text-black dark:text-white" />
            Real Estate Reports
          </h2>
          <Link
            href="/compare/homes"
            className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-100 transition-all active:scale-[0.98]"
          >
            <Home className="h-4 w-4" />
            New Comparison
          </Link>
        </div>

        {homeReports.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-border bg-secondary/10 p-12 text-center">
            <Home className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-lg font-bold text-foreground">
              No real estate reports yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground font-medium">
              Start a comparison to get started.
            </p>
            <Link
              href="/compare/homes"
              className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-black dark:text-white hover:underline"
            >
              Compare your first properties <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {homeReports.map((report) => {
              const displayName = report.custom_name || getHomeDisplayName(report);
              const isDeleting = deleteId === report.id;

              return (
                <div key={report.id} className="relative rounded-3xl border border-border bg-card p-5 transition-all hover:border-black/10 hover:shadow-md dark:hover:border-white/10">
                  {/* Delete Confirmation Overlay */}
                  {isDeleting && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/95 backdrop-blur-sm">
                      <div className="text-center p-4">
                        <p className="text-sm font-bold text-foreground">
                          Delete this report?
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground font-medium">
                          This action cannot be undone.
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-3">
                          <button
                            onClick={() => setDeleteId(null)}
                            className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-foreground hover:bg-secondary/20 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDeleteHome(report.id)}
                            className="rounded-xl bg-error px-4 py-2 text-xs font-bold text-white hover:bg-error/90 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <Link
                        href={`/homes/report?id=${report.id}`}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      >
                        <Home className="h-6 w-6 text-black dark:text-white" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <PlanBadge tier={report.plan_tier_at_generation} />
                          <Link
                            href={`/homes/report?id=${report.id}`}
                            className="truncate text-base font-bold text-foreground hover:text-black dark:hover:text-white transition-colors"
                          >
                            {displayName}
                          </Link>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                          {new Date(report.created_at).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteId(report.id);
                        }}
                        className="rounded-full p-2 text-neutral-400 hover:bg-error/10 hover:text-red-500 transition-all"
                        title="Delete report"
                      >
                        <Trash2 className="h-5 w-5 text-neutral-400 hover:text-red-500" />
                      </button>
                      <Link href={`/homes/report?id=${report.id}`} className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all">
                        <ArrowRight className="h-6 w-6 text-neutral-400 hover:text-black dark:hover:text-white" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
