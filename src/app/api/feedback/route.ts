import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST: submit new feedback/support ticket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, subject, message, type } = body;

    if (!subject) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId: userId || null,
        email: email || null,
        subject,
        message: message || null,
        type: type || "general",
      },
    });

    return NextResponse.json({ id: feedback.id, message: "Feedback submitted successfully" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}

// GET: list feedback (admin use)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");

    const where: any = {};
    if (status && ["new", "in_progress", "resolved"].includes(status)) {
      where.status = status;
    }

    const [feedback, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.feedback.count({ where }),
    ]);

    return NextResponse.json({ feedback, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
  }
}
