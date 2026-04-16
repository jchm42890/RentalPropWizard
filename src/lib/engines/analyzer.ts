// Main orchestrator — runs all engines and returns FullAnalysisResult
import {
  AnalysisAssumptions,
  FullAnalysisResult,
  PassFailRules,
  NeighborhoodData,
} from "../types";
import { calcLoanSummary, buildAmortizationSchedule } from "./loan";
import { calcAnnualMetrics } from "./metrics";
import { buildYearProjections, buildExitAnalysis } from "./projection";
import { calcAllGrades } from "./grading";
import { calcRisk } from "./risk";
import { buildScenarios } from "./scenarios";
import { buildSensitivityAnalysis, calcBreakevenRent } from "./sensitivity";
import { buildDealSummary } from "./dealSummary";
import { applyPassFailRules, DEFAULT_PASS_FAIL_RULES } from "./passFailRules";
import { checkRealism } from "./realism";
import { analyzeComps, generateSyntheticComps } from "./comps";

export function runFullAnalysis(
  assumptions: AnalysisAssumptions,
  options: {
    passFailRules?: PassFailRules;
    neighborhood?: NeighborhoodData;
    existingComps?: import("../types").RentalComp[];
  } = {}
): FullAnalysisResult {
  const { property, income, loan: loanAss } = assumptions;

  // 1. Loan
  const loan = calcLoanSummary(loanAss);
  const amortization = buildAmortizationSchedule(
    loan.loanAmount,
    loanAss.interestRate,
    loanAss.loanTermYears
  );

  // 2. Year-1 Metrics
  const metrics = calcAnnualMetrics(assumptions, loan, 1);

  // 3. Projections
  const projections = buildYearProjections(assumptions, loan, amortization);

  // 4. Exit
  const exit = buildExitAnalysis(assumptions, loan, projections);

  // 5. Grades
  const grades = calcAllGrades(
    metrics,
    exit,
    loan.totalCashNeeded,
    options.neighborhood
  );

  // 6. Risk
  const risk = calcRisk(metrics, loanAss, loan.totalCashNeeded);

  // 7. Comps
  const rawComps =
    options.existingComps ??
    generateSyntheticComps(
      property.beds,
      property.baths,
      property.zip,
      income.monthlyRent
    );
  const comps = analyzeComps(rawComps);

  // 8. Scenarios
  const scenarios = buildScenarios(assumptions);

  // 9. Sensitivity
  const sensitivity = buildSensitivityAnalysis(assumptions);

  // 10. Deal Summary
  const dealSummary = buildDealSummary(
    metrics,
    grades,
    risk,
    exit,
    `${property.address}, ${property.city}, ${property.state}`
  );

  // 11. Pass/Fail
  const passFailResult = applyPassFailRules(
    metrics,
    loanAss,
    options.passFailRules ?? DEFAULT_PASS_FAIL_RULES
  );

  // 12. Realism Check
  const realism = checkRealism(assumptions);

  // 13. Market Comparison (basic)
  const marketComparison = {
    rentVsMarket:
      income.monthlyRent > comps.weightedRent * 1.05
        ? ("above" as const)
        : income.monthlyRent < comps.weightedRent * 0.95
        ? ("below" as const)
        : ("inline" as const),
    rentDiffPct:
      comps.weightedRent > 0
        ? ((income.monthlyRent - comps.weightedRent) / comps.weightedRent) * 100
        : 0,
    priceVsMarket: "inline" as const,
    priceDiffPct: 0,
    rentPerSqft:
      property.sqft > 0 ? income.monthlyRent / property.sqft : 0,
    marketRentPerSqft: comps.rentPerSqft,
    explanation:
      comps.weightedRent > 0
        ? `Asking rent is ${Math.abs(
            ((income.monthlyRent - comps.weightedRent) / comps.weightedRent) * 100
          ).toFixed(1)}% ${income.monthlyRent > comps.weightedRent ? "above" : "below"} comparable rentals.`
        : "Market rent data unavailable.",
  };

  return {
    assumptions,
    loan,
    amortization,
    metrics,
    projections,
    exit,
    grades,
    risk,
    comps,
    scenarios,
    sensitivity,
    dealSummary,
    passFailResult,
    neighborhood: options.neighborhood,
    marketComparison,
    realism,
  };
}
