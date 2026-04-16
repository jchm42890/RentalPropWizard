import {
  LoanAssumptions,
  LoanSummary,
  AmortizationRow,
} from "../types";

export function calcMonthlyPayment(
  principal: number,
  annualRatePct: number,
  termYears: number
): number {
  const r = annualRatePct / 100 / 12;
  const n = termYears * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function calcLoanSummary(loan: LoanAssumptions): LoanSummary {
  const { purchasePrice, downPaymentPct, interestRate, loanTermYears, closingCostsPct, points } =
    loan;

  const downPayment = purchasePrice * (downPaymentPct / 100);
  const loanAmount = purchasePrice - downPayment;
  const closingCosts = purchasePrice * (closingCostsPct / 100) + loanAmount * (points / 100);
  const totalCashNeeded = downPayment + closingCosts;
  const monthlyPayment = calcMonthlyPayment(loanAmount, interestRate, loanTermYears);
  const annualDebtService = monthlyPayment * 12;

  return {
    loanAmount,
    downPayment,
    closingCosts,
    totalCashNeeded,
    monthlyPayment,
    annualDebtService,
  };
}

export function buildAmortizationSchedule(
  loanAmount: number,
  annualRatePct: number,
  termYears: number
): AmortizationRow[] {
  const r = annualRatePct / 100 / 12;
  const n = termYears * 12;
  const payment = calcMonthlyPayment(loanAmount, annualRatePct, termYears);
  let balance = loanAmount;
  const rows: AmortizationRow[] = [];

  for (let month = 1; month <= n; month++) {
    const interest = balance * r;
    const principal = payment - interest;
    balance = Math.max(0, balance - principal);
    rows.push({
      month,
      year: Math.ceil(month / 12),
      payment,
      principal,
      interest,
      balance,
    });
  }

  return rows;
}

export function getLoanBalanceAtYear(
  amortization: AmortizationRow[],
  year: number
): number {
  const row = amortization.filter((r) => r.year <= year).at(-1);
  return row ? row.balance : 0;
}

export function getPrincipalPaydownInYear(
  amortization: AmortizationRow[],
  year: number
): number {
  return amortization
    .filter((r) => r.year === year)
    .reduce((sum, r) => sum + r.principal, 0);
}

export function getInterestPaidInYear(
  amortization: AmortizationRow[],
  year: number
): number {
  return amortization
    .filter((r) => r.year === year)
    .reduce((sum, r) => sum + r.interest, 0);
}
