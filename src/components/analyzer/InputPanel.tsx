"use client";

import React, { useState, useCallback } from "react";
import { AnalysisAssumptions } from "@/lib/types";
import { MarketDataResult } from "@/lib/marketData";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MarketDataBanner } from "./MarketDataBanner";
import {
  ChevronDown, ChevronUp, Home, DollarSign, TrendingUp,
  Wrench, BarChart3, Sparkles, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InputPanelProps {
  assumptions: AnalysisAssumptions;
  onChange: (updated: AnalysisAssumptions) => void;
  onAnalyze: () => void;
  isLoading?: boolean;
}

type Section = "property" | "loan" | "income" | "expenses" | "projection";

// ─── Small helpers ───────────────────────────────────────────────────────────

function SectionHeader({
  title, icon, open, onToggle,
}: {
  title: string; icon: React.ReactNode; open: boolean; onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between py-3 text-left font-semibold text-gray-800 hover:text-blue-600 transition-colors"
    >
      <span className="flex items-center gap-2">{icon}{title}</span>
      {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
    </button>
  );
}

function Field({
  label, children, hint,
}: {
  label: string; children: React.ReactNode; hint?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-gray-600">{label}</Label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function NumericInput({
  value, onChange, prefix, suffix, step = 1, min, max, highlight,
}: {
  value: number; onChange: (v: number) => void; prefix?: string; suffix?: string;
  step?: number; min?: number; max?: number; highlight?: boolean;
}) {
  return (
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-3 text-gray-400 text-sm pointer-events-none">{prefix}</span>
      )}
      <Input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className={cn(
          prefix && "pl-7",
          suffix && "pr-8",
          highlight && "border-blue-400 ring-1 ring-blue-300 bg-blue-50"
        )}
      />
      {suffix && (
        <span className="absolute right-3 text-gray-400 text-sm pointer-events-none">{suffix}</span>
      )}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function InputPanel({ assumptions, onChange, onAnalyze, isLoading }: InputPanelProps) {
  const [openSections, setOpenSections] = useState<Record<Section, boolean>>({
    property: true,
    loan: true,
    income: true,
    expenses: false,
    projection: false,
  });

  const [marketData, setMarketData] = useState<MarketDataResult | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);
  // Track which fields were auto-filled (for blue highlight)
  const [autoFilled, setAutoFilled] = useState<Set<string>>(new Set());

  const toggle = (s: Section) =>
    setOpenSections((prev) => ({ ...prev, [s]: !prev[s] }));

  const update = <K extends keyof AnalysisAssumptions>(
    key: K,
    value: Partial<AnalysisAssumptions[K]>
  ) => {
    // Clear highlight for fields that are manually changed
    onChange({ ...assumptions, [key]: { ...assumptions[key], ...value } });
  };

  const { property, loan, income, expenses, projection } = assumptions;

  // ── Auto-fill from market data ──────────────────────────────────────────
  const canAutoFill =
    property.zip.replace(/\D/g, "").length >= 5 &&
    property.state.trim().length === 2 &&
    loan.purchasePrice > 0;

  const handleAutoFill = useCallback(async () => {
    if (!canAutoFill) return;
    setMarketLoading(true);
    setMarketError(null);

    try {
      const params = new URLSearchParams({
        zip: property.zip,
        state: property.state,
        beds: String(property.beds),
        purchasePrice: String(loan.purchasePrice),
      });
      const res = await fetch(`/api/market-data?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: MarketDataResult = await res.json();

      setMarketData(data);

      // Build the updates + track which fields changed
      const filled = new Set<string>();
      let newIncome = { ...income };
      let newExpenses = { ...expenses };

      if (data.estimatedMonthlyRent !== null) {
        newIncome = { ...newIncome, monthlyRent: data.estimatedMonthlyRent };
        filled.add("monthlyRent");
      }
      if (data.estimatedAnnualTax > 0) {
        newExpenses = { ...newExpenses, propertyTaxAnnual: data.estimatedAnnualTax };
        filled.add("propertyTaxAnnual");
      }
      if (data.estimatedAnnualInsurance > 0) {
        newExpenses = { ...newExpenses, insuranceAnnual: data.estimatedAnnualInsurance };
        filled.add("insuranceAnnual");
      }

      setAutoFilled(filled);
      onChange({ ...assumptions, income: newIncome, expenses: newExpenses });

      // Open income + expenses sections so user can see what changed
      setOpenSections((prev) => ({ ...prev, income: true, expenses: true }));
    } catch (err) {
      setMarketError(
        err instanceof Error ? err.message : "Failed to fetch market data"
      );
    } finally {
      setMarketLoading(false);
    }
  }, [canAutoFill, property, loan, income, expenses, assumptions, onChange]);

  // Clear highlight when user edits a field
  const clearHighlight = (field: string) => {
    if (autoFilled.has(field)) {
      setAutoFilled((prev) => { const s = new Set(prev); s.delete(field); return s; });
    }
  };

  return (
    <div className="space-y-3">

      {/* ── Property ──────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="px-4 py-2">
          <SectionHeader
            title="Property Details"
            icon={<Home className="h-4 w-4 text-blue-500" />}
            open={openSections.property}
            onToggle={() => toggle("property")}
          />
          {openSections.property && (
            <div className="space-y-3 pb-3">
              <Field label="Street Address">
                <Input
                  value={property.address}
                  onChange={(e) => update("property", { address: e.target.value })}
                  placeholder="123 Main St"
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="City">
                  <Input
                    value={property.city}
                    onChange={(e) => update("property", { city: e.target.value })}
                    placeholder="Austin"
                  />
                </Field>
                <Field label="State" hint="2-letter code">
                  <Input
                    value={property.state}
                    onChange={(e) => update("property", { state: e.target.value.toUpperCase().slice(0, 2) })}
                    placeholder="TX"
                    maxLength={2}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="ZIP Code">
                  <Input
                    value={property.zip}
                    onChange={(e) => update("property", { zip: e.target.value })}
                    placeholder="78701"
                    maxLength={10}
                  />
                </Field>
                <Field label="Property Type">
                  <Select
                    value={property.propertyType}
                    onValueChange={(v) => update("property", { propertyType: v as any })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_family">Single Family</SelectItem>
                      <SelectItem value="multi_family">Multi-Family</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="duplex">Duplex</SelectItem>
                      <SelectItem value="triplex">Triplex</SelectItem>
                      <SelectItem value="quadplex">Quadplex</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Beds">
                  <NumericInput value={property.beds} onChange={(v) => update("property", { beds: v })} step={1} min={0} />
                </Field>
                <Field label="Baths">
                  <NumericInput value={property.baths} onChange={(v) => update("property", { baths: v })} step={0.5} min={0} />
                </Field>
                <Field label="Sq Ft">
                  <NumericInput value={property.sqft} onChange={(v) => update("property", { sqft: v })} step={100} min={0} />
                </Field>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Loan ──────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="px-4 py-2">
          <SectionHeader
            title="Loan & Financing"
            icon={<DollarSign className="h-4 w-4 text-green-500" />}
            open={openSections.loan}
            onToggle={() => toggle("loan")}
          />
          {openSections.loan && (
            <div className="space-y-3 pb-3">
              <Field label="Purchase Price">
                <NumericInput value={loan.purchasePrice} onChange={(v) => update("loan", { purchasePrice: v })} prefix="$" step={5000} min={0} />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Down Payment %" hint="e.g. 20 for 20%">
                  <NumericInput value={loan.downPaymentPct} onChange={(v) => update("loan", { downPaymentPct: v })} suffix="%" step={1} min={0} max={100} />
                </Field>
                <Field label="Interest Rate">
                  <NumericInput value={loan.interestRate} onChange={(v) => update("loan", { interestRate: v })} suffix="%" step={0.125} min={0} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Loan Term (yrs)">
                  <NumericInput value={loan.loanTermYears} onChange={(v) => update("loan", { loanTermYears: v })} step={5} min={5} max={40} />
                </Field>
                <Field label="Closing Costs %">
                  <NumericInput value={loan.closingCostsPct} onChange={(v) => update("loan", { closingCostsPct: v })} suffix="%" step={0.25} min={0} />
                </Field>
              </div>
              <Field label="Points">
                <NumericInput value={loan.points} onChange={(v) => update("loan", { points: v })} suffix="pts" step={0.25} min={0} />
              </Field>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Auto-fill CTA ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-dashed border-blue-300 bg-blue-50 p-3">
        <p className="text-xs text-blue-700 mb-2 font-medium">
          Fill in ZIP, state, and purchase price above, then auto-populate rent, taxes, and insurance from public market data.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
          onClick={handleAutoFill}
          disabled={!canAutoFill || marketLoading}
        >
          {marketLoading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Fetching market data…</>
          ) : (
            <><Sparkles className="h-4 w-4 mr-2" /> Auto-fill from Local Market Data</>
          )}
        </Button>
        {marketError && (
          <p className="text-xs text-red-600 mt-2">⚠ {marketError}</p>
        )}
        {!canAutoFill && (
          <p className="text-xs text-blue-500 mt-1 opacity-70">
            Needs: ZIP code (5-digit), 2-letter state, purchase price
          </p>
        )}
      </div>

      {/* ── Market Data Banner ────────────────────────────────────────── */}
      {marketData && (
        <MarketDataBanner
          data={marketData}
          onDismiss={() => { setMarketData(null); setAutoFilled(new Set()); }}
        />
      )}

      {/* ── Income ────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="px-4 py-2">
          <SectionHeader
            title="Income & Rent"
            icon={<TrendingUp className="h-4 w-4 text-purple-500" />}
            open={openSections.income}
            onToggle={() => toggle("income")}
          />
          {openSections.income && (
            <div className="space-y-3 pb-3">
              <Field label="Monthly Rent">
                <NumericInput
                  value={income.monthlyRent}
                  onChange={(v) => { clearHighlight("monthlyRent"); update("income", { monthlyRent: v }); }}
                  prefix="$"
                  step={50}
                  min={0}
                  highlight={autoFilled.has("monthlyRent")}
                />
                {autoFilled.has("monthlyRent") && (
                  <p className="text-[10px] text-blue-600 mt-0.5">
                    ✦ Auto-filled from market data — adjust if needed
                  </p>
                )}
              </Field>
              <Field label="Other Monthly Income" hint="Parking, laundry, etc.">
                <NumericInput value={income.otherMonthlyIncome} onChange={(v) => update("income", { otherMonthlyIncome: v })} prefix="$" step={25} min={0} />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Annual Rent Growth" hint="Can be 0% or negative">
                  <NumericInput value={income.annualRentGrowthPct} onChange={(v) => update("income", { annualRentGrowthPct: v })} suffix="%" step={0.5} />
                </Field>
                <Field label="Vacancy Rate">
                  <NumericInput value={income.vacancyRatePct} onChange={(v) => update("income", { vacancyRatePct: v })} suffix="%" step={1} min={0} max={100} />
                </Field>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Expenses ──────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="px-4 py-2">
          <SectionHeader
            title="Expenses"
            icon={<Wrench className="h-4 w-4 text-orange-500" />}
            open={openSections.expenses}
            onToggle={() => toggle("expenses")}
          />
          {openSections.expenses && (
            <div className="space-y-3 pb-3">
              <div className="grid grid-cols-2 gap-2">
                <Field label="Property Tax (annual)">
                  <NumericInput
                    value={expenses.propertyTaxAnnual}
                    onChange={(v) => { clearHighlight("propertyTaxAnnual"); update("expenses", { propertyTaxAnnual: v }); }}
                    prefix="$"
                    step={100}
                    min={0}
                    highlight={autoFilled.has("propertyTaxAnnual")}
                  />
                  {autoFilled.has("propertyTaxAnnual") && (
                    <p className="text-[10px] text-blue-600 mt-0.5">✦ Auto-filled</p>
                  )}
                </Field>
                <Field label="Insurance (annual)">
                  <NumericInput
                    value={expenses.insuranceAnnual}
                    onChange={(v) => { clearHighlight("insuranceAnnual"); update("expenses", { insuranceAnnual: v }); }}
                    prefix="$"
                    step={100}
                    min={0}
                    highlight={autoFilled.has("insuranceAnnual")}
                  />
                  {autoFilled.has("insuranceAnnual") && (
                    <p className="text-[10px] text-blue-600 mt-0.5">✦ Auto-filled</p>
                  )}
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Repairs %" hint="% of rent">
                  <NumericInput value={expenses.repairsMaintenancePct} onChange={(v) => update("expenses", { repairsMaintenancePct: v })} suffix="%" step={1} min={0} />
                </Field>
                <Field label="Mgmt %" hint="% of rent">
                  <NumericInput value={expenses.propertyManagementPct} onChange={(v) => update("expenses", { propertyManagementPct: v })} suffix="%" step={1} min={0} />
                </Field>
                <Field label="CapEx %" hint="% of rent">
                  <NumericInput value={expenses.capexPct} onChange={(v) => update("expenses", { capexPct: v })} suffix="%" step={1} min={0} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Utilities (monthly)">
                  <NumericInput value={expenses.utilitiesMonthly} onChange={(v) => update("expenses", { utilitiesMonthly: v })} prefix="$" step={25} min={0} />
                </Field>
                <Field label="HOA (monthly)">
                  <NumericInput value={expenses.hoaMonthly} onChange={(v) => update("expenses", { hoaMonthly: v })} prefix="$" step={25} min={0} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Other (annual)">
                  <NumericInput value={expenses.otherAnnual} onChange={(v) => update("expenses", { otherAnnual: v })} prefix="$" step={100} min={0} />
                </Field>
                <Field label="Expense Growth %">
                  <NumericInput value={expenses.expenseGrowthPct} onChange={(v) => update("expenses", { expenseGrowthPct: v })} suffix="%" step={0.5} />
                </Field>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Projection ────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="px-4 py-2">
          <SectionHeader
            title="Projection & Exit"
            icon={<BarChart3 className="h-4 w-4 text-blue-500" />}
            open={openSections.projection}
            onToggle={() => toggle("projection")}
          />
          {openSections.projection && (
            <div className="space-y-3 pb-3">
              <div className="grid grid-cols-2 gap-2">
                <Field label="Holding Period (yrs)">
                  <NumericInput value={projection.holdingPeriodYears} onChange={(v) => update("projection", { holdingPeriodYears: Math.max(1, Math.round(v)) })} step={1} min={1} max={30} />
                </Field>
                <Field label="Appreciation %">
                  <NumericInput value={projection.annualAppreciationPct} onChange={(v) => update("projection", { annualAppreciationPct: v })} suffix="%" step={0.5} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Selling Costs %">
                  <NumericInput value={projection.sellingCostsPct} onChange={(v) => update("projection", { sellingCostsPct: v })} suffix="%" step={0.5} min={0} />
                </Field>
                <Field label="Tax Benefit Rate %">
                  <NumericInput value={projection.annualTaxBenefitRate} onChange={(v) => update("projection", { annualTaxBenefitRate: v })} suffix="%" step={1} min={0} max={50} />
                </Field>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Button className="w-full" size="lg" onClick={onAnalyze} disabled={isLoading}>
        {isLoading ? "Analyzing…" : "Analyze Property"}
      </Button>
    </div>
  );
}
