"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AnalysisAssumptions, RentalComp, CompsAnalysis } from "@/lib/types";
import { analyzeComps } from "@/lib/engines/comps";
import { formatCurrency, cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { RefreshCw, Database, AlertCircle, CheckCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompsServiceResult {
  comps: RentalComp[];
  source: "rentcast" | "census_estimated";
  sourceLabel: string;
  fetchedAt: string;
  hasRentCastKey: boolean;
  note?: string;
}

interface LiveCompsTabProps {
  assumptions: AnalysisAssumptions;
  subjectRent: number;
}

export function LiveCompsTab({ assumptions, subjectRent }: LiveCompsTabProps) {
  const [data, setData] = useState<CompsServiceResult | null>(null);
  const [analysis, setAnalysis] = useState<CompsAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toggled, setToggled] = useState<Set<string>>(new Set());

  const { property } = assumptions;
  const canFetch = property.zip.length >= 5;

  const fetchComps = useCallback(async () => {
    if (!canFetch) return;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        zip: property.zip,
        beds: String(property.beds),
        baths: String(property.baths),
        limit: "12",
      });
      const res = await fetch(`/api/comps?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: CompsServiceResult = await res.json();
      setData(json);
      setToggled(new Set());

      // Build analysis from comps
      const parsed = json.comps.map((c) => ({
        ...c,
        fetchedAt: new Date(c.fetchedAt),
        included: true,
      }));
      setAnalysis(analyzeComps(parsed));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch comps");
    } finally {
      setLoading(false);
    }
  }, [property.zip, property.beds, property.baths, canFetch]);

  // Auto-fetch when zip changes
  useEffect(() => {
    if (canFetch) fetchComps();
  }, [property.zip, property.beds]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleComp = (id: string) => {
    const next = new Set(toggled);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setToggled(next);

    if (data) {
      const updated = data.comps.map((c) => ({
        ...c,
        fetchedAt: new Date(c.fetchedAt),
        included: !next.has(c.id),
      }));
      setAnalysis(analyzeComps(updated));
    }
  };

  // Chart data: comps + subject property
  const chartData = analysis
    ? [
        ...analysis.comps
          .filter((c) => !toggled.has(c.id))
          .map((c) => ({ name: c.address.split(",")[0] ?? c.address, rent: c.rent, type: "comp" })),
        { name: "Subject", rent: subjectRent, type: "subject" },
      ].sort((a, b) => a.rent - b.rent)
    : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-gray-800">Rental Comparables</h3>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-sm text-gray-500">
                ZIP {property.zip} · {property.beds} bed / {property.baths} bath
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchComps}
            disabled={loading || !canFetch}
            className="shrink-0"
          >
            <RefreshCw className={cn("h-4 w-4 mr-1.5", loading && "animate-spin")} />
            {loading ? "Fetching…" : "Refresh"}
          </Button>
        </div>

        {/* Source badge */}
        {data && (
          <div className="flex items-center gap-2 mt-3">
            <span className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border",
              data.source === "rentcast"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-blue-50 border-blue-200 text-blue-700"
            )}>
              <Database className="h-3 w-3" />
              {data.sourceLabel}
            </span>
            {!data.hasRentCastKey && (
              <span className="text-xs text-gray-400">
                · Add <code className="bg-gray-100 px-1 rounded">RENTCAST_API_KEY</code> for live listings
              </span>
            )}
          </div>
        )}
        {data?.note && (
          <p className="text-xs text-blue-600 mt-1.5 flex items-start gap-1">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {data.note}
          </p>
        )}
        {error && (
          <p className="text-xs text-red-600 mt-2">⚠ {error}</p>
        )}
        {!canFetch && (
          <p className="text-xs text-gray-400 mt-2">Enter a ZIP code in Property Details to load comps.</p>
        )}
      </div>

      {/* Stats row */}
      {analysis && analysis.comps.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Avg Market Rent", value: formatCurrency(analysis.averageRent) + "/mo", highlight: false },
            { label: "Median Rent", value: formatCurrency(analysis.medianRent) + "/mo", highlight: false },
            { label: "Weighted Rent", value: formatCurrency(analysis.weightedRent) + "/mo", highlight: true },
            { label: "Your Rent", value: formatCurrency(subjectRent) + "/mo",
              positive: subjectRent <= analysis.medianRent * 1.05 },
          ].map((s, i) => (
            <div key={i} className={cn(
              "rounded-xl border p-3 text-center",
              s.highlight ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
            )}>
              <div className="text-xs text-gray-500 mb-1">{s.label}</div>
              <div className={cn(
                "text-lg font-bold",
                s.positive === false ? "text-red-600" :
                s.positive === true ? "text-green-600" :
                s.highlight ? "text-blue-700" : "text-gray-800"
              )}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Rent Comparison</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                tickFormatter={(v: string) => v.length > 12 ? v.slice(0, 12) + "…" : v}
              />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                formatter={(v) => [formatCurrency(Number(v ?? 0)) + "/mo", "Rent"]}
              />
              <ReferenceLine
                y={analysis!.medianRent}
                stroke="#3b82f6"
                strokeDasharray="4 4"
                label={{ value: "Median", fill: "#3b82f6", fontSize: 10, position: "insideTopRight" }}
              />
              <Bar dataKey="rent" radius={[4, 4, 0, 0]}>
                {chartData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.type === "subject" ? "#f59e0b" : d.rent > analysis!.medianRent ? "#ef4444" : "#22c55e"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Your property</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Below median</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Above median</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block border-dashed" /> Median</span>
          </div>
        </div>
      )}

      {/* Table */}
      {data && data.comps.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h4 className="text-sm font-semibold text-gray-700">
              {data.comps.length} Comparable{data.comps.length > 1 ? "s" : ""}
              <span className="text-xs text-gray-400 font-normal ml-2">
                Click checkbox to exclude from analysis
              </span>
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-100">
                  {["Include", "Address", "Rent/mo", "Beds", "Baths", "Sq Ft", "$/sqft", "Distance", "Source"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.comps.map((comp) => {
                  const excluded = toggled.has(comp.id);
                  return (
                    <tr key={comp.id} className={cn("hover:bg-gray-50 transition-colors", excluded && "opacity-40 line-through-subtle")}>
                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={!excluded}
                          onChange={() => toggleComp(comp.id)}
                          className="rounded border-gray-300 text-blue-600"
                        />
                      </td>
                      <td className="px-3 py-2.5 font-medium text-gray-700 max-w-[180px] truncate">
                        {comp.address}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-green-600 whitespace-nowrap">
                        {formatCurrency(comp.rent)}
                        {subjectRent > 0 && (
                          <span className={cn(
                            "ml-1.5 text-[10px] font-normal",
                            comp.rent < subjectRent * 0.95 ? "text-green-500" :
                            comp.rent > subjectRent * 1.05 ? "text-red-400" : "text-gray-400"
                          )}>
                            {comp.rent < subjectRent * 0.95 ? "▼" : comp.rent > subjectRent * 1.05 ? "▲" : "≈"}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">{comp.beds}</td>
                      <td className="px-3 py-2.5">{comp.baths}</td>
                      <td className="px-3 py-2.5">{comp.sqft ? comp.sqft.toLocaleString() : "—"}</td>
                      <td className="px-3 py-2.5">
                        {comp.sqft ? `$${(comp.rent / comp.sqft).toFixed(2)}` : "—"}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {comp.distance !== undefined ? `${comp.distance.toFixed(1)} mi` : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-gray-400 max-w-[140px] truncate" title={comp.source}>
                        {comp.source}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confidence */}
      {analysis && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <CheckCircle className="h-3.5 w-3.5 text-gray-400" />
          Data confidence: <strong>{analysis.confidenceLabel}</strong> ({analysis.confidenceScore}/100) ·
          {analysis.comps.filter(c => c.included).length} of {analysis.comps.length} comps included
        </div>
      )}
    </div>
  );
}
