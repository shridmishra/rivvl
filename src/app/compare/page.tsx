"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  Plus,
  X,
  ChevronDown,
  Link2,
  Car,
  AlertCircle,
  Shield,
  Fuel,
  Wrench,
  TrendingUp,
  Gauge,
  Smartphone,
  Armchair,
  DollarSign,
  Scale,
  Gem,
  Users,
  Map,
  Mountain,
  RefreshCw,
  Timer,
  Calendar,
  Home,
  Check,
  Lock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { ManualCarEntry } from "@/types";
import { NHTSACarFields } from "@/components/nhtsa-car-fields";
import { isMultiCarPlan, getMaxCarsForPlan } from "@/lib/plan-config";

const EXAMPLE_SITES =
  "Cars.com, AutoTrader, CarMax, Carvana, and most other car listing sites";

/* ═══════════════════════════════════════════════════════════════════════ */
/*                      PRIORITY PILL CONFIG                              */
/* ═══════════════════════════════════════════════════════════════════════ */

const PRIORITIES = [
  { value: "Safety", icon: <Shield className="h-4 w-4" /> },
  { value: "Fuel Economy", icon: <Fuel className="h-4 w-4" /> },
  { value: "Reliability", icon: <Wrench className="h-4 w-4" /> },
  { value: "Resale Value", icon: <TrendingUp className="h-4 w-4" /> },
  { value: "Performance", icon: <Gauge className="h-4 w-4" /> },
  { value: "Technology & Features", icon: <Smartphone className="h-4 w-4" /> },
  { value: "Comfort", icon: <Armchair className="h-4 w-4" /> },
  { value: "Low Maintenance Cost", icon: <DollarSign className="h-4 w-4" /> },
] as const;

const BUDGET_OPTIONS = [
  {
    value: "Price is my top priority",
    label: "Price is #1",
    desc: "Getting the lowest price is my top priority",
    icon: <DollarSign className="h-5 w-5" />,
  },
  {
    value: "Price is important but not everything",
    label: "Balanced",
    desc: "Important, but I'll pay more for quality",
    icon: <Scale className="h-5 w-5" />,
  },
  {
    value: "I care more about value than price",
    label: "Value First",
    desc: "I want the best car regardless of price",
    icon: <Gem className="h-5 w-5" />,
  },
] as const;

const USAGE_OPTIONS = [
  { value: "Daily Commute", icon: <Car className="h-4 w-4" /> },
  { value: "Family Car", icon: <Users className="h-4 w-4" /> },
  { value: "Road Trips", icon: <Map className="h-4 w-4" /> },
  { value: "Off-Road / Adventure", icon: <Mountain className="h-4 w-4" /> },
  { value: "Mixed Use", icon: <RefreshCw className="h-4 w-4" /> },
] as const;

const KEEP_OPTIONS = [
  { value: "1-2 years", label: "1-2 Years", icon: <Timer className="h-4 w-4" /> },
  { value: "3-5 years", label: "3-5 Years", icon: <Calendar className="h-4 w-4" /> },
  { value: "5+ years", label: "5+ Years", desc: "Long-term", icon: <Home className="h-4 w-4" /> },
] as const;

const emptyManual: ManualCarEntry = {
  year: "",
  make: "",
  model: "",
  trim: "",
  mileage: "",
  price: "",
  vin: "",
};

type ManualFieldErrors = Partial<Record<keyof ManualCarEntry, string>>;

const CURRENT_YEAR = new Date().getFullYear();

function validateManualField(field: keyof ManualCarEntry, value: string): string {
  const v = value.trim();
  switch (field) {
    case "year": {
      if (!v) return "Enter a valid year (e.g., 2024)";
      if (!/^\d{4}$/.test(v)) return "Enter a valid year (e.g., 2024)";
      const y = parseInt(v, 10);
      if (y < 1990 || y > CURRENT_YEAR + 2) return "Enter a valid year (e.g., 2024)";
      return "";
    }
    case "make": {
      if (!v) return "Enter the car make (e.g., Honda)";
      if (!/^[A-Za-z\s-]+$/.test(v)) return "Make should only contain letters";
      if (v.length < 2 || v.length > 30) return "Enter the car make (e.g., Honda)";
      return "";
    }
    case "model": {
      if (!v) return "Enter the car model (e.g., Accord)";
      if (v.length < 1 || v.length > 40) return "Enter the car model (e.g., Accord)";
      return "";
    }
    case "trim": {
      if (v.length > 30) return "Trim must be under 30 characters";
      return "";
    }
    case "mileage": {
      if (!v) return "";
      const cleaned = v.replace(/[^0-9]/g, "");
      if (!cleaned || isNaN(Number(cleaned))) return "Enter mileage as a number (e.g., 45000)";
      const n = parseInt(cleaned, 10);
      if (n < 0 || n > 500000) return "Enter mileage as a number (e.g., 45000)";
      return "";
    }
    case "price": {
      if (!v) return "";
      const cleaned = v.replace(/[$,\s]/g, "");
      if (!cleaned || isNaN(Number(cleaned))) return "Enter price as a number (e.g., 25000)";
      const n = parseFloat(cleaned);
      if (n < 0 || n > 500000) return "Enter price as a number (e.g., 25000)";
      return "";
    }
    case "vin": {
      if (!v) return "";
      const upper = v.toUpperCase();
      if (upper.length !== 17) return "VIN must be exactly 17 characters (letters and numbers)";
      if (/[IOQ]/.test(upper)) return "VIN must be exactly 17 characters (letters and numbers)";
      if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(upper)) return "VIN must be exactly 17 characters (letters and numbers)";
      return "";
    }
    default:
      return "";
  }
}

