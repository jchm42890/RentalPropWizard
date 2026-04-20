"use client";

import React, { useMemo } from "react";
import { AnalysisAssumptions } from "@/lib/types";
import { findDealPrice, DealPriceResult, DealCriterion } from "@/lib/engines/dealPrice";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Tag, TrendingDown, AlertTriangle, Sparkles } from "lucide-react";

interface DealPricePanelProps {
  assumptions: AnalysisAssumptions;
}

// ─── Format a criterion value ─────────────────────────────────────────────────

function fmtValue(c: DealCriterion, val: number | null): string {
  if (val === null) return "—";
  switch (c.unit) {
    case "percent":
      return `${val.toFixed(1)}%`;
    case "ratio":
      return val.toFixed(2);
    case "currency_monthly":
      return `${formatCurrency(val)}/mo`;
    case "currency_annual":
      return `${formatCurrency(val)}/yr`;
    default:
      return String(val);
  }
}

// ─── Progress bar for each criterion ─────────────────────────────────────────

function CriterionRow({ c, showDeal }: { c: DealCriterion; showDeal: boolean }) {
  const pct = Math.min(100, Math.max(0, (c.currentValue / c.threshold) * 100));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700 flex items-center gap-1.5">
          {c.currentPass
            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            : <XCircle className="w-3.5 h-3.5 text-red-400" />}
          {c.name}
        </span>
        <div className="flex items-center gap-2 text-xs">
          <span className={cn("font-semibold", c.currentPass ? "text-emerald-600" : "text-red-500")}>
            {fmtValue(c, c.currentValue)}
          </span>
          {showDeal && c.dealValue !== null && !c.currentPass && (
            <>
              <span className="text-gray-400">→</span>
              <span className="font-semibold text-emerald-600">{fmtValue(c, c.dealValue)}</span>
            </>
          )}
          <span className="text-gray-400">({c.thresholdLabel})</span>
        </div>
      </div>
      {/* progress bar */}
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            c.currentPass ? "bg-emerald-400" : pct >= 80 ? "bg-amber-400" : "bg-red-400"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DealPricePanel({ assumptions }: DealPricePanelProps) {
  const result: DealPriceResult = useMemo(
    () => findDealPrice(assumptions),
    // Re-run only when financially relevant inputs change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      assumptions.loan.purchasePrice,
      assumptions.loan.downPaymentPct,
      assumptions.loan.interestRate,
      assumptions.loan.loanTermYears,
      assumptions.income.monthlyRent,
      assumptions.income.vacancyRatePct,
      assumptions.expenses.propertyTaxAnnual,
      assumptions.expenses.insuranceAnnual,
      assumptions.expenses.repairsMaintenancePct,
      assumptions.expenses.propertyManagementPct,
      assumptions.expenses.capexPct,
    ]
  );

  // ── Already a deal ──────────────────────────────────────────────────────────
  if (result.isAlreadyDeal) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-emerald-100 p-2.5 shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-bold text-emerald-800 text-base">Already priced as a deal!</p>
            <p className="text-sm text-emerald-700 mt-0.5">
              This property meets all investment criteria at the current asking price of{" "}
              <span className="font-semibold">{formatCurrency(result.currentPrice)}</span>.
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {result.criteria.map((c) => (
            <CriterionRow key={c.name} c={c} showDeal={false} />
          ))}
        </div>
      </div>
    );
  }

  // ── Can't be saved by price alone ──────────────────────────────────────────
  if (!result.canBeFixed) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-amber-100 p-2.5 shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="font-bold text-amber-800 text-base">Price alone can&apos;t save this deal</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Even at a 55% discount the metrics don&apos;t pass. The rent is likely too low
              relative to expenses for this market. Consider raising the rent assumption or
              reducing operating costs.
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {result.criteria.map((c) => (
            <CriterionRow key={c.name} c={c} showDeal={false} />
          ))}
        </div>
      </div>
    );
  }

  // ── Show deal price ─────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-blue-100 p-2.5 shrink-0">
          <Tag className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-0.5">
            Offer Price to Make This a Deal
          </p>
          <p className="text-3xl font-black text-blue-900 leading-none">
            {formatCurrency(result.dealPrice!)}
          </p>
          <p className="text-sm text-blue-700 mt-1">
            vs. asking {formatCurrency(result.currentPrice)}
          </p>
        </div>
      </div>

      {/* Discount badges */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white border border-blue-100 p-3 text-center">
          <p className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">
            <TrendingDown className="w-3 h-3" /> Discount needed
          </p>
          <p className="text-xl font-black text-red-600">
            {formatCurrency(result.discountNeeded)}
          </p>
        </div>
        <div className="rounded-xl bg-white border border-blue-100 p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Price reduction</p>
          <p className="text-xl font-black text-red-600">
            {result.discountPct.toFixed(1)}% off
          </p>
        </div>
      </div>

      {/* Negotiation tip */}
      <div className="rounded-lg bg-blue-100/60 px-3 py-2 text-xs text-blue-800">
        <span className="font-semibold">Negotiation tip:</span>{" "}
        Offer {formatCurrency(result.dealPrice!)} ({result.discountPct.toFixed(0)}% below ask).
        Justify with cap-rate comparables or deferred maintenance.
        Even a {Math.ceil(result.discountPct / 2).toFixed(0)}% reduction improves your returns meaningfully.
      </div>

      {/* Criteria comparison */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Criteria — current price vs. deal price
        </p>
        <div className="space-y-3">
          {result.criteria.map((c) => (
            <CriterionRow key={c.name} c={c} showDeal={true} />
          ))}
        </div>
      </div>

      {/* Criteria legend */}
      <p className="text-xs text-gray-400 text-center">
        Criteria: CoC ≥ 8% · DSCR ≥ 1.25 · Cash flow ≥ $200/mo · Cap rate ≥ 5%
      </p>
    </div>
  );
}
