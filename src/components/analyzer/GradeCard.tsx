"use client";

import React from "react";
import { PropertyGrades, GradeDetail, RiskAssessment } from "@/lib/types";
import { gradeBgColor, gradeColor, cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertTriangle, Shield } from "lucide-react";

interface GradeCardProps {
  grades: PropertyGrades;
  risk: RiskAssessment;
}

function GradeBadge({ detail, size = "md" }: { detail: GradeDetail; size?: "sm" | "md" | "lg" }) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-xl border-2 font-bold",
        gradeBgColor(detail.grade),
        gradeColor(detail.grade),
        size === "lg" ? "w-20 h-20 text-3xl" : size === "md" ? "w-14 h-14 text-2xl" : "w-10 h-10 text-lg"
      )}
    >
      {detail.grade}
    </div>
  );
}

function GradeSection({ detail, title }: { detail: GradeDetail; title: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <GradeBadge detail={detail} size="md" />
      <div className="text-center">
        <div className="text-sm font-semibold text-gray-700">{title}</div>
        <div className="text-xs text-gray-500">{detail.score}/100</div>
      </div>
    </div>
  );
}

function RiskBadge({ risk }: { risk: RiskAssessment }) {
  const colors: Record<string, string> = {
    Low: "bg-green-100 text-green-700 border-green-300",
    Medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
    High: "bg-orange-100 text-orange-700 border-orange-300",
    "Very High": "bg-red-100 text-red-700 border-red-300",
  };
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold",
        colors[risk.level]
      )}
    >
      <Shield className="h-3.5 w-3.5" />
      {risk.level} Risk
    </div>
  );
}

export function GradeCard({ grades, risk }: GradeCardProps) {
  const { overall, financial, neighborhood } = grades;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-800">Property Score</h3>
          <p className="text-xs text-gray-500">
            {grades.financialWeight}% financial / {grades.neighborhoodWeight}% neighborhood
          </p>
        </div>
        <RiskBadge risk={risk} />
      </div>

      {/* Grades */}
      <div className="flex items-center justify-around py-3">
        <div className="flex flex-col items-center gap-2">
          <GradeBadge detail={overall} size="lg" />
          <div className="text-center">
            <div className="text-sm font-bold text-gray-800">Overall</div>
            <div className="text-xs text-gray-500">{overall.score}/100</div>
          </div>
        </div>
        <div className="text-gray-200 text-2xl font-light">|</div>
        <GradeSection detail={financial} title="Financial" />
        <div className="text-gray-200 text-2xl font-light">|</div>
        <GradeSection detail={neighborhood} title="Neighborhood" />
      </div>

      {/* Strengths & Weaknesses */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {overall.strengths.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-green-700 mb-1.5 flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" /> Strengths
            </div>
            <ul className="space-y-1">
              {overall.strengths.slice(0, 3).map((s, i) => (
                <li key={i} className="text-xs text-gray-600">
                  • {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {overall.weaknesses.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-red-700 mb-1.5 flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5" /> Weaknesses
            </div>
            <ul className="space-y-1">
              {overall.weaknesses.slice(0, 3).map((w, i) => (
                <li key={i} className="text-xs text-gray-600">
                  • {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Risk Factors */}
      {risk.warnings.length > 0 && (
        <div className="mt-3 rounded-lg bg-orange-50 border border-orange-200 p-3">
          <div className="text-xs font-semibold text-orange-700 mb-1 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" /> Risk Warnings
          </div>
          <ul className="space-y-1">
            {risk.warnings.map((w, i) => (
              <li key={i} className="text-xs text-orange-600">
                • {w}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
