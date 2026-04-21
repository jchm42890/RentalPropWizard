"use client";

import React from "react";
import {
  RadialBarChart, RadialBar, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, ReferenceLine,
  Legend, AreaChart, Area,
} from "recharts";
import { FullAnalysisResult } from "@/lib/types";
import { formatCurrency, formatPercent, gradeBgColor, gradeColor, cn } from "@/lib/utils";
import { DealVerdict } from "./DealVerdict";
import { DealPricePanel } from "./DealPricePanel";
import { CheckCircle2, XCircle, AlertCircle, TrendingUp, Shield, Home } from "lucide-react";

interface OverviewTabProps {
  result: FullAnalysisResult;
  onRulesChange: (rules: FullAnalysisResult["passFailResult"] extends { results: any[] } ? any : never) => void;
}

const TOOLTIP_STYLE = {
  contentStyle: {
    fontSize: 12,
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
};

// ─── Grade Gauge ─────────────────────────────────────────────────────────────

function GradeGauge({ score, grade, label }: { score: number; grade: string; label: string }) {
  const data = [{ name: label, value: score, fill: gradeGaugeColor(score) }];

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="68%"
            outerRadius="100%"
            startAngle={225}
            endAngle={-45}
            data={data}
            barSize={10}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: "#f1f5f9" }}
              dataKey="value"
              angleAxisId={0}
              cornerRadius={5}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-2xl font-black", gradeColor(grade as any))}>{grade}</span>
          <span className="text-xs text-gray-500">{score}/100</span>
        </div>
      </div>
      <span className="text-xs font-semibold text-gray-600 mt-1">{label}</span>
    </div>
  );
}

function gradeGaugeColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 65) return "#3b82f6";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

// ─── Expense Donut ───────────────────────────────────────────────────────────

