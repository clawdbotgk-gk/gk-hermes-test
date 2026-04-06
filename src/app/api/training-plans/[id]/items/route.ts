import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req: request as any });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const plan = await prisma.trainingPlan.findUnique({ where: { id } });
  if (!plan || plan.userId !== token.sub) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { videoId, title, description, sortOrder } = body;

  const item = await prisma.trainingPlanItem.create({
    data: {
      planId: id,
      videoId: videoId || null,
      title: title || "Unnamed item",
      description: description || null,
      sortOrder: sortOrder || 0,
    },
    include: { video: { select: { id: true, title: true, duration: true } } },
  });

  return NextResponse.json(item);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req: request as any });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const plan = await prisma.trainingPlan.findFirst({
    where: { id, userId: token.sub },
    include: {
      items: {
        include: { video: { select: { id: true, title: true, duration: true } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!plan) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(plan.items);
}
