"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface RealismWarningsProps {
  warnings: string[];
}

export function RealismWarnings({ warnings }: RealismWarningsProps) {
  if (warnings.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <span className="text-sm font-semibold text-amber-700">
          Realism Check — {warnings.length} Warning{warnings.length > 1 ? "s" : ""}
        </span>
      </div>
      <ul className="space-y-1">
        {warnings.map((w, i) => (
          <li key={i} className="text-sm text-amber-700">
            • {w}
          </li>
        ))}
      </ul>
    </div>
  );
}
