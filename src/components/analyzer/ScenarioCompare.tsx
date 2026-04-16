"use client";

import React from "react";
import { Scenario } from "@/lib/types";
import { formatCurrency, formatPercent, gradeBgColor, gradeColor, cn } from "@/lib/utils";

interface ScenarioCompareProps {
  scenarios: Scenario[];
}

export function ScenarioCompare({ scenarios }: ScenarioCompareProps) {
  const labels = ["Conservative", "Base Case", "Aggressive"];
  const colors = ["text-gray-600", "text-blue-600", "text-green-600"];
  const bgColors = ["bg-gray-50", "bg-blue-50", "bg-green-50"];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-4">Scenario Comparison</h3>
      <div className="grid grid-cols-3 gap-3">
        {scenarios.map((scenario, i) => {
          const m = scenario.metrics;
          const e = scenario.exit;
          const g = scenario.grades?.overall;
          if (!m || !e) return null;

          return (
            <div
              key={scenario.type}
              className={cn("rounded-lg border p-3", bgColors[i], "border-gray-200")}
            >
              <div className={cn("text-sm font-bold mb-3", colors[i])}>
                {labels[i]}
              </div>

              <div className="space-y-2 text-xs">
                <Row label="Monthly CF" value={formatCurrency(m.cashFlow / 12)} positive={m.cashFlow >= 0} />
                <Row label="Cash-on-Cash" value={formatPercent(m.cashOnCashReturn, 1)} positive={m.cashOnCashReturn >= 6} />
                <Row label="Cap Rate" value={formatPercent(m.capRate, 1)} positive={m.capRate >= 5} />
                <Row label="DSCR" value={m.dscr.toFixed(2)} positive={m.dscr >= 1.2} />
                <Row label="Total ROI" value={formatPercent(e.roi, 0)} positive={e.roi >= 20} />
                <Row label="IRR" value={e.irr ? formatPercent(e.irr, 1) : "N/A"} />
                <Row label="Equity Mult." value={`${e.equityMultiple.toFixed(1)}x`} />

                {g && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div
                      className={cn(
                        "inline-flex items-center justify-center w-10 h-10 rounded-lg border-2 font-bold text-lg",
                        gradeBgColor(g.grade),
                        gradeColor(g.grade)
                      )}
                    >
                      {g.grade}
                    </div>
                    <span className="ml-2 text-gray-500 text-xs">{g.score}/100</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span
        className={cn(
          "font-semibold",
          positive === undefined
            ? "text-gray-700"
            : positive
            ? "text-green-600"
            : "text-red-600"
        )}
      >
        {value}
      </span>
    </div>
  );
}
