import {
  AnalysisAssumptions,
  Scenario,
  ScenarioType,
} from "../types";
import { calcLoanSummary, buildAmortizationSchedule } from "./loan";
import { calcAnnualMetrics } from "./metrics";
import { buildYearProjections, buildExitAnalysis } from "./projection";
import { calcAllGrades } from "./grading";

function applyScenarioOverrides(
  base: AnalysisAssumptions,
  type: ScenarioType
): AnalysisAssumptions {
  const overrides = getScenarioOverrides(type);
  return {
    ...base,
    income: { ...base.income, ...overrides.income },
    expenses: { ...base.expenses, ...overrides.expenses },
    projection: { ...base.projection, ...overrides.projection },
    loan: { ...base.loan, ...overrides.loan },
  };
}

function getScenarioOverrides(type: ScenarioType): {
  income: Partial<AnalysisAssumptions["income"]>;
  expenses: Partial<AnalysisAssumptions["expenses"]>;
  projection: Partial<AnalysisAssumptions["projection"]>;
  loan: Partial<AnalysisAssumptions["loan"]>;
} {
  switch (type) {
    case "conservative":
      return {
        income: { annualRentGrowthPct: 1, vacancyRatePct: 10 },
        expenses: { expenseGrowthPct: 4, repairsMaintenancePct: 10, capexPct: 8 },
        projection: { annualAppreciationPct: 2 },
        loan: {},
      };
    case "base":
      return {
        income: {},
        expenses: {},
        projection: {},
        loan: {},
      };
    case "aggressive":
      return {
        income: { annualRentGrowthPct: 5, vacancyRatePct: 3 },
        expenses: { expenseGrowthPct: 2, repairsMaintenancePct: 5, capexPct: 4 },
        projection: { annualAppreciationPct: 6 },
        loan: {},
      };
  }
}

export function buildScenarios(base: AnalysisAssumptions): Scenario[] {
  const types: ScenarioType[] = ["conservative", "base", "aggressive"];
  const labels = { conservative: "Conservative", base: "Base Case", aggressive: "Aggressive" };

  return types.map((type) => {
    const assumptions = applyScenarioOverrides(base, type);
    const loan = calcLoanSummary(assumptions.loan);
    const amort = buildAmortizationSchedule(
      loan.loanAmount,
      assumptions.loan.interestRate,
      assumptions.loan.loanTermYears
    );
    const metrics = calcAnnualMetrics(assumptions, loan, 1);
    const projections = buildYearProjections(assumptions, loan, amort);
    const exit = buildExitAnalysis(assumptions, loan, projections);
    const grades = calcAllGrades(metrics, exit, loan.totalCashNeeded);

    return {
      type,
      label: labels[type],
      assumptions,
      metrics,
      projections,
      exit,
      grades,
    };
  });
}
