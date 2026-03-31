/**
 * Shared vehicle color palette — used across ALL charts, legends, and color-coded UI.
 * Import this everywhere instead of hardcoding colors.
 */

// Primary chart colors for up to 4 vehicles
export const VEHICLE_COLORS = [
  "#6C5CE7", // Electric Purple (rivvl brand)
  "#FF6B35", // Vivid Orange
  "#00CEC9", // Teal/Cyan
  "#FDCB6E", // Amber/Yellow
] as const;

// Light background tints (for cards, highlights)
export const VEHICLE_LIGHT_COLORS = [
  "#F3F0FF", // Light purple
  "#FFF4EE", // Light orange
  "#E8FFFE", // Light teal
  "#FFF9E6", // Light amber
] as const;

// Tailwind border classes with dark mode
export const VEHICLE_BORDER_CLASSES = [
  "border-purple-200 dark:border-purple-700",
  "border-orange-200 dark:border-orange-700",
  "border-teal-200 dark:border-teal-700",
  "border-amber-200 dark:border-amber-700",
] as const;

// Tailwind background classes with dark mode
export const VEHICLE_BG_CLASSES = [
  "bg-purple-50/30 dark:bg-purple-900/20",
  "bg-orange-50/30 dark:bg-orange-900/20",
  "bg-teal-50/30 dark:bg-teal-900/20",
  "bg-amber-50/30 dark:bg-amber-900/20",
] as const;

// Tailwind text color classes
export const VEHICLE_TEXT_CLASSES = [
  "text-purple-700 dark:text-purple-300",
  "text-orange-700 dark:text-orange-300",
  "text-teal-700 dark:text-teal-300",
  "text-amber-700 dark:text-amber-300",
] as const;

// Tailwind icon color classes
export const VEHICLE_ICON_CLASSES = [
  "text-purple-400 dark:text-purple-300",
  "text-orange-400 dark:text-orange-300",
  "text-teal-400 dark:text-teal-300",
  "text-amber-400 dark:text-amber-300",
] as const;

// Tailwind pill background classes
export const VEHICLE_PILL_BG = [
  "bg-purple-100 dark:bg-purple-900/30",
  "bg-orange-100 dark:bg-orange-900/30",
  "bg-teal-100 dark:bg-teal-900/30",
  "bg-amber-100 dark:bg-amber-900/30",
] as const;

/**
 * Data safety helpers
 */

/** Returns true if a numeric value is valid (not null, undefined, -1, or NaN) */
export function isValidNumeric(val: number | null | undefined): val is number {
  return val != null && !isNaN(val) && val >= 0;
}

/** Format a dollar amount safely — returns "N/A" for invalid values */
export function safeDollars(val: number | null | undefined): string {
  if (!isValidNumeric(val)) return "N/A";
  return `$${val.toLocaleString()}`;
}

/** Format a numeric value with suffix safely — returns "N/A" for invalid values */
export function safeNumeric(val: number | null | undefined, suffix = ""): string {
  if (!isValidNumeric(val)) return "N/A";
  return `${val}${suffix}`;
}
