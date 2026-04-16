"use client";

import React, { useState, useCallback } from "react";
import { AnalysisAssumptions, FullAnalysisResult, PassFailRules } from "@/lib/types";
import { DEFAULT_ASSUMPTIONS } from "@/lib/defaults";
import { DEFAULT_PASS_FAIL_RULES } from "@/lib/engines/passFailRules";
import { InputPanel } from "./InputPanel";
import { KpiCards } from "./KpiCards";
import { GradeCard } from "./GradeCard";
import { Charts } from "./Charts";
import { ProjectionTable } from "./ProjectionTable";
import { DealSummaryCard } from "./DealSummaryCard";
import { SensitivityTable } from "./SensitivityTable";
import { ScenarioCompare } from "./ScenarioCompare";
import { PassFailCard } from "./PassFailCard";
import { CompsTable } from "./CompsTable";
import { ExitCard } from "./ExitCard";
import { RealismWarnings } from "./RealismWarnings";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { runFullAnalysis } from "@/lib/engines/analyzer";
import { Building2 } from "lucide-react";

export function AnalyzerClient() {
  const [assumptions, setAssumptions] = useState<AnalysisAssumptions>(DEFAULT_ASSUMPTIONS);
  const [result, setResult] = useState<FullAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [passFailRules, setPassFailRules] = useState<PassFailRules>(DEFAULT_PASS_FAIL_RULES);

  const handleAnalyze = useCallback(() => {
    setIsLoading(true);
    // Run synchronously but defer to next tick for UI responsiveness
    setTimeout(() => {
      try {
        const r = runFullAnalysis(assumptions, { passFailRules });
        setResult(r);
      } catch (err) {
        console.error("Analysis error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 0);
  }, [assumptions, passFailRules]);

  const handleRulesChange = useCallback(
    (newRules: PassFailRules) => {
      setPassFailRules(newRules);
      if (result) {
        const r = runFullAnalysis(assumptions, { passFailRules: newRules });
        setResult(r);
      }
    },
    [assumptions, result]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-bold text-gray-900">Rental Property Wizard</span>
          </div>
          <span className="text-xs text-gray-400 border-l border-gray-200 pl-3 ml-1">
            Rental Investment Analyzer
          </span>
          {result && (
            <div className="ml-auto flex items-center gap-2">
              <span
                className={`text-sm font-bold px-3 py-1 rounded-full ${
                  result.dealSummary.verdictColor === "green"
                    ? "bg-green-100 text-green-700"
                    : result.dealSummary.verdictColor === "yellow"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {result.dealSummary.verdict}
              </span>
              <span className="text-xs text-gray-500">
                Overall: {result.grades.overall.grade} ({result.grades.overall.score}/100)
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar — Inputs */}
          <aside className="w-80 flex-shrink-0 hidden lg:block">
            <div className="sticky top-20">
              <InputPanel
                assumptions={assumptions}
                onChange={setAssumptions}
                onAnalyze={handleAnalyze}
                isLoading={isLoading}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Mobile input trigger */}
            <div className="lg:hidden mb-4">
              <InputPanel
                assumptions={assumptions}
                onChange={setAssumptions}
                onAnalyze={handleAnalyze}
                isLoading={isLoading}
              />
            </div>

            {!result ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <Building2 className="h-16 w-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-600 mb-2">
                  Ready to Analyze
                </h2>
                <p className="text-gray-400 max-w-md">
                  Fill in your property details on the left and click{" "}
                  <strong>Analyze Property</strong> to get a full investment analysis.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Realism Warnings */}
                <RealismWarnings warnings={result.realism.warnings} />

                {/* KPI Cards — sticky on mobile */}
                <div className="sticky top-14 z-30 bg-gray-50 pb-2 pt-1">
                  <KpiCards result={result} />
                </div>

                {/* Tabs for the rest */}
                <Tabs defaultValue="overview">
                  <TabsList className="flex-wrap h-auto gap-1 bg-gray-100 p-1">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="projections">Projections</TabsTrigger>
                    <TabsTrigger value="charts">Charts</TabsTrigger>
                    <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
                    <TabsTrigger value="comps">Comps</TabsTrigger>
                    <TabsTrigger value="sensitivity">Sensitivity</TabsTrigger>
                    <TabsTrigger value="exit">Exit</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      <GradeCard grades={result.grades} risk={result.risk} />
                      <DealSummaryCard summary={result.dealSummary} />
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      <PassFailCard
                        result={result.passFailResult}
                        rules={passFailRules}
                        onRulesChange={handleRulesChange}
                      />
                      <MetricsSummary result={result} />
                    </div>
                  </TabsContent>

                  <TabsContent value="projections" className="mt-4">
                    <ProjectionTable projections={result.projections} />
                  </TabsContent>

                  <TabsContent value="charts" className="mt-4">
                    <Charts result={result} />
                  </TabsContent>

                  <TabsContent value="scenarios" className="mt-4">
                    <ScenarioCompare scenarios={result.scenarios} />
                  </TabsContent>

                  <TabsContent value="comps" className="mt-4">
                    <CompsTable comps={result.comps} />
                  </TabsContent>

                  <TabsContent value="sensitivity" className="mt-4">
                    <SensitivityTable
                      sensitivity={result.sensitivity}
                      assumptions={result.assumptions}
                    />
                  </TabsContent>

                  <TabsContent value="exit" className="mt-4">
                    <ExitCard exit={result.exit} />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function MetricsSummary({ result }: { result: FullAnalysisResult }) {
  const { metrics, loan } = result;

  const rows = [
    { label: "Gross Rent Income", value: `$${(metrics.grossRentIncome / 12).toFixed(0)}/mo` },
    { label: "Vacancy Loss", value: `-$${(metrics.vacancyLoss / 12).toFixed(0)}/mo`, neg: true },
    { label: "Effective Gross Income", value: `$${(metrics.effectiveGrossIncome / 12).toFixed(0)}/mo` },
    { label: "Total Expenses", value: `-$${(metrics.totalExpenses / 12).toFixed(0)}/mo`, neg: true },
    { label: "Net Operating Income", value: `$${(metrics.noi / 12).toFixed(0)}/mo`, bold: true },
    { label: "Debt Service", value: `-$${(metrics.debtService / 12).toFixed(0)}/mo`, neg: true },
    { label: "Cash Flow", value: `$${(metrics.cashFlow / 12).toFixed(0)}/mo`, bold: true, positive: metrics.cashFlow >= 0 },
    { sep: true },
    { label: "Loan Amount", value: `$${loan.loanAmount.toLocaleString()}` },
    { label: "Down Payment", value: `$${loan.downPayment.toLocaleString()}` },
    { label: "Closing Costs", value: `$${loan.closingCosts.toFixed(0)}` },
    { label: "GRM", value: metrics.grm.toFixed(1) },
  ] as any[];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-4">Income Statement (Year 1)</h3>
      <div className="space-y-1.5">
        {rows.map((r, i) =>
          r.sep ? (
            <div key={i} className="border-t border-gray-100 my-2" />
          ) : (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-600">{r.label}</span>
              <span
                className={`font-medium ${r.bold ? "font-semibold" : ""} ${
                  r.positive === false || r.neg ? "text-red-600" :
                  r.positive === true ? "text-green-600" :
                  "text-gray-800"
                }`}
              >
                {r.value}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
