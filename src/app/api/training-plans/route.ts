import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request as any });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plans = await prisma.trainingPlan.findMany({
    where: { userId: (session.user as any).id },
    include: {
      items: {
        include: { video: { select: { id: true, title: true, duration: true, category: true } } },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(plans);
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request as any });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description } = body;
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const plan = await prisma.trainingPlan.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      userId: (session.user as any).id,
    },
  });

  return NextResponse.json(plan);
}
