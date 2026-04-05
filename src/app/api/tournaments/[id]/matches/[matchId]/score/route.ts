import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scoreUpdateSchema, validateRequest } from "@/lib/validation";
import { verifyAuth } from "@/lib/auth";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; matchId: string }> }) {
  // Security: Verify authentication before modifying scores
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Authentication required to submit scores" }, { status: 401 });
  }

  const { id, matchId } = await params;

  // Validate IDs
  if (!isValidId(id) || !isValidId(matchId)) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }

  // Validate input with Zod schema
  const validation = await validateRequest(request, scoreUpdateSchema);
  if (validation.error) return validation.response!;

  const { gameScores } = validation.data;

  // Validate all scores are valid positive numbers with reasonable bounds
  for (const g of gameScores) {
    if (typeof g.player1Score !== "number" || g.player1Score < 0 || g.player1Score > 1000) {
      return NextResponse.json({ error: `Invalid player1Score in game ${g.gameNumber}` }, { status: 400 });
    }
    if (typeof g.player2Score !== "number" || g.player2Score < 0 || g.player2Score > 1000) {
      return NextResponse.json({ error: `Invalid player2Score in game ${g.gameNumber}` }, { status: 400 });
    }
    if (typeof g.gameNumber !== "number" || g.gameNumber < 1 || g.gameNumber > 100) {
      return NextResponse.json({ error: `Invalid gameNumber: ${g.gameNumber}` }, { status: 400 });
    }
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { player1: true, player2: true },
  });
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (!match.player1 || !match.player2) return NextResponse.json({ error: "Match incomplete" }, { status: 400 });

  let p1Wins = 0, p2Wins = 0;
  for (const g of gameScores) {
    if (g.player1Score > g.player2Score) p1Wins++;
    else if (g.player2Score > g.player1Score) p2Wins++;
    else return NextResponse.json({ error: "Games cannot be tied" }, { status: 400 });
  }
  if (p1Wins === p2Wins) return NextResponse.json({ error: "Match must have a winner" }, { status: 400 });

  const playerWins = p1Wins > p2Wins ? 1 : 2;
  const winnerId = playerWins === 1 ? match.player1.playerId : match.player2.playerId;

  await prisma.$transaction(async (tx) => {
    await tx.gameScore.deleteMany({ where: { matchId } });
    await tx.gameScore.createMany({
      data: gameScores.map(g => ({
        matchId,
        gameNumber: g.gameNumber,
        player1Score: g.player1Score,
        player2Score: g.player2Score,
      })),
    });
    await tx.match.update({
      where: { id: matchId },
      data: {
        status: "completed",
        completedAt: new Date(),
        winnerScore: Math.max(p1Wins, p2Wins),
        loserScore: Math.min(p1Wins, p2Wins),
      },
    });
  });

  // Advance winner
  const nextRound = match.round + 1;
  const nextMatchNumber = Math.ceil(match.matchNumber / 2);
  const position = match.matchNumber % 2 === 1 ? 1 : 2;

  const nextMatch = await prisma.match.findFirst({
    where: { tournamentId: id, round: nextRound, matchNumber: nextMatchNumber, stage: match.stage },
  });

  if (nextMatch) {
    const existing = await prisma.matchPlayer.findFirst({
      where: { matchId: nextMatch.id, position },
    });
    if (existing) {
      await prisma.$transaction(async (tx) => {
        await tx.matchPlayer.update({
          where: { id: existing.id },
          data: { playerId: winnerId },
        });
        const updateData: Record<string, string> = {};
        updateData[position === 1 ? "player1Id" : "player2Id"] = existing.id;
        await tx.match.update({
          where: { id: nextMatch.id },
          data: updateData,
        });
      });
    } else {
      const mp = await prisma.matchPlayer.create({
        data: { matchId: nextMatch.id, playerId: winnerId, position },
      });
      const updateData: Record<string, string> = {};
      updateData[position === 1 ? "player1Id" : "player2Id"] = mp.id;
      await prisma.match.update({
        where: { id: nextMatch.id },
        data: updateData,
      });
    }
  }

  return NextResponse.json({ success: true, winnerId });
}

function isValidId(id: string) {
  return typeof id === "string" && id.length > 0 && id.length <= 100;
}
