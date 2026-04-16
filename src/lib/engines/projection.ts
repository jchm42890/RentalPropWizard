import {
  AnalysisAssumptions,
  LoanSummary,
  YearProjection,
  ExitAnalysis,
  AmortizationRow,
} from "../types";
import {
  getLoanBalanceAtYear,
  getPrincipalPaydownInYear,
  getInterestPaidInYear,
} from "./loan";
import { calcIRR } from "./metrics";

export function buildYearProjections(
  assumptions: AnalysisAssumptions,
  loan: LoanSummary,
  amortization: AmortizationRow[]
): YearProjection[] {
  const { income, expenses, projection, loan: loanAss } = assumptions;
  const holdingYears = projection.holdingPeriodYears;
  const purchasePrice = loanAss.purchasePrice;

  const projections: YearProjection[] = [];
  let cumulativeCashFlow = 0;

  for (let year = 1; year <= holdingYears; year++) {
    // ---- Income ----
    const rentGrowth = Math.pow(1 + income.annualRentGrowthPct / 100, year - 1);
    const monthlyRent = income.monthlyRent * rentGrowth;
    const annualRent = monthlyRent * 12;
    const otherIncome = income.otherMonthlyIncome * 12 * rentGrowth;
    const vacancyLoss = annualRent * (income.vacancyRatePct / 100);
    const effectiveGrossIncome = annualRent - vacancyLoss + otherIncome;

    // ---- Expenses ----
    const expGrowth = Math.pow(1 + expenses.expenseGrowthPct / 100, year - 1);
    const propertyTax = expenses.propertyTaxAnnual * expGrowth;
    const insurance = expenses.insuranceAnnual * expGrowth;
    const repairs = effectiveGrossIncome * (expenses.repairsMaintenancePct / 100);
    const management = effectiveGrossIncome * (expenses.propertyManagementPct / 100);
    const capex = effectiveGrossIncome * (expenses.capexPct / 100);
    const utilities = expenses.utilitiesMonthly * 12 * expGrowth;
    const hoa = expenses.hoaMonthly * 12 * expGrowth;
    const other = expenses.otherAnnual * expGrowth;
    const totalExpenses =
      propertyTax + insurance + repairs + management + capex + utilities + hoa + other;

    // ---- NOI & Cash Flow ----
    const noi = effectiveGrossIncome - totalExpenses;
    const debtService = loan.annualDebtService;
    const cashFlow = noi - debtService;
    cumulativeCashFlow += cashFlow;

    // ---- Property Value & Equity ----
    const propertyValue =
      purchasePrice * Math.pow(1 + projection.annualAppreciationPct / 100, year);
    const appreciation = propertyValue - purchasePrice;
    const loanBalance = getLoanBalanceAtYear(amortization, year);
    const equity = propertyValue - loanBalance;
    const equityPct = propertyValue > 0 ? (equity / propertyValue) * 100 : 0;

    // ---- Loan detail ----
    const principalPaydown = getPrincipalPaydownInYear(amortization, year);
    const interestPaid = getInterestPaidInYear(amortization, year);

    // ---- Tax Benefit (simplified: % of interest) ----
    const taxBenefit = interestPaid * (projection.annualTaxBenefitRate / 100);

    // ---- Total Return ----
    const totalReturn = cashFlow + appreciation / holdingYears + principalPaydown + taxBenefit;

    // ---- Derived metrics ----
    const capRate = (noi / purchasePrice) * 100;
    const cashOnCashReturn = loan.totalCashNeeded > 0 ? (cashFlow / loan.totalCashNeeded) * 100 : 0;
    const dscr = debtService > 0 ? noi / debtService : 0;

    projections.push({
      year,
      monthlyRent,
      annualRent,
      otherIncome,
      effectiveGrossIncome,
      vacancyLoss,
      totalExpenses,
      noi,
      debtService,
      cashFlow,
      cumulativeCashFlow,
      propertyValue,
      loanBalance,
      equity,
      equityPct,
      appreciation,
      taxBenefit,
      totalReturn,
      cashOnCashReturn,
      capRate,
      dscr,
      principalPaydown,
      interestPaid,
    });
  }

  return projections;
}

export function buildExitAnalysis(
  assumptions: AnalysisAssumptions,
  loan: LoanSummary,
  projections: YearProjection[]
): ExitAnalysis {
  const saleYear = assumptions.projection.holdingPeriodYears;
  const lastProjection = projections[saleYear - 1];

  if (!lastProjection) {
    return {
      saleYear,
      projectedSalePrice: 0,
      sellingCosts: 0,
      loanPayoff: 0,
      netProceeds: 0,
      totalCashFlow: 0,
      totalAppreciation: 0,
      totalPrincipalPaydown: 0,
      totalTaxBenefit: 0,
      totalReturn: 0,
      roi: 0,
      irr: null,
      equityMultiple: 0,
    };
  }

  const projectedSalePrice = lastProjection.propertyValue;
  const sellingCosts =
    projectedSalePrice * (assumptions.projection.sellingCostsPct / 100);
  const loanPayoff = lastProjection.loanBalance;
  const netProceeds = projectedSalePrice - sellingCosts - loanPayoff;

  const totalCashFlow = lastProjection.cumulativeCashFlow;
  const totalAppreciation = projectedSalePrice - assumptions.loan.purchasePrice;
  const totalPrincipalPaydown = projections.reduce((s, p) => s + p.principalPaydown, 0);
  const totalTaxBenefit = projections.reduce((s, p) => s + p.taxBenefit, 0);
  const totalReturn = netProceeds + totalCashFlow + totalTaxBenefit - loan.totalCashNeeded;
  const roi = loan.totalCashNeeded > 0 ? (totalReturn / loan.totalCashNeeded) * 100 : 0;

  // Build IRR cash flows: [initial investment (negative), ...annual cash flows, final proceeds]
  const irrFlows = [
    -loan.totalCashNeeded,
    ...projections.slice(0, saleYear - 1).map((p) => p.cashFlow),
    projections[saleYear - 1].cashFlow + netProceeds,
  ];
  const irr = calcIRR(irrFlows);

  const equityMultiple =
    loan.totalCashNeeded > 0 ? (totalCashFlow + netProceeds) / loan.totalCashNeeded : 0;

  return {
    saleYear,
    projectedSalePrice,
    sellingCosts,
    loanPayoff,
    netProceeds,
    totalCashFlow,
    totalAppreciation,
    totalPrincipalPaydown,
    totalTaxBenefit,
    totalReturn,
    roi,
    irr,
    equityMultiple,
  };
}
