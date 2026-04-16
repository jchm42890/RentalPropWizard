import {
  AnnualMetrics,
  PropertyGrades,
  GradeDetail,
  LetterGrade,
  NeighborhoodData,
  ExitAnalysis,
} from "../types";
import { scoreToGrade } from "../utils";

function buildGradeDetail(
  label: string,
  score: number,
  reasons: string[],
  strengths: string[],
  weaknesses: string[]
): GradeDetail {
  const clampedScore = Math.min(100, Math.max(0, score));
  return {
    score: Math.round(clampedScore),
    grade: scoreToGrade(clampedScore),
    label,
    reasons,
    strengths,
    weaknesses,
  };
}

export function calcFinancialGrade(
  metrics: AnnualMetrics,
  exit: ExitAnalysis,
  totalCashNeeded: number
): GradeDetail {
  let score = 50; // base
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const reasons: string[] = [];

  // Cap Rate (weight: 20)
  if (metrics.capRate >= 8) { score += 20; strengths.push(`Cap rate ${metrics.capRate.toFixed(1)}% is excellent`); }
  else if (metrics.capRate >= 6) { score += 15; strengths.push(`Cap rate ${metrics.capRate.toFixed(1)}% is good`); }
  else if (metrics.capRate >= 4) { score += 8; reasons.push(`Cap rate ${metrics.capRate.toFixed(1)}% is moderate`); }
  else if (metrics.capRate >= 2) { score -= 5; weaknesses.push(`Cap rate ${metrics.capRate.toFixed(1)}% is low`); }
  else { score -= 15; weaknesses.push(`Cap rate ${metrics.capRate.toFixed(1)}% is very low`); }

  // Cash-on-Cash (weight: 20)
  if (metrics.cashOnCashReturn >= 10) { score += 20; strengths.push(`Cash-on-cash ${metrics.cashOnCashReturn.toFixed(1)}% is excellent`); }
  else if (metrics.cashOnCashReturn >= 7) { score += 15; strengths.push(`Cash-on-cash ${metrics.cashOnCashReturn.toFixed(1)}% is strong`); }
  else if (metrics.cashOnCashReturn >= 5) { score += 8; reasons.push(`Cash-on-cash ${metrics.cashOnCashReturn.toFixed(1)}% is acceptable`); }
  else if (metrics.cashOnCashReturn >= 2) { score -= 5; weaknesses.push(`Cash-on-cash ${metrics.cashOnCashReturn.toFixed(1)}% is weak`); }
  else { score -= 15; weaknesses.push(`Cash-on-cash ${metrics.cashOnCashReturn.toFixed(1)}% is negative or near-zero`); }

  // DSCR (weight: 20)
  if (metrics.dscr >= 1.5) { score += 20; strengths.push(`DSCR ${metrics.dscr.toFixed(2)} shows strong debt coverage`); }
  else if (metrics.dscr >= 1.25) { score += 15; strengths.push(`DSCR ${metrics.dscr.toFixed(2)} is healthy`); }
  else if (metrics.dscr >= 1.1) { score += 8; reasons.push(`DSCR ${metrics.dscr.toFixed(2)} provides minimal coverage`); }
  else if (metrics.dscr >= 1.0) { score -= 5; weaknesses.push(`DSCR ${metrics.dscr.toFixed(2)} is very thin`); }
  else { score -= 20; weaknesses.push(`DSCR ${metrics.dscr.toFixed(2)} — property does not cover debt service`); }

  // Cash Flow (weight: 10)
  if (metrics.cashFlow >= 500 * 12) { score += 10; strengths.push(`Positive cash flow of ${(metrics.cashFlow / 12).toFixed(0)}/mo`); }
  else if (metrics.cashFlow >= 200 * 12) { score += 6; }
  else if (metrics.cashFlow >= 0) { score += 2; }
  else { score -= 10; weaknesses.push(`Negative cash flow of $${Math.abs(metrics.cashFlow / 12).toFixed(0)}/mo`); }

  // ROI (weight: 10)
  if (exit.roi >= 50) { score += 10; strengths.push(`Total ROI ${exit.roi.toFixed(0)}% over holding period`); }
  else if (exit.roi >= 25) { score += 7; }
  else if (exit.roi >= 10) { score += 3; }
  else { score -= 8; weaknesses.push(`Low total ROI of ${exit.roi.toFixed(0)}%`); }

  // Normalize
  score = Math.max(0, Math.min(100, score));
  reasons.push(`Financial score based on cap rate, CoC, DSCR, cash flow, and ROI`);

  return buildGradeDetail("Financial Grade", score, reasons, strengths, weaknesses);
}

