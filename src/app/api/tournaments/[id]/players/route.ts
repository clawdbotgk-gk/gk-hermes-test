import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { playerCreateSchema, bulkPlayerCreateSchema, validateRequest } from "@/lib/validation";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isValidId(id)) {
    return NextResponse.json({ error: "Invalid tournament ID format" }, { status: 400 });
  }

  const players = await prisma.player.findMany({
    where: { tournamentId: id },
    orderBy: { seed: "asc" },
  });
  return NextResponse.json(players);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Security: Verify authentication
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Authentication required to add players" }, { status: 401 });
  }

  const { id } = await params;

  if (!isValidId(id)) {
    return NextResponse.json({ error: "Invalid tournament ID format" }, { status: 400 });
  }

  const body = await request.json();

  // Check if single player or bulk
  if (body.players && Array.isArray(body.players)) {
    const validation = await validateRequest(request, bulkPlayerCreateSchema);
    if (validation.error) return validation.response!;

    await prisma.player.createMany({
      data: validation.data.players.map((p: { name: string; email?: string; phone?: string; seed?: number }) => ({
        name: p.name,
        email: p.email || null,
        phone: p.phone || null,
        seed: p.seed || null,
        tournamentId: id,
      })),
    });
    return NextResponse.json({ success: true, count: validation.data.players.length });
  }

  const validation = await validateRequest(request, playerCreateSchema);
  if (validation.error) return validation.response!;

  const d = validation.data;

  const player = await prisma.player.create({
    data: {
      name: d.name,
      email: d.email || null,
      phone: d.phone || null,
      seed: d.seed || null,
      tournamentId: id,
    },
  });
  return NextResponse.json(player);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Security: Verify authentication before deleting
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Authentication required to delete players" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get("playerId");
  if (!playerId) return NextResponse.json({ error: "playerId required" }, { status: 400 });

  if (!isValidId(playerId)) {
    return NextResponse.json({ error: "Invalid player ID format" }, { status: 400 });
  }

  await prisma.player.delete({ where: { id: playerId } });
  return NextResponse.json({ success: true });
}

function isValidId(id: string) {
  return typeof id === "string" && id.length > 0 && id.length <= 100;
}
