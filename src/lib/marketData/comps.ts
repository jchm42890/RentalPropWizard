/**
 * Rental Comps Service
 *
 * Priority (first success wins):
 *  1. Zillow via RapidAPI  (RAPIDAPI_KEY env)     — live "For Rent" listings
 *  2. RentCast             (RENTCAST_API_KEY env)  — active MLS-style listings
 *  3. HUD Fair Market Rents (HUD_API_TOKEN env)   — official gov't ZIP-level rents
 *  4. US Census ACS        (free, no key)          — county/ZIP statistical estimates
 */

import { RentalComp } from "@/lib/types";
import { fetchCensusMedianRent } from "./censusRent";
import { getBedMultiplier } from "./stateTaxRates";
import { fetchZillowComps } from "./zillowComps";
import { fetchHudFmr, hudFmrToMarketRent } from "./hudFmr";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CompsSource = "zillow" | "rentcast" | "hud_fmr" | "census_estimated";

export interface CompsServiceResult {
  comps: RentalComp[];
  source: CompsSource;
  sourceLabel: string;
  fetchedAt: Date;
  note?: string;
}

// ─── RentCast ─────────────────────────────────────────────────────────────────

const RENTCAST_BASE = "https://api.rentcast.io/v1";

interface RentCastListing {
  id: string;
  formattedAddress: string;
  city: string;
  state: string;
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage?: number;
  price: number;
  propertyType?: string;
  distance?: number;
  listedDate?: string;
}