function validateAllManualFields(entry: ManualCarEntry): ManualFieldErrors {
  const errors: ManualFieldErrors = {};
  for (const field of Object.keys(entry) as (keyof ManualCarEntry)[]) {
    const err = validateManualField(field, entry[field]);
    if (err) errors[field] = err;
  }
  return errors;
}

function hasRequiredFieldErrors(errors: ManualFieldErrors): boolean {
  return !!(errors.year || errors.make || errors.model);
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                          MAIN COMPONENT                                */
/* ═══════════════════════════════════════════════════════════════════════ */

export default function ComparePage() {
  const router = useRouter();
  const [urls, setUrls] = useState<string[]>(["", ""]);
  const [urlErrors, setUrlErrors] = useState<string[]>(["", ""]);
  const [urlScrapeErrors, setUrlScrapeErrors] = useState<(string | null)[]>([null, null]);
  const [inlineManual, setInlineManual] = useState<(ManualCarEntry | null)[]>([null, null]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [usage, setUsage] = useState("");
  const [keepDuration, setKeepDuration] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualEntries, setManualEntries] = useState<ManualCarEntry[]>([
    { ...emptyManual },
    { ...emptyManual },
  ]);

  // Validation state for manual entries
  const [inlineManualErrors, setInlineManualErrors] = useState<(ManualFieldErrors | null)[]>([null, null]);
  const [manualEntryErrors, setManualEntryErrors] = useState<ManualFieldErrors[]>([{}, {}]);

  // Auth state
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Restore form state after login redirect
  useEffect(() => {
    const saved = localStorage.getItem("rivvl_compare_form");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.urls) setUrls(data.urls);
        if (data.inlineManual) setInlineManual(data.inlineManual);
        if (data.manualEntries) setManualEntries(data.manualEntries);
        if (data.priorities) setPriorities(data.priorities);
        if (data.budget) setBudget(data.budget);
        if (data.usage) setUsage(data.usage);
        if (data.keepDuration) setKeepDuration(data.keepDuration);
        if (data.selectedPlan) setSelectedPlan(data.selectedPlan);
      } catch { /* ignore corrupted data */ }
      localStorage.removeItem("rivvl_compare_form");
    }

    // Restore preferences after "Try Again" from error page
    const retryPrefs = sessionStorage.getItem("rivvl_retry_preferences");
    if (retryPrefs) {
      try {
        const prefs = JSON.parse(retryPrefs);
        if (prefs.priorities) setPriorities(prefs.priorities);
        if (prefs.budget) setBudget(prefs.budget);
        if (prefs.usage) setUsage(prefs.usage);
        if (prefs.keepDuration) setKeepDuration(prefs.keepDuration);
      } catch { /* ignore */ }
      sessionStorage.removeItem("rivvl_retry_preferences");
    }
  }, []);

  // Payment processing state (shown while transitioning after Stripe return)
  const [processingPayment, setProcessingPayment] = useState(false);

  // Handle return from Stripe checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    if (!payment) return;

    // Extract session_id BEFORE cleaning URL params
    const stripeSessionId = params.get("session_id") || null;
    const stripePlan = params.get("plan") || null;

    // Clean URL params
    window.history.replaceState({}, "", "/compare");

    if (payment === "success") {
      // Show "Processing payment..." while we prepare
      setProcessingPayment(true);

      // Retrieve saved comparison data and auto-start generation
      const pendingData = sessionStorage.getItem("rivvl_pending_checkout");
      if (pendingData) {
        try {
          // Inject Stripe session ID into the pending data so the analyze API
          // can verify the payment directly (instead of waiting for the webhook)
          const parsed = JSON.parse(pendingData);
          if (stripeSessionId) parsed.stripeSessionId = stripeSessionId;
          if (stripePlan) parsed.plan = stripePlan;
          localStorage.setItem("rivvl_pending_comparison", JSON.stringify(parsed));
        } catch {
          localStorage.setItem("rivvl_pending_comparison", pendingData);
        }
        sessionStorage.removeItem("rivvl_pending_checkout");
        sessionStorage.removeItem("rivvl_checkout_form");
        router.push("/report/generating");
        return;
      }

      // Fallback: no sessionStorage data (opened in new tab, etc.)
      setProcessingPayment(false);
      const formData = sessionStorage.getItem("rivvl_checkout_form");
      if (formData) {
        try {
          const data = JSON.parse(formData);
          restoreFormState(data);
          sessionStorage.removeItem("rivvl_checkout_form");
        } catch { /* ignore */ }
      }
      setApiError("Payment successful! Click Generate to create your report.");
    }

    if (payment === "cancelled") {
      // Restore form state from sessionStorage
      const formData = sessionStorage.getItem("rivvl_checkout_form");
      if (formData) {
        try {
          const data = JSON.parse(formData);
          restoreFormState(data);
        } catch { /* ignore */ }
        sessionStorage.removeItem("rivvl_checkout_form");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function restoreFormState(data: Record<string, unknown>) {
    if (data.urls) setUrls(data.urls as string[]);
    if (data.inlineManual) setInlineManual(data.inlineManual as (ManualCarEntry | null)[]);
    if (data.manualEntries) setManualEntries(data.manualEntries as ManualCarEntry[]);
    if (data.priorities) setPriorities(data.priorities as string[]);
    if (data.budget) setBudget(data.budget as string);
    if (data.usage) setUsage(data.usage as string);
    if (data.keepDuration) setKeepDuration(data.keepDuration as string);
    if (data.selectedPlan) setSelectedPlan(data.selectedPlan as string);
  }

  // Submitting state (double-click prevention)
  const [submitting, setSubmitting] = useState(false);
  const [redirectingToStripe, setRedirectingToStripe] = useState(false);

  // Error state
  const [apiError, setApiError] = useState<string | null>(null);

  // Plans that allow 3-4 cars (single source of truth: plan-config.ts)
  const canMultiCar = isMultiCarPlan(selectedPlan);
  const maxCarsForPlan = getMaxCarsForPlan(selectedPlan);

  // Plan limit enforcement: a URL slot is occupied if it has any text;
  // a manual slot is occupied once the year dropdown is selected.
  // We use year-selected (not full year+make+model) so that filling a URL
  // prevents the user from even starting a manual entry beyond the limit.
  const urlOccupied = urls.filter((u) => u.trim() !== "").length;
  const manualSlotCount = manualEntries.filter((e) => e.year !== "").length;
  const isAtPlanLimit = (urlOccupied + manualSlotCount) >= maxCarsForPlan;

  /* ─── URL management ─── */
  const addUrl = () => {
    if (urls.length >= 4) return;
    if ((urls.length + manualEntries.length) >= maxCarsForPlan) return;
    if (isAtPlanLimit) return;
    setUrls([...urls, ""]);
    setUrlErrors([...urlErrors, ""]);
    setUrlScrapeErrors([...urlScrapeErrors, null]);
    setInlineManual([...inlineManual, null]);
  };

  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
    setUrlErrors(urlErrors.filter((_, i) => i !== index));
    setUrlScrapeErrors(urlScrapeErrors.filter((_, i) => i !== index));
    setInlineManual(inlineManual.filter((_, i) => i !== index));
  };

  const updateUrl = (index: number, value: string) => {
    const updated = [...urls];
    updated[index] = value;
    setUrls(updated);

    const errors = [...urlErrors];
    if (value && !isValidUrl(value)) {
      errors[index] = "Please enter a valid URL";
    } else {
      errors[index] = "";
    }
    setUrlErrors(errors);

    const scrapeErrors = [...urlScrapeErrors];
    scrapeErrors[index] = null;
    setUrlScrapeErrors(scrapeErrors);
    const manuals = [...inlineManual];
    manuals[index] = null;
    setInlineManual(manuals);
  };

  /* ─── Inline manual entry for failed URLs ─── */
  const showInlineManual = (index: number) => {
    const manuals = [...inlineManual];
    manuals[index] = { ...emptyManual };
    setInlineManual(manuals);
  };

  const updateInlineManual = (
    index: number,
    field: keyof ManualCarEntry,
    value: string
  ) => {
    setInlineManual(prev => {
      const manuals = [...prev];
      if (manuals[index]) {
        const finalValue = field === "vin" ? value.toUpperCase() : value;
        manuals[index] = { ...manuals[index]!, [field]: finalValue };
      }
      return manuals;
    });
  };

  const handleInlineManualBlur = (index: number, field: keyof ManualCarEntry) => {
    const entry = inlineManual[index];
    if (!entry) return;
    const err = validateManualField(field, entry[field]);
    const errors = [...inlineManualErrors];
    if (!errors[index]) errors[index] = {};
    errors[index] = { ...errors[index]!, [field]: err || undefined };
    if (!err) delete errors[index]![field];
    setInlineManualErrors(errors);
  };

  /* ─── Preferences ─── */
  const togglePriority = (priority: string) => {
    setPriorities((prev) =>
      prev.includes(priority)
        ? prev.filter((p) => p !== priority)
        : prev.length < 3
          ? [...prev, priority]
          : prev
    );
  };

  /* ─── Bottom manual fallback ─── */
  const updateManualEntry = (
    index: number,
    field: keyof ManualCarEntry,
    value: string
  ) => {
    setManualEntries(prev => {
      const updated = [...prev];
      const finalValue = field === "vin" ? value.toUpperCase() : value;
      updated[index] = { ...updated[index], [field]: finalValue };
      return updated;
    });
  };

  const handleManualEntryBlur = (index: number, field: keyof ManualCarEntry) => {
    const entry = manualEntries[index];
    if (!entry) return;
    const err = validateManualField(field, entry[field]);
    const errors = [...manualEntryErrors];
    if (!errors[index]) errors[index] = {};
    errors[index] = { ...errors[index], [field]: err || undefined };
    if (!err) delete errors[index][field];
    setManualEntryErrors(errors);
  };

  const addManualEntry = () => {
    if (manualEntries.length >= 4) return;
    if ((urls.length + manualEntries.length) >= maxCarsForPlan) return;
    if (isAtPlanLimit) return;
    setManualEntries([...manualEntries, { ...emptyManual }]);
    setManualEntryErrors([...manualEntryErrors, {}]);
  };

  const removeManualEntry = (index: number) => {
    setManualEntries(manualEntries.filter((_, i) => i !== index));
    setManualEntryErrors(manualEntryErrors.filter((_, i) => i !== index));
  };

  const activeUrlCount = urls.filter((u) => u.trim() !== "").length;
  const activeManualCount = [
    ...inlineManual.filter((e) => e && e.year && e.make && e.model),
    ...manualEntries.filter((e) => e.year && e.make && e.model),
  ].length;
  const totalCarCount = activeUrlCount + activeManualCount;
  const isTooManyCars = totalCarCount > maxCarsForPlan;
  const hasInput =
    urls.some((u) => u.trim() !== "" && isValidUrl(u)) ||
    inlineManual.some((e) => e && e.year && e.make && e.model) ||
    manualEntries.some((e) => e.year && e.make && e.model);

  // Plan downgrade warning
  const planDowngradeWarning = !canMultiCar && totalCarCount > 2
    ? "Your current plan allows up to 2 cars. Please remove cars or select a Pro plan."
    : null;

  /* ─── Helpers for payment-first flow ─── */
  const saveAndGenerate = useCallback((validUrls: string[], allManualEntries: ManualCarEntry[]) => {
    localStorage.setItem("rivvl_pending_comparison", JSON.stringify({
      urls: validUrls,
      manualEntries: allManualEntries,
      preferences: { priorities, budget, usage, keepDuration },
      plan: selectedPlan,
    }));
    router.push("/report/generating");
  }, [priorities, budget, usage, keepDuration, selectedPlan, router]);

  const redirectToStripeCheckout = useCallback(async (
    validUrls: string[],
    allManualEntries: ManualCarEntry[],
    planTier: string
  ) => {
    setRedirectingToStripe(true);

    // Save form data to sessionStorage for Stripe round-trip
    const comparisonData = {
      urls: validUrls,
      manualEntries: allManualEntries,
      preferences: { priorities, budget, usage, keepDuration },
      plan: planTier,
    };
    sessionStorage.setItem("rivvl_pending_checkout", JSON.stringify(comparisonData));

    // Save full form state for restoration on cancel
    sessionStorage.setItem("rivvl_checkout_form", JSON.stringify({
      urls,
      inlineManual,
      manualEntries,
      priorities,
      budget,
      usage,
      keepDuration,
      selectedPlan,
    }));

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: planTier,
          source: "compare",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create checkout session");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      setRedirectingToStripe(false);
      setSubmitting(false);
      setApiError(err instanceof Error ? err.message : "Payment initialization failed. Please try again.");
    }
  }, [priorities, budget, usage, keepDuration, selectedPlan, urls, inlineManual, manualEntries]);

  /* ─── Generate Report handler ─── */
  const handleGenerate = useCallback(async () => {
    if (submitting || redirectingToStripe) return;

    // Validate that there is input before proceeding
    if (!hasInput) {
      setApiError("Please enter at least 2 car listing URLs or use manual entry.");
      return;
    }

    // Require sign-in before generating
    if (!user) {
      localStorage.setItem("rivvl_compare_form", JSON.stringify({
        urls, inlineManual, manualEntries, priorities, budget, usage, keepDuration, selectedPlan,
      }));
      router.push("/login?redirect=/compare");
      return;
    }

    setApiError(null);
    setSubmitting(true);

    // Validate inputs
    const validUrls = urls.filter(
      (u) => u.trim() !== "" && isValidUrl(u)
    );

    // Validate all manual entries on submit
    let hasValidationErrors = false;

    const newInlineErrors = [...inlineManualErrors];
    for (let i = 0; i < inlineManual.length; i++) {
      const entry = inlineManual[i];
      if (entry && (entry.year || entry.make || entry.model)) {
        const errs = validateAllManualFields(entry);
        newInlineErrors[i] = errs;
        if (hasRequiredFieldErrors(errs)) hasValidationErrors = true;
      }
    }
    setInlineManualErrors(newInlineErrors);

    const newManualErrors = [...manualEntryErrors];
    for (let i = 0; i < manualEntries.length; i++) {
      const entry = manualEntries[i];
      if (entry.year || entry.make || entry.model) {
        const errs = validateAllManualFields(entry);
        newManualErrors[i] = errs;
        if (hasRequiredFieldErrors(errs)) hasValidationErrors = true;
      }
    }
    setManualEntryErrors(newManualErrors);

    if (hasValidationErrors) {
      setApiError("Please fix the validation errors in your manual entries before generating.");
      setSubmitting(false);
      return;
    }

    const allManualEntries: ManualCarEntry[] = [];
    for (const entry of inlineManual) {
      if (entry && entry.year && entry.make && entry.model) {
        allManualEntries.push(entry);
      }
    }
    for (const entry of manualEntries) {
      if (entry.year && entry.make && entry.model) {
        allManualEntries.push(entry);
      }
    }

    const totalInputCars = validUrls.length + allManualEntries.length;
    if (totalInputCars < 2) {
      setApiError("Please add at least 2 cars to compare. Enter car listing URLs or fill in car details manually.");
      setSubmitting(false);
      return;
    }

    // Car count check
    const totalCars = validUrls.length + allManualEntries.length;
    const planAllowsMultiCar = isMultiCarPlan(selectedPlan);
    if (!planAllowsMultiCar && totalCars > 2) {
      setApiError("Your current plan allows up to 2 cars. Please remove cars or select a Pro plan.");
      setSubmitting(false);
      return;
    }

    // FREE plan: generate immediately, no payment needed
    if (selectedPlan === "free") {
      saveAndGenerate(validUrls, allManualEntries);
      return;
    }

    // PAID plan: check if user already has the plan active
    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("vehicle_plan_tier, vehicle_reports_used, vehicle_max_reports")
        .eq("id", user.id)
        .single();

      if (profile) {
        const vehiclePlan = profile.vehicle_plan_tier || "free";
        const vehicleUsed = profile.vehicle_reports_used ?? 0;
        const vehicleMax = profile.vehicle_max_reports ?? 0;

        // If user has an active vehicle plan with remaining reports
        if (vehiclePlan !== "free" && vehicleMax > 0 && vehicleUsed < vehicleMax) {
          const planHierarchy: Record<string, number> = {
            free: 0, car_single: 1, car_pro_report: 2, car_pro10: 3,
          };
          if ((planHierarchy[vehiclePlan] ?? 0) >= (planHierarchy[selectedPlan] ?? 0)) {
            saveAndGenerate(validUrls, allManualEntries);
            return;
          }
        }
      }

      // User needs to pay: redirect to Stripe
      await redirectToStripeCheckout(validUrls, allManualEntries, selectedPlan);
    } catch {
      // If plan check fails, try generating anyway (server will catch it)
      saveAndGenerate(validUrls, allManualEntries);
    }
  }, [urls, inlineManual, inlineManualErrors, manualEntries, manualEntryErrors, priorities, budget, usage, keepDuration, selectedPlan, router, user, submitting, redirectingToStripe, hasInput, saveAndGenerate, redirectToStripeCheckout]);

  // Can add more cars?
  const totalSlots = urls.length + manualEntries.length;
  const canAddMoreUrlSlots = urls.length < 4 && totalSlots < maxCarsForPlan && !isAtPlanLimit;
  const canAddMoreManualEntries = manualEntries.length < 4 && totalSlots < maxCarsForPlan && !isAtPlanLimit;

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*                              RENDER                                    */
  /* ═══════════════════════════════════════════════════════════════════════ */

  // Show loading state while processing payment return from Stripe
  if (processingPayment) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-bg shadow-lg shadow-indigo-200">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
          <h2 className="mt-6 text-xl font-bold text-indigo-950 dark:text-gray-100">
            Processing your payment...
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
            Hang tight! We&apos;re preparing your report.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-indigo-950 dark:text-gray-100 sm:text-4xl">
          <span className="gradient-text">Compare Cars</span>
        </h1>
        <p className="mt-3 text-slate-600 dark:text-gray-400">
          Paste your car listing URLs and let our intelligent engine do the heavy lifting.
        </p>

        {/* Feature strip */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {["Safety Ratings", "Recalls", "Fuel Economy", "Cost Projection", "Our Pick"].map((f) => (
            <span key={f} className="inline-flex items-center gap-1.5 rounded-full border border-[#6C5CE7]/30 bg-[#6C5CE7]/5 px-3 py-1 text-[11px] font-medium text-[#6C5CE7] dark:text-[#a99cf5]">
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* ═══ SECTION 1: PLAN SELECTION (now FIRST) ═══ */}
      <section className="mt-10 rounded-2xl border border-indigo-300 dark:border-gray-600 bg-white dark:bg-[#1A1A2E] p-6 shadow-sm">
        <h2 className="text-lg font-bold text-indigo-950 dark:text-gray-100">Choose Your Plan</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
          Select the depth of analysis you need.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Free */}
          <button
            type="button"
            onClick={() => setSelectedPlan("free")}
            className={`relative flex flex-col rounded-xl border p-5 text-left transition-all duration-200 ${
              selectedPlan === "free"
                ? "border-[#6C5CE7] ring-2 ring-indigo-200 shadow-lg"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
            }`}
          >
            {selectedPlan === "free" && (
              <div className="absolute -right-1.5 -top-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#6C5CE7] shadow">
                  <Check className="h-3 w-3 text-white" />
                </div>
              </div>
            )}
            <p className="text-sm font-bold text-indigo-950 dark:text-gray-100">Free</p>
            <div className="mt-2">
              <span className="text-2xl font-bold text-indigo-950 dark:text-gray-100">$0</span>
              <span className="ml-1 text-xs text-slate-500 dark:text-gray-400">/forever</span>
            </div>
            <div className="mt-4 flex-1 space-y-1.5 text-xs text-slate-500 dark:text-gray-400">
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> Compare 2 cars</p>
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> Specs, safety & fuel economy</p>
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> 3 of 11 sections</p>
            </div>
          </button>

          {/* Full Report */}
          <button
            type="button"
            onClick={() => setSelectedPlan("car_single")}
            className={`relative flex flex-col rounded-xl border p-5 text-left transition-all duration-200 ${
              selectedPlan === "car_single"
                ? "border-[#6C5CE7] ring-2 ring-indigo-200 shadow-lg"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
            }`}
          >
            {selectedPlan === "car_single" && (
              <div className="absolute -right-1.5 -top-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#6C5CE7] shadow">
                  <Check className="h-3 w-3 text-white" />
                </div>
              </div>
            )}
            <p className="text-sm font-bold text-indigo-950 dark:text-gray-100">Full Report</p>
            <div className="mt-2">
              <span className="text-2xl font-bold text-indigo-950 dark:text-gray-100">$4.99</span>
              <span className="ml-1 text-xs text-slate-500 dark:text-gray-400">/one-time</span>
            </div>
            <div className="mt-4 flex-1 space-y-1.5 text-xs text-slate-500 dark:text-gray-400">
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> Compare 2 cars</p>
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> All 11 sections</p>
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> Charts & intelligent recommendation</p>
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> Downloadable PDF</p>
            </div>
          </button>

          {/* Pro Report */}
          <button
            type="button"
            onClick={() => setSelectedPlan("car_pro_report")}
            className={`relative flex flex-col rounded-xl border pt-8 p-5 text-left transition-all duration-200 ${
              selectedPlan === "car_pro_report"
                ? "border-[#6C5CE7] ring-2 ring-indigo-200 shadow-lg"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
            }`}
          >
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#6C5CE7] px-4 py-1 text-[11px] font-bold text-white shadow-md">
              Most Popular
            </span>
            {selectedPlan === "car_pro_report" && (
              <div className="absolute -right-1.5 -top-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#6C5CE7] shadow">
                  <Check className="h-3 w-3 text-white" />
                </div>
              </div>
            )}
            <p className="text-sm font-bold text-indigo-950 dark:text-gray-100">Pro Report</p>
            <div className="mt-2">
              <span className="text-2xl font-bold text-indigo-950 dark:text-gray-100">$9.99</span>
              <span className="ml-1 text-xs text-slate-500 dark:text-gray-400">/one-time</span>
            </div>
            <div className="mt-4 flex-1 space-y-1.5 text-xs text-slate-500 dark:text-gray-400">
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> Up to 4 cars</p>
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> All 11 sections</p>
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> Charts & intelligent recommendation</p>
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> Downloadable PDF</p>
            </div>
          </button>

          {/* Pro 10 */}
          <button
            type="button"
            onClick={() => setSelectedPlan("car_pro10")}
            className={`relative flex flex-col rounded-xl border pt-8 p-5 text-left transition-all duration-200 ${
              selectedPlan === "car_pro10"
                ? "border-[#6C5CE7] ring-2 ring-indigo-200 shadow-lg"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
            }`}
          >
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#F59E0B] px-4 py-1 text-[11px] font-bold text-white shadow-md">
              Best Value
            </span>
            {selectedPlan === "car_pro10" && (
              <div className="absolute -right-1.5 -top-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#6C5CE7] shadow">
                  <Check className="h-3 w-3 text-white" />
                </div>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-indigo-950 dark:text-gray-100">Pro 10</p>
              <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white leading-tight whitespace-nowrap">40% Off</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-indigo-950 dark:text-gray-100">$59.99</span>
              <span className="text-xs text-slate-500 dark:text-gray-400">/one-time</span>
            </div>
            <div className="mt-4 flex-1 space-y-1.5 text-xs text-slate-500 dark:text-gray-400">
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> 10 Pro reports</p>
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> Up to 4 cars each</p>
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> All 11 sections</p>
              <p className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-500" /> Credits never expire</p>
            </div>
          </button>
        </div>

        {/* Plan downgrade warning */}
        {planDowngradeWarning && (
          <div className="mt-4 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            <AlertCircle className="mr-2 inline h-4 w-4" />
            {planDowngradeWarning}
          </div>
        )}
      </section>

      {/* ═══ SECTION 2: URL INPUT ═══ */}
      <section className="mt-8 rounded-2xl border border-indigo-300 dark:border-gray-600 bg-white dark:bg-[#1A1A2E] p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-bold text-indigo-950 dark:text-gray-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-bg">
            <Link2 className="h-4 w-4 text-white" />
          </div>
          Car Listing URLs
        </h2>

        <div className="mt-5 space-y-4">
          {urls.map((url, i) => (
            <div key={i}>
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white gradient-bg">
                  {i + 1}
                </span>
                <div className="relative flex-1">
                  <input
                    id={`url-${i}`}
                    type="url"
                    value={url}
                    onChange={(e) => updateUrl(i, e.target.value)}
                    placeholder="Paste any car listing URL"
                    className={`w-full rounded-xl border bg-white dark:bg-[#1E1E30] px-4 py-3 text-sm dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      urlErrors[i] || urlScrapeErrors[i]
                        ? "border-red-400"
                        : "border-slate-300 dark:border-gray-600"
                    }`}
                  />
                </div>
                {i >= 2 && (
                  <button
                    type="button"
                    onClick={() => removeUrl(i)}
                    className="rounded-lg p-2 text-slate-400 dark:text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {urlErrors[i] && (
                <p className="ml-10 mt-1 text-xs text-red-500">{urlErrors[i]}</p>
              )}

              {urlScrapeErrors[i] && (
                <div className="ml-10 mt-2">
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-3 py-2.5">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div className="flex-1">
                      <p className="text-sm text-amber-800">
                        We couldn&apos;t read this listing. Enter details manually.
                      </p>
                      <p className="mt-0.5 text-xs text-amber-600">{urlScrapeErrors[i]}</p>
                    </div>
                  </div>
                  {!inlineManual[i] ? (
                    <button
                      type="button"
                      onClick={() => showInlineManual(i)}
                      className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Enter details manually
                    </button>
                  ) : (
                    <div className="mt-3 rounded-lg border border-indigo-300 dark:border-gray-600 bg-indigo-50/50 dark:bg-[#1E1E30] p-4">
                      <p className="mb-3 text-xs font-semibold text-indigo-950 dark:text-gray-100">
                        Manual entry for Car {i + 1}
                      </p>
                      <NHTSACarFields
                        entry={inlineManual[i]!}
                        onChange={(field, value) => updateInlineManual(i, field, value)}
                        onBlur={(field) => handleInlineManualBlur(i, field)}
                        errors={inlineManualErrors[i] ?? undefined}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Another Car button for URLs */}
        {canAddMoreUrlSlots ? (
          <Button
            variant="outline"
            size="sm"
            className="mt-4 border-indigo-300 text-indigo-600 hover:bg-indigo-50"
            onClick={addUrl}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Another Car
          </Button>
        ) : isAtPlanLimit && urls.length < 4 ? (
          <div className="mt-4 text-sm text-slate-500 dark:text-gray-400">
            {canMultiCar ? (
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                Plan limit reached (4 cars max)
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                Plan limit reached.{" "}
                <button type="button" onClick={() => setSelectedPlan("car_pro_report")} className="font-semibold text-indigo-600 hover:text-indigo-800 underline">
                  Upgrade to Pro to compare more cars
                </button>
              </span>
            )}
          </div>
        ) : null}

        <p className="mt-4 text-xs text-slate-500 dark:text-gray-400">
          Works with {EXAMPLE_SITES}
        </p>
      </section>

      {/* ═══ SECTION 3: MANUAL ENTRY (standalone) ═══ */}
      <section className="mt-8 rounded-2xl border border-indigo-300 dark:border-gray-600 bg-white dark:bg-[#1A1A2E] shadow-sm">
        <Collapsible
          open={manualOpen}
          onOpenChange={setManualOpen}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between px-6 py-4 text-sm font-medium text-slate-500 dark:text-gray-400 hover:text-indigo-600">
            <span className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-[#1E1E30]">
                <Car className="h-4 w-4 text-slate-500 dark:text-gray-400" />
              </div>
              <span className="text-base font-bold text-indigo-950 dark:text-gray-100">Enter Details Manually Instead</span>
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${manualOpen ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t border-indigo-300 dark:border-gray-600 px-6 pb-6 pt-4">
            {isAtPlanLimit && (
              <div className="mb-4 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                <AlertCircle className="mr-2 inline h-4 w-4" />
                {canMultiCar ? (
                  <>Plan limit reached (4 cars max for this plan).</>
                ) : (
                  <>
                    Car limit reached for your plan. Remove a URL above or{" "}
                    <button
                      type="button"
                      onClick={() => setSelectedPlan("car_pro_report")}
                      className="font-semibold underline hover:text-amber-900 dark:hover:text-amber-100"
                    >
                      upgrade your plan
                    </button>
                    {" "}to add more cars.
                  </>
                )}
              </div>
            )}
            {manualEntries.map((entry, idx) => (
              <div key={idx} className="mb-4 last:mb-0">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-indigo-950 dark:text-gray-100">Car {idx + 1}</span>
                  {manualEntries.length > 2 && idx >= 2 && (
                    <button type="button" onClick={() => removeManualEntry(idx)} className="text-xs text-slate-400 dark:text-gray-500 hover:text-red-500">
                      Remove
                    </button>
                  )}
                </div>
                <NHTSACarFields
                  entry={entry}
                  onChange={(field, value) => updateManualEntry(idx, field, value)}
                  onBlur={(field) => handleManualEntryBlur(idx, field)}
                  errors={manualEntryErrors[idx]}
                  disabled={isAtPlanLimit && !entry.year}
                />
              </div>
            ))}

            {/* Add Another Car button for manual entries */}
            {canAddMoreManualEntries ? (
              <Button variant="ghost" size="sm" className="mt-2 text-indigo-600 hover:bg-indigo-50" onClick={addManualEntry}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add Another Car
              </Button>
            ) : isAtPlanLimit && manualEntries.length < 4 ? (
              <div className="mt-2 text-sm text-slate-500 dark:text-gray-400">
                {canMultiCar ? (
                  <span className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    Plan limit reached (4 cars max)
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    Plan limit reached.{" "}
                    <button type="button" onClick={() => setSelectedPlan("car_pro_report")} className="font-semibold text-indigo-600 hover:text-indigo-800 underline">
                      Upgrade to Pro to compare more cars
                    </button>
                  </span>
                )}
              </div>
            ) : null}
          </CollapsibleContent>
        </Collapsible>
      </section>

      {/* ═══ SECTION 4: PREFERENCES ═══ */}
      <section className="mt-8 rounded-2xl border border-indigo-300 dark:border-gray-600 bg-white dark:bg-[#1A1A2E] p-6 shadow-sm">
        <h2 className="text-lg font-bold text-indigo-950 dark:text-gray-100">Your Preferences</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
          Help us tailor the analysis to what matters most to you.
        </p>

        {/* Priorities -- pill chips */}
        <div className="mt-6">
          <p className="text-sm font-semibold text-indigo-950 dark:text-gray-100">
            What matters most to you?
          </p>
          <p className="mb-3 text-xs text-slate-500 dark:text-gray-400">Select up to 3</p>
          <div className="flex flex-wrap gap-2.5">
            {PRIORITIES.map((p) => {
              const isSelected = priorities.includes(p.value);
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => togglePriority(p.value)}
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? "gradient-bg border-transparent text-white shadow-md shadow-indigo-200"
                      : "border-slate-300 dark:border-gray-600 bg-white dark:bg-[#1E1E30] text-slate-600 dark:text-gray-300 hover:border-indigo-400 hover:shadow-sm"
                  }`}
                >
                  <span className={isSelected ? "text-white/90" : "text-slate-400"}>
                    {p.icon}
                  </span>
                  {p.value}
                </button>
              );
            })}
          </div>
        </div>

        {/* Budget -- card select */}
        <div className="mt-8">
          <p className="text-sm font-semibold text-indigo-950 dark:text-gray-100">Budget priority</p>
          <p className="mb-3 text-xs text-slate-500 dark:text-gray-400">How important is price to you?</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {BUDGET_OPTIONS.map((opt) => {
              const isSelected = budget === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBudget(opt.value)}
                  className={`relative rounded-xl border p-4 text-left transition-all duration-200 ${
                    isSelected
                      ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/50 dark:to-violet-950/50 shadow-md ring-2 ring-indigo-200"
                      : "border-slate-300 dark:border-gray-600 bg-white dark:bg-[#1E1E30] hover:border-indigo-400 hover:shadow-sm"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -right-1.5 -top-1.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full gradient-bg shadow">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  )}
                  <div className={`${isSelected ? "text-indigo-600" : "text-slate-400"}`}>
                    {opt.icon}
                  </div>
                  <p className={`mt-2 text-sm font-bold ${isSelected ? "text-indigo-900 dark:text-indigo-300" : "text-slate-700 dark:text-gray-200"}`}>
                    {opt.label}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-gray-400">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Usage -- pill row */}
        <div className="mt-8">
          <p className="text-sm font-semibold text-indigo-950 dark:text-gray-100">How will you use this car?</p>
          <p className="mb-3 text-xs text-slate-500 dark:text-gray-400">Pick your primary use</p>
          <div className="flex flex-wrap gap-2">
            {USAGE_OPTIONS.map((opt) => {
              const isSelected = usage === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setUsage(opt.value)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? "gradient-bg border-transparent text-white shadow-md shadow-indigo-200"
                      : "border-slate-300 dark:border-gray-600 bg-white dark:bg-[#1E1E30] text-slate-600 dark:text-gray-300 hover:border-indigo-400"
                  }`}
                >
                  <span className={isSelected ? "text-white/90" : "text-slate-400"}>
                    {opt.icon}
                  </span>
                  {opt.value}
                </button>
              );
            })}
          </div>
        </div>

        {/* Keep duration -- pill row */}
        <div className="mt-8">
          <p className="text-sm font-semibold text-indigo-950 dark:text-gray-100">How long do you plan to keep it?</p>
          <p className="mb-3 text-xs text-slate-500 dark:text-gray-400">Affects cost projections</p>
          <div className="flex flex-wrap gap-2">
            {KEEP_OPTIONS.map((opt) => {
              const isSelected = keepDuration === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setKeepDuration(opt.value)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? "gradient-bg border-transparent text-white shadow-md shadow-indigo-200"
                      : "border-slate-300 dark:border-gray-600 bg-white dark:bg-[#1E1E30] text-slate-600 dark:text-gray-300 hover:border-indigo-400"
                  }`}
                >
                  <span className={isSelected ? "text-white/90" : "text-slate-400"}>
                    {opt.icon}
                  </span>
                  {opt.label}
                  {"desc" in opt && opt.desc && (
                    <span className={`text-xs ${isSelected ? "text-white/70" : "text-slate-400"}`}>
                      ({opt.desc})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ GENERATE BUTTON ═══ */}
      <div className="mt-10">
        <Button
          onClick={handleGenerate}
          loading={submitting || redirectingToStripe}
          loadingText={redirectingToStripe ? "Redirecting to checkout..." : "Generating..."}
          disabled={isTooManyCars}
          className="gradient-bg-hover w-full h-14 rounded-2xl text-base font-bold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Generate My Report
        </Button>
        <p className="mt-3 text-center text-xs text-slate-500 dark:text-gray-400">
          {selectedPlan === "free"
            ? "Takes about 45-90 seconds to generate your intelligent report."
            : "You'll complete payment before your report is generated."}
        </p>
      </div>

      {/* ═══ API ERROR ═══ */}
      {apiError && (
        <div className="mt-8 rounded-2xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-800">Something went wrong</h3>
              <p className="mt-1 text-sm text-red-700">{apiError}</p>
              <Button 
                variant="ghost" 
                onClick={handleGenerate} 
                className="mt-3 text-sm font-medium text-red-700 underline hover:text-red-900 hover:bg-red-100 p-0 h-auto"
                loading={submitting}
              >
                Try again
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
