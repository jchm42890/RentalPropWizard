/**
 * Market Data Service
 * Aggregates rent, tax, and insurance data from public sources
 */

import { fetchCensusMedianRent } from "./censusRent";
import { estimatePropertyTax } from "./propertyTaxEstimate";
import { getBedMultiplier, getInsurancePremium } from "./stateTaxRates";

export interface MarketDataResult {
  // Rent
  estimatedMonthlyRent: number | null;
  rentSource: string;
  rentConfidence: "high" | "medium" | "low";
  rentNote?: string;
  medianRentAllUnits: number | null;
  bedAdjustmentMultiplier: number;

  // Tax
  estimatedAnnualTax: number;
  taxSource: string;
  taxConfidence: "high" | "medium" | "low";
  effectiveTaxRate: number;

  // Insurance
  estimatedAnnualInsurance: number;
  insuranceSource: string;

  // Summary
  dataFreshness: string;
  zip: string;
  state: string;
}

export async function fetchMarketData(params: {
  zip: string;
  state: string;
  beds: number;
  purchasePrice: number;
}): Promise<MarketDataResult> {
  const { zip, state, beds, purchasePrice } = params;

  // Run all fetches in parallel
  const [rentResult, taxResult] = await Promise.all([
    fetchCensusMedianRent(zip),
    estimatePropertyTax(state, purchasePrice, zip),
  ]);

  // Adjust median rent for bed count
  const bedMult = getBedMultiplier(beds);
  const estimatedMonthlyRent = rentResult.medianRent
    ? Math.round((rentResult.medianRent * bedMult) / 25) * 25
    : null;

  // Insurance from state table (round to nearest $50)
  const rawInsurance = getInsurancePremium(state);
  // Scale insurance slightly with property value (higher-value = higher premium)
  const valueScaler = Math.min(Math.max(purchasePrice / 300000, 0.6), 2.0);
  const estimatedAnnualInsurance = Math.round((rawInsurance * valueScaler) / 50) * 50;

  return {
    estimatedMonthlyRent,
    rentSource: rentResult.source,
    rentConfidence: rentResult.confidence,
    rentNote: rentResult.note,
    medianRentAllUnits: rentResult.medianRent,
    bedAdjustmentMultiplier: bedMult,

    estimatedAnnualTax: taxResult.annualTax,
    taxSource: taxResult.source,
    taxConfidence: taxResult.confidence,
    effectiveTaxRate: taxResult.effectiveRate,

    estimatedAnnualInsurance,
    insuranceSource: `State average premium (${state.toUpperCase()}) — NAIC 2023, adjusted for property value`,

    dataFreshness: "2023 ACS 5-Year Estimates",
    zip,
    state: state.toUpperCase(),
  };
}
