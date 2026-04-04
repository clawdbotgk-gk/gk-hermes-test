import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(tournaments);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, type, maxPlayers } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 });
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        description: description || null,
        type,
        maxPlayers: maxPlayers ? parseInt(maxPlayers) : null,
      },
    });

    return NextResponse.json({ success: true, tournamentId: tournament.id });
  } catch (error) {
    console.error("Error creating tournament:", error);
    return NextResponse.json({ error: "Failed to create tournament" }, { status: 500 });
  }
}