function ExpenseDonut({ result }: { result: FullAnalysisResult }) {
  const { expenses, income } = result.assumptions;
  const egi = result.metrics.effectiveGrossIncome;

  const slices = [
    { name: "Property Tax", value: Math.round(expenses.propertyTaxAnnual), color: "#3b82f6" },
    { name: "Insurance", value: Math.round(expenses.insuranceAnnual), color: "#8b5cf6" },
    { name: "Repairs", value: Math.round(egi * expenses.repairsMaintenancePct / 100), color: "#f97316" },
    { name: "Management", value: Math.round(egi * expenses.propertyManagementPct / 100), color: "#ec4899" },
    { name: "CapEx", value: Math.round(egi * expenses.capexPct / 100), color: "#14b8a6" },
    { name: "HOA/Util/Other", value: Math.round(expenses.hoaMonthly * 12 + expenses.utilitiesMonthly * 12 + expenses.otherAnnual), color: "#94a3b8" },
  ].filter((s) => s.value > 0);

  const totalExp = slices.reduce((s, e) => s + e.value, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Expense Breakdown</h4>
      <div className="flex items-center gap-4">
        <div className="shrink-0 w-32 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                cx="50%"
                cy="50%"
                innerRadius={34}
                outerRadius={58}
                paddingAngle={2}
                dataKey="value"
              >
                {slices.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(v) => [formatCurrency(Number(v ?? 0)) + "/yr", ""]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-1.5 min-w-0">
          {slices.map((s) => (
            <div key={s.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-gray-600 truncate">{s.name}</span>
              </div>
              <div className="text-right ml-2 shrink-0">
                <span className="font-semibold text-gray-800">{formatCurrency(s.value / 12)}</span>
                <span className="text-gray-400">/mo</span>
              </div>
            </div>
          ))}
          <div className="pt-1.5 border-t border-gray-100 flex justify-between text-xs font-bold">
            <span className="text-gray-700">Total Expenses</span>
            <span className="text-orange-600">{formatCurrency(totalExp / 12)}/mo</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 5-Year Cash Flow Mini Chart ─────────────────────────────────────────────

function CashFlowMini({ result }: { result: FullAnalysisResult }) {
  const data = result.projections.slice(0, 5).map((p) => ({
    year: `Y${p.year}`,
    CF: Math.round(p.cashFlow / 12),
  }));

  const allPositive = data.every((d) => d.CF >= 0);
  const allNegative = data.every((d) => d.CF < 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-700">Monthly Cash Flow (5yr)</h4>
        <span className={cn(
          "text-xs font-bold px-2 py-0.5 rounded-full",
          allPositive ? "bg-green-100 text-green-700" : allNegative ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
        )}>
          {allPositive ? "Positive" : allNegative ? "Negative" : "Mixed"}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={data} margin={{ left: 0, right: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f8f8f8" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} width={45} />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(v) => [formatCurrency(Number(v ?? 0)) + "/mo", "Cash Flow"]}
          />
          <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
          <Bar
            dataKey="CF"
            radius={[4, 4, 0, 0]}
            fill="#22c55e"
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.CF >= 0 ? "#22c55e" : "#ef4444"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Equity Build Mini Chart ──────────────────────────────────────────────────

function EquityMini({ result }: { result: FullAnalysisResult }) {
  const data = result.projections.map((p) => ({
    year: `Y${p.year}`,
    Equity: Math.round(p.equity),
    "Loan Balance": Math.round(p.loanBalance),
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Equity vs Loan Balance</h4>
      <ResponsiveContainer width="100%" height={130}>
        <AreaChart data={data} margin={{ left: 0, right: 0 }}>
          <defs>
            <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f8f8f8" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={42} />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(v) => [formatCurrency(Number(v ?? 0)), ""]}
          />
          <Area type="monotone" dataKey="Equity" stroke="#8b5cf6" fill="url(#equityGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="Loan Balance" stroke="#ef4444" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Deal Criteria (replaces Pass/Fail) ──────────────────────────────────────

function DealCriteria({
  result,
  onRulesChange,
}: {
  result: FullAnalysisResult;
  onRulesChange: (r: any) => void;
}) {
  const { passFailResult: pf } = result;
  const passCount = pf.results.filter((r) => r.pass).length;
  const total = pf.results.length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700">Deal Criteria</h4>
        <span className={cn(
          "text-xs font-bold px-2.5 py-1 rounded-full",
          pf.pass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        )}>
          {passCount}/{total} Met
        </span>
      </div>
      <div className="space-y-2">
        {pf.results.map((r, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 text-xs",
              r.pass ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"
            )}
          >
            <div className="flex items-center gap-2">
              {r.pass
                ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                : <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
              <span className={r.pass ? "text-green-800" : "text-red-800"}>{r.rule}</span>
            </div>
            <span className={cn("font-bold tabular-nums", r.pass ? "text-green-700" : "text-red-600")}>
              {typeof r.actual === "number"
                ? r.actual % 1 !== 0 ? r.actual.toFixed(2) : r.actual.toFixed(0)
                : r.actual}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Key Metrics Row ─────────────────────────────────────────────────────────

function MetricRow({ label, value, sub, color }: {
  label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="text-right">
        <span className={cn("text-sm font-bold", color ?? "text-gray-800")}>{value}</span>
        {sub && <span className="text-xs text-gray-400 ml-1">{sub}</span>}
      </div>
    </div>
  );
}

function KeyMetrics({ result }: { result: FullAnalysisResult }) {
  const { metrics, exit, loan } = result;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Metrics</h4>
      <MetricRow label="Cap Rate" value={formatPercent(metrics.capRate, 2)} color={metrics.capRate >= 5 ? "text-green-600" : "text-orange-500"} />
      <MetricRow label="DSCR" value={metrics.dscr.toFixed(2)} color={metrics.dscr >= 1.2 ? "text-green-600" : metrics.dscr >= 1.0 ? "text-yellow-600" : "text-red-600"} />
      <MetricRow label="GRM" value={metrics.grm.toFixed(1)} sub="gross rent mult." />
      <MetricRow label="NOI" value={formatCurrency(metrics.noi / 12)} sub="/mo" color="text-blue-600" />
      <MetricRow label="IRR" value={exit.irr ? formatPercent(exit.irr, 1) : "N/A"} color={exit.irr && exit.irr >= 8 ? "text-green-600" : "text-gray-500"} />
      <MetricRow label="Equity Multiple" value={`${exit.equityMultiple.toFixed(2)}x`} color={exit.equityMultiple >= 1.5 ? "text-green-600" : "text-gray-600"} />
      <MetricRow label="Cash to Close" value={formatCurrency(loan.totalCashNeeded)} color="text-gray-700" />
    </div>
  );
}

// ─── Grades Panel ────────────────────────────────────────────────────────────

function GradesPanel({ result }: { result: FullAnalysisResult }) {
  const { grades, risk } = result;
  const riskColors = {
    Low: "bg-green-100 text-green-700",
    Medium: "bg-yellow-100 text-yellow-700",
    High: "bg-orange-100 text-orange-700",
    "Very High": "bg-red-100 text-red-700",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-700">Investment Score</h4>
        <span className={cn("text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1", riskColors[risk.level])}>
          <Shield className="h-3 w-3" /> {risk.level} Risk
        </span>
      </div>
      <div className="flex justify-around">
        <GradeGauge
          score={grades.overall.score}
          grade={grades.overall.grade}
          label="Overall"
        />
        <GradeGauge
          score={grades.financial.score}
          grade={grades.financial.grade}
          label="Financial"
        />
        <GradeGauge
          score={grades.neighborhood.score}
          grade={grades.neighborhood.grade}
          label="Location"
        />
      </div>

      {/* Strengths + Weaknesses inline */}
      {(grades.overall.strengths.length > 0 || grades.overall.weaknesses.length > 0) && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {grades.overall.strengths.slice(0, 2).map((s, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-green-700 bg-green-50 rounded-lg px-2 py-1.5">
              <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" /> {s}
            </div>
          ))}
          {grades.overall.weaknesses.slice(0, 2).map((w, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-red-700 bg-red-50 rounded-lg px-2 py-1.5">
              <XCircle className="h-3 w-3 shrink-0 mt-0.5" /> {w}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Deal Summary ─────────────────────────────────────────────────────────────

function DealNarrative({ result }: { result: FullAnalysisResult }) {
  const { dealSummary } = result;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Analysis Summary</h4>
      <div className="space-y-2">
        {dealSummary.sentences.map((s, i) => (
          <p key={i} className="text-xs text-gray-600 leading-relaxed">{s}</p>
        ))}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function OverviewTab({
  result,
  onRulesChange,
}: {
  result: FullAnalysisResult;
  onRulesChange: (rules: any) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Hero: Deal or No Deal */}
      <DealVerdict result={result} />

      {/* Grade gauges row */}
      <GradesPanel result={result} />

      {/* 3-chart row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CashFlowMini result={result} />
        <ExpenseDonut result={result} />
        <EquityMini result={result} />
      </div>

      {/* Deal Criteria */}
      <DealCriteria result={result} onRulesChange={onRulesChange} />

      {/* Deal Price + Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2 px-1">
            What price makes this a deal?
          </h3>
          <DealPricePanel assumptions={result.assumptions} />
        </div>
        <div className="space-y-4">
          <KeyMetrics result={result} />
          <DealNarrative result={result} />
        </div>
      </div>
    </div>
  );
}
