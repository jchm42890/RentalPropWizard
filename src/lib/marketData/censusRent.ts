/**
 * Fetches median contract rent for a ZIP code from the US Census Bureau
 * American Community Survey 5-Year estimates (ACS5).
 *
 * Variable B25058_001E = Median contract rent (dollars)
 * No API key required for public endpoints.
 *
 * Docs: https://www.census.gov/data/developers/data-sets/acs-5year.html
 */

const ACS_YEAR = "2023"; // latest available ACS5
const CENSUS_BASE = "https://api.census.gov/data";

interface CensusRentResult {
  medianRent: number | null;
  source: string;
  zip: string;
  year: string;
  confidence: "high" | "medium" | "low";
  note?: string;
}

export async function fetchCensusMedianRent(zip: string): Promise<CensusRentResult> {
  const clean = zip.replace(/\D/g, "").slice(0, 5).padStart(5, "0");

  // ACS5 variable: B25058_001E = Median contract rent
  const url =
    `${CENSUS_BASE}/${ACS_YEAR}/acs/acs5` +
    `?get=B25058_001E,NAME` +
    `&for=zip%20code%20tabulation%20area:${clean}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 86400 }, // Cache for 24hrs in Next.js
    });

    if (!res.ok) {
      throw new Error(`Census API returned ${res.status}`);
    }

    const json: string[][] = await res.json();
    // json[0] = headers, json[1] = values
    if (!json || json.length < 2) {
      return fallback(clean, "No data returned from Census API");
    }

    const headers = json[0];
    const values = json[1];
    const rentIdx = headers.indexOf("B25058_001E");
    const rawRent = rentIdx >= 0 ? parseInt(values[rentIdx], 10) : null;

    // Census returns -666666666 or null for suppressed/missing data
    if (!rawRent || rawRent < 0 || rawRent > 20000) {
      return fallback(clean, `Suppressed or missing Census data for ZIP ${clean}`);
    }

    return {
      medianRent: rawRent,
      source: `US Census ACS ${ACS_YEAR} 5-Year Estimates`,
      zip: clean,
      year: ACS_YEAR,
      confidence: "high",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return fallback(clean, msg);
  }
}

function fallback(zip: string, note: string): CensusRentResult {
  return {
    medianRent: null,
    source: "Census API unavailable",
    zip,
    year: ACS_YEAR,
    confidence: "low",
    note,
  };
}
