/**
 * Attempts to fetch a real property tax estimate.
 *
 * Strategy:
 * 1. Try to get county-level effective rate from the Census ACS
 *    (variable B25103 = Real estate taxes, B25075 = property value)
 * 2. Fall back to state effective rate table
 */

import { getEffectiveTaxRate } from "./stateTaxRates";

const ACS_YEAR = "2023";
const CENSUS_BASE = "https://api.census.gov/data";

interface TaxEstimateResult {
  annualTax: number;
  effectiveRate: number;
  source: string;
  confidence: "high" | "medium" | "low";
}

export async function estimatePropertyTax(
  state: string,
  purchasePrice: number,
  zip: string
): Promise<TaxEstimateResult> {
  // Try ZIP-level effective rate from ACS
  // B25103_001E = Median real estate taxes paid
  // B25077_001E = Median value of owner-occupied housing units
  const clean = zip.replace(/\D/g, "").slice(0, 5).padStart(5, "0");
  const url =
    `${CENSUS_BASE}/${ACS_YEAR}/acs/acs5` +
    `?get=B25103_001E,B25077_001E` +
    `&for=zip%20code%20tabulation%20area:${clean}`;

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (res.ok) {
      const json: string[][] = await res.json();
      if (json && json.length >= 2) {
        const headers = json[0];
        const values = json[1];

        const taxIdx = headers.indexOf("B25103_001E");
        const valIdx = headers.indexOf("B25077_001E");

        const medianTax = taxIdx >= 0 ? parseInt(values[taxIdx], 10) : null;
        const medianValue = valIdx >= 0 ? parseInt(values[valIdx], 10) : null;

        if (
          medianTax && medianTax > 0 && medianTax < 50000 &&
          medianValue && medianValue > 0
        ) {
          // Derive effective rate from census medians, apply to actual purchase price
          const effectiveRate = (medianTax / medianValue) * 100;
          const annualTax = Math.round((effectiveRate / 100) * purchasePrice / 100) * 100;

          return {
            annualTax: Math.max(annualTax, 500), // floor at $500
            effectiveRate,
            source: `US Census ACS ${ACS_YEAR} — ZIP ${clean}`,
            confidence: "high",
          };
        }
      }
    }
  } catch {
    // Fall through to state-level
  }

  // State-level fallback
  const stateRate = getEffectiveTaxRate(state);
  const annualTax = Math.round((stateRate / 100) * purchasePrice / 100) * 100;

  return {
    annualTax: Math.max(annualTax, 500),
    effectiveRate: stateRate,
    source: `State average effective rate (${state.toUpperCase()}) — Tax Foundation 2023`,
    confidence: "medium",
  };
}
