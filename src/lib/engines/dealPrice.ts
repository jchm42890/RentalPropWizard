/**
 * Deal Price Engine
 *
 * Finds the maximum purchase price at which this property becomes a "deal"
 * by binary-searching on purchase price until all key criteria are met.
 *
 * Criteria for a "deal":
 *   • Cash-on-cash return  ≥ 8 %
 *   • DSCR                 ≥ 1.25
 *   • Monthly cash flow    ≥ $200
 *   • Cap rate             ≥ 5 %
 */

import { AnalysisAssumptions } from "../types";
import { runFullAnalysis } from "./analyzer";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface DealCriterion {
  name: string;
  threshold: number;
  thresholdLabel: string;
  currentValue: number;
  dealValue: number | null;
  currentPass: boolean;
  dealPass: boolean;
  unit: "currency_monthly" | "percent" | "ratio" | "currency_annual";
  /** How far the current value is from the threshold (negative = below) */
  gap: number;
}

export interface DealPriceResult {
  currentPrice: number;
  dealPrice: number | null;
  discountNeeded: number;
  discountPct: number;
  isAlreadyDeal: boolean;
  /** false when even a 55% discount can't save the deal (rent too low for market) */
  canBeFixed: boolean;
  criteria: DealCriterion[];
  /** Number of criteria currently passing */
  passingNow: number;
  /** Total criteria */
  total: number;
}

// ─── Thresholds ───────────────────────────────────────────────────────────────

const THRESHOLDS = {
  minCoCReturn: 8,        // %
  minDSCR: 1.25,
  minMonthlyCashFlow: 200, // $
  minCapRate: 5,          // %
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function runAtPrice(assumptions: AnalysisAssumptions, price: number) {
  return runFullAnalysis({
    ...assumptions,
    loan: { ...assumptions.loan, purchasePrice: price },
  });
}

function checkDeal(assumptions: AnalysisAssumptions, price: number): boolean {
  const r = runAtPrice(assumptions, price);
  const m = r.metrics;
  return (
    m.cashOnCashReturn >= THRESHOLDS.minCoCReturn &&
    m.dscr >= THRESHOLDS.minDSCR &&
    m.cashFlow / 12 >= THRESHOLDS.minMonthlyCashFlow &&
    m.capRate >= THRESHOLDS.minCapRate
  );
}

function buildCriteria(
  currentAssumptions: AnalysisAssumptions,
  dealPrice: number | null
): DealCriterion[] {
  const cur = runFullAnalysis(currentAssumptions).metrics;
  const dealMetrics = dealPrice
    ? runAtPrice(currentAssumptions, dealPrice).metrics
    : null;

  return [
    {
      name: "Cash-on-Cash Return",
      threshold: THRESHOLDS.minCoCReturn,
      thresholdLabel: `≥ ${THRESHOLDS.minCoCReturn}%`,
      currentValue: cur.cashOnCashReturn,
      dealValue: dealMetrics?.cashOnCashReturn ?? null,
      currentPass: cur.cashOnCashReturn >= THRESHOLDS.minCoCReturn,
      dealPass: dealMetrics ? dealMetrics.cashOnCashReturn >= THRESHOLDS.minCoCReturn : false,
      unit: "percent",
      gap: cur.cashOnCashReturn - THRESHOLDS.minCoCReturn,
    },
    {
      name: "DSCR",
      threshold: THRESHOLDS.minDSCR,
      thresholdLabel: `≥ ${THRESHOLDS.minDSCR}`,
      currentValue: cur.dscr,
      dealValue: dealMetrics?.dscr ?? null,
      currentPass: cur.dscr >= THRESHOLDS.minDSCR,
      dealPass: dealMetrics ? dealMetrics.dscr >= THRESHOLDS.minDSCR : false,
      unit: "ratio",
      gap: cur.dscr - THRESHOLDS.minDSCR,
    },
    {
      name: "Monthly Cash Flow",
      threshold: THRESHOLDS.minMonthlyCashFlow,
      thresholdLabel: `≥ $${THRESHOLDS.minMonthlyCashFlow}/mo`,
      currentValue: cur.cashFlow / 12,
      dealValue: dealMetrics ? dealMetrics.cashFlow / 12 : null,
      currentPass: cur.cashFlow / 12 >= THRESHOLDS.minMonthlyCashFlow,
      dealPass: dealMetrics ? dealMetrics.cashFlow / 12 >= THRESHOLDS.minMonthlyCashFlow : false,
      unit: "currency_monthly",
      gap: cur.cashFlow / 12 - THRESHOLDS.minMonthlyCashFlow,
    },
    {
      name: "Cap Rate",
      threshold: THRESHOLDS.minCapRate,
      thresholdLabel: `≥ ${THRESHOLDS.minCapRate}%`,
      currentValue: cur.capRate,
      dealValue: dealMetrics?.capRate ?? null,
      currentPass: cur.capRate >= THRESHOLDS.minCapRate,
      dealPass: dealMetrics ? dealMetrics.capRate >= THRESHOLDS.minCapRate : false,
      unit: "percent",
      gap: cur.capRate - THRESHOLDS.minCapRate,
    },
  ];
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function findDealPrice(assumptions: AnalysisAssumptions): DealPriceResult {
  const currentPrice = assumptions.loan.purchasePrice;

  // Are we already a deal?
  if (checkDeal(assumptions, currentPrice)) {
    const criteria = buildCriteria(assumptions, currentPrice);
    return {
      currentPrice,
      dealPrice: currentPrice,
      discountNeeded: 0,
      discountPct: 0,
      isAlreadyDeal: true,
      canBeFixed: true,
      criteria,
      passingNow: criteria.filter((c) => c.currentPass).length,
      total: criteria.length,
    };
  }

  // Can it even be fixed? Check at 45% of current price (55% discount).
  const floorPrice = Math.max(50_000, currentPrice * 0.45);
  if (!checkDeal(assumptions, floorPrice)) {
    // Rent is probably too low relative to expenses regardless of price.
    const criteria = buildCriteria(assumptions, null);
    return {
      currentPrice,
      dealPrice: null,
      discountNeeded: 0,
      discountPct: 0,
      isAlreadyDeal: false,
      canBeFixed: false,
      criteria,
      passingNow: criteria.filter((c) => c.currentPass).length,
      total: criteria.length,
    };
  }

  // Binary search:
  //   lo = price at which it IS a deal (≤ threshold)
  //   hi = price at which it is NOT a deal (> threshold)
  let lo = floorPrice;   // is a deal
  let hi = currentPrice; // not a deal

  for (let i = 0; i < 28; i++) {
    if (hi - lo < 500) break;
    const mid = (lo + hi) / 2;
    if (checkDeal(assumptions, mid)) {
      lo = mid; // deal at mid — can try a higher price
    } else {
      hi = mid; // not a deal at mid — must go lower
    }
  }

  // Round down to nearest $1 k so we land safely inside the "deal" zone
  const dealPrice = Math.floor(lo / 1_000) * 1_000;

  const criteria = buildCriteria(assumptions, dealPrice);

  return {
    currentPrice,
    dealPrice,
    discountNeeded: currentPrice - dealPrice,
    discountPct: ((currentPrice - dealPrice) / currentPrice) * 100,
    isAlreadyDeal: false,
    canBeFixed: true,
    criteria,
    passingNow: criteria.filter((c) => c.currentPass).length,
    total: criteria.length,
  };
}
