import { RentalComp, CompsAnalysis } from "../types";

export function analyzeComps(comps: RentalComp[]): CompsAnalysis {
  const included = comps.filter((c) => c.included);

  if (included.length === 0) {
    return {
      comps,
      averageRent: 0,
      medianRent: 0,
      weightedRent: 0,
      rentRange: { min: 0, max: 0 },
      confidenceScore: 0,
      confidenceLabel: "No data",
    };
  }

  const rents = included.map((c) => c.rent).sort((a, b) => a - b);
  const averageRent = rents.reduce((s, r) => s + r, 0) / rents.length;

  // Median
  const mid = Math.floor(rents.length / 2);
  const medianRent =
    rents.length % 2 !== 0 ? rents[mid] : (rents[mid - 1] + rents[mid]) / 2;

  // Weighted by proximity (closer = more weight)
  const withDistance = included.filter((c) => c.distance !== undefined && c.distance !== null);
  let weightedRent: number;
  if (withDistance.length >= 3) {
    const maxDist = Math.max(...withDistance.map((c) => c.distance!));
    const weights = withDistance.map((c) => (maxDist - c.distance! + 0.1));
    const totalWeight = weights.reduce((s, w) => s + w, 0);
    weightedRent = withDistance.reduce((s, c, i) => s + c.rent * weights[i], 0) / totalWeight;
  } else {
    weightedRent = averageRent;
  }

  // Confidence score
  let confidence = 50;
  if (included.length >= 5) confidence += 20;
  else if (included.length >= 3) confidence += 10;
  if (withDistance.length >= 3) confidence += 15;
  if (included.some((c) => c.sqft)) confidence += 10;
  confidence = Math.min(100, confidence);

  const confidenceLabel =
    confidence >= 80 ? "High" : confidence >= 60 ? "Medium" : "Low";

  const rentPerSqft =
    included.some((c) => c.sqft && c.sqft > 0)
      ? included
          .filter((c) => c.sqft && c.sqft > 0)
          .reduce((s, c) => s + c.rent / c.sqft!, 0) /
        included.filter((c) => c.sqft && c.sqft > 0).length
      : undefined;

  return {
    comps,
    averageRent,
    medianRent,
    weightedRent,
    rentRange: { min: rents[0], max: rents[rents.length - 1] },
    rentPerSqft,
    confidenceScore: confidence,
    confidenceLabel,
  };
}

// Generate synthetic comps when no real data is available
export function generateSyntheticComps(
  beds: number,
  baths: number,
  zip: string,
  baseRent: number
): RentalComp[] {
  const variations = [
    { distMult: 0.95, distKm: 0.3 },
    { distMult: 1.02, distKm: 0.5 },
    { distMult: 0.97, distKm: 0.8 },
    { distMult: 1.05, distKm: 1.1 },
    { distMult: 0.93, distKm: 1.4 },
    { distMult: 1.01, distKm: 1.8 },
  ];

  return variations.map((v, i) => ({
    id: `synthetic-${i}`,
    address: `${100 + i * 23} Nearby St`,
    city: "—",
    state: "—",
    zip,
    beds,
    baths,
    rent: Math.round(baseRent * v.distMult / 25) * 25,
    propertyType: "single_family",
    distance: v.distKm,
    source: "Estimated (synthetic)",
    fetchedAt: new Date(),
    included: true,
  }));
}
