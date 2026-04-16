import { calcAnnualMetrics } from "../metrics";
import { calcLoanSummary } from "../loan";
import { DEFAULT_ASSUMPTIONS } from "../../defaults";

describe("Metrics Engine", () => {
  const loan = calcLoanSummary(DEFAULT_ASSUMPTIONS.loan);

  describe("calcAnnualMetrics", () => {
    it("calculates cap rate correctly", () => {
      const metrics = calcAnnualMetrics(DEFAULT_ASSUMPTIONS, loan, 1);
      // NOI / Purchase Price
      expect(metrics.capRate).toBeGreaterThan(0);
      expect(metrics.capRate).toBeLessThan(20);
    });

    it("DSCR is positive when NOI covers debt", () => {
      const metrics = calcAnnualMetrics(DEFAULT_ASSUMPTIONS, loan, 1);
      expect(metrics.dscr).toBeGreaterThan(0);
    });

    it("effective income is less than gross income due to vacancy", () => {
      const metrics = calcAnnualMetrics(DEFAULT_ASSUMPTIONS, loan, 1);
      expect(metrics.effectiveGrossIncome).toBeLessThan(metrics.grossRentIncome + metrics.otherIncome);
    });

    it("NOI = effectiveGrossIncome - totalExpenses", () => {
      const metrics = calcAnnualMetrics(DEFAULT_ASSUMPTIONS, loan, 1);
      expect(metrics.noi).toBeCloseTo(metrics.effectiveGrossIncome - metrics.totalExpenses, 2);
    });

    it("cashFlow = NOI - debtService", () => {
      const metrics = calcAnnualMetrics(DEFAULT_ASSUMPTIONS, loan, 1);
      expect(metrics.cashFlow).toBeCloseTo(metrics.noi - metrics.debtService, 2);
    });

    it("rent grows with compounding in year 5", () => {
      const m1 = calcAnnualMetrics(DEFAULT_ASSUMPTIONS, loan, 1);
      const m5 = calcAnnualMetrics(DEFAULT_ASSUMPTIONS, loan, 5);
      expect(m5.grossRentIncome).toBeGreaterThan(m1.grossRentIncome);
    });
  });
});
