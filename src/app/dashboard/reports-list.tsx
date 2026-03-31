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
const TIER_BADGE: Record<string, { label: string; className: string; icon?: boolean }> = {
  free: { label: "Free", className: "bg-slate-100 text-slate-600" },
  single: { label: "Full", className: "bg-blue-100 text-blue-700" },
  pro: { label: "Pro", className: "bg-purple-100 text-purple-700", icon: true },
  // Home plan tiers
  home_standard: { label: "Standard", className: "bg-cyan-100 text-cyan-700" },
  home_premium: { label: "Premium", className: "bg-amber-100 text-amber-700", icon: true },
  home_pro10: { label: "Pro 10", className: "bg-purple-100 text-purple-700", icon: true },
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
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${config.className}`}
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
    <div className="mt-10 space-y-10">
      {/* Vehicle Reports Section */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Car className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Vehicle Reports
          </h2>
          <Link
            href="/compare"
            className="gradient-bg inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Car className="h-4 w-4" />
            New Comparison
          </Link>
        </div>

        {reports.length === 0 ? (
          <div className="mt-4 rounded-xl border border-gray-300 bg-slate-50 p-12 text-center dark:border-gray-600 dark:bg-[#1A1A2E]">
            <Car className="mx-auto h-10 w-10 text-slate-400 dark:text-gray-500" />
            <p className="mt-3 text-lg font-medium text-slate-600 dark:text-gray-300">
              No vehicle reports yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Start a comparison to get started.
            </p>
            <Link
              href="/compare"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Compare your first cars <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {reports.map((report) => {
              const autoName = getAutoName(report);
              const displayName = report.custom_name || autoName;
              const isEditing = editId === report.id;
              const isDeleting = deleteId === report.id;

              return (
                <div
                  key={report.id}
                  className="relative rounded-xl border border-gray-300 bg-white p-4 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30 dark:border-gray-600 dark:bg-[#1A1A2E] dark:hover:border-indigo-500/50 dark:hover:bg-indigo-900/20"
                >
                  {/* Delete Confirmation Overlay */}
                  {isDeleting && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/95 backdrop-blur-sm dark:bg-[#1A1A2E]/95">
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-800 dark:text-gray-200">
                          Are you sure you want to delete this report?
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          This action cannot be undone.
                        </p>
                        <div className="mt-3 flex items-center justify-center gap-2">
                          <button
                            onClick={() => setDeleteId(null)}
                            className="rounded-lg border border-gray-300 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDelete(report.id)}
                            className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
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
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100"
                      >
                        <FileText className="h-5 w-5 text-indigo-600" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {/* Plan badge */}
                          <PlanBadge tier={report.plan_tier_at_generation} />

                          {/* Manual entry without VIN indicator */}
                          {hasManualWithoutVin(report) && (
                            <span title="Some cars were entered manually without a VIN" className="inline-flex">
                              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                            </span>
                          )}

                          {/* Name — editable or link */}
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
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
                                className="rounded border border-gray-300 px-2 py-0.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-[#1E1E30] dark:text-gray-100"
                              />
                              <button
                                onClick={() => saveEdit(report.id)}
                                className="rounded p-0.5 text-emerald-600 hover:bg-emerald-50"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="rounded p-0.5 text-slate-400 hover:bg-slate-100"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <Link
                              href={`/report/${report.id}`}
                              className="truncate font-semibold hover:text-indigo-600"
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
                              className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                              title="Rename report"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
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

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteId(report.id);
                        }}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete report"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <Link href={`/report/${report.id}`}>
                        <ArrowRight className="h-5 w-5 text-slate-400" />
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
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Home className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            Real Estate Reports
          </h2>
          <Link
            href="/compare/homes"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Home className="h-4 w-4" />
            New Comparison
          </Link>
        </div>

        {homeReports.length === 0 ? (
          <div className="mt-4 rounded-xl border border-gray-300 bg-slate-50 p-12 text-center dark:border-gray-600 dark:bg-[#1A1A2E]">
            <Home className="mx-auto h-10 w-10 text-slate-400 dark:text-gray-500" />
            <p className="mt-3 text-lg font-medium text-slate-600 dark:text-gray-300">
              No real estate reports yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Start a comparison to get started.
            </p>
            <Link
              href="/compare/homes"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-cyan-600 hover:text-cyan-500"
            >
              Compare your first properties <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {homeReports.map((report) => {
              const displayName = report.custom_name || getHomeDisplayName(report);
              const isDeleting = deleteId === report.id;

              return (
                <div key={report.id} className="relative rounded-xl border border-gray-300 bg-white p-4 transition-colors hover:border-cyan-200 hover:bg-cyan-50/30 dark:border-gray-600 dark:bg-[#1A1A2E] dark:hover:border-cyan-500/50 dark:hover:bg-cyan-900/20">
                  {/* Delete Confirmation Overlay */}
                  {isDeleting && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/95 backdrop-blur-sm dark:bg-[#1A1A2E]/95">
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-800 dark:text-gray-200">
                          Are you sure you want to delete this report?
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          This action cannot be undone.
                        </p>
                        <div className="mt-3 flex items-center justify-center gap-2">
                          <button
                            onClick={() => setDeleteId(null)}
                            className="rounded-lg border border-gray-300 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDeleteHome(report.id)}
                            className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
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
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-100"
                      >
                        <Home className="h-5 w-5 text-cyan-600" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <PlanBadge tier={report.plan_tier_at_generation} />
                          <Link
                            href={`/homes/report?id=${report.id}`}
                            className="truncate font-semibold hover:text-cyan-600"
                          >
                            {displayName}
                          </Link>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {new Date(report.created_at).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteId(report.id);
                        }}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete report"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <Link href={`/homes/report?id=${report.id}`}>
                        <ArrowRight className="h-5 w-5 text-slate-400" />
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
