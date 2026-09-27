/**
 * Maps hospitality venues and logistics operators to their canonical Firestore & Auth userIds.
 */

export const BUSINESS_UID_MAP: Record<string, string> = {
  // ── 5 Vendors (Providers) ──
  "taj lands end": "usr_taj_lands_end",
  "taj": "usr_taj_lands_end",
  "itc maratha mumbai": "usr_itc_maratha",
  "itc maratha": "usr_itc_maratha",
  "itc": "usr_itc_maratha",
  "trident hotel bkc": "usr_trident_bkc",
  "trident bkc": "usr_trident_bkc",
  "trident": "usr_trident_bkc",
  "renaissance mumbai convention centre": "usr_renaissance_powai",
  "renaissance powai": "usr_renaissance_powai",
  "renaissance": "usr_renaissance_powai",
  "hotel sahara star": "usr_sahara_star",
  "sahara star": "usr_sahara_star",
  "sahara": "usr_sahara_star",

  // ── 5 Buyers (Seekers) ──
  "jio world convention centre": "usr_jio_convention",
  "jio world centre": "usr_jio_convention",
  "jio convention": "usr_jio_convention",
  "jio": "usr_jio_convention",
  "bombay gymkhana club": "usr_bombay_gymkhana",
  "bombay gymkhana": "usr_bombay_gymkhana",
  "nesco exhibition centre": "usr_nesco_goregaon",
  "nesco goregaon": "usr_nesco_goregaon",
  "nesco": "usr_nesco_goregaon",
  "the taj mahal palace": "usr_taj_colaba",
  "taj colaba": "usr_taj_colaba",
  "taj palace": "usr_taj_colaba",
  "blue sea banquets worli": "usr_blue_sea_worli",
  "blue sea": "usr_blue_sea_worli",
};

/**
 * Resolves a venue name, email, or identifier to its canonical userId.
 */
export function resolveBusinessUid(nameOrId?: string | null): string {
  if (!nameOrId) return "usr_taj_lands_end";
  if (nameOrId.startsWith("usr_") || nameOrId.startsWith("drv_")) return nameOrId;
  const lower = nameOrId.toLowerCase().trim();
  for (const [key, uid] of Object.entries(BUSINESS_UID_MAP)) {
    if (lower.includes(key) || key.includes(lower)) {
      return uid;
    }
  }
  return "usr_taj_lands_end";
}
