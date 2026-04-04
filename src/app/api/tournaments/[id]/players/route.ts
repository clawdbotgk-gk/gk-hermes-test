import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const players = await prisma.player.findMany({
    where: { tournamentId: params.id },
    orderBy: { seed: "asc" },
  });
  return NextResponse.json(players);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  
  // Check if single player or bulk
  if (body.players && Array.isArray(body.players)) {
    await prisma.player.createMany({
      data: body.players.map((p: any) => ({
        name: p.name,
        email: p.email || null,
        phone: p.phone || null,
        seed: p.seed || null,
        tournamentId: params.id,
      })),
    });
    return NextResponse.json({ success: true, count: body.players.length });
  }
  
  const player = await prisma.player.create({
    data: {
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      seed: body.seed || null,
      tournamentId: params.id,
    },
  });
  return NextResponse.json(player);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get("playerId");
  if (!playerId) return NextResponse.json({ error: "playerId required" }, { status: 400 });
  await prisma.player.delete({ where: { id: playerId } });
  return NextResponse.json({ success: true });
}
