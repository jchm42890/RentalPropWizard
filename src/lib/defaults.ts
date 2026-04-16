import { AnalysisAssumptions } from "./types";

export const DEFAULT_ASSUMPTIONS: AnalysisAssumptions = {
  property: {
    address: "",
    city: "",
    state: "",
    zip: "",
    beds: 3,
    baths: 2,
    sqft: 1500,
    yearBuilt: 2000,
    propertyType: "single_family",
  },
  loan: {
    purchasePrice: 300000,
    downPaymentPct: 20,
    interestRate: 7.0,
    loanTermYears: 30,
    closingCostsPct: 2,
    points: 0,
  },
  income: {
    monthlyRent: 2000,
    otherMonthlyIncome: 0,
    annualRentGrowthPct: 3,
    vacancyRatePct: 5,
  },
  expenses: {
    propertyTaxAnnual: 3600,
    insuranceAnnual: 1200,
    repairsMaintenancePct: 5,
    propertyManagementPct: 8,
    capexPct: 5,
    utilitiesMonthly: 0,
    hoaMonthly: 0,
    otherAnnual: 0,
    expenseGrowthPct: 3,
  },
  projection: {
    holdingPeriodYears: 10,
    annualAppreciationPct: 3,
    sellingCostsPct: 6,
    annualTaxBenefitRate: 25,
  },
};
