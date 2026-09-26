const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export type RentalWindow = { from?: string | null; to?: string | null };

export function rentalDays({ from, to }: RentalWindow) {
  if (!from || !to) return 1;
  const diff = new Date(to).getTime() - new Date(from).getTime();
  if (!Number.isFinite(diff) || diff <= 0) return 1;
  return Math.max(1, Math.ceil(diff / DAY));
}

export function rentalHours({ from, to }: RentalWindow) {
  if (!from || !to) return 1;
  const diff = new Date(to).getTime() - new Date(from).getTime();
  if (!Number.isFinite(diff) || diff <= 0) return 1;
  return Math.max(1, Math.ceil(diff / HOUR));
}

/**
 * Rough rental cost for a quantity over a window, used to pre-fill offers
 * and total up bundles. The provider can still counter.
 */
export function estimateCost(
  price: number,
  pricingUnit: string,
  quantity: number,
  window: RentalWindow,
) {
  switch (pricingUnit) {
    case "per_day":
      return price * rentalDays(window);
    case "per_hour":
      return price * rentalHours(window);
    case "per_item":
      return price * quantity;
    case "per_event":
      return price;
    case "per_item_per_day":
    default:
      return price * quantity * rentalDays(window);
  }
}

/** `datetime-local` value → ISO string (or null when empty). */
export function localInputToIso(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Date → `datetime-local` value in the person's timezone. */
export function toLocalInput(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
