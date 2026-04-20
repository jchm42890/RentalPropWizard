/**
 * Census Rent Data — ZIP-level with county fallback
 *
 * 1. Tries ACS5 B25058_001E (median contract rent) at the ZIP/ZCTA level.
 * 2. When ZIP data is suppressed (common for small areas), automatically
 *    falls back to county-level data via the Census Geocoder — completely
 *    free, no API key required.
 *
 * Docs: https://www.census.gov/data/developers/data-sets/acs-5year.html
 */

const ACS_YEAR = "2023";
const CENSUS_BASE = "https://api.census.gov/data";
const GEOCODER_BASE = "https://geocoding.geo.census.gov/geocoder";

export interface CensusRentResult {
  medianRent: number | null;
  source: string;
  zip: string;
  year: string;
  geography: "zip" | "county" | "unavailable";
  confidence: "high" | "medium" | "low";
  note?: string;
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function fetchCensusMedianRent(zip: string): Promise<CensusRentResult> {
  const clean = zip.replace(/\D/g, "").slice(0, 5).padStart(5, "0");

  // 1. Try ZIP / ZCTA level first
  const zipRent = await fetchZipLevelRent(clean);
  if (zipRent !== null) {
    return {
      medianRent: zipRent,
      source: `US Census ACS ${ACS_YEAR} 5-Year Estimates (ZIP level)`,
      zip: clean,
      year: ACS_YEAR,
      geography: "zip",
      confidence: "high",
    };
  }

  // 2. ZIP data suppressed — fall back to county via Census Geocoder (free, no token)
  const county = await getCountyFipsFromZip(clean);
  if (county) {
    const countyRent = await fetchCountyLevelRent(county.stateFips, county.countyFips);
    if (countyRent !== null) {
      return {
        medianRent: countyRent,
        source: `US Census ACS ${ACS_YEAR} 5-Year Estimates (${county.countyName})`,
        zip: clean,
        year: ACS_YEAR,
        geography: "county",
        confidence: "medium",
        note: `ZIP-level data unavailable; using ${county.countyName} county median rent.`,
      };
    }
  }

  // 3. Nothing worked
  return {
    medianRent: null,
    source: "Census API — data unavailable",
    zip: clean,
    year: ACS_YEAR,
    geography: "unavailable",
    confidence: "low",
    note: `No Census data found for ZIP ${clean}. Add HUD_API_TOKEN for HUD Fair Market Rents.`,
  };
}

// ─── ZIP/ZCTA ACS query ───────────────────────────────────────────────────────

async function fetchZipLevelRent(zip: string): Promise<number | null> {
  const url =
    `${CENSUS_BASE}/${ACS_YEAR}/acs/acs5` +
    `?get=B25058_001E,NAME` +
    `&for=zip%20code%20tabulation%20area:${zip}`;

  try {
    const res = await fetch(url, { next: { revalidate: 86_400 } });
    if (!res.ok) return null;

    const json: string[][] = await res.json();
    if (!json || json.length < 2) return null;

    const rentIdx = json[0].indexOf("B25058_001E");
    const raw = rentIdx >= 0 ? parseInt(json[1][rentIdx], 10) : null;

    // Census returns -666666666 for suppressed / small-sample data
    if (!raw || raw < 100 || raw > 20_000) return null;
    return raw;
  } catch {
    return null;
  }
}

// ─── Census Geocoder — ZIP → county FIPS (free, no token) ────────────────────

interface CountyFips {
  stateFips: string;
  countyFips: string;
  countyName: string;
}

async function getCountyFipsFromZip(zip: string): Promise<CountyFips | null> {
  // The Census Geocoder resolves a dummy address + ZIP to FIPS codes.
  const url =
    `${GEOCODER_BASE}/geographies/address` +
    `?street=1+Main+St&zip=${zip}` +
    `&benchmark=Public_AR_Current&vintage=Current_Current` +
    `&layers=Counties&format=json`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 604_800 }, // county → ZIP mapping is stable; cache 1 week
    });
    if (!res.ok) return null;

    const data = await res.json();
    const match = data?.result?.addressMatches?.[0];
    const county = match?.geographies?.Counties?.[0];
    if (!county?.STATE || !county?.COUNTY) return null;

    return {
      stateFips: county.STATE,
      countyFips: county.COUNTY,
      countyName: county.NAME ?? "Unknown County",
    };
  } catch {
    return null;
  }
}

// ─── County-level ACS query ───────────────────────────────────────────────────

async function fetchCountyLevelRent(
  stateFips: string,
  countyFips: string
): Promise<number | null> {
  const url =
    `${CENSUS_BASE}/${ACS_YEAR}/acs/acs5` +
    `?get=B25058_001E,NAME` +
    `&for=county:${countyFips}` +
    `&in=state:${stateFips}`;

  try {
    const res = await fetch(url, { next: { revalidate: 86_400 } });
    if (!res.ok) return null;

    const json: string[][] = await res.json();
    if (!json || json.length < 2) return null;

    const rentIdx = json[0].indexOf("B25058_001E");
    const raw = rentIdx >= 0 ? parseInt(json[1][rentIdx], 10) : null;

    if (!raw || raw < 100 || raw > 20_000) return null;
    return raw;
  } catch {
    return null;
  }
}
