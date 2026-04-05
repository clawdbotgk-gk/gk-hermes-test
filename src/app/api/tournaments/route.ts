import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tournamentCreateSchema, validateRequest } from "@/lib/validation";
import { verifyAuth } from "@/lib/auth";

export async function GET() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(tournaments);
}

export async function POST(request: NextRequest) {
  // Security: Verify authentication before creating tournaments
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: "Authentication required to create tournaments" },
      { status: 401 }
    );
  }

  // Security: Validate input with Zod schema to prevent injection and invalid data
  const validation = await validateRequest(request, tournamentCreateSchema);
  if (validation.error) return validation.response!;

  const data = validation.data;

  const tournament = await prisma.tournament.create({
    data: {
      name: data.name,
      description: data.description || null,
      type: data.type,
      maxPlayers: data.maxPlayers || null,
      ownerId: auth.userId,
    },
  });

  return NextResponse.json({ success: true, tournamentId: tournament.id });
}