async function fetchRentCastComps(params: {
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  limit?: number;
}): Promise<CompsServiceResult> {
  const key = process.env.RENTCAST_API_KEY;
  if (!key) throw new Error("No RENTCAST_API_KEY");

  const { zipCode, bedrooms, bathrooms, limit = 12 } = params;

  const url = new URL(`${RENTCAST_BASE}/listings/rental/long-term`);
  url.searchParams.set("zipCode", zipCode);
  url.searchParams.set("bedrooms", String(bedrooms));
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("status", "Active");

  const res = await fetch(url.toString(), {
    headers: { "X-Api-Key": key, Accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (!res.ok) throw new Error(`RentCast ${res.status}: ${await res.text()}`);

  const data: RentCastListing[] = await res.json();

  const comps: RentalComp[] = data.map((l) => ({
    id: l.id ?? `rc-${Math.random()}`,
    address: l.formattedAddress ?? "—",
    city: l.city ?? "—",
    state: l.state ?? "—",
    zip: l.zipCode ?? zipCode,
    beds: l.bedrooms ?? bedrooms,
    baths: l.bathrooms ?? bathrooms,
    sqft: l.squareFootage,
    rent: l.price,
    propertyType: l.propertyType,
    distance: l.distance,
    source: "RentCast (active listing)",
    fetchedAt: new Date(),
    included: true,
  }));

  return {
    comps,
    source: "rentcast",
    sourceLabel: `RentCast — ${comps.length} Active Rental Listings`,
    fetchedAt: new Date(),
  };
}

// ─── Census Fallback ──────────────────────────────────────────────────────────

async function fetchCensusComps(params: {
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
}): Promise<CompsServiceResult> {
  const { zipCode, bedrooms, bathrooms } = params;

  const censusResult = await fetchCensusMedianRent(zipCode);
  const bedMult = getBedMultiplier(bedrooms);

  let baseRent: number;
  let note: string;

  if (censusResult.medianRent) {
    baseRent = censusResult.medianRent * bedMult;
    note = `Based on Census ACS ${censusResult.year} median rent for ZIP ${zipCode}, adjusted ${bedMult.toFixed(2)}× for ${bedrooms} bed(s). Add RAPIDAPI_KEY for live Zillow listings.`;
  } else {
    baseRent = 1_400 * bedMult;
    note = `Census data unavailable for ZIP ${zipCode}. Using national median estimate. Add RAPIDAPI_KEY for live Zillow listings.`;
  }

  const patterns = [
    { priceFactor: 0.87, distMi: 0.2, label: "Smaller unit" },
    { priceFactor: 0.92, distMi: 0.4, label: "Older building" },
    { priceFactor: 0.96, distMi: 0.7, label: "No parking" },
    { priceFactor: 1.00, distMi: 0.9, label: "Median" },
    { priceFactor: 1.04, distMi: 1.2, label: "Updated kitchen" },
    { priceFactor: 1.08, distMi: 1.6, label: "Newer construction" },
    { priceFactor: 1.13, distMi: 2.0, label: "Premium finishes" },
    { priceFactor: 1.19, distMi: 2.5, label: "Luxury" },
  ];

  const comps: RentalComp[] = patterns.map((p, i) => ({
    id: `census-${zipCode}-${i}`,
    address: `${200 + i * 47} Market St`,
    city: "—",
    state: "—",
    zip: zipCode,
    beds: bedrooms,
    baths: bathrooms,
    sqft: Math.round((600 + bedrooms * 350 + i * 40) / 50) * 50,
    rent: Math.round((baseRent * p.priceFactor) / 25) * 25,
    propertyType: "single_family",
    distance: p.distMi,
    source: `Census ACS Estimate (${p.label})`,
    fetchedAt: new Date(),
    included: true,
  }));

  return {
    comps,
    source: "census_estimated",
    sourceLabel: `US Census ACS ${censusResult.year} — Market Estimates`,
    fetchedAt: new Date(),
    note,
  };
}

// ─── HUD FMR comps ────────────────────────────────────────────────────────────

async function fetchHudComps(params: {
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
}): Promise<CompsServiceResult> {
  const { zipCode, bedrooms, bathrooms } = params;

  const fmr = await fetchHudFmr(zipCode);
  if (!fmr) throw new Error("HUD FMR unavailable");

  // Market median ≈ FMR × 1.17 (FMR is the 40th-percentile rent)
  const baseRent = hudFmrToMarketRent(fmr, bedrooms);

  // Generate a realistic distribution around the HUD-calibrated median
  const patterns = [
    { priceFactor: 0.86, distMi: 0.2, label: "Budget" },
    { priceFactor: 0.91, distMi: 0.4, label: "Older building" },
    { priceFactor: 0.95, distMi: 0.7, label: "No parking" },
    { priceFactor: 0.99, distMi: 0.9, label: "Standard" },
    { priceFactor: 1.03, distMi: 1.2, label: "Updated" },
    { priceFactor: 1.08, distMi: 1.6, label: "Renovated" },
    { priceFactor: 1.14, distMi: 2.0, label: "Premium" },
    { priceFactor: 1.21, distMi: 2.5, label: "Luxury" },
  ];

  const comps: RentalComp[] = patterns.map((p, i) => ({
    id: `hud-${zipCode}-${i}`,
    address: `${200 + i * 47} Market St`,
    city: "—",
    state: "—",
    zip: zipCode,
    beds: bedrooms,
    baths: bathrooms,
    sqft: Math.round((600 + bedrooms * 350 + i * 40) / 50) * 50,
    rent: Math.round((baseRent * p.priceFactor) / 25) * 25,
    propertyType: "single_family",
    distance: p.distMi,
    source: `HUD FMR Estimate (${p.label})`,
    fetchedAt: new Date(),
    included: true,
  }));

  return {
    comps,
    source: "hud_fmr",
    sourceLabel: `HUD Fair Market Rents FY${fmr.year} — ${fmr.areaName}`,
    fetchedAt: new Date(),
    note: `Based on HUD Fair Market Rents for ${fmr.areaName}. FMR is the 40th-percentile rent; market median is estimated ~17% above FMR. Add RAPIDAPI_KEY for live Zillow listings.`,
  };
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function fetchRentalComps(params: {
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  limit?: number;
}): Promise<CompsServiceResult> {
  // 1. Zillow (RapidAPI) — live listings, best accuracy
  if (process.env.RAPIDAPI_KEY) {
    try {
      return await fetchZillowComps(params);
    } catch (err) {
      console.warn("Zillow RapidAPI failed, trying RentCast:", err);
    }
  }

  // 2. RentCast — active MLS-style listings
  if (process.env.RENTCAST_API_KEY) {
    try {
      return await fetchRentCastComps(params);
    } catch (err) {
      console.warn("RentCast failed, trying HUD FMR:", err);
    }
  }

  // 3. HUD Fair Market Rents (HUD_API_TOKEN) — official gov't ZIP-level data
  if (process.env.HUD_API_TOKEN) {
    try {
      return await fetchHudComps(params);
    } catch (err) {
      console.warn("HUD FMR failed, falling back to Census:", err);
    }
  }

  // 4. Census ACS with county fallback (always available, zero tokens)
  return fetchCensusComps(params);
}
