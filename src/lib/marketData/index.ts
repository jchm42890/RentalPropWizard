/**
 * Market Data Service
 * Aggregates rent, tax, and insurance data from public sources.
 *
 * Rent source priority:
 *  1. HUD Fair Market Rents  (HUD_API_TOKEN env) — official gov't ZIP-level data
 *  2. Census ACS 5-Year      (free, no key)      — ZIP or county median rent
 */

import { fetchCensusMedianRent } from "./censusRent";
import { fetchHudFmr, hudFmrToMarketRent } from "./hudFmr";
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
  const bedMult = getBedMultiplier(beds);

  // Run census + tax + HUD in parallel for speed
  const [censusResult, taxResult, hudResult] = await Promise.all([
    fetchCensusMedianRent(zip),
    estimatePropertyTax(state, purchasePrice, zip),
    fetchHudFmr(zip),   // returns null if HUD_API_TOKEN not set
  ]);

  // ── Rent estimate ──────────────────────────────────────────────────────────
  // Prefer HUD FMR when Census fails (suppressed ZIP data is common)
  let estimatedMonthlyRent: number | null = null;
  let rentSource: string;
  let rentConfidence: "high" | "medium" | "low";
  let rentNote: string | undefined;
  let medianRentAllUnits: number | null = null;

  if (censusResult.medianRent) {
    // Census ZIP or county data available
    estimatedMonthlyRent = Math.round((censusResult.medianRent * bedMult) / 25) * 25;
    medianRentAllUnits = censusResult.medianRent;
    rentSource = censusResult.source;
    rentConfidence = censusResult.geography === "zip" ? "high" : "medium";
    rentNote = censusResult.note;
  } else if (hudResult) {
    // Census unavailable — fall back to HUD FMR
    const hudRent = hudFmrToMarketRent(hudResult, beds);
    estimatedMonthlyRent = hudRent;
    medianRentAllUnits = Math.round(hudRent / bedMult);
    rentSource = `HUD Fair Market Rents FY${hudResult.year} — ${hudResult.areaName}`;
    rentConfidence = "medium";
    rentNote = `Census data unavailable for ZIP ${zip}. Using HUD FMR (40th-percentile rent + market adjustment). For live listings add RAPIDAPI_KEY.`;
  } else {
    // Nothing worked
    rentSource = censusResult.source;
    rentConfidence = "low";
    rentNote = censusResult.note ?? `No rent data available for ZIP ${zip}. Add HUD_API_TOKEN for HUD Fair Market Rents.`;
  }

  // ── Insurance ──────────────────────────────────────────────────────────────
  const rawInsurance = getInsurancePremium(state);
  const valueScaler = Math.min(Math.max(purchasePrice / 300_000, 0.6), 2.0);
  const estimatedAnnualInsurance = Math.round((rawInsurance * valueScaler) / 50) * 50;

  return {
    estimatedMonthlyRent,
    rentSource,
    rentConfidence,
    rentNote,
    medianRentAllUnits,
    bedAdjustmentMultiplier: bedMult,

    estimatedAnnualTax: taxResult.annualTax,
    taxSource: taxResult.source,
    taxConfidence: taxResult.confidence,
    effectiveTaxRate: taxResult.effectiveRate,

    estimatedAnnualInsurance,
    insuranceSource: `State average premium (${state.toUpperCase()}) — NAIC 2023, adjusted for property value`,

    dataFreshness: censusResult.medianRent
      ? `Census ACS ${censusResult.year}`
      : hudResult
      ? `HUD FMR FY${hudResult.year}`
      : "Estimates only",
    zip,
    state: state.toUpperCase(),
  };
}
