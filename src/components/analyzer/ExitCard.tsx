"use client";

import React from "react";
import { ExitAnalysis } from "@/lib/types";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";

interface ExitCardProps {
  exit: ExitAnalysis;
}

export function ExitCard({ exit }: ExitCardProps) {
  const rows = [
    { label: "Projected Sale Price", value: formatCurrency(exit.projectedSalePrice), highlight: false },
    { label: `Selling Costs`, value: `(${formatCurrency(exit.sellingCosts)})`, highlight: false, neg: true },
    { label: "Loan Payoff", value: `(${formatCurrency(exit.loanPayoff)})`, highlight: false, neg: true },
    { label: "Net Proceeds", value: formatCurrency(exit.netProceeds), highlight: true },
    { label: "", value: "", sep: true },
    { label: "Total Cash Flow", value: formatCurrency(exit.totalCashFlow), highlight: false, positive: exit.totalCashFlow >= 0 },
    { label: "Total Appreciation", value: formatCurrency(exit.totalAppreciation), highlight: false, positive: true },
    { label: "Principal Paydown", value: formatCurrency(exit.totalPrincipalPaydown), highlight: false, positive: true },
    { label: "Tax Benefits", value: formatCurrency(exit.totalTaxBenefit), highlight: false, positive: true },
    { label: "", value: "", sep: true },
    { label: "Total Return", value: formatCurrency(exit.totalReturn), highlight: true, positive: exit.totalReturn >= 0 },
    { label: "Total ROI", value: formatPercent(exit.roi, 1), highlight: false, positive: exit.roi >= 0 },
    { label: "IRR", value: exit.irr ? formatPercent(exit.irr, 1) : "N/A", highlight: false, positive: exit.irr ? exit.irr >= 0 : undefined },
    { label: "Equity Multiple", value: `${exit.equityMultiple.toFixed(2)}x`, highlight: false, positive: exit.equityMultiple >= 1 },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-1">
        Exit Analysis — Year {exit.saleYear}
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Projected sale and total investment returns
      </p>

      <div className="space-y-1.5">
        {rows.map((row, i) =>
          row.sep ? (
            <div key={i} className="border-t border-gray-200 my-2" />
          ) : (
            <div
              key={i}
              className={cn(
                "flex justify-between items-center px-2 py-1.5 rounded-lg text-sm",
                row.highlight && "bg-blue-50 font-semibold"
              )}
            >
              <span className={cn("text-gray-600", row.highlight && "text-gray-800")}>
                {row.label}
              </span>
              <span
                className={cn(
                  row.highlight ? "text-blue-700 font-bold" : "font-medium",
                  row.neg ? "text-red-600" :
                  row.positive === true ? "text-green-600" :
                  row.positive === false ? "text-red-600" :
                  "text-gray-700"
                )}
              >
                {row.value}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
