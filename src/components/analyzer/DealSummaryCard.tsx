"use client";

import React from "react";
import { DealSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CheckCircle, AlertCircle, XCircle } from "lucide-react";

interface DealSummaryCardProps {
  summary: DealSummary;
}

export function DealSummaryCard({ summary }: DealSummaryCardProps) {
  const verdictConfig = {
    green: {
      bg: "bg-green-50 border-green-200",
      text: "text-green-700",
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
    },
    yellow: {
      bg: "bg-yellow-50 border-yellow-200",
      text: "text-yellow-700",
      icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
    },
    red: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-700",
      icon: <XCircle className="h-5 w-5 text-red-600" />,
    },
  }[summary.verdictColor];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-3">Deal Summary</h3>

      {/* Verdict Badge */}
      <div className={cn("flex items-center gap-2 rounded-lg border px-4 py-2.5 mb-4", verdictConfig.bg)}>
        {verdictConfig.icon}
        <span className={cn("font-bold text-lg", verdictConfig.text)}>{summary.verdict}</span>
      </div>

      {/* Sentences */}
      <div className="space-y-2">
        {summary.sentences.map((s, i) => (
          <p key={i} className="text-sm text-gray-700 leading-relaxed">
            {s}
          </p>
        ))}
      </div>
    </div>
  );
}
