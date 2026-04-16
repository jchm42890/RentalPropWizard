/**
 * Average effective property tax rates by state (% of property value)
 * Source: Tax Foundation, 2023 data
 */
export const STATE_EFFECTIVE_TAX_RATES: Record<string, number> = {
  AL: 0.41, AK: 1.04, AZ: 0.62, AR: 0.62, CA: 0.75, CO: 0.55,
  CT: 1.96, DE: 0.61, FL: 0.91, GA: 0.90, HI: 0.28, ID: 0.69,
  IL: 2.23, IN: 0.87, IA: 1.56, KS: 1.41, KY: 0.86, LA: 0.55,
  ME: 1.36, MD: 1.09, MA: 1.20, MI: 1.54, MN: 1.12, MS: 0.79,
  MO: 0.97, MT: 0.84, NE: 1.73, NV: 0.60, NH: 2.09, NJ: 2.47,
  NM: 0.80, NY: 1.73, NC: 0.82, ND: 0.98, OH: 1.59, OK: 0.90,
  OR: 0.93, PA: 1.58, RI: 1.63, SC: 0.56, SD: 1.31, TN: 0.71,
  TX: 1.80, UT: 0.62, VT: 1.90, VA: 0.82, WA: 0.98, WV: 0.62,
  WI: 1.85, WY: 0.61, DC: 0.55,
};

/**
 * Average annual homeowner's insurance premium by state ($)
 * Source: Insurance Information Institute / NAIC, 2023 data
 */
export const STATE_INSURANCE_PREMIUMS: Record<string, number> = {
  AL: 1900, AK: 1040, AZ: 1140, AR: 2040, CA: 1380, CO: 1700,
  CT: 1310, DE: 910,  FL: 3600, GA: 1660, HI: 490,  ID: 1010,
  IL: 1490, IN: 1320, IA: 1350, KS: 2250, KY: 1890, LA: 2770,
  ME: 870,  MD: 1140, MA: 1490, MI: 1130, MN: 1680, MS: 2200,
  MO: 1840, MT: 1430, NE: 1760, NV: 890,  NH: 990,  NJ: 1260,
  NM: 1340, NY: 1380, NC: 1490, ND: 1360, OH: 1040, OK: 2890,
  OR: 840,  PA: 990,  RI: 1480, SC: 1600, SD: 1450, TN: 1880,
  TX: 3300, UT: 780,  VT: 900,  VA: 1260, WA: 1030, WV: 980,
  WI: 870,  WY: 1050, DC: 1200,
};

/**
 * Bed-count multiplier applied to the ZIP-level median rent.
 * Census ACS B25058 is roughly the median for ALL units (skews toward 1-2BR).
 */
export const BED_COUNT_MULTIPLIERS: Record<number, number> = {
  0: 0.70,  // Studio
  1: 0.82,
  2: 1.00,  // Baseline
  3: 1.22,
  4: 1.48,
  5: 1.75,
};

export function getBedMultiplier(beds: number): number {
  const rounded = Math.round(beds);
  return BED_COUNT_MULTIPLIERS[rounded] ?? BED_COUNT_MULTIPLIERS[5];
}

export function getEffectiveTaxRate(state: string): number {
  return STATE_EFFECTIVE_TAX_RATES[state.toUpperCase()] ?? 1.10; // national avg fallback
}

export function getInsurancePremium(state: string): number {
  return STATE_INSURANCE_PREMIUMS[state.toUpperCase()] ?? 1500;
}
