import { NextRequest } from "next/server";
import { z } from "zod";
import { fetchRentalComps } from "@/lib/marketData/comps";

const schema = z.object({
  zip: z.string().min(5).max(10),
  beds: z.number().min(0).max(10),
  baths: z.number().min(0).max(10),
  limit: z.number().min(1).max(25).optional(),
});

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const parsed = schema.safeParse({
    zip: sp.get("zip") ?? "",
    beds: parseFloat(sp.get("beds") ?? "3"),
    baths: parseFloat(sp.get("baths") ?? "2"),
    limit: sp.get("limit") ? parseFloat(sp.get("limit")!) : undefined,
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid parameters", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await fetchRentalComps({
      zipCode: parsed.data.zip,
      bedrooms: parsed.data.beds,
      bathrooms: parsed.data.baths,
      limit: parsed.data.limit,
    });

    return Response.json({
      ...result,
      hasRentCastKey: !!process.env.RENTCAST_API_KEY,
    });
  } catch (err) {
    console.error("Comps API error:", err);
    return Response.json({ error: "Failed to fetch comps" }, { status: 500 });
  }
}
