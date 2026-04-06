import { NextRequest, NextResponse } from "next/server";
import { auth } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: (session.user as any).email as string },
    select: {
      id: true, name: true, email: true, image: true,
      bookmarks: { select: { id: true } },
      trainingPlans: {
        where: { items: { some: { completedAt: { not: null } } } },
        select: { id: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    bookmarksCount: user.bookmarks.length,
    totalVideosWatched: user.trainingPlans.length,
    totalPlansCompleted: user.trainingPlans.length,
    skillLevel: null,
    goals: null,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const updated = await prisma.user.update({
    where: { email: (session.user as any).email as string },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.skillLevel !== undefined && { skillLevel: body.skillLevel }),
      ...(body.goals !== undefined && { goals: body.goals }),
    },
  });

  return NextResponse.json(updated);
}
