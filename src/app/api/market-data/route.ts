import { NextRequest } from "next/server";
import { z } from "zod";
import { fetchMarketData } from "@/lib/marketData";

const schema = z.object({
  zip: z.string().min(5).max(10),
  state: z.string().min(2).max(2),
  beds: z.number().min(0).max(10),
  purchasePrice: z.number().positive(),
});

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const parsed = schema.safeParse({
    zip: sp.get("zip") ?? "",
    state: sp.get("state") ?? "",
    beds: parseFloat(sp.get("beds") ?? "3"),
    purchasePrice: parseFloat(sp.get("purchasePrice") ?? "300000"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Missing or invalid parameters", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const data = await fetchMarketData(parsed.data);
    return Response.json(data);
  } catch (err) {
    console.error("Market data error:", err);
    return Response.json({ error: "Failed to fetch market data" }, { status: 500 });
  }
}
