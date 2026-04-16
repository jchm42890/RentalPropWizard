import { AnnualMetrics, PassFailRules, PassFailResult, LoanAssumptions } from "../types";

export const DEFAULT_PASS_FAIL_RULES: PassFailRules = {
  minCashOnCashPct: 6,
  minDSCR: 1.2,
  minMonthlyCashFlow: 100,
  maxLTV: 80,
};

export function applyPassFailRules(
  metrics: AnnualMetrics,
  loan: LoanAssumptions,
  rules: PassFailRules = DEFAULT_PASS_FAIL_RULES
): PassFailResult {
  const ltv =
    ((loan.purchasePrice - loan.purchasePrice * (loan.downPaymentPct / 100)) /
      loan.purchasePrice) *
    100;
  const monthlyCashFlow = metrics.cashFlow / 12;

  const results = [
    {
      rule: `Min Cash-on-Cash Return ≥ ${rules.minCashOnCashPct}%`,
      required: rules.minCashOnCashPct,
      actual: metrics.cashOnCashReturn,
      pass: metrics.cashOnCashReturn >= rules.minCashOnCashPct,
    },
    {
      rule: `Min DSCR ≥ ${rules.minDSCR}`,
      required: rules.minDSCR,
      actual: metrics.dscr,
      pass: metrics.dscr >= rules.minDSCR,
    },
    {
      rule: `Min Monthly Cash Flow ≥ $${rules.minMonthlyCashFlow}`,
      required: rules.minMonthlyCashFlow,
      actual: monthlyCashFlow,
      pass: monthlyCashFlow >= rules.minMonthlyCashFlow,
    },
    {
      rule: `Max LTV ≤ ${rules.maxLTV}%`,
      required: rules.maxLTV,
      actual: ltv,
      pass: ltv <= rules.maxLTV,
    },
  ];

  return {
    pass: results.every((r) => r.pass),
    results,
  };
}
