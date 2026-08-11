import type { AlertLevel, Category } from "./types";

// Status colors are fixed and reserved (dataviz skill, references/palette.md) - never themed, never
// reused for chart series identity, always shipped with an icon + label (never color alone, since
// "warning"/"serious" sit below 3:1 contrast on the light surface by design).
export const STATUS_COLOR = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
} as const;

export type StatusRole = keyof typeof STATUS_COLOR;

// AQI category -> status role. Direct one-to-one mapping (ARCHITECTURE.md §4.3's four bands are
// literally a good->critical severity scale).
const CATEGORY_TO_STATUS: Record<Category, StatusRole> = {
  Good: "good",
  Moderate: "warning",
  Unhealthy: "serious",
  Hazardous: "critical",
};

// Alert level -> status role. Alerts only ever fire at Moderate/Unhealthy/Hazardous-equivalent
// severity (ARCHITECTURE.md §5 - Info/Warning/Critical map to those same three bands), so "good"
// never appears here; there is no such thing as a "Good" alert.
const ALERT_LEVEL_TO_STATUS: Record<AlertLevel, StatusRole> = {
  Info: "warning",
  Warning: "serious",
  Critical: "critical",
};

export function categoryStatus(category: Category): StatusRole {
  return CATEGORY_TO_STATUS[category];
}

export function alertLevelStatus(level: AlertLevel): StatusRole {
  return ALERT_LEVEL_TO_STATUS[level];
}

export function categoryColor(category: Category): string {
  return STATUS_COLOR[categoryStatus(category)];
}

export function alertLevelColor(level: AlertLevel): string {
  return STATUS_COLOR[alertLevelStatus(level)];
}

// Tailwind-safe class lookups (Tailwind can't see dynamically-built class strings at build time, so
// these are written as full literal class names rather than template-interpolated).
export const STATUS_BG_CLASS: Record<StatusRole, string> = {
  good: "bg-status-good",
  warning: "bg-status-warning",
  serious: "bg-status-serious",
  critical: "bg-status-critical",
};

export const STATUS_TEXT_CLASS: Record<StatusRole, string> = {
  good: "text-status-good",
  warning: "text-status-warning",
  serious: "text-status-serious",
  critical: "text-status-critical",
};

export const STATUS_BORDER_CLASS: Record<StatusRole, string> = {
  good: "border-status-good",
  warning: "border-status-warning",
  serious: "border-status-serious",
  critical: "border-status-critical",
};

// Tinted background "wash" (low-opacity status color, via Tailwind's built-in color/opacity
// modifier) - a lighter-touch alternative to a solid fill, used for stat-tile backgrounds and the
// "soft" badge variant so the dashboard reads as more colorful without every status indicator being
// a heavy solid block. Text/icon still carries the actual status signal (STATUS_TEXT_CLASS/StatusIcon)
// per the dataviz skill's "never color alone" rule - the wash is a supplementary accent, not the
// sole encoding.
export const STATUS_WASH_CLASS: Record<StatusRole, string> = {
  good: "bg-status-good/10",
  warning: "bg-status-warning/10",
  serious: "bg-status-serious/10",
  critical: "bg-status-critical/10",
};
