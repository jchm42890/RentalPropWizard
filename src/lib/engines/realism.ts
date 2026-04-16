import { AnalysisAssumptions } from "../types";

export function checkRealism(assumptions: AnalysisAssumptions): { warnings: string[] } {
  const warnings: string[] = [];
  const { income, expenses, projection, loan } = assumptions;

  // Vacancy
  if (income.vacancyRatePct === 0) {
    warnings.push("0% vacancy is unrealistic — most properties have some vacancy.");
  } else if (income.vacancyRatePct < 3) {
    warnings.push(`${income.vacancyRatePct}% vacancy is very low — consider 5–8% for accuracy.`);
  }

  // Rent growth
  if (income.annualRentGrowthPct > 6) {
    warnings.push(
      `${income.annualRentGrowthPct}% annual rent growth is aggressive — historical average is 2–4%.`
    );
  }

  // Appreciation
  if (projection.annualAppreciationPct > 7) {
    warnings.push(
      `${projection.annualAppreciationPct}% annual appreciation is optimistic — long-run average is 3–4%.`
    );
  }

  // Low repairs
  const totalPctExpenses =
    expenses.repairsMaintenancePct + expenses.capexPct + expenses.propertyManagementPct;
  if (totalPctExpenses < 8) {
    warnings.push(
      `Operating expenses look low (${totalPctExpenses}% of rent). Typical range is 15–30%.`
    );
  }

  // No property tax
  if (expenses.propertyTaxAnnual < 100) {
    warnings.push("Property tax appears very low — verify this is correct.");
  }

  // High interest rate
  if (loan.interestRate > 12) {
    warnings.push(
      `Interest rate of ${loan.interestRate}% is very high — double-check your loan terms.`
    );
  }

  // Extremely low down payment
  if (loan.downPaymentPct < 3) {
    warnings.push(
      `Down payment of ${loan.downPaymentPct}% is extremely low — most investment loans require 20–25%.`
    );
  }

  return { warnings };
}
