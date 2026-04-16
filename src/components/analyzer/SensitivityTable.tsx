"use client";

import React from "react";
import { SensitivityRow, FullAnalysisResult } from "@/lib/types";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { calcBreakevenRent } from "@/lib/engines/sensitivity";

interface SensitivityTableProps {
  sensitivity: SensitivityRow[];
  assumptions: FullAnalysisResult["assumptions"];
}

export function SensitivityTable({ sensitivity, assumptions }: SensitivityTableProps) {
  const breakeven = calcBreakevenRent(assumptions);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-1">Sensitivity Analysis</h3>
      <p className="text-xs text-gray-500 mb-4">
        Impact of changing key variables on monthly cash flow and cash-on-cash return
      </p>

      {/* Break-even Rent */}
      <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
        <span className="text-sm font-semibold text-blue-700">
          Break-even Rent: {formatCurrency(breakeven)}/mo
        </span>
        <p className="text-xs text-blue-600 mt-0.5">
          Minimum monthly rent to cover all expenses and debt service
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 text-left font-semibold text-gray-600">Variable</th>
              <th className="py-2 text-right font-semibold text-gray-500">Low (CF)</th>
              <th className="py-2 text-right font-semibold text-blue-600">Base (CF)</th>
              <th className="py-2 text-right font-semibold text-gray-500">High (CF)</th>
              <th className="py-2 text-right font-semibold text-gray-500">Low (CoC)</th>
              <th className="py-2 text-right font-semibold text-blue-600">Base (CoC)</th>
              <th className="py-2 text-right font-semibold text-gray-500">High (CoC)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sensitivity.map((row) => (
              <tr key={row.variable} className="hover:bg-gray-50">
                <td className="py-2 font-medium text-gray-700">{row.variable}</td>
                <td className={cn("py-2 text-right", row.lowCashFlow < 0 ? "text-red-500" : "text-green-600")}>
                  {formatCurrency(row.lowCashFlow)}/mo
                </td>
                <td className={cn("py-2 text-right font-semibold", row.baseCashFlow < 0 ? "text-red-600" : "text-blue-600")}>
                  {formatCurrency(row.baseCashFlow)}/mo
                </td>
                <td className={cn("py-2 text-right", row.highCashFlow < 0 ? "text-red-500" : "text-green-600")}>
                  {formatCurrency(row.highCashFlow)}/mo
                </td>
                <td className={cn("py-2 text-right", row.lowCoC < 5 ? "text-red-500" : "text-green-600")}>
                  {formatPercent(row.lowCoC, 1)}
                </td>
                <td className={cn("py-2 text-right font-semibold", row.baseCoC < 5 ? "text-red-600" : "text-blue-600")}>
                  {formatPercent(row.baseCoC, 1)}
                </td>
                <td className={cn("py-2 text-right", row.highCoC < 5 ? "text-red-500" : "text-green-600")}>
                  {formatPercent(row.highCoC, 1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
