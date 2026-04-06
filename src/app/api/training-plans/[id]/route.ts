import { NextRequest, NextResponse } from "next/server";
import { auth } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const plan = await prisma.trainingPlan.findFirst({
    where: { id, userId: (session.user as any).id },
    include: {
      items: {
        include: { video: { select: { id: true, title: true, duration: true, category: true } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!plan) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(plan);
}
