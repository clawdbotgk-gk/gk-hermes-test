import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data: any = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.response !== undefined) data.response = body.response;
    if (body.type !== undefined) data.type = body.type;

    const feedback = await prisma.feedback.update({
      where: { id },
      data,
      include: { user: { select: { name: true, email: true } } },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update feedback" }, { status: 500 });
  }
}
