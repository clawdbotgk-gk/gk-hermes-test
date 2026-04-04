import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
    include: {
      players: { orderBy: { seed: "asc" } },
      matches: {
        orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
        include: {
          player1: { include: { player: true } },
          player2: { include: { player: true } },
          gameScores: true,
        },
      },
      groups: { orderBy: { name: "asc" }, include: { players: true } },
    },
  });
  if (!tournament) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(tournament);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const tournament = await prisma.tournament.update({ where: { id: params.id }, data: body });
  return NextResponse.json(tournament);
}
