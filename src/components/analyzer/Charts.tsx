"use client";

import React from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { FullAnalysisResult } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface ChartsProps {
  result: FullAnalysisResult;
}

const COLORS = {
  income: "#3b82f6",
  expense: "#f97316",
  cashFlow: "#22c55e",
  equity: "#8b5cf6",
  loanBalance: "#ef4444",
  appreciation: "#10b981",
  conservative: "#94a3b8",
  base: "#3b82f6",
  aggressive: "#22c55e",
};

const tooltipStyle = {
  contentStyle: {
    fontSize: 12,
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
};

function ChartWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function CashFlowChart({ result }: { result: FullAnalysisResult }) {
  const data = result.projections.map((p) => ({
    year: `Y${p.year}`,
    "Monthly CF": Math.round(p.cashFlow / 12),
    "Cumulative CF": Math.round(p.cumulativeCashFlow),
  }));

  return (
    <ChartWrapper title="Cash Flow Projection">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            {...tooltipStyle}
            formatter={(v) => [formatCurrency(Number(v ?? 0)), ""]}
          />
          <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
          <Bar dataKey="Monthly CF" fill={COLORS.cashFlow} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

function IncomeExpenseChart({ result }: { result: FullAnalysisResult }) {
  const data = result.projections.map((p) => ({
    year: `Y${p.year}`,
    Income: Math.round(p.effectiveGrossIncome),
    Expenses: Math.round(p.totalExpenses),
    "Debt Service": Math.round(p.debtService),
  }));

  return (
    <ChartWrapper title="Income vs Expenses">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            {...tooltipStyle}
            formatter={(v) => [formatCurrency(Number(v ?? 0)), ""]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="Income" stroke={COLORS.income} fill={COLORS.income} fillOpacity={0.15} />
          <Area type="monotone" dataKey="Expenses" stroke={COLORS.expense} fill={COLORS.expense} fillOpacity={0.15} />
          <Area type="monotone" dataKey="Debt Service" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

function EquityChart({ result }: { result: FullAnalysisResult }) {
  const data = result.projections.map((p) => ({
    year: `Y${p.year}`,
    Equity: Math.round(p.equity),
    "Loan Balance": Math.round(p.loanBalance),
    "Property Value": Math.round(p.propertyValue),
  }));

  return (
    <ChartWrapper title="Equity & Property Value">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            {...tooltipStyle}
            formatter={(v) => [formatCurrency(Number(v ?? 0)), ""]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="Property Value" stroke={COLORS.appreciation} fill={COLORS.appreciation} fillOpacity={0.1} />
          <Area type="monotone" dataKey="Equity" stroke={COLORS.equity} fill={COLORS.equity} fillOpacity={0.2} />
          <Area type="monotone" dataKey="Loan Balance" stroke={COLORS.loanBalance} fill={COLORS.loanBalance} fillOpacity={0.1} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

function RentGrowthChart({ result }: { result: FullAnalysisResult }) {
  const data = result.projections.map((p) => ({
    year: `Y${p.year}`,
    "Monthly Rent": Math.round(p.monthlyRent),
  }));

  return (
    <ChartWrapper title="Rent Growth">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            {...tooltipStyle}
            formatter={(v) => [formatCurrency(Number(v ?? 0)), "Monthly Rent"]}
          />
          <Line type="monotone" dataKey="Monthly Rent" stroke={COLORS.income} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

function ScenarioChart({ result }: { result: FullAnalysisResult }) {
  const years = result.projections.length;
  const data = Array.from({ length: years }, (_, i) => ({
    year: `Y${i + 1}`,
    Conservative: Math.round((result.scenarios[0]?.projections?.[i]?.cashFlow ?? 0) / 12),
    Base: Math.round((result.scenarios[1]?.projections?.[i]?.cashFlow ?? 0) / 12),
    Aggressive: Math.round((result.scenarios[2]?.projections?.[i]?.cashFlow ?? 0) / 12),
  }));

  return (
    <ChartWrapper title="Scenario Comparison — Monthly Cash Flow">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            {...tooltipStyle}
            formatter={(v) => [formatCurrency(Number(v ?? 0)), ""]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
          <Line type="monotone" dataKey="Conservative" stroke={COLORS.conservative} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Base" stroke={COLORS.base} strokeWidth={2} dot={false} strokeDasharray="5 5" />
          <Line type="monotone" dataKey="Aggressive" stroke={COLORS.aggressive} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

function CumulativeProfitChart({ result }: { result: FullAnalysisResult }) {
  const data = result.projections.map((p) => ({
    year: `Y${p.year}`,
    "Cumulative Cash Flow": Math.round(p.cumulativeCashFlow),
    Equity: Math.round(p.equity),
  }));

  return (
    <ChartWrapper title="Cumulative Profit & Equity Build">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            {...tooltipStyle}
            formatter={(v) => [formatCurrency(Number(v ?? 0)), ""]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
          <Line type="monotone" dataKey="Cumulative Cash Flow" stroke={COLORS.cashFlow} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Equity" stroke={COLORS.equity} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

export function Charts({ result }: ChartsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <CashFlowChart result={result} />
      <IncomeExpenseChart result={result} />
      <EquityChart result={result} />
      <RentGrowthChart result={result} />
      <ScenarioChart result={result} />
      <CumulativeProfitChart result={result} />
    </div>
  );
}
