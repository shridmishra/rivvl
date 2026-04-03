"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import type { ManualCarEntry } from "@/types";

/* ═══════════════════════════════════════════════════════════════════════ */
/*                         NHTSA API HELPERS                              */
/* ═══════════════════════════════════════════════════════════════════════ */

interface NHTSAMake {
  MakeId: number;
  MakeName: string;
}

interface NHTSAModel {
  Model_ID: number;
  Model_Name: string;
}

// Module-level cache so repeat selections don't re-fetch
const makeCache: Record<string, NHTSAMake[]> = {};
const modelCache: Record<string, NHTSAModel[]> = {};

const MIN_YEAR = 2000;
const MAX_YEAR = new Date().getFullYear() + 1;
const YEARS = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) =>
  String(MAX_YEAR - i)
);

const OTHER_SENTINEL = "__OTHER__";

async function fetchMakes(): Promise<NHTSAMake[]> {
  const cacheKey = "all_makes";
  if (makeCache[cacheKey]) return makeCache[cacheKey];

  const res = await fetch(
    "https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json"
  );
  if (!res.ok) throw new Error("Failed to fetch makes");
  const data = await res.json();
  const makes: NHTSAMake[] = (data.Results || []).sort(
    (a: NHTSAMake, b: NHTSAMake) =>
      a.MakeName.localeCompare(b.MakeName)
  );
  makeCache[cacheKey] = makes;
  return makes;
}

