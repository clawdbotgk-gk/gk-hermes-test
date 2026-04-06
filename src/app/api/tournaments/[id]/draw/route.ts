import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDraw } from "@/lib/draws";

import { verifyAuth } from "@/lib/auth";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Security: Verify authentication
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Authentication required to generate draw" }, { status: 401 });
  }

  const { id } = await params;

  if (!isValidId(id)) {
    return NextResponse.json({ error: "Invalid tournament ID format" }, { status: 400 });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: { players: { orderBy: { seed: "asc" } } },
  });

  if (!tournament) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (tournament.players.length < 2) {
    return NextResponse.json({ error: "Need at least 2 players" }, { status: 400 });
  }

  const draw = generateDraw(
    tournament.type as "knockout" | "round-robin" | "double-knockout" | "groups-then-knockout",
    tournament.players.map(p => ({
    id: p.id, name: p.name, seed: p.seed ?? undefined,
  })));

  await prisma.$transaction(async (tx) => {
    await tx.match.deleteMany({ where: { tournamentId: id } });

    for (const m of draw.matches) {
      const match = await tx.match.create({
        data: {
          tournamentId: id,
          round: m.round,
          matchNumber: m.matchNumber,
          stage: m.stage,
        },
      });

      if (m.player1) {
        const mp1 = await tx.matchPlayer.create({
          data: { matchId: match.id, playerId: m.player1.id, position: 1 },
        });
        await tx.match.update({
          where: { id: match.id },
          data: { player1Id: mp1.id },
        });
      }
      if (m.player2) {
        const mp2 = await tx.matchPlayer.create({
          data: { matchId: match.id, playerId: m.player2.id, position: 2 },
        });
        await tx.match.update({
          where: { id: match.id },
          data: { player2Id: mp2.id },
        });
      }
    }

    await tx.tournament.update({ where: { id }, data: { status: "in-progress" } });
  });

  return NextResponse.json({ success: true, matchCount: draw.matches.length });
}

function isValidId(id: string) {
  return typeof id === "string" && id.length > 0 && id.length <= 100;
}
