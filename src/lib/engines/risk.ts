import { AnnualMetrics, RiskAssessment, RiskLevel, LoanAssumptions } from "../types";

export function calcRisk(
  metrics: AnnualMetrics,
  loan: LoanAssumptions,
  totalCashNeeded: number
): RiskAssessment {
  let score = 0;
  const factors: string[] = [];
  const warnings: string[] = [];

  // DSCR risk
  if (metrics.dscr < 1.0) {
    score += 30;
    factors.push("Property does not cover debt service (DSCR < 1.0)");
    warnings.push("Negative cash flow — requires out-of-pocket contributions");
  } else if (metrics.dscr < 1.15) {
    score += 18;
    factors.push("Very thin debt service coverage (DSCR < 1.15)");
    warnings.push("Small vacancy or expense increase could flip to negative");
  } else if (metrics.dscr < 1.25) {
    score += 10;
    factors.push("Tight debt service coverage");
  }

  // Leverage risk
  const ltv = ((loan.purchasePrice - loan.purchasePrice * (loan.downPaymentPct / 100)) / loan.purchasePrice) * 100;
  if (ltv > 90) {
    score += 20;
    factors.push(`Very high LTV: ${ltv.toFixed(0)}%`);
    warnings.push("High leverage magnifies losses");
  } else if (ltv > 80) {
    score += 12;
    factors.push(`High LTV: ${ltv.toFixed(0)}%`);
  } else if (ltv > 70) {
    score += 5;
    factors.push(`Moderate LTV: ${ltv.toFixed(0)}%`);
  }

  // Cap rate risk
  if (metrics.capRate < 3) {
    score += 15;
    factors.push("Very low cap rate — sensitive to market changes");
  } else if (metrics.capRate < 5) {
    score += 8;
  }

  // Negative cash flow
  if (metrics.cashFlow < 0) {
    score += 20;
    factors.push("Negative annual cash flow");
    warnings.push(`Deficit of $${Math.abs(metrics.cashFlow / 12).toFixed(0)}/mo from reserves`);
  }

  // Thin margins
  const expenseRatio = metrics.totalExpenses / metrics.effectiveGrossIncome;
  if (expenseRatio > 0.7) {
    score += 10;
    factors.push(`High expense ratio: ${(expenseRatio * 100).toFixed(0)}%`);
    warnings.push("Expense ratio above 70% leaves little margin");
  }

  score = Math.min(100, score);

  let level: RiskLevel;
  if (score >= 60) level = "Very High";
  else if (score >= 40) level = "High";
  else if (score >= 20) level = "Medium";
  else level = "Low";

  return { level, score, factors, warnings };
}
