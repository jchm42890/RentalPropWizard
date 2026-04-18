"use client";

import React from "react";
import { FullAnalysisResult } from "@/lib/types";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface DealVerdictProps {
  result: FullAnalysisResult;
}

type Verdict = "DEAL" | "NO DEAL" | "BORDERLINE";

function getVerdict(result: FullAnalysisResult): {
  verdict: Verdict;
  headline: string;
  sub: string;
  reasons: string[];
  color: "green" | "red" | "yellow";
} {
  const { metrics, grades, risk, passFailResult } = result;
  const passCount = passFailResult.results.filter((r) => r.pass).length;
  const totalRules = passFailResult.results.length;
  const score = grades.overall.score;

  // Strong deal
  if (score >= 75 && metrics.cashFlow > 0 && metrics.dscr >= 1.2 && passCount === totalRules) {
    return {
      verdict: "DEAL",
      headline: "This is a Deal",
      sub: `Grade ${grades.overall.grade} · ${formatPercent(metrics.cashOnCashReturn, 1)} CoC · ${formatCurrency(metrics.cashFlow / 12)}/mo cash flow`,
      reasons: [
        ...grades.overall.strengths.slice(0, 3),
        `Passes all ${totalRules} investment criteria`,
      ].filter(Boolean),
      color: "green",
    };
  }

  // Decent deal
  if (score >= 62 && metrics.cashFlow > 0 && metrics.dscr >= 1.0 && passCount >= totalRules - 1) {
    return {
      verdict: "DEAL",
      headline: "Likely a Deal",
      sub: `Grade ${grades.overall.grade} · ${formatPercent(metrics.cashOnCashReturn, 1)} CoC · ${passCount}/${totalRules} criteria met`,
      reasons: [
        ...grades.overall.strengths.slice(0, 2),
        ...(grades.overall.weaknesses.length ? [`Watch: ${grades.overall.weaknesses[0]}`] : []),
      ].filter(Boolean),
      color: "green",
    };
  }

  // Borderline
  if (score >= 50 && passCount >= totalRules / 2) {
    return {
      verdict: "BORDERLINE",
      headline: "Needs More Analysis",
      sub: `Grade ${grades.overall.grade} · ${passCount}/${totalRules} criteria met · Risk: ${risk.level}`,
      reasons: [
        ...(grades.overall.strengths.length ? [`Pro: ${grades.overall.strengths[0]}`] : []),
        ...(grades.overall.weaknesses.length ? [`Con: ${grades.overall.weaknesses[0]}`] : []),
        risk.warnings[0] ?? risk.factors[0] ?? "",
      ].filter(Boolean),
      color: "yellow",
    };
  }

  // No deal
  return {
    verdict: "NO DEAL",
    headline: "Not a Deal",
    sub: `Grade ${grades.overall.grade} · ${passCount}/${totalRules} criteria met · Risk: ${risk.level}`,
    reasons: [
      ...grades.overall.weaknesses.slice(0, 2),
      ...risk.warnings.slice(0, 2),
    ].filter(Boolean),
    color: "red",
  };
}

export function DealVerdict({ result }: DealVerdictProps) {
  const { verdict, headline, sub, reasons, color } = getVerdict(result);
  const { metrics, exit } = result;

  const config = {
    green: {
      bg: "from-green-500 to-emerald-600",
      iconBg: "bg-green-400/30",
      border: "border-green-400/40",
      badge: "bg-white/20 text-white",
      icon: <CheckCircle2 className="h-12 w-12 text-white" />,
      label: "DEAL",
    },
    yellow: {
      bg: "from-amber-400 to-orange-500",
      iconBg: "bg-amber-300/30",
      border: "border-amber-300/40",
      badge: "bg-white/20 text-white",
      icon: <AlertTriangle className="h-12 w-12 text-white" />,
      label: "BORDERLINE",
    },
    red: {
      bg: "from-red-500 to-rose-600",
      iconBg: "bg-red-400/30",
      border: "border-red-400/40",
      badge: "bg-white/20 text-white",
      icon: <XCircle className="h-12 w-12 text-white" />,
      label: "NO DEAL",
    },
  }[color];

  return (
    <div className={cn("rounded-2xl bg-gradient-to-br text-white p-6 shadow-lg border", config.bg, config.border)}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className={cn("rounded-2xl p-3", config.iconBg)}>
          {config.icon}
        </div>
        <div className="text-right">
          <div className={cn("inline-block rounded-full px-4 py-1.5 text-sm font-black tracking-widest uppercase mb-1", config.badge)}>
            {config.label}
          </div>
          <div className="text-2xl font-black">{headline}</div>
          <div className="text-sm text-white/80 mt-0.5">{sub}</div>
        </div>
      </div>

      {/* Key numbers row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatPill
          label="Monthly Cash Flow"
          value={formatCurrency(metrics.cashFlow / 12)}
          positive={metrics.cashFlow >= 0}
        />
        <StatPill
          label="Cash-on-Cash"
          value={formatPercent(metrics.cashOnCashReturn, 1)}
          positive={metrics.cashOnCashReturn >= 6}
        />
        <StatPill
          label="Total ROI"
          value={formatPercent(exit.roi, 0)}
          positive={exit.roi >= 20}
        />
      </div>

      {/* Reasons */}
      {reasons.length > 0 && (
        <div className="space-y-1.5">
          {reasons.map((r, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-white/90">
              <span className="mt-0.5 shrink-0">
                {color === "green" ? "✓" : color === "red" ? "✗" : "→"}
              </span>
              {r}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-xl bg-white/15 backdrop-blur-sm px-3 py-2.5 text-center">
      <div className="text-[10px] text-white/70 uppercase tracking-wide mb-1">{label}</div>
      <div className={cn("text-lg font-bold", positive === false ? "text-red-200" : "text-white")}>
        {value}
      </div>
    </div>
  );
}
