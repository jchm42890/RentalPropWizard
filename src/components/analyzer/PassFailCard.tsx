"use client";

import React, { useState } from "react";
import { PassFailResult, PassFailRules } from "@/lib/types";
import { DEFAULT_PASS_FAIL_RULES } from "@/lib/engines/passFailRules";
import { formatPercent, cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PassFailCardProps {
  result: PassFailResult;
  rules: PassFailRules;
  onRulesChange: (rules: PassFailRules) => void;
}

export function PassFailCard({ result, rules, onRulesChange }: PassFailCardProps) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-800">Pass / Fail Rules</h3>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "px-3 py-1 rounded-full text-sm font-bold",
              result.pass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            )}
          >
            {result.pass ? "✓ PASS" : "✗ FAIL"}
          </div>
          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            className="text-xs text-blue-600 hover:underline"
          >
            {editing ? "Done" : "Edit Rules"}
          </button>
        </div>
      </div>

      {editing && (
        <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <div>
            <Label className="text-xs">Min CoC %</Label>
            <Input
              type="number"
              value={rules.minCashOnCashPct}
              step={0.5}
              onChange={(e) => onRulesChange({ ...rules, minCashOnCashPct: parseFloat(e.target.value) || 0 })}
              className="h-8 text-xs mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Min DSCR</Label>
            <Input
              type="number"
              value={rules.minDSCR}
              step={0.05}
              onChange={(e) => onRulesChange({ ...rules, minDSCR: parseFloat(e.target.value) || 0 })}
              className="h-8 text-xs mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Min Monthly CF ($)</Label>
            <Input
              type="number"
              value={rules.minMonthlyCashFlow}
              step={50}
              onChange={(e) => onRulesChange({ ...rules, minMonthlyCashFlow: parseFloat(e.target.value) || 0 })}
              className="h-8 text-xs mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Max LTV %</Label>
            <Input
              type="number"
              value={rules.maxLTV}
              step={5}
              onChange={(e) => onRulesChange({ ...rules, maxLTV: parseFloat(e.target.value) || 0 })}
              className="h-8 text-xs mt-1"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {result.results.map((r, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 text-sm",
              r.pass ? "bg-green-50" : "bg-red-50"
            )}
          >
            <div className="flex items-center gap-2">
              {r.pass ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-gray-700">{r.rule}</span>
            </div>
            <span
              className={cn(
                "font-semibold text-xs",
                r.pass ? "text-green-600" : "text-red-600"
              )}
            >
              {typeof r.actual === "number" && r.actual % 1 !== 0
                ? r.actual.toFixed(2)
                : r.actual.toFixed(0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
