/**
 * Zillow Rental Comps via RapidAPI
 *
 * Uses the zillow-com1 RapidAPI endpoint to fetch real, active Zillow
 * "For Rent" listings near the subject ZIP.  Requires RAPIDAPI_KEY env var.
 *
 * Docs: https://rapidapi.com/apimaker/api/zillow-com1
 */

import { RentalComp } from "@/lib/types";
import { CompsServiceResult } from "./comps";

const RAPIDAPI_HOST = "zillow-com1.p.rapidapi.com";
const RAPIDAPI_BASE = `https://${RAPIDAPI_HOST}`;

// ─── Response shape ───────────────────────────────────────────────────────────

interface ZillowProp {
  zpid?: string | number;
  address?: string;
  price?: number;                 // monthly rent when ForRent
  bedrooms?: number;
  bathrooms?: number;
  livingArea?: number;
  homeType?: string;
  rentZestimate?: number;
  imgSrc?: string;
  detailUrl?: string;
  country?: string;
  currency?: string;
}

interface ZillowSearchResponse {
  props?: ZillowProp[];
  totalResultCount?: number;
  currentPage?: number;
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchZillowComps(params: {
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  limit?: number;
}): Promise<CompsServiceResult> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) throw new Error("No RAPIDAPI_KEY");

  const { zipCode, bedrooms, limit = 12 } = params;

  // Map bed count to Zillow bedsMin/bedsMax filter
  const bedsMin = Math.max(1, bedrooms - 1);
  const bedsMax = bedrooms + 1;

  const url = new URL(`${RAPIDAPI_BASE}/propertyExtendedSearch`);
  url.searchParams.set("location", zipCode);
  url.searchParams.set("status_type", "ForRent");
  url.searchParams.set("home_type", "Houses,Townhomes,Multi-family,Condos,Apartments");
  url.searchParams.set("bedsMin", String(bedsMin));
  url.searchParams.set("bedsMax", String(bedsMax));
  url.searchParams.set("page", "1");

  const res = await fetch(url.toString(), {
    headers: {
      "X-RapidAPI-Key": key,
      "X-RapidAPI-Host": RAPIDAPI_HOST,
      Accept: "application/json",
    },
    next: { revalidate: 3600 }, // 1-hour edge cache
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Zillow RapidAPI ${res.status}: ${body.slice(0, 200)}`);
  }

  const data: ZillowSearchResponse = await res.json();
  const props = data.props ?? [];

  if (props.length === 0) {
    throw new Error(`Zillow returned 0 listings for ZIP ${zipCode}`);
  }

  // Filter to price-valid listings and take up to limit
  const valid = props
    .filter((p) => p.price && p.price > 100)
    .slice(0, limit);

  const comps: RentalComp[] = valid.map((p, i) => {
    // Zillow address strings: "123 Main St, City, ST 12345"
    const addressParts = (p.address ?? "").split(", ");
    const streetAddr = addressParts[0] ?? p.address ?? "—";
    const city = addressParts[1] ?? "—";
    const stateZip = addressParts[2] ?? "";
    const [state] = stateZip.split(" ");

    return {
      id: String(p.zpid ?? `zillow-${zipCode}-${i}`),
      address: streetAddr,
      city,
      state: state || "—",
      zip: zipCode,
      beds: p.bedrooms ?? params.bedrooms,
      baths: p.bathrooms ?? params.bathrooms,
      sqft: p.livingArea,
      rent: p.price!,
      propertyType: normalizeHomeType(p.homeType),
      source: "Zillow (active listing)",
      fetchedAt: new Date(),
      included: true,
    };
  });

  return {
    comps,
    source: "zillow",
    sourceLabel: `Zillow — ${comps.length} Active Rental Listings`,
    fetchedAt: new Date(),
  };
}

function normalizeHomeType(t?: string): string {
  if (!t) return "single_family";
  const map: Record<string, string> = {
    SINGLE_FAMILY: "single_family",
    MULTI_FAMILY: "multi_family",
    CONDO: "condo",
    TOWNHOUSE: "townhouse",
    APARTMENT: "apartment",
    MANUFACTURED: "manufactured",
  };
  return map[t.toUpperCase()] ?? t.toLowerCase();
}
