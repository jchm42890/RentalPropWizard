import { calcMonthlyPayment, calcLoanSummary, buildAmortizationSchedule } from "../loan";

describe("Loan Engine", () => {
  describe("calcMonthlyPayment", () => {
    it("calculates standard 30yr at 7%", () => {
      const payment = calcMonthlyPayment(240000, 7, 30);
      expect(payment).toBeCloseTo(1597.0, 0);
    });

    it("returns principal/n when rate is 0", () => {
      const payment = calcMonthlyPayment(120000, 0, 10);
      expect(payment).toBeCloseTo(1000, 0);
    });
  });

  describe("calcLoanSummary", () => {
    it("calculates correct loan summary", () => {
      const summary = calcLoanSummary({
        purchasePrice: 300000,
        downPaymentPct: 20,
        interestRate: 7.0,
        loanTermYears: 30,
        closingCostsPct: 2,
        points: 0,
      });
      expect(summary.loanAmount).toBe(240000);
      expect(summary.downPayment).toBe(60000);
      expect(summary.closingCosts).toBeCloseTo(6000, 0);
      expect(summary.totalCashNeeded).toBeCloseTo(66000, 0);
      expect(summary.monthlyPayment).toBeCloseTo(1597, 0);
    });
  });

  describe("buildAmortizationSchedule", () => {
    it("builds correct schedule length", () => {
      const schedule = buildAmortizationSchedule(240000, 7, 30);
      expect(schedule).toHaveLength(360);
    });

    it("final balance is near zero", () => {
      const schedule = buildAmortizationSchedule(240000, 7, 30);
      expect(schedule[359].balance).toBeCloseTo(0, -1);
    });

    it("each payment is constant", () => {
      const schedule = buildAmortizationSchedule(240000, 7, 30);
      const firstPayment = schedule[0].payment;
      schedule.forEach((row) => {
        expect(row.payment).toBeCloseTo(firstPayment, 2);
      });
    });
  });
});
