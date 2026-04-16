import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const jsonObj = z.record(z.string(), z.unknown());

const createSchema = z.object({
  propertyAddress: z.string().min(1),
  propertyCity: z.string().min(1),
  propertyState: z.string().min(1),
  propertyZip: z.string().min(1),
  name: z.string().optional(),
  assumptions: jsonObj,
  projections: jsonObj.optional(),
  grades: jsonObj.optional(),
  metrics: jsonObj.optional(),
  scenarios: jsonObj.optional(),
});

export async function GET() {
  try {
    const analyses = await prisma.analysis.findMany({
      include: { property: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return Response.json(analyses);
  } catch (err) {
    console.error("GET /api/analyses error:", err);
    return Response.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { propertyAddress, propertyCity, propertyState, propertyZip, name, assumptions, projections, grades, metrics, scenarios } = parsed.data;

    // Create property
    const property = await prisma.property.create({
      data: {
        address: propertyAddress,
        city: propertyCity,
        state: propertyState,
        zip: propertyZip,
      },
    });

    const analysis = await prisma.analysis.create({
      data: {
        propertyId: property.id,
        name: name ?? "New Analysis",
        assumptions: assumptions as any,
        projections: (projections ?? null) as any,
        grades: (grades ?? null) as any,
        metrics: (metrics ?? null) as any,
        scenarios: (scenarios ?? null) as any,
      },
      include: { property: true },
    });

    return Response.json(analysis, { status: 201 });
  } catch (err) {
    console.error("POST /api/analyses error:", err);
    return Response.json({ error: "Database error" }, { status: 500 });
  }
}
