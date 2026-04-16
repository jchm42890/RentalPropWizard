import { NextRequest } from "next/server";
import { z } from "zod";
import { runFullAnalysis } from "@/lib/engines/analyzer";
import { AnalysisAssumptions } from "@/lib/types";

const schema = z.object({
  assumptions: z.object({
    property: z.object({
      address: z.string(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
      beds: z.number(),
      baths: z.number(),
      sqft: z.number(),
      yearBuilt: z.number().optional(),
      propertyType: z.string().default("single_family"),
    }),
    loan: z.object({
      purchasePrice: z.number().positive(),
      downPaymentPct: z.number().min(0).max(100),
      interestRate: z.number().min(0),
      loanTermYears: z.number().positive(),
      closingCostsPct: z.number().min(0),
      points: z.number().min(0),
    }),
    income: z.object({
      monthlyRent: z.number().min(0),
      otherMonthlyIncome: z.number().min(0),
      annualRentGrowthPct: z.number(),
      vacancyRatePct: z.number().min(0).max(100),
    }),
    expenses: z.object({
      propertyTaxAnnual: z.number().min(0),
      insuranceAnnual: z.number().min(0),
      repairsMaintenancePct: z.number().min(0),
      propertyManagementPct: z.number().min(0),
      capexPct: z.number().min(0),
      utilitiesMonthly: z.number().min(0),
      hoaMonthly: z.number().min(0),
      otherAnnual: z.number().min(0),
      expenseGrowthPct: z.number(),
    }),
    projection: z.object({
      holdingPeriodYears: z.number().positive().int(),
      annualAppreciationPct: z.number(),
      sellingCostsPct: z.number().min(0),
      annualTaxBenefitRate: z.number().min(0),
    }),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = runFullAnalysis(parsed.data.assumptions as AnalysisAssumptions);
    return Response.json(result);
  } catch (err) {
    console.error("Analysis API error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
