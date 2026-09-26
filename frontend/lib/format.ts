const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function inr(value: number | null | undefined) {
  return inrFormatter.format(Number(value ?? 0));
}

export function shortDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function dateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function relativeTime(value: string | null | undefined) {
  if (!value) return "";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return shortDate(value);
}

/** "driver_assigned" → "Driver assigned" */
export function humanize(value: string | null | undefined) {
  if (!value) return "—";
  const text = value.replace(/[_-]+/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function pricingUnitLabel(unit: string | null | undefined) {
  switch (unit) {
    case "per_item_per_day":
      return "/ item / day";
    case "per_day":
      return "/ day";
    case "per_hour":
      return "/ hour";
    case "per_item":
      return "/ item";
    case "per_event":
      return "/ event";
    default:
      return unit ? `/ ${humanize(unit).toLowerCase()}` : "";
  }
}

export function initials(value: string | null | undefined, fallback = "U") {
  const text = (value ?? "").trim();
  if (!text) return fallback;
  const parts = text.split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function firstName(value: string | null | undefined) {
  return (value ?? "").trim().split(/\s+/)[0] || "there";
}

/** Local date as YYYY-MM-DD (not UTC, so "today" is the person's today). */
export function isoDate(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}
