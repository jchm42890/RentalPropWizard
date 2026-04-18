"use client";

import React, { useState, useCallback } from "react";
import { AnalysisAssumptions, FullAnalysisResult, PassFailRules } from "@/lib/types";
import { DEFAULT_ASSUMPTIONS } from "@/lib/defaults";
import { DEFAULT_PASS_FAIL_RULES } from "@/lib/engines/passFailRules";
import { InputPanel } from "./InputPanel";
import { KpiCards } from "./KpiCards";
import { OverviewTab } from "./OverviewTab";
import { Charts } from "./Charts";
import { ProjectionTable } from "./ProjectionTable";
import { DealSummaryCard } from "./DealSummaryCard";
import { SensitivityTable } from "./SensitivityTable";
import { ScenarioCompare } from "./ScenarioCompare";
import { ExitCard } from "./ExitCard";
import { RealismWarnings } from "./RealismWarnings";
import { LiveCompsTab } from "./LiveCompsTab";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { runFullAnalysis } from "@/lib/engines/analyzer";
import { applyPassFailRules } from "@/lib/engines/passFailRules";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function AnalyzerClient() {
  const [assumptions, setAssumptions] = useState<AnalysisAssumptions>(DEFAULT_ASSUMPTIONS);
  const [result, setResult] = useState<FullAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [passFailRules, setPassFailRules] = useState<PassFailRules>(DEFAULT_PASS_FAIL_RULES);

  const handleAnalyze = useCallback(() => {
    setIsLoading(true);
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
        const updated = {
          ...result,
          passFailResult: applyPassFailRules(result.metrics, result.assumptions.loan, newRules),
        };
        setResult(updated);
      }
    },
    [result]
  );

  const verdictColor = result?.dealSummary.verdictColor;
  const verdict = result?.dealSummary.verdict;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-bold text-gray-900">Rental Property Wizard</span>
          </div>
          <span className="text-xs text-gray-400 border-l border-gray-200 pl-3 ml-1 hidden sm:block">
            Rental Investment Analyzer
          </span>
          {result && (
            <div className="ml-auto flex items-center gap-2">
              <span className={cn(
                "text-sm font-black px-4 py-1.5 rounded-full tracking-wide",
                verdictColor === "green" ? "bg-green-100 text-green-700" :
                verdictColor === "yellow" ? "bg-amber-100 text-amber-700" :
                "bg-red-100 text-red-700"
              )}>
                {verdict === "Strong Buy" || verdict === "Buy" ? "✓ DEAL" :
                 verdict === "Pass" || verdict === "Caution" ? "✗ NO DEAL" : "⚡ BORDERLINE"}
              </span>
              <span className="text-xs text-gray-500 hidden md:block">
                Grade {result.grades.overall.grade} · {result.grades.overall.score}/100
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar */}
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

          {/* Main */}
          <main className="flex-1 min-w-0">
            {/* Mobile inputs */}
            <div className="lg:hidden mb-4">
              <InputPanel
                assumptions={assumptions}
                onChange={setAssumptions}
                onAnalyze={handleAnalyze}
                isLoading={isLoading}
              />
            </div>

            {!result ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                <RealismWarnings warnings={result.realism.warnings} />

                {/* Sticky KPIs */}
                <div className="sticky top-14 z-30 bg-gray-50 pb-2 pt-1">
                  <KpiCards result={result} />
                </div>

                <Tabs defaultValue="overview">
                  <TabsList className="flex-wrap h-auto gap-1 bg-gray-100 p-1 w-full">
                    {[
                      { value: "overview", label: "Overview" },
                      { value: "comps", label: "Comps" },
                      { value: "projections", label: "Projections" },
                      { value: "charts", label: "Charts" },
                      { value: "scenarios", label: "Scenarios" },
                      { value: "sensitivity", label: "Sensitivity" },
                      { value: "exit", label: "Exit" },
                    ].map((t) => (
                      <TabsTrigger key={t.value} value={t.value} className="text-xs sm:text-sm">
                        {t.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value="overview" className="mt-4">
                    <OverviewTab result={result} onRulesChange={handleRulesChange} />
                  </TabsContent>

                  <TabsContent value="comps" className="mt-4">
                    <LiveCompsTab
                      assumptions={assumptions}
                      subjectRent={assumptions.income.monthlyRent}
                    />
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

                  <TabsContent value="sensitivity" className="mt-4">
                    <SensitivityTable sensitivity={result.sensitivity} assumptions={result.assumptions} />
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <Building2 className="h-16 w-16 text-gray-200 mb-4" />
      <h2 className="text-xl font-semibold text-gray-500 mb-2">Ready to Analyze</h2>
      <p className="text-gray-400 max-w-md text-sm">
        Enter your property details on the left, then click{" "}
        <strong className="text-gray-500">Analyze Property</strong>.
        <br />
        Get an instant <strong>Deal or No Deal</strong> verdict with grades, charts, and projections.
      </p>
    </div>
  );
}
