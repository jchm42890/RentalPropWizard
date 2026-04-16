import { AnalysisAssumptions, SensitivityRow } from "../types";
import { calcLoanSummary } from "./loan";
import { calcAnnualMetrics } from "./metrics";

function runMetrics(assumptions: AnalysisAssumptions) {
  const loan = calcLoanSummary(assumptions.loan);
  return calcAnnualMetrics(assumptions, loan, 1);
}

export function buildSensitivityAnalysis(base: AnalysisAssumptions): SensitivityRow[] {
  const rows: SensitivityRow[] = [];

  // Helper to create a row
  function makeRow(
    variable: string,
    low: number,
    high: number,
    applyLow: (a: AnalysisAssumptions) => AnalysisAssumptions,
    applyHigh: (a: AnalysisAssumptions) => AnalysisAssumptions
  ): SensitivityRow {
    const baseLoan = calcLoanSummary(base.loan);
    const baseM = calcAnnualMetrics(base, baseLoan, 1);
    const lowM = runMetrics(applyLow(base));
    const highM = runMetrics(applyHigh(base));

    return {
      variable,
      low,
      base: 0,
      high,
      lowCashFlow: lowM.cashFlow / 12,
      baseCashFlow: baseM.cashFlow / 12,
      highCashFlow: highM.cashFlow / 12,
      lowCoC: lowM.cashOnCashReturn,
      baseCoC: baseM.cashOnCashReturn,
      highCoC: highM.cashOnCashReturn,
    };
  }

  // Rent ±15%
  rows.push(
    makeRow(
      "Monthly Rent",
      -15,
      +15,
      (a) => ({
        ...a,
        income: { ...a.income, monthlyRent: a.income.monthlyRent * 0.85 },
      }),
      (a) => ({
        ...a,
        income: { ...a.income, monthlyRent: a.income.monthlyRent * 1.15 },
      })
    )
  );

  // Purchase Price ±10%
  rows.push(
    makeRow(
      "Purchase Price",
      -10,
      +10,
      (a) => ({
        ...a,
        loan: { ...a.loan, purchasePrice: a.loan.purchasePrice * 0.9 },
      }),
      (a) => ({
        ...a,
        loan: { ...a.loan, purchasePrice: a.loan.purchasePrice * 1.1 },
      })
    )
  );

  // Interest Rate ±1%
  rows.push(
    makeRow(
      "Interest Rate",
      -1,
      +1,
      (a) => ({
        ...a,
        loan: { ...a.loan, interestRate: Math.max(0.1, a.loan.interestRate - 1) },
      }),
      (a) => ({
        ...a,
        loan: { ...a.loan, interestRate: a.loan.interestRate + 1 },
      })
    )
  );

  // Vacancy +5%
  rows.push(
    makeRow(
      "Vacancy Rate",
      0,
      +5,
      (a) => ({
        ...a,
        income: { ...a.income, vacancyRatePct: Math.max(0, a.income.vacancyRatePct - 3) },
      }),
      (a) => ({
        ...a,
        income: { ...a.income, vacancyRatePct: a.income.vacancyRatePct + 5 },
      })
    )
  );

  // Expenses ±10%
  rows.push(
    makeRow(
      "Operating Expenses",
      -10,
      +10,
      (a) => ({
        ...a,
        expenses: {
          ...a.expenses,
          propertyTaxAnnual: a.expenses.propertyTaxAnnual * 0.9,
          insuranceAnnual: a.expenses.insuranceAnnual * 0.9,
          repairsMaintenancePct: a.expenses.repairsMaintenancePct * 0.9,
          capexPct: a.expenses.capexPct * 0.9,
        },
      }),
      (a) => ({
        ...a,
        expenses: {
          ...a.expenses,
          propertyTaxAnnual: a.expenses.propertyTaxAnnual * 1.1,
          insuranceAnnual: a.expenses.insuranceAnnual * 1.1,
          repairsMaintenancePct: a.expenses.repairsMaintenancePct * 1.1,
          capexPct: a.expenses.capexPct * 1.1,
        },
      })
    )
  );

  // Rent Growth ±2%
  rows.push(
    makeRow(
      "Rent Growth Rate",
      -2,
      +2,
      (a) => ({
        ...a,
        income: { ...a.income, annualRentGrowthPct: Math.max(0, a.income.annualRentGrowthPct - 2) },
      }),
      (a) => ({
        ...a,
        income: { ...a.income, annualRentGrowthPct: a.income.annualRentGrowthPct + 2 },
      })
    )
  );

  return rows;
}

export function calcBreakevenRent(base: AnalysisAssumptions): number {
  const loan = calcLoanSummary(base.loan);
  const { expenses } = base;
  const expGrow = 1;
  const propertyTax = expenses.propertyTaxAnnual;
  const insurance = expenses.insuranceAnnual;
  const utilities = expenses.utilitiesMonthly * 12;
  const hoa = expenses.hoaMonthly * 12;
  const other = expenses.otherAnnual;
  const debtService = loan.annualDebtService;

  // Solve for rent where cashFlow = 0
  // cashFlow = (rent * 12 * (1 - vacancy%) - fixedExpenses - rent * 12 * percentExpenses) - debtService = 0
  const vacancyPct = base.income.vacancyRatePct / 100;
  const percentExpenses =
    (expenses.repairsMaintenancePct +
      expenses.propertyManagementPct +
      expenses.capexPct) /
    100;
  const fixedExpenses = propertyTax + insurance + utilities + hoa + other;
  const targetNoi = debtService;

  // noi = rent*12*(1-vacancy%) - fixedExpenses - rent*12*(1-vacancy%)*percentExpenses
  // = rent*12*(1-vacancy%)*(1-percentExpenses) - fixedExpenses
  const coefficient = 12 * (1 - vacancyPct) * (1 - percentExpenses);
  if (coefficient <= 0) return 0;
  const annualRentNeeded = (targetNoi + fixedExpenses) / coefficient;
  return annualRentNeeded / 12;
}
