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
      <div className="flex min-h-[60vh] items-center justify-center px-4 bg-mesh-gradient">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
          </div>
          <h2 className="mt-6 text-xl font-extrabold text-foreground">
            Processing your payment...
          </h2>
          <p className="mt-2 text-sm text-muted-foreground font-medium">
            Hang tight! We&apos;re preparing your report.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 bg-mesh-gradient min-h-screen">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Compare Cars
        </h1>
        <p className="mt-3 text-muted-foreground font-medium">
          Paste your car listing URLs and let our intelligent engine do the heavy lifting.
        </p>

        {/* Feature strip */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {["Safety Ratings", "Recalls", "Fuel Economy", "Cost Projection", "Our Pick"].map((f) => (
            <span key={f} className="inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-neutral-100 dark:bg-neutral-800 px-4 py-1.5 text-[10px] font-black text-foreground uppercase tracking-widest">
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* ═══ SECTION 1: PLAN SELECTION (now FIRST) ═══ */}
      <section className="mt-10 rounded-3xl border border-border bg-white/40 backdrop-blur-sm p-8 shadow-sm dark:border-zinc-800 dark:bg-black/40">
        <h2 className="text-lg font-bold text-foreground">Choose Your Plan</h2>
        <p className="mt-1 text-sm text-muted-foreground font-medium">
          Select the depth of analysis you need.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Free */}
          <button
            type="button"
            onClick={() => setSelectedPlan("free")}
            className={`relative flex flex-col rounded-2xl border p-6 text-left transition-all duration-300 ${selectedPlan === "free"
                ? "border-zinc-400 bg-white/60 shadow-xl scale-105 z-10 dark:border-zinc-600 dark:bg-black/60"
                : "border-border bg-white/20 hover:border-zinc-300 dark:border-zinc-800 dark:bg-black/20 dark:hover:border-zinc-700"
              }`}
          >
            {selectedPlan === "free" && (
              <div className="absolute -right-1.5 -top-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black shadow-lg">
                  <Check className="h-3.5 w-3.5" />
                </div>
              </div>
            )}
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Free</p>
            <div className="mt-2">
              <span className="text-3xl font-black text-foreground">$0</span>
              <span className="ml-1 text-[10px] text-muted-foreground font-black uppercase tracking-widest">/forever</span>
            </div>
            <div className="mt-6 flex-1 space-y-2 text-[11px] font-bold text-muted-foreground">
              <p className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-foreground" /> 2 properties</p>
              <p className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-foreground" /> Basic report</p>
              <p className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-foreground" /> 3 of 11 sections</p>
            </div>
          </button>

          {/* Full Report */}
          <button
            type="button"
            onClick={() => setSelectedPlan("car_single")}
            className={`relative flex flex-col rounded-2xl border p-6 text-left transition-all duration-300 ${selectedPlan === "car_single"
                ? "border-zinc-400 bg-white/60 shadow-xl scale-105 z-10 dark:border-zinc-600 dark:bg-black/60"
                : "border-border bg-white/20 hover:border-zinc-300 dark:border-zinc-800 dark:bg-black/20 dark:hover:border-zinc-700"
              }`}
          >
            {selectedPlan === "car_single" && (
              <div className="absolute -right-1.5 -top-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black shadow-lg">
                  <Check className="h-3.5 w-3.5" />
                </div>
              </div>
            )}
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Standard</p>
            <div className="mt-2">
              <span className="text-3xl font-black text-foreground">$4.99</span>
              <span className="ml-1 text-[10px] text-muted-foreground font-black uppercase tracking-widest">/one-time</span>
            </div>
            <div className="mt-6 flex-1 space-y-2 text-[11px] font-bold text-muted-foreground">
              <p className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-foreground" /> 2 properties</p>
              <p className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-foreground" /> All 11 sections</p>
              <p className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-foreground" /> Charts & Picks</p>
              <p className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-foreground" /> PDF Download</p>
            </div>
          </button>

          {/* Pro Report */}
          <button
            type="button"
            onClick={() => setSelectedPlan("car_pro_report")}
            className={`relative flex flex-col rounded-2xl border pt-10 p-6 text-left transition-all duration-300 ${
              selectedPlan === "car_pro_report"
                ? "border-primary/20 bg-primary/5 ring-1 ring-primary/20 scale-105 z-10 shadow-2xl dark:border-primary/30 dark:bg-primary/10"
                : "border-border bg-white/20 hover:border-zinc-300 dark:border-zinc-800 dark:bg-black/20"
            }`}
          >
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-5 py-2 text-[9px] font-black uppercase tracking-widest text-white shadow-xl">
              MOST POPULAR
            </span>
            {selectedPlan === "car_pro_report" && (
              <div className="absolute -right-1.5 -top-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                  <Check className="h-3.5 w-3.5" />
                </div>
              </div>
            )}
            <p className={`text-[10px] font-extrabold uppercase tracking-[0.2em] ${selectedPlan === "car_pro_report" ? "text-primary/60 font-black" : "text-zinc-500"}`}>Pro Report</p>
            <div className={`mt-2 ${selectedPlan === "car_pro_report" ? "text-primary font-black" : "text-foreground"}`}>
              <span className="text-3xl font-black">$9.99</span>
              <span className="ml-1 text-[10px] font-black uppercase tracking-widest opacity-60">/one-time</span>
            </div>
            <div className={`mt-6 flex-1 space-y-2 text-[11px] font-bold ${selectedPlan === "car_pro_report" ? "text-primary/80" : "text-muted-foreground"}`}>
              <p className="flex items-center gap-2"><Check className={`h-3.5 w-3.5 shrink-0 ${selectedPlan === "car_pro_report" ? "text-primary" : ""}`} /> Up to 4 cars</p>
              <p className="flex items-center gap-2"><Check className={`h-3.5 w-3.5 shrink-0 ${selectedPlan === "car_pro_report" ? "text-primary" : ""}`} /> All 11 sections</p>
              <p className="flex items-center gap-2"><Check className={`h-3.5 w-3.5 shrink-0 ${selectedPlan === "car_pro_report" ? "text-primary" : ""}`} /> Charts & Picks</p>
              <p className="flex items-center gap-2"><Check className={`h-3.5 w-3.5 shrink-0 ${selectedPlan === "car_pro_report" ? "text-primary" : ""}`} /> PDF Download</p>
            </div>
          </button>

          {/* Pro 10 */}
          <button
            type="button"
            onClick={() => setSelectedPlan("car_pro10")}
            className={`relative flex flex-col rounded-2xl border p-6 text-left transition-all duration-300 ${selectedPlan === "car_pro10"
                ? "border-zinc-400 bg-white/60 shadow-xl scale-105 z-10 dark:border-zinc-600 dark:bg-black/60"
                : "border-border bg-white/20 hover:border-zinc-300 dark:border-zinc-800 dark:bg-black/20 dark:hover:border-zinc-700"
              }`}
          >
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-500 px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-white shadow-xl">
              BEST VALUE
            </span>
            {selectedPlan === "car_pro10" && (
              <div className="absolute -right-1.5 -top-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black shadow-lg">
                  <Check className="h-3.5 w-3.5" />
                </div>
              </div>
            )}
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Pro 10</p>
            <div className="mt-2">
              <span className="text-3xl font-black text-foreground">$54.99</span>
              <span className="ml-1 text-[10px] text-muted-foreground font-black uppercase tracking-widest">/bundle</span>
            </div>
            <div className="mt-1">
              <span className="rounded-full bg-foreground px-2 py-0.5 text-[8px] font-black text-background leading-tight uppercase tracking-widest">40% OFF</span>
            </div>
            <div className="mt-4 flex-1 space-y-2 text-[11px] font-bold text-muted-foreground">
              <p className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-foreground" /> 10 Pro reports</p>
              <p className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-foreground" /> Up to 4 cars each</p>
              <p className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-foreground" /> Credits never expire</p>
            </div>
          </button>
        </div>

        {/* Plan downgrade warning */}
        {planDowngradeWarning && (
          <div className="mt-6 rounded-2xl border border-black dark:border-white bg-black/5 dark:bg-white/5 px-5 py-4 text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            {planDowngradeWarning}
          </div>
        )}
      </section>

      {/* ═══ SECTION 2: URL INPUT ═══ */}
      <section className="mt-8 rounded-3xl border border-border bg-card p-8 shadow-sm">
        <h2 className="flex items-center gap-3 text-xl font-extrabold text-foreground tracking-tight">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black dark:bg-white text-white dark:text-black shadow-lg">
            <Link2 className="h-5 w-5" />
          </div>
          Car Listing URLs
        </h2>

        <div className="mt-8 space-y-6">
          {urls.map((url, i) => (
            <div key={i} className="group transition-all">
              <div className="flex items-center gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-black bg-black text-white dark:bg-white dark:text-black shadow-md transition-transform group-focus-within:scale-110">
                  {i + 1}
                </span>
                <div className="relative flex-1">
                  <div className={`flex items-center rounded-2xl border bg-neutral-50 dark:bg-neutral-900 px-5 py-4 focus-within:border-black dark:focus-within:border-white focus-within:ring-4 focus-within:ring-black/5 dark:focus-within:ring-white/5 transition-all ${urlErrors[i] || urlScrapeErrors[i] ? "border-red-500" : "border-border"
                    }`}>
                    <input
                      id={`url-${i}`}
                      type="url"
                      value={url}
                      onChange={(e) => updateUrl(i, e.target.value)}
                      placeholder={i === 0 ? "Paste Vehicle 1 URL" : i === 1 ? "Paste Vehicle 2 URL" : "Paste another car URL"}
                      className="w-full bg-transparent text-sm font-bold text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                    />
                  </div>
                </div>
                {i >= 2 && (
                  <button
                    type="button"
                    onClick={() => removeUrl(i)}
                    className="rounded-full p-2.5 text-muted-foreground transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {urlErrors[i] && (
                <p className="ml-12 mt-2 text-[11px] font-bold text-red-500 flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {urlErrors[i]}
                </p>
              )}

              {urlScrapeErrors[i] && (
                <div className="ml-12 mt-3">
                  <div className="flex items-start gap-3 rounded-2xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20 px-4 py-4">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-widest">
                        Listing Scrape Failed
                      </p>
                      <p className="mt-1 text-sm text-red-700/80 dark:text-red-400/80 font-medium">{urlScrapeErrors[i]}</p>
                    </div>
                  </div>
                  {!inlineManual[i] ? (
                    <button
                      type="button"
                      onClick={() => showInlineManual(i)}
                      className="mt-3 inline-flex items-center gap-2 text-[11px] font-black text-black dark:text-white uppercase tracking-[0.2em] hover:underline"
                    >
                      Enter details manually
                    </button>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-border bg-neutral-50 dark:bg-neutral-900 p-6 shadow-sm">
                      <p className="mb-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
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
          <button
            className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-dashed border-border px-6 py-3.5 text-xs font-black text-muted-foreground uppercase tracking-widest transition-all hover:border-black hover:text-black dark:hover:border-white dark:hover:text-white"
            onClick={addUrl}
          >
            <Plus className="h-4 w-4" />
            Add Another Car
          </button>
        ) : isAtPlanLimit && urls.length < 4 ? (
          <div className="mt-6 rounded-2xl border border-border bg-neutral-50 dark:bg-neutral-900 px-5 py-4">
            {canMultiCar ? (
              <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <Lock className="h-4 w-4" />
                Plan limit reached (4 cars max)
              </span>
            ) : (
              <span className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Upgrade to Pro to compare 4 cars
                </div>
                <button type="button" onClick={() => setSelectedPlan("car_pro_report")} className="font-black text-black dark:text-white underline decoration-2 underline-offset-4">
                  Upgrade Now
                </button>
              </span>
            )}
          </div>
        ) : null}

        <p className="mt-8 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
          Works with {EXAMPLE_SITES}
        </p>
      </section>

      {/* ═══ SECTION 3: MANUAL ENTRY (standalone) ═══ */}
      <section className="mt-8 rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        <Collapsible
          open={manualOpen}
          onOpenChange={setManualOpen}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between px-8 py-5 text-sm font-medium transition-all hover:bg-neutral-50 dark:hover:bg-neutral-900">
            <span className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-muted-foreground">
                <Car className="h-5 w-5" />
              </div>
              <span className="text-lg font-extrabold text-foreground tracking-tight">Enter Details Manually Instead</span>
            </span>
            <ChevronDown className={`h-5 w-5 transition-transform duration-500 ${manualOpen ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t border-border px-8 pb-8 pt-6">
            {isAtPlanLimit && (
              <div className="mb-6 rounded-3xl border border-black/10 bg-neutral-100 dark:bg-neutral-800 px-6 py-5 text-[10px] font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-4 shadow-sm">
                <AlertCircle className="h-6 w-6 shrink-0 text-black dark:text-white" />
                <div className="flex-1 flex items-center justify-between">
                  <span>Plan limit reached (4 cars max).</span>
                  {!canMultiCar && (
                    <button
                      type="button"
                      onClick={() => setSelectedPlan("car_pro_report")}
                      className="rounded-full bg-black px-4 py-2 text-white dark:bg-white dark:text-black shadow-lg transition-transform hover:scale-105 active:scale-95"
                    >
                      Upgrade
                    </button>
                  )}
                </div>
              </div>
            )}
            {manualEntries.map((entry, idx) => (
              <div key={idx} className="mb-8 last:mb-0">
                <div className="mb-4 flex items-center justify-between px-2">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Vehicle {idx + 1}</span>
                  {manualEntries.length > 2 && idx >= 2 && (
                    <button type="button" onClick={() => removeManualEntry(idx)} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">
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
              <button className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-dashed border-border px-6 py-3.5 text-xs font-black text-muted-foreground uppercase tracking-widest transition-all hover:border-black hover:text-black dark:hover:border-white dark:hover:text-white" onClick={addManualEntry}>
                <Plus className="h-4 w-4" />
                Add Another Car
              </button>
            ) : isAtPlanLimit && manualEntries.length < 4 ? (
              <div className="mt-4 rounded-2xl border border-border bg-neutral-50 dark:bg-neutral-900 px-5 py-4">
                {canMultiCar ? (
                  <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <Lock className="h-4 w-4" />
                    Plan limit reached (4 cars max)
                  </span>
                ) : (
                  <span className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Upgrade to Pro to compare 4 cars
                    </div>
                    <button type="button" onClick={() => setSelectedPlan("car_pro_report")} className="font-black text-black dark:text-white underline decoration-2 underline-offset-4">
                      Upgrade Now
                    </button>
                  </span>
                )}
              </div>
            ) : null}
          </CollapsibleContent>
        </Collapsible>
      </section>

      {/* ═══ SECTION 4: PREFERENCES ═══ */}
      <section className="mt-8 rounded-3xl border border-border bg-card p-8 shadow-sm">
        <h2 className="text-xl font-extrabold text-foreground tracking-tight">Your Preferences</h2>
        <p className="mt-1 text-sm text-muted-foreground font-medium">
          Help us tailor the analysis to what matters most to you.
        </p>

        {/* Priorities -- pill chips */}
        <div className="mt-10">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
            Primary Focus
          </p>
          <p className="mb-4 text-xs font-bold text-foreground/40">Select up to 3</p>
          <div className="flex flex-wrap gap-2.5">
            {PRIORITIES.map((p) => {
              const isSelected = priorities.includes(p.value);
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => togglePriority(p.value)}
                  className={`inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border-2 px-6 py-3 text-sm font-black transition-all duration-300 ${isSelected
                      ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-xl scale-105"
                      : "border-border bg-neutral-50 dark:bg-neutral-900 text-muted-foreground hover:border-black/20 dark:hover:border-white/20"
                    }`}
                >
                  {p.icon}
                  {p.value}
                </button>
              );
            })}
          </div>
        </div>

        {/* Budget -- card select */}
        <div className="mt-12">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Budget Strategy</p>
          <p className="mb-4 text-xs font-bold text-foreground/40">How important is price?</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {BUDGET_OPTIONS.map((opt) => {
              const isSelected = budget === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBudget(opt.value)}
                  className={`relative rounded-2xl border-2 p-6 text-left transition-all duration-300 ${isSelected
                      ? "border-black dark:border-white bg-neutral-50 dark:bg-neutral-900 shadow-xl ring-4 ring-black/5 dark:ring-white/5"
                      : "border-border bg-background hover:border-black/10 dark:hover:border-white/10"
                    }`}
                >
                  {isSelected && (
                    <div className="absolute -right-2 -top-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black shadow-lg">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                  <div className={`${isSelected ? "text-foreground" : "text-muted-foreground/50"}`}>
                    {opt.icon}
                  </div>
                  <p className={`mt-4 text-sm font-black uppercase tracking-widest ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                    {opt.label}
                  </p>
                  <p className="mt-1 text-[11px] font-bold text-muted-foreground leading-relaxed">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Usage -- pill row */}
        <div className="mt-12">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Usage Profile</p>
          <p className="mb-4 text-xs font-bold text-foreground/40">Primary use case</p>
          <div className="flex flex-wrap gap-2.5">
            {USAGE_OPTIONS.map((opt) => {
              const isSelected = usage === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setUsage(opt.value)}
                  className={`inline-flex items-center gap-2.5 rounded-full border-2 px-6 py-3 text-sm font-black transition-all duration-300 ${isSelected
                      ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-xl scale-105"
                      : "border-border bg-neutral-50 dark:bg-neutral-900 text-muted-foreground hover:border-black/20 dark:hover:border-white/20"
                    }`}
                >
                  {opt.icon}
                  {opt.value}
                </button>
              );
            })}
          </div>
        </div>

        {/* Keep duration -- pill row */}
        <div className="mt-12">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Ownership Period</p>
          <p className="mb-4 text-xs font-bold text-foreground/40">Affects depreciation projections</p>
          <div className="flex flex-wrap gap-2.5">
            {KEEP_OPTIONS.map((opt) => {
              const isSelected = keepDuration === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setKeepDuration(opt.value)}
                  className={`inline-flex items-center gap-2.5 rounded-full border-2 px-6 py-3 text-sm font-black transition-all duration-300 ${isSelected
                      ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-xl scale-105"
                      : "border-border bg-neutral-50 dark:bg-neutral-900 text-muted-foreground hover:border-black/20 dark:hover:border-white/20"
                    }`}
                >
                  {opt.icon}
                  {opt.label}
                  {"desc" in opt && opt.desc && (
                    <span className={`text-[10px] opacity-60`}>
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
      <div className="mt-12">
        <button
          onClick={handleGenerate}
          disabled={isTooManyCars || submitting || redirectingToStripe}
          className="w-full h-20 rounded-full bg-black text-white dark:bg-white dark:text-black text-xl font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {submitting || redirectingToStripe ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>{redirectingToStripe ? "Redirecting..." : "Generating..."}</span>
            </>
          ) : (
            <>
              <Car className="h-6 w-6" />
              <span>Generate My Report</span>
            </>
          )}
        </button>
        <p className="mt-6 text-center text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40">
          {selectedPlan === "free"
            ? "Takes about 45-90 seconds for deep analysis."
            : "Complete payment to unlock full comparison results."}
        </p>
      </div>

      {/* ═══ API ERROR ═══ */}
      {apiError && (
        <div className="mt-10 rounded-3xl border-2 border-black dark:border-white bg-neutral-50 dark:bg-neutral-900 p-8 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Something went wrong</h3>
              <p className="mt-2 text-sm font-bold text-muted-foreground leading-relaxed">{apiError}</p>
              <button
                onClick={handleGenerate}
                className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-black px-8 text-xs font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-neutral-800 dark:bg-white dark:text-black"
                disabled={submitting}
              >
                {submitting ? "Trying..." : "Try again"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
