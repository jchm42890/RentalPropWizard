"use client";

import React from "react";
import { CompsAnalysis } from "@/lib/types";
import { formatCurrency, cn } from "@/lib/utils";

interface CompsTableProps {
  comps: CompsAnalysis;
  onToggleComp?: (id: string) => void;
}

export function CompsTable({ comps, onToggleComp }: CompsTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-gray-800">Rental Comps</h3>
          <span className="text-xs text-gray-500">
            Confidence: {comps.confidenceLabel} ({comps.confidenceScore}/100)
          </span>
        </div>
        <div className="flex gap-4 text-xs">
          <Stat label="Average" value={formatCurrency(comps.averageRent)} />
          <Stat label="Median" value={formatCurrency(comps.medianRent)} />
          <Stat label="Weighted" value={formatCurrency(comps.weightedRent)} />
          <Stat label="Range" value={`${formatCurrency(comps.rentRange.min)}–${formatCurrency(comps.rentRange.max)}`} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 text-left font-semibold text-gray-600">Address</th>
              <th className="py-2 text-right font-semibold text-gray-600">Rent</th>
              <th className="py-2 text-right font-semibold text-gray-600">Beds</th>
              <th className="py-2 text-right font-semibold text-gray-600">Baths</th>
              <th className="py-2 text-right font-semibold text-gray-600">Sq Ft</th>
              <th className="py-2 text-right font-semibold text-gray-600">$/sqft</th>
              <th className="py-2 text-right font-semibold text-gray-600">Distance</th>
              <th className="py-2 text-left font-semibold text-gray-600">Source</th>
              <th className="py-2 text-center font-semibold text-gray-600">Include</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {comps.comps.map((comp) => (
              <tr
                key={comp.id}
                className={cn(
                  "hover:bg-gray-50 transition-colors",
                  !comp.included && "opacity-40"
                )}
              >
                <td className="py-2 font-medium text-gray-700">{comp.address}</td>
                <td className="py-2 text-right font-semibold text-green-600">
                  {formatCurrency(comp.rent)}/mo
                </td>
                <td className="py-2 text-right">{comp.beds}</td>
                <td className="py-2 text-right">{comp.baths}</td>
                <td className="py-2 text-right">{comp.sqft ?? "—"}</td>
                <td className="py-2 text-right">
                  {comp.sqft ? `$${(comp.rent / comp.sqft).toFixed(2)}` : "—"}
                </td>
                <td className="py-2 text-right">
                  {comp.distance !== undefined ? `${comp.distance.toFixed(1)} mi` : "—"}
                </td>
                <td className="py-2 text-gray-500">{comp.source}</td>
                <td className="py-2 text-center">
                  {onToggleComp ? (
                    <input
                      type="checkbox"
                      checked={comp.included}
                      onChange={() => onToggleComp(comp.id)}
                      className="rounded"
                    />
                  ) : (
                    <span>{comp.included ? "✓" : "—"}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-gray-500">{label}</div>
      <div className="font-semibold text-gray-800">{value}</div>
    </div>
  );
}