export function calcNeighborhoodGrade(data?: NeighborhoodData): GradeDetail {
  if (!data) {
    return buildGradeDetail(
      "Neighborhood Grade",
      55,
      ["Neighborhood data not available — using default score"],
      [],
      ["Unable to verify neighborhood quality — research manually"]
    );
  }

  let score = 50;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const reasons: string[] = [];

  if (data.safetyScore !== undefined) {
    score += (data.safetyScore - 50) * 0.3;
    if (data.safetyScore >= 70) strengths.push("Above-average safety score");
    else if (data.safetyScore < 40) weaknesses.push("Below-average safety score");
  }

  if (data.schoolScore !== undefined) {
    score += (data.schoolScore - 50) * 0.2;
    if (data.schoolScore >= 70) strengths.push("Good school ratings");
    else if (data.schoolScore < 40) weaknesses.push("Below-average school ratings");
  }

  if (data.populationGrowth !== undefined) {
    if (data.populationGrowth > 1) { score += 10; strengths.push("Growing population"); }
    else if (data.populationGrowth < -0.5) { score -= 10; weaknesses.push("Population decline"); }
  }

  if (data.unemploymentRate !== undefined) {
    if (data.unemploymentRate < 4) { score += 8; strengths.push("Low unemployment rate"); }
    else if (data.unemploymentRate > 8) { score -= 8; weaknesses.push("High unemployment rate"); }
  }

  if (data.confidence === "low") {
    reasons.push(`Neighborhood data has low confidence — ${data.missing.join(", ")} unavailable`);
    score = Math.max(40, Math.min(70, score)); // reduce confidence range
  }

  score = Math.max(0, Math.min(100, score));
  reasons.push(`Source: ${data.dataSource}`);

  return buildGradeDetail("Neighborhood Grade", score, reasons, strengths, weaknesses);
}

export function calcOverallGrade(
  financial: GradeDetail,
  neighborhood: GradeDetail,
  financialWeight = 70,
  neighborhoodWeight = 30
): GradeDetail {
  const normalizedFW = financialWeight / (financialWeight + neighborhoodWeight);
  const normalizedNW = neighborhoodWeight / (financialWeight + neighborhoodWeight);
  const score = financial.score * normalizedFW + neighborhood.score * normalizedNW;

  const strengths = [
    ...financial.strengths.slice(0, 2),
    ...neighborhood.strengths.slice(0, 1),
  ];
  const weaknesses = [
    ...financial.weaknesses.slice(0, 2),
    ...neighborhood.weaknesses.slice(0, 1),
  ];
  const reasons = [
    `Weighted score: ${financialWeight}% financial, ${neighborhoodWeight}% neighborhood`,
    `Financial: ${financial.grade} (${financial.score}/100)`,
    `Neighborhood: ${neighborhood.grade} (${neighborhood.score}/100)`,
  ];

  return buildGradeDetail("Overall Grade", score, reasons, strengths, weaknesses);
}

export function calcAllGrades(
  metrics: AnnualMetrics,
  exit: ExitAnalysis,
  totalCashNeeded: number,
  neighborhood?: NeighborhoodData,
  financialWeight = 70,
  neighborhoodWeight = 30
): PropertyGrades {
  const financial = calcFinancialGrade(metrics, exit, totalCashNeeded);
  const neighborhoodGrade = calcNeighborhoodGrade(neighborhood);
  const overall = calcOverallGrade(financial, neighborhoodGrade, financialWeight, neighborhoodWeight);

  return {
    financial,
    neighborhood: neighborhoodGrade,
    overall,
    financialWeight,
    neighborhoodWeight,
  };
}
