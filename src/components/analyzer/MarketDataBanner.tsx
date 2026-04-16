"use client";

import React from "react";
import { MarketDataResult } from "@/lib/marketData";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { Database, CheckCircle2, AlertCircle, Info } from "lucide-react";

interface MarketDataBannerProps {
  data: MarketDataResult;
  onDismiss?: () => void;
}

const confidenceColors = {
  high: "bg-green-50 border-green-200 text-green-800",
  medium: "bg-blue-50 border-blue-200 text-blue-800",
  low: "bg-yellow-50 border-yellow-200 text-yellow-800",
};

const confidenceIcons = {
  high: <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />,
  medium: <Info className="h-3.5 w-3.5 text-blue-600" />,
  low: <AlertCircle className="h-3.5 w-3.5 text-yellow-600" />,
};

function SourceRow({
  label,
  value,
  source,
  confidence,
}: {
  label: string;
  value: string;
  source: string;
  confidence: "high" | "medium" | "low";
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <span className="text-xs font-semibold text-gray-700">{label}: </span>
        <span className="text-xs font-bold text-blue-700">{value}</span>
        <div className="flex items-center gap-1 mt-0.5">
          {confidenceIcons[confidence]}
          <span className="text-[10px] text-gray-500">{source}</span>
        </div>
      </div>
      <span
        className={cn(
          "text-[10px] font-semibold rounded-full px-1.5 py-0.5 border capitalize shrink-0",
          confidenceColors[confidence]
        )}
      >
        {confidence}
      </span>
    </div>
  );
}

export function MarketDataBanner({ data, onDismiss }: MarketDataBannerProps) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700">
          <Database className="h-3.5 w-3.5" />
          Market Data Applied — {data.dataFreshness}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-[10px] text-blue-500 hover:underline"
          >
            Dismiss
          </button>
        )}
      </div>

      <div className="space-y-2">
        {data.estimatedMonthlyRent !== null ? (
          <SourceRow
            label="Rent Estimate"
            value={`${formatCurrency(data.estimatedMonthlyRent)}/mo`}
            source={`${data.rentSource} · ${data.bedAdjustmentMultiplier.toFixed(2)}x bed adjustment`}
            confidence={data.rentConfidence}
          />
        ) : (
          <div className="text-xs text-yellow-700">
            ⚠ Rent data unavailable for ZIP {data.zip} — enter manually.
            {data.rentNote && <span className="block text-[10px] mt-0.5 opacity-70">{data.rentNote}</span>}
          </div>
        )}

        <SourceRow
          label="Property Tax"
          value={`${formatCurrency(data.estimatedAnnualTax)}/yr (${formatPercent(data.effectiveTaxRate, 2)} eff. rate)`}
          source={data.taxSource}
          confidence={data.taxConfidence}
        />

        <SourceRow
          label="Insurance"
          value={`${formatCurrency(data.estimatedAnnualInsurance)}/yr`}
          source={data.insuranceSource}
          confidence="medium"
        />
      </div>

      <p className="text-[10px] text-blue-600 leading-relaxed">
        All values are estimates from public data. Verify with actual quotes before making investment decisions.
      </p>
    </div>
  );
}
