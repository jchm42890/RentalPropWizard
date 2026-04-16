import {
  AnnualMetrics,
  PropertyGrades,
  RiskAssessment,
  ExitAnalysis,
  DealSummary,
  LetterGrade,
} from "../types";
import { formatCurrency, formatPercent } from "../utils";

function getVerdict(
  grade: LetterGrade,
  metrics: AnnualMetrics
): DealSummary["verdict"] {
  if (grade.startsWith("A") && metrics.cashOnCashReturn >= 8) return "Strong Buy";
  if (grade.startsWith("A") || grade.startsWith("B+") || grade.startsWith("B"))
    return "Buy";
  if (grade.startsWith("C") || grade === "B-") return "Neutral";
  if (grade === "D") return "Caution";
  return "Pass";
}

function verdictColor(verdict: DealSummary["verdict"]): DealSummary["verdictColor"] {
  if (verdict === "Strong Buy" || verdict === "Buy") return "green";
  if (verdict === "Neutral") return "yellow";
  return "red";
}

export function buildDealSummary(
  metrics: AnnualMetrics,
  grades: PropertyGrades,
  risk: RiskAssessment,
  exit: ExitAnalysis,
  address: string
): DealSummary {
  const sentences: string[] = [];
  const v = getVerdict(grades.overall.grade, metrics);

  // Sentence 1: Property overview and overall grade
  sentences.push(
    `${address} earns an overall grade of ${grades.overall.grade} (${grades.overall.score}/100), ` +
      `reflecting ${grades.overall.strengths[0] ?? "a mix of financial and location factors"}.`
  );

  // Sentence 2: Key financial metrics
  sentences.push(
    `The property generates a cap rate of ${formatPercent(metrics.capRate, 1)} and a ` +
      `cash-on-cash return of ${formatPercent(metrics.cashOnCashReturn, 1)}, with ` +
      `${metrics.cashFlow >= 0 ? "positive" : "negative"} annual cash flow of ` +
      `${formatCurrency(Math.abs(metrics.cashFlow / 12))}/mo.`
  );

  // Sentence 3: Debt coverage
  sentences.push(
    `Debt service coverage ratio (DSCR) is ${metrics.dscr.toFixed(2)}, ` +
      `${metrics.dscr >= 1.25
        ? "indicating comfortable coverage of debt obligations"
        : metrics.dscr >= 1.0
        ? "which barely covers debt service — minimal margin for error"
        : "which does not cover debt service — caution advised"
      }.`
  );

  // Sentence 4: Long-term return
  sentences.push(
    `Over the projected holding period, the deal is estimated to produce a total ROI of ` +
      `${formatPercent(exit.roi, 0)} with an equity multiple of ${exit.equityMultiple.toFixed(1)}x` +
      `${exit.irr ? `, and an IRR of ${formatPercent(exit.irr, 1)}` : ""}.`
  );

  // Sentence 5: Risk
  sentences.push(
    `Risk is assessed as ${risk.level}. ` +
      (risk.warnings[0] ?? risk.factors[0] ?? "No major red flags identified.")
  );

  // Sentence 6: Verdict
  sentences.push(
    `Based on these factors, this deal is rated: ${v}. ` +
      (grades.financial.weaknesses[0]
        ? `Primary concern: ${grades.financial.weaknesses[0]}.`
        : `The fundamentals support a positive investment outlook.`)
  );

  return {
    sentences,
    verdict: v,
    verdictColor: verdictColor(v),
  };
}