async function fetchModels(make: string, year: string): Promise<NHTSAModel[]> {
  const cacheKey = `${year}_${make}`;
  if (modelCache[cacheKey]) return modelCache[cacheKey];

  // Use the broader endpoint without vehicletype filter so SUVs, trucks,
  // crossovers, and vans are all included — not just passenger cars
  const res = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`
  );
  if (!res.ok) throw new Error("Failed to fetch models");
  const data = await res.json();

  // Deduplicate by model name (case-insensitive) and sort alphabetically
  const seen = new Set<string>();
  const models: NHTSAModel[] = (data.Results || [])
    .filter((m: NHTSAModel) => {
      const name = m.Model_Name?.trim();
      if (!name || seen.has(name.toLowerCase())) return false;
      seen.add(name.toLowerCase());
      return true;
    })
    .sort((a: NHTSAModel, b: NHTSAModel) =>
      a.Model_Name.localeCompare(b.Model_Name)
    );
  modelCache[cacheKey] = models;
  return models;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                      DROPDOWN SELECT COMPONENT                        */
/* ═══════════════════════════════════════════════════════════════════════ */

function SelectDropdown({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  loading,
  error,
  fallbackInput,
  showOther,
  isOtherMode,
  onOtherToggle,
}: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  fallbackInput?: boolean;
  showOther?: boolean;
  isOtherMode?: boolean;
  onOtherToggle?: (other: boolean) => void;
}) {
  // If in "Other" mode, show a text input with "Back to list" link
  if (isOtherMode) {
    return (
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder.replace("Select", "Enter").replace(" *", "") + " *"}
          className={`w-full rounded-lg border bg-white dark:bg-neutral-900 px-3 py-2 text-sm dark:text-gray-100 placeholder:text-muted-foreground/40 focus:outline-none focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black dark:focus:border-white disabled:cursor-not-allowed disabled:opacity-50 ${
            error ? "border-red-500" : "border-border"
          }`}
        />
        <button
          type="button"
          onClick={() => onOtherToggle?.(false)}
          className="mt-1 text-[10px] font-black uppercase tracking-widest text-foreground/40 hover:text-foreground hover:underline"
        >
          Back to list
        </button>
      </div>
    );
  }

  // If in fallback mode (API failed), render a text input
  if (fallbackInput) {
    return (
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder.replace("Select", "Enter")}
          className="w-full rounded-lg border border-border bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm dark:text-gray-100 placeholder:text-muted-foreground/40 focus:outline-none focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black dark:focus:border-white disabled:cursor-not-allowed disabled:opacity-50"
        />
        <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
          Manual Entry required
        </p>
      </div>
    );
  }

  const handleChange = (val: string) => {
    if (val === OTHER_SENTINEL) {
      onOtherToggle?.(true);
      onChange("");
      return;
    }
    onChange(val);
  };

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled || loading}
        className={`w-full appearance-none rounded-lg border bg-white dark:bg-neutral-900 px-3 py-2 pr-8 text-sm dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black dark:focus:border-white ${
          disabled
            ? "cursor-not-allowed border-border text-muted-foreground/30"
            : error
              ? "border-red-500"
              : "border-border"
        } ${!value ? "text-muted-foreground/40" : ""}`}
      >
        <option value="">{loading ? "Loading..." : placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
        {showOther && !loading && (
          <option value={OTHER_SENTINEL}>Other</option>
        )}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                  NHTSA CAR FIELDS (MAIN COMPONENT)                    */
/* ═══════════════════════════════════════════════════════════════════════ */

interface NHTSACarFieldsProps {
  entry: ManualCarEntry;
  onChange: (field: keyof ManualCarEntry, value: string) => void;
  onBlur?: (field: keyof ManualCarEntry) => void;
  errors?: Partial<Record<keyof ManualCarEntry, string>>;
  disabled?: boolean;
}

export function NHTSACarFields({
  entry,
  onChange,
  onBlur,
  errors,
  disabled,
}: NHTSACarFieldsProps) {
  // NHTSA data
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);

  // Loading / error states
  const [makesLoading, setMakesLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [makesFailed, setMakesFailed] = useState(false);
  const [modelsFailed, setModelsFailed] = useState(false);

  // "Other" mode for make and model
  const [makeOther, setMakeOther] = useState(false);
  const [modelOther, setModelOther] = useState(false);

  // Track if makes have been loaded at least once
  const makesLoaded = useRef(false);

  // Load makes when a year is selected
  const loadMakes = useCallback(async () => {
    if (makesLoaded.current && makes.length > 0) return;
    setMakesLoading(true);
    setMakesFailed(false);
    try {
      const result = await fetchMakes();
      setMakes(result.map((m) => m.MakeName));
      makesLoaded.current = true;
    } catch {
      setMakesFailed(true);
    } finally {
      setMakesLoading(false);
    }
  }, [makes.length]);

  // Load models when make + year are selected
  const loadModels = useCallback(async (make: string, year: string) => {
    if (!make || !year) return;
    setModelsLoading(true);
    setModelsFailed(false);
    try {
      const result = await fetchModels(make, year);
      setModels(result.map((m) => m.Model_Name));
    } catch {
      setModelsFailed(true);
    } finally {
      setModelsLoading(false);
    }
  }, []);

  // When year changes, load makes
  useEffect(() => {
    if (entry.year) {
      loadMakes();
    }
  }, [entry.year, loadMakes]);

  // When make changes, load models (only if not in "Other" mode)
  useEffect(() => {
    if (entry.make && entry.year && !makeOther) {
      loadModels(entry.make, entry.year);
    }
  }, [entry.make, entry.year, loadModels, makeOther]);

  const handleYearChange = (value: string) => {
    onChange("year", value);
    // Reset children
    onChange("make", "");
    onChange("model", "");
    onChange("trim", "");
    setModels([]);
    setMakeOther(false);
    setModelOther(false);
  };

  const handleMakeChange = (value: string) => {
    onChange("make", value);
    // Reset children
    onChange("model", "");
    onChange("trim", "");
    setModels([]);
    // If not in Other mode for make, reset model Other mode too
    if (!makeOther) {
      setModelOther(false);
    }
  };

  const handleMakeOtherToggle = (other: boolean) => {
    setMakeOther(other);
    onChange("make", "");
    onChange("model", "");
    onChange("trim", "");
    setModels([]);
    if (other) {
      // When make is "Other", model must also be manual
      setModelOther(true);
    } else {
      setModelOther(false);
    }
  };

  const handleModelChange = (value: string) => {
    onChange("model", value);
    // Reset trim
    onChange("trim", "");
  };

  const handleModelOtherToggle = (other: boolean) => {
    setModelOther(other);
    onChange("model", "");
    onChange("trim", "");
  };

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {/* Year dropdown (hardcoded) */}
      <div>
        <SelectDropdown
          value={entry.year}
          onChange={handleYearChange}
          options={YEARS}
          placeholder="Year *"
          disabled={disabled}
          error={!!errors?.year}
        />
        {errors?.year && (
          <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-red-500">{errors.year}</p>
        )}
      </div>

      {/* Make dropdown (NHTSA) with "Other" option */}
      <div>
        <SelectDropdown
          value={entry.make}
          onChange={handleMakeChange}
          options={makes}
          placeholder={entry.year ? "Make *" : "Select year first"}
          disabled={disabled || !entry.year}
          loading={makesLoading}
          error={!!errors?.make}
          fallbackInput={makesFailed}
          showOther={!makesFailed}
          isOtherMode={makeOther}
          onOtherToggle={handleMakeOtherToggle}
        />
        {errors?.make && (
          <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-red-500">{errors.make}</p>
        )}
      </div>

      {/* Model dropdown (NHTSA) with "Other" option */}
      <div>
        <SelectDropdown
          value={entry.model}
          onChange={handleModelChange}
          options={models}
          placeholder={entry.make ? "Model *" : "Select make first"}
          disabled={disabled || (!entry.make && !makeOther)}
          loading={modelsLoading}
          error={!!errors?.model}
          fallbackInput={modelsFailed && !makeOther}
          showOther={!modelsFailed && !makeOther}
          isOtherMode={modelOther}
          onOtherToggle={handleModelOtherToggle}
        />
        {errors?.model && (
          <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-red-500">{errors.model}</p>
        )}
      </div>

      {/* Trim — always text input (NHTSA doesn't reliably have trims) */}
      <div>
        <input
          placeholder="Trim"
          value={entry.trim}
          onChange={(e) => onChange("trim", e.target.value)}
          onBlur={() => onBlur?.("trim")}
          disabled={disabled}
          maxLength={30}
          className={`w-full rounded-lg border bg-white dark:bg-neutral-900 px-3 py-2 text-sm dark:text-gray-100 placeholder:text-muted-foreground/40 focus:outline-none focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black dark:focus:border-white disabled:cursor-not-allowed disabled:opacity-50 ${
            errors?.trim ? "border-red-500" : "border-border"
          }`}
        />
        {errors?.trim && (
          <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-red-500">{errors.trim}</p>
        )}
      </div>

      {/* Mileage */}
      <div>
        <input
          placeholder="Mileage"
          value={entry.mileage}
          onChange={(e) => onChange("mileage", e.target.value)}
          onBlur={() => onBlur?.("mileage")}
          disabled={disabled}
          inputMode="numeric"
          className={`w-full rounded-lg border bg-white dark:bg-neutral-900 px-3 py-2 text-sm dark:text-gray-100 placeholder:text-muted-foreground/40 focus:outline-none focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black dark:focus:border-white disabled:cursor-not-allowed disabled:opacity-50 ${
            errors?.mileage ? "border-red-500" : "border-border"
          }`}
        />
        {errors?.mileage && (
          <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-red-500">{errors.mileage}</p>
        )}
      </div>

      {/* Price */}
      <div>
        <input
          placeholder="Price"
          value={entry.price}
          onChange={(e) => onChange("price", e.target.value)}
          onBlur={() => onBlur?.("price")}
          disabled={disabled}
          inputMode="numeric"
          className={`w-full rounded-lg border bg-white dark:bg-neutral-900 px-3 py-2 text-sm dark:text-gray-100 placeholder:text-muted-foreground/40 focus:outline-none focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black dark:focus:border-white disabled:cursor-not-allowed disabled:opacity-50 ${
            errors?.price ? "border-red-500" : "border-border"
          }`}
        />
        {errors?.price && (
          <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-red-500">{errors.price}</p>
        )}
      </div>

      {/* VIN */}
      <div className="col-span-2">
        <input
          placeholder="VIN (optional)"
          value={entry.vin}
          onChange={(e) => onChange("vin", e.target.value.toUpperCase())}
          onBlur={() => onBlur?.("vin")}
          disabled={disabled}
          maxLength={17}
          className={`w-full rounded-lg border bg-white dark:bg-neutral-900 px-3 py-2 text-sm dark:text-gray-100 placeholder:text-muted-foreground/40 focus:outline-none focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black dark:focus:border-white disabled:cursor-not-allowed disabled:opacity-50 ${
            errors?.vin ? "border-red-500" : "border-border"
          }`}
        />
        {errors?.vin && (
          <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-red-500">{errors.vin}</p>
        )}
      </div>
    </div>
  );
}
