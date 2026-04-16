import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { LetterGrade } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, decimals = 0): string {
  if (!isFinite(value)) return "$—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number, decimals = 2): string {
  if (!isFinite(value)) return "—%";
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number, decimals = 0): string {
  if (!isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function scoreToGrade(score: number): LetterGrade {
  if (score >= 97) return "A+";
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  if (score >= 60) return "D";
  return "F";
}

export function gradeColor(grade: LetterGrade): string {
  if (grade.startsWith("A")) return "text-green-600";
  if (grade.startsWith("B")) return "text-blue-600";
  if (grade.startsWith("C")) return "text-yellow-600";
  if (grade === "D") return "text-orange-600";
  return "text-red-600";
}

export function gradeBgColor(grade: LetterGrade): string {
  if (grade.startsWith("A")) return "bg-green-100 border-green-300";
  if (grade.startsWith("B")) return "bg-blue-100 border-blue-300";
  if (grade.startsWith("C")) return "bg-yellow-100 border-yellow-300";
  if (grade === "D") return "bg-orange-100 border-orange-300";
  return "bg-red-100 border-red-300";
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function roundTo(value: number, places: number): number {
  const factor = Math.pow(10, places);
  return Math.round(value * factor) / factor;
}
