"use client";

import React from "react";
import { YearProjection } from "@/lib/types";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";

interface ProjectionTableProps {
  projections: YearProjection[];
}

export function ProjectionTable({ projections }: ProjectionTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {[
              "Year",
              "Monthly Rent",
              "Effective Income",
              "Expenses",
              "NOI",
              "Debt Service",
              "Cash Flow",
              "CoC Return",
              "Property Value",
              "Loan Balance",
              "Equity",
              "DSCR",
            ].map((h) => (
              <th
                key={h}
                className="px-3 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {projections.map((p) => (
            <tr key={p.year} className="hover:bg-gray-50 transition-colors">
              <td className="px-3 py-2 font-medium text-gray-700">Y{p.year}</td>
              <td className="px-3 py-2">{formatCurrency(p.monthlyRent)}</td>
              <td className="px-3 py-2">{formatCurrency(p.effectiveGrossIncome)}</td>
              <td className="px-3 py-2 text-orange-600">{formatCurrency(p.totalExpenses)}</td>
              <td className="px-3 py-2 text-blue-600 font-medium">{formatCurrency(p.noi)}</td>
              <td className="px-3 py-2 text-red-500">{formatCurrency(p.debtService)}</td>
              <td
                className={cn(
                  "px-3 py-2 font-semibold",
                  p.cashFlow >= 0 ? "text-green-600" : "text-red-600"
                )}
              >
                {formatCurrency(p.cashFlow / 12)}/mo
              </td>
              <td
                className={cn(
                  "px-3 py-2",
                  p.cashOnCashReturn >= 6 ? "text-green-600" : "text-gray-600"
                )}
              >
                {formatPercent(p.cashOnCashReturn, 1)}
              </td>
              <td className="px-3 py-2">{formatCurrency(p.propertyValue)}</td>
              <td className="px-3 py-2 text-red-400">{formatCurrency(p.loanBalance)}</td>
              <td className="px-3 py-2 font-medium text-purple-600">{formatCurrency(p.equity)}</td>
              <td
                className={cn(
                  "px-3 py-2",
                  p.dscr >= 1.25 ? "text-green-600" : p.dscr >= 1.0 ? "text-yellow-600" : "text-red-600"
                )}
              >
                {p.dscr.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
