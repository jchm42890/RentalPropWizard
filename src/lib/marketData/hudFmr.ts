/**
 * HUD Fair Market Rents (FMR) API
 *
 * HUD publishes Fair Market Rents annually for every county/metro in the US,
 * broken down by bedroom count (0–4 BR). These are professionally calibrated,
 * ZIP-level accurate, and far more reliable than Census ACS for rental pricing.
 *
 * Note: FMR represents the ~40th percentile of rents — i.e. the low end of the
 * market. The true market median is roughly 15–20% above FMR. We correct for
 * this when generating comps.
 *
 * Free token (no credit card): https://www.huduser.gov/hudapi/public/token
 * Set env var: HUD_API_TOKEN
 *
 * Docs: https://www.huduser.gov/portal/dataset/fmr-api.html
 */

const HUD_BASE = "https://www.huduser.gov/hudapi/public";

// ─── Response types ───────────────────────────────────────────────────────────

interface HudCrosswalkResponse {
  data?: {
    results?: Array<{
      zip?: string;
      geoid?: string;   // county FIPS (e.g. "06037")
      state?: string;
      county?: string;
      tot_ratio?: number;
    }>;
  };
}

interface HudFmrResponse {
  data?: {
    metroarea_name?: string;
    county_name?: string;
    countyname?: string;
    basicdata?: {
      Efficiency?: number;
      "Zero-Bedroom"?: number;
      "One-Bedroom"?: number;
      "Two-Bedroom"?: number;
      "Three-Bedroom"?: number;
      "Four-Bedroom"?: number;
    };
    year?: string;
  };
  query?: string;
}

// ─── Public types ─────────────────────────────────────────────────────────────

export interface HudFmrResult {
  rent0br: number;
  rent1br: number;
  rent2br: number;
  rent3br: number;
  rent4br: number;
  areaName: string;
  year: string;
  countyFips: string;
  source: "hud_fmr";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** FMR is the 40th-percentile rent — market median is ~17% higher */
const FMR_TO_MEDIAN_FACTOR = 1.17;

export function hudFmrToMarketRent(fmr: HudFmrResult, beds: number): number {
  const fmrRent =
    beds <= 0 ? fmr.rent0br :
    beds === 1 ? fmr.rent1br :
    beds === 2 ? fmr.rent2br :
    beds === 3 ? fmr.rent3br :
    fmr.rent4br;

  return Math.round((fmrRent * FMR_TO_MEDIAN_FACTOR) / 25) * 25;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/** Step 1: ZIP → county GEOID via HUD USPS crosswalk */
async function zipToCountyGeoid(zipCode: string, token: string): Promise<string | null> {
  const url = `${HUD_BASE}/usps?type=2&query=${zipCode}&token=${token}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 604_800 }, // 1 week — county mapping is stable
    });
    if (!res.ok) return null;

    const data: HudCrosswalkResponse = await res.json();
    // Take the result with the highest tot_ratio (dominant county for this ZIP)
    const results = data?.data?.results ?? [];
    if (results.length === 0) return null;

    results.sort((a, b) => (b.tot_ratio ?? 0) - (a.tot_ratio ?? 0));
    return results[0].geoid ?? null;
  } catch {
    return null;
  }
}

/** Step 2: county GEOID → FMR data */
async function countyGeoidToFmr(geoid: string, token: string): Promise<HudFmrResult | null> {
  const url = `${HUD_BASE}/fmr/data/${geoid}?token=${token}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 604_800 }, // 1 week — FMR data is annual
    });
    if (!res.ok) return null;

    const data: HudFmrResponse = await res.json();
    const basic = data?.data?.basicdata;
    if (!basic) return null;

    return {
      rent0br: basic["Efficiency"] ?? basic["Zero-Bedroom"] ?? 0,
      rent1br: basic["One-Bedroom"] ?? 0,
      rent2br: basic["Two-Bedroom"] ?? 0,
      rent3br: basic["Three-Bedroom"] ?? 0,
      rent4br: basic["Four-Bedroom"] ?? 0,
      areaName:
        data.data?.metroarea_name ??
        data.data?.countyname ??
        data.data?.county_name ??
        "Unknown Area",
      year: data.data?.year ?? new Date().getFullYear().toString(),
      countyFips: geoid,
      source: "hud_fmr",
    };
  } catch {
    return null;
  }
}

// ─── Public entry point ───────────────────────────────────────────────────────

/**
 * Fetch HUD Fair Market Rents for a ZIP code.
 * Returns null if HUD_API_TOKEN is not set or the lookup fails.
 */
export async function fetchHudFmr(zipCode: string): Promise<HudFmrResult | null> {
  const token = process.env.HUD_API_TOKEN;
  if (!token) return null;

  const clean = zipCode.replace(/\D/g, "").slice(0, 5).padStart(5, "0");

  const geoid = await zipToCountyGeoid(clean, token);
  if (!geoid) return null;

  return countyGeoidToFmr(geoid, token);
}
