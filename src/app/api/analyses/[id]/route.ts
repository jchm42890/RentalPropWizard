import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const analysis = await prisma.analysis.findUnique({
      where: { id },
      include: { property: true },
    });
    if (!analysis) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json(analysis);
  } catch (err) {
    console.error("GET /api/analyses/[id] error:", err);
    return Response.json({ error: "Database error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.analysis.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/analyses/[id] error:", err);
    return Response.json({ error: "Database error" }, { status: 500 });
  }
}
