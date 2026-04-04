import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; matchId: string }> }) {
  const match = await prisma.match.findUnique({
    where: { id: params.matchId },
    include: {
      player1: { include: { player: true } },
      player2: { include: { player: true } },
      gameScores: true,
    },
  });
  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(match);
}
