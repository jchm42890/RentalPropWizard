// ============================================================
// Core Types for RentalPropertyWizard
// ============================================================

export interface PropertyDetails {
  address: string;
  city: string;
  state: string;
  zip: string;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt?: number;
  propertyType: PropertyType;
  estimatedValue?: number;
  dataSource?: string;
  dataFreshness?: Date;
}

export type PropertyType =
  | "single_family"
  | "multi_family"
  | "condo"
  | "townhouse"
  | "duplex"
  | "triplex"
  | "quadplex";

export interface LoanAssumptions {
  purchasePrice: number;
  downPaymentPct: number;       // e.g. 20 = 20%
  interestRate: number;         // e.g. 7.0 = 7%
  loanTermYears: number;        // e.g. 30
  closingCostsPct: number;      // e.g. 2 = 2%
  points: number;               // loan points
}

export interface IncomeAssumptions {
  monthlyRent: number;
  otherMonthlyIncome: number;   // parking, laundry, etc.
  annualRentGrowthPct: number;  // e.g. 3 = 3%
  vacancyRatePct: number;       // e.g. 5 = 5%
}

export interface ExpenseItem {
  label: string;
  type: "fixed" | "percent_rent" | "percent_value";
  monthlyAmount?: number;
  annualAmount?: number;
  percentage?: number;
  annualGrowthPct?: number;
}

export interface ExpenseAssumptions {
  propertyTaxAnnual: number;
  insuranceAnnual: number;
  repairsMaintenancePct: number;  // % of rent
  propertyManagementPct: number;  // % of rent
  capexPct: number;               // % of rent
  utilitiesMonthly: number;
  hoaMonthly: number;
  otherAnnual: number;
  expenseGrowthPct: number;       // annual expense growth %
}

export interface ProjectionAssumptions {
  holdingPeriodYears: number;
  annualAppreciationPct: number;
  sellingCostsPct: number;
  annualTaxBenefitRate: number;   // estimated tax benefit % of mortgage interest
}

export interface AnalysisAssumptions {
  property: PropertyDetails;
  loan: LoanAssumptions;
  income: IncomeAssumptions;
  expenses: ExpenseAssumptions;
  projection: ProjectionAssumptions;
}

// ---- Calculated Outputs ----

export interface LoanSummary {
  loanAmount: number;
  downPayment: number;
  closingCosts: number;
  totalCashNeeded: number;
  monthlyPayment: number;
  annualDebtService: number;
}

export interface AnnualMetrics {
  grossRentIncome: number;
  otherIncome: number;
  effectiveGrossIncome: number;
  vacancyLoss: number;
  totalExpenses: number;
  noi: number;
  debtService: number;
  cashFlow: number;
  capRate: number;
  cashOnCashReturn: number;
  dscr: number;
  grm: number;  // gross rent multiplier
}

export interface YearProjection {
  year: number;
  monthlyRent: number;
  annualRent: number;
  otherIncome: number;
  effectiveGrossIncome: number;
  vacancyLoss: number;
  totalExpenses: number;
  noi: number;
  debtService: number;
  cashFlow: number;
  cumulativeCashFlow: number;
  propertyValue: number;
  loanBalance: number;
  equity: number;
  equityPct: number;
  appreciation: number;
  taxBenefit: number;
  totalReturn: number;
  cashOnCashReturn: number;
  capRate: number;
  dscr: number;
  principalPaydown: number;
  interestPaid: number;
}

export interface ExitAnalysis {
  saleYear: number;
  projectedSalePrice: number;
  sellingCosts: number;
  loanPayoff: number;
  netProceeds: number;
  totalCashFlow: number;
  totalAppreciation: number;
  totalPrincipalPaydown: number;
  totalTaxBenefit: number;
  totalReturn: number;
  roi: number;
  irr: number | null;
  equityMultiple: number;
}

export interface AmortizationRow {
  month: number;
  year: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

// ---- Grades & Scoring ----

export type LetterGrade = "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "C-" | "D" | "F";

export interface GradeDetail {
  score: number;         // 0-100
  grade: LetterGrade;
  label: string;
  reasons: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface PropertyGrades {
  financial: GradeDetail;
  neighborhood: GradeDetail;
  overall: GradeDetail;
  financialWeight: number;   // e.g. 70
  neighborhoodWeight: number; // e.g. 30
}

export type RiskLevel = "Low" | "Medium" | "High" | "Very High";

export interface RiskAssessment {
  level: RiskLevel;
  score: number;   // 0-100 (higher = more risky)
  factors: string[];
  warnings: string[];
}

// ---- Comps ----

export interface RentalComp {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  beds: number;
  baths: number;
  sqft?: number;
  rent: number;
  propertyType?: string;
  distance?: number;
  source: string;
  fetchedAt: Date;
  included: boolean;
}

export interface CompsAnalysis {
  comps: RentalComp[];
  averageRent: number;
  medianRent: number;
  weightedRent: number;
  rentRange: { min: number; max: number };
  rentPerSqft?: number;
  confidenceScore: number;  // 0-100
  confidenceLabel: string;
}

// ---- Scenarios ----

export type ScenarioType = "conservative" | "base" | "aggressive";

export interface Scenario {
  type: ScenarioType;
  label: string;
  assumptions: Partial<AnalysisAssumptions>;
  metrics?: AnnualMetrics;
  projections?: YearProjection[];
  exit?: ExitAnalysis;
  grades?: PropertyGrades;
}

// ---- Sensitivity ----

export interface SensitivityRow {
  variable: string;
  low: number;
  base: number;
  high: number;
  lowCashFlow: number;
  baseCashFlow: number;
  highCashFlow: number;
  lowCoC: number;
  baseCoC: number;
  highCoC: number;
}

// ---- Deal Summary ----

export interface DealSummary {
  sentences: string[];
  verdict: "Strong Buy" | "Buy" | "Neutral" | "Caution" | "Pass";
  verdictColor: "green" | "yellow" | "red";
}

// ---- Pass/Fail Rules ----

export interface PassFailRules {
  minCashOnCashPct: number;
  minDSCR: number;
  minMonthlyCashFlow: number;
  maxLTV: number;
}

export interface PassFailResult {
  pass: boolean;
  results: {
    rule: string;
    required: number;
    actual: number;
    pass: boolean;
  }[];
}

// ---- Neighborhood ----

export interface NeighborhoodData {
  safetyScore?: number;
  schoolScore?: number;
  medianIncome?: number;
  populationGrowth?: number;
  unemploymentRate?: number;
  walkScore?: number;
  dataSource: string;
  confidence: "high" | "medium" | "low";
  missing: string[];
}

// ---- Market Comparison ----

export interface MarketComparison {
  rentVsMarket: "above" | "below" | "inline";
  rentDiffPct: number;
  priceVsMarket: "above" | "below" | "inline";
  priceDiffPct: number;
  rentPerSqft: number;
  marketRentPerSqft?: number;
  explanation: string;
}

// ---- Full Analysis Result ----

export interface FullAnalysisResult {
  assumptions: AnalysisAssumptions;
  loan: LoanSummary;
  amortization: AmortizationRow[];
  metrics: AnnualMetrics;
  projections: YearProjection[];
  exit: ExitAnalysis;
  grades: PropertyGrades;
  risk: RiskAssessment;
  comps: CompsAnalysis;
  scenarios: Scenario[];
  sensitivity: SensitivityRow[];
  dealSummary: DealSummary;
  passFailResult: PassFailResult;
  neighborhood?: NeighborhoodData;
  marketComparison?: MarketComparison;
  realism: { warnings: string[] };
}
