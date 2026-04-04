import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDraw } from "@/lib/draws";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: { players: { orderBy: { seed: "asc" } } },
  });

  if (!tournament) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (tournament.players.length < 2) {
    return NextResponse.json({ error: "Need at least 2 players" }, { status: 400 });
  }

  const draw = generateDraw(tournament.type as any, tournament.players.map(p => ({
    id: p.id, name: p.name, seed: p.seed ?? undefined,
  })));

  await prisma.$transaction(async (tx) => {
    await tx.match.deleteMany({ where: { tournamentId: id } });

    for (const m of draw.matches) {
      const matchData: any = {
        tournamentId: params.id,
        round: m.round,
        matchNumber: m.matchNumber,
        stage: m.stage,
      };

      if (m.player1) {
        matchData.player1 = { create: { playerId: m.player1.id, position: 1 } };
      }
      if (m.player2) {
        matchData.player2 = { create: { playerId: m.player2.id, position: 2 } };
      }

      await tx.match.create({ data: matchData });
    }

    await tx.tournament.update({ where: { id: params.id }, data: { status: "in-progress" } });
  });

  return NextResponse.json({ success: true, matchCount: draw.matches.length });
}
