import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; matchId: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { gameScores } = body;

  if (!gameScores || !Array.isArray(gameScores) || gameScores.length === 0) {
    return NextResponse.json({ error: "No game scores provided" }, { status: 400 });
  }

  // Validate all scores are numbers
  for (const g of gameScores) {
    if (typeof g.player1Score !== "number" || typeof g.player2Score !== "number" || typeof g.gameNumber !== "number") {
      return NextResponse.json({ error: "Invalid score format" }, { status: 400 });
    }
  }

  const match = await prisma.match.findUnique({
    where: { id: params.matchId },
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
    await tx.gameScore.deleteMany({ where: { matchId: params.matchId } });
    await tx.gameScore.createMany({
      data: gameScores.map(g => ({ matchId: params.matchId, gameNumber: g.gameNumber, player1Score: g.player1Score, player2Score: g.player2Score })),
    });
    await tx.match.update({
      where: { id: params.matchId },
      data: { status: "completed", completedAt: new Date(), winnerScore: Math.max(p1Wins, p2Wins), loserScore: Math.min(p1Wins, p2Wins) },
    });
  });

  // Advance winner
  const nextRound = match.round + 1;
  const nextMatchNumber = Math.ceil(match.matchNumber / 2);
  const position = match.matchNumber % 2 === 1 ? 1 : 2;

  const nextMatch = await prisma.match.findFirst({
    where: { tournamentId: params.id, round: nextRound, matchNumber: nextMatchNumber, stage: match.stage },
  });

  if (nextMatch) {
    const existing = await prisma.matchPlayer.findFirst({ where: { matchId: nextMatch.id, position } });
    if (existing) {
      await prisma.matchPlayer.update({ where: { id: existing.id }, data: { playerId: winnerId } });
    } else {
      await prisma.matchPlayer.create({ data: { matchId: nextMatch.id, playerId: winnerId, position } });
    }
  }

  return NextResponse.json({ success: true, winnerId });
}
