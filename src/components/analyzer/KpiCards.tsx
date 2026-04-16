"use client";

import React from "react";
import { FullAnalysisResult } from "@/lib/types";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, Percent, Shield, Home } from "lucide-react";

interface KpiCardsProps {
  result: FullAnalysisResult;
}

function KpiCard({
  label,
  value,
  sub,
  positive,
  icon,
  tooltip,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
  icon: React.ReactNode;
  tooltip?: string;
}) {
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
      title={tooltip}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <span className="text-gray-400">{icon}</span>
      </div>
      <div
        className={cn(
          "text-2xl font-bold",
          positive === undefined
            ? "text-gray-900"
            : positive
            ? "text-green-600"
            : "text-red-600"
        )}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

export function KpiCards({ result }: KpiCardsProps) {
  const { metrics, loan } = result;
  const monthlyCF = metrics.cashFlow / 12;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      <KpiCard
        label="Monthly Cash Flow"
        value={formatCurrency(monthlyCF)}
        sub={`${formatCurrency(metrics.cashFlow)}/yr`}
        positive={monthlyCF >= 0}
        icon={monthlyCF >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        tooltip="Net cash flow after all expenses and debt service"
      />
      <KpiCard
        label="Cash-on-Cash"
        value={formatPercent(metrics.cashOnCashReturn, 1)}
        sub="annual return on cash"
        positive={metrics.cashOnCashReturn >= 6}
        icon={<Percent className="h-4 w-4" />}
        tooltip="Annual cash flow ÷ total cash invested"
      />
      <KpiCard
        label="Cap Rate"
        value={formatPercent(metrics.capRate, 1)}
        sub="NOI / Purchase Price"
        positive={metrics.capRate >= 5}
        icon={<BarChart className="h-4 w-4" />}
        tooltip="Net Operating Income ÷ Purchase Price"
      />
      <KpiCard
        label="DSCR"
        value={metrics.dscr.toFixed(2)}
        sub="debt service coverage"
        positive={metrics.dscr >= 1.2}
        icon={<Shield className="h-4 w-4" />}
        tooltip="NOI ÷ Annual Debt Service (≥1.25 is healthy)"
      />
      <KpiCard
        label="Monthly Payment"
        value={formatCurrency(loan.monthlyPayment)}
        sub={`${formatCurrency(loan.loanAmount)} loan`}
        icon={<DollarSign className="h-4 w-4" />}
        tooltip="Principal & interest only"
      />
      <KpiCard
        label="Cash to Close"
        value={formatCurrency(loan.totalCashNeeded)}
        sub={`${formatPercent(result.assumptions.loan.downPaymentPct, 0)} down`}
        icon={<Home className="h-4 w-4" />}
        tooltip="Down payment + closing costs"
      />
    </div>
  );
}

// Inline icon since BarChart isn't in lucide by that exact name
function BarChart({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
