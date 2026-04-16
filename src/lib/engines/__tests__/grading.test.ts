import { calcFinancialGrade, calcAllGrades } from "../grading";
import { calcAnnualMetrics } from "../metrics";
import { calcLoanSummary, buildAmortizationSchedule } from "../loan";
import { buildYearProjections, buildExitAnalysis } from "../projection";
import { DEFAULT_ASSUMPTIONS } from "../../defaults";
import { scoreToGrade } from "../../utils";

describe("Grading Engine", () => {
  const loan = calcLoanSummary(DEFAULT_ASSUMPTIONS.loan);
  const amort = buildAmortizationSchedule(loan.loanAmount, DEFAULT_ASSUMPTIONS.loan.interestRate, DEFAULT_ASSUMPTIONS.loan.loanTermYears);
  const metrics = calcAnnualMetrics(DEFAULT_ASSUMPTIONS, loan, 1);
  const projections = buildYearProjections(DEFAULT_ASSUMPTIONS, loan, amort);
  const exit = buildExitAnalysis(DEFAULT_ASSUMPTIONS, loan, projections);

  describe("calcFinancialGrade", () => {
    it("returns a grade between 0 and 100", () => {
      const grade = calcFinancialGrade(metrics, exit, loan.totalCashNeeded);
      expect(grade.score).toBeGreaterThanOrEqual(0);
      expect(grade.score).toBeLessThanOrEqual(100);
    });

    it("very good metrics produce A grade", () => {
      const excellentMetrics = {
        ...metrics,
        capRate: 10,
        cashOnCashReturn: 12,
        dscr: 1.8,
        cashFlow: 600 * 12,
      };
      const grade = calcFinancialGrade(excellentMetrics, { ...exit, roi: 80 }, loan.totalCashNeeded);
      expect(grade.score).toBeGreaterThanOrEqual(80);
    });

    it("poor metrics produce low grade", () => {
      const poorMetrics = {
        ...metrics,
        capRate: 1,
        cashOnCashReturn: -2,
        dscr: 0.8,
        cashFlow: -500 * 12,
      };
      const grade = calcFinancialGrade(poorMetrics, { ...exit, roi: 5 }, loan.totalCashNeeded);
      expect(grade.score).toBeLessThan(50);
    });
  });

  describe("scoreToGrade", () => {
    it("maps 95+ to A", () => expect(scoreToGrade(95)).toBe("A"));
    it("maps 83 to B", () => expect(scoreToGrade(83)).toBe("B"));
    it("maps 70 to C-", () => expect(scoreToGrade(70)).toBe("C-"));
    it("maps 50 to F", () => expect(scoreToGrade(50)).toBe("F"));
  });
});
