import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tournamentUpdateSchema, validateRequest } from "@/lib/validation";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isValidId(id)) {
    return NextResponse.json({ error: "Invalid tournament ID format" }, { status: 400 });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id },
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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Security: Verify authentication before allowing updates
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: "Authentication required to update tournaments" },
      { status: 401 }
    );
  }

  const { id } = await params;

  if (!isValidId(id)) {
    return NextResponse.json({ error: "Invalid tournament ID format" }, { status: 400 });
  }

  // Security: Use Zod schema to whitelist allowed fields and prevent mass assignment
  const validation = await validateRequest(request, tournamentUpdateSchema);
  if (validation.error) return validation.response!;

  const data = validation.data;

  // Check ownership before allowing updates
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { ownerId: true },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // If tournament has an owner, verify the authenticated user matches
  if (tournament.ownerId && tournament.ownerId !== auth.userId) {
    return NextResponse.json(
      { error: "You do not have permission to update this tournament" },
      { status: 403 }
    );
  }

  // Update only the whitelisted fields
  const updated = await prisma.tournament.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.maxPlayers !== undefined && { maxPlayers: data.maxPlayers }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.startDate !== undefined && { startDate: data.startDate !== null ? new Date(data.startDate) : null }),
      ...(data.endDate !== undefined && { endDate: data.endDate !== null ? new Date(data.endDate) : null }),
    },
  });

  return NextResponse.json(updated);
}

function isValidId(id: string) {
  return typeof id === "string" && id.length > 0 && id.length <= 100;
}
