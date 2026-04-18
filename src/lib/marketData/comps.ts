/**
 * Rental Comps Service
 *
 * Priority:
 * 1. RentCast API (RENTCAST_API_KEY env) — real active listings
 * 2. Census ACS rent distribution — realistic market estimates (free, no key)
 */

import { RentalComp } from "@/lib/types";
import { fetchCensusMedianRent } from "./censusRent";
import { getBedMultiplier } from "./stateTaxRates";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CompsServiceResult {
  comps: RentalComp[];
  source: "rentcast" | "census_estimated";
  sourceLabel: string;
  fetchedAt: Date;
  note?: string;
}

// ─── RentCast ────────────────────────────────────────────────────────────────

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
  price: number;          // monthly rent
  propertyType?: string;
  distance?: number;      // miles from query point
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

  // Primary: listings endpoint
  const url = new URL(`${RENTCAST_BASE}/listings/rental/long-term`);
  url.searchParams.set("zipCode", zipCode);
  url.searchParams.set("bedrooms", String(bedrooms));
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("status", "Active");

  const res = await fetch(url.toString(), {
    headers: { "X-Api-Key": key, Accept: "application/json" },
    next: { revalidate: 3600 }, // 1-hour cache
  });

  if (!res.ok) {
    throw new Error(`RentCast ${res.status}: ${await res.text()}`);
  }

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
    source: "RentCast (active listings)",
    fetchedAt: new Date(),
    included: true,
  }));

  return {
    comps,
    source: "rentcast",
    sourceLabel: "RentCast — Active Rental Listings",
    fetchedAt: new Date(),
  };
}

// ─── Census Fallback ─────────────────────────────────────────────────────────

/**
 * Builds realistic comps from Census median rent + a synthetic distribution.
 * The spread is calibrated to typical intra-zip variance (~±20%).
 */
async function fetchCensusComps(params: {
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
}): Promise<CompsServiceResult> {
  const { zipCode, bedrooms, bathrooms } = params;

  const censusResult = await fetchCensusMedianRent(zipCode);
  const bedMult = getBedMultiplier(bedrooms);

  let baseRent: number;
  let confidence: "medium" | "low";
  let note: string;

  if (censusResult.medianRent) {
    baseRent = censusResult.medianRent * bedMult;
    confidence = "medium";
    note = `Based on Census ACS median rent for ZIP ${zipCode}, adjusted ${bedMult.toFixed(2)}× for ${bedrooms} bed(s).`;
  } else {
    // If Census returns nothing, use a very rough national median (~$1,400 for 2BR)
    baseRent = 1400 * bedMult;
    confidence = "low";
    note = `Census data unavailable for ZIP ${zipCode}. Using national median estimate.`;
  }

  // Spread pattern: simulate a realistic rent distribution around the median
  const patterns = [
    { priceFactor: 0.88, distMi: 0.2, label: "Studio/Jr" },
    { priceFactor: 0.93, distMi: 0.4, label: "Updated" },
    { priceFactor: 0.96, distMi: 0.6, label: "Corner" },
    { priceFactor: 1.00, distMi: 0.8, label: "Standard" },
    { priceFactor: 1.03, distMi: 1.1, label: "Renovated" },
    { priceFactor: 1.07, distMi: 1.4, label: "Newer" },
    { priceFactor: 1.11, distMi: 1.7, label: "Premium" },
    { priceFactor: 1.16, distMi: 2.1, label: "Luxury" },
  ];

  const comps: RentalComp[] = patterns.map((p, i) => {
    const rent = Math.round((baseRent * p.priceFactor) / 25) * 25;
    return {
      id: `census-${zipCode}-${i}`,
      address: `${200 + i * 47} Market St`,
      city: "—",
      state: "—",
      zip: zipCode,
      beds: bedrooms,
      baths: bathrooms,
      sqft: Math.round((600 + bedrooms * 350 + i * 40) / 50) * 50,
      rent,
      propertyType: "single_family",
      distance: p.distMi,
      source: `Census ACS Estimate (${p.label})`,
      fetchedAt: new Date(),
      included: true,
    };
  });

  return {
    comps,
    source: "census_estimated",
    sourceLabel: `US Census ACS ${censusResult.year} — Market Estimates`,
    fetchedAt: new Date(),
    note,
  };
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function fetchRentalComps(params: {
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  limit?: number;
}): Promise<CompsServiceResult> {
  // 1. Try RentCast if key is present
  if (process.env.RENTCAST_API_KEY) {
    try {
      return await fetchRentCastComps(params);
    } catch (err) {
      console.warn("RentCast failed, falling back to Census:", err);
    }
  }

  // 2. Census fallback
  return fetchCensusComps(params);
}
