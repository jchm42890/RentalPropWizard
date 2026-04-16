import {
  AnalysisAssumptions,
  AnnualMetrics,
  LoanSummary,
} from "../types";

export function calcAnnualMetrics(
  assumptions: AnalysisAssumptions,
  loan: LoanSummary,
  year = 1
): AnnualMetrics {
  const { income, expenses, projection } = assumptions;
  const { purchasePrice } = assumptions.loan;

  // ---- Income ----
  const rentGrowthFactor = Math.pow(1 + income.annualRentGrowthPct / 100, year - 1);
  const monthlyRent = income.monthlyRent * rentGrowthFactor;
  const annualRent = monthlyRent * 12;
  const annualOtherIncome = income.otherMonthlyIncome * 12 * rentGrowthFactor;
  const grossRentIncome = annualRent;
  const vacancyLoss = grossRentIncome * (income.vacancyRatePct / 100);
  const effectiveGrossIncome = grossRentIncome - vacancyLoss + annualOtherIncome;

  // ---- Expenses ----
  const expGrowthFactor = Math.pow(1 + expenses.expenseGrowthPct / 100, year - 1);
  const propertyTax = expenses.propertyTaxAnnual * expGrowthFactor;
  const insurance = expenses.insuranceAnnual * expGrowthFactor;
  const repairs = effectiveGrossIncome * (expenses.repairsMaintenancePct / 100);
  const management = effectiveGrossIncome * (expenses.propertyManagementPct / 100);
  const capex = effectiveGrossIncome * (expenses.capexPct / 100);
  const utilities = expenses.utilitiesMonthly * 12 * expGrowthFactor;
  const hoa = expenses.hoaMonthly * 12 * expGrowthFactor;
  const other = expenses.otherAnnual * expGrowthFactor;
  const totalExpenses = propertyTax + insurance + repairs + management + capex + utilities + hoa + other;

  // ---- NOI ----
  const noi = effectiveGrossIncome - totalExpenses;

  // ---- Returns ----
  const debtService = loan.annualDebtService;
  const cashFlow = noi - debtService;
  const capRate = (noi / purchasePrice) * 100;
  const cashOnCashReturn = (cashFlow / loan.totalCashNeeded) * 100;
  const dscr = debtService > 0 ? noi / debtService : 0;
  const grm = purchasePrice / (monthlyRent > 0 ? monthlyRent * 12 : 1);

  return {
    grossRentIncome,
    otherIncome: annualOtherIncome,
    effectiveGrossIncome,
    vacancyLoss,
    totalExpenses,
    noi,
    debtService,
    cashFlow,
    capRate,
    cashOnCashReturn,
    dscr,
    grm,
  };
}

export function calcIRR(cashFlows: number[]): number | null {
  // Newton-Raphson IRR calculation
  if (cashFlows.length < 2) return null;

  let rate = 0.1;
  for (let i = 0; i < 1000; i++) {
    let npv = 0;
    let dnpv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      const factor = Math.pow(1 + rate, t);
      npv += cashFlows[t] / factor;
      dnpv -= (t * cashFlows[t]) / (factor * (1 + rate));
    }
    if (Math.abs(dnpv) < 1e-10) return null;
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < 1e-8) return newRate * 100;
    rate = newRate;
  }
  return null;
}
