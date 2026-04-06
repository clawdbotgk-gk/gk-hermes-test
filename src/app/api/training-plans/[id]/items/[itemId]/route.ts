import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  _ctx: { params: Promise<{ itemId: string }> }
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itemId } = await _ctx.params;
  const item = await prisma.trainingPlanItem.findFirst({
    where: { id: itemId, plan: { userId: (session.user as any).id } },
  });
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const updated = await prisma.trainingPlanItem.update({
    where: { id: itemId },
    data: {
      ...(body.completedAt !== undefined && { completedAt: body.completedAt }),
      ...(body.title && { title: body.title }),
    },
    include: { video: { select: { id: true, title: true, duration: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  _ctx: { params: Promise<{ itemId: string }> }
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itemId } = await _ctx.params;
  const item = await prisma.trainingPlanItem.findFirst({
    where: { id: itemId, plan: { userId: (session.user as any).id } },
  });
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.trainingPlanItem.delete({ where: { id: itemId } });
  return NextResponse.json({ message: "Item deleted" });
}
