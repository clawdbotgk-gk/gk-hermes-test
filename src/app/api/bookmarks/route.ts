import { NextRequest, NextResponse } from "next/server";
import { auth } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookmarks = await prisma.videoBookmark.findMany({
    where: { userId: (session.user as any).id },
    include: {
      video: { select: { id: true, title: true, description: true, category: true, skillLevel: true, duration: true, thumbnailUrl: true } },
    },
    orderBy: { bookmarkedAt: "desc" },
  });

  return NextResponse.json(bookmarks);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { videoId, action } = body;

  if (!videoId || !action) {
    return NextResponse.json({ error: "videoId and action (add/remove) are required" }, { status: 400 });
  }

  if (action === "add") {
    const existing = await prisma.videoBookmark.findFirst({
      where: { userId: (session.user as any).id, videoId },
    });
    if (existing) {
      return NextResponse.json(existing);
    }
    const bookmark = await prisma.videoBookmark.create({
      data: { userId: (session.user as any).id, videoId },
      include: { video: true },
    });
    return NextResponse.json(bookmark);
  } else {
    await prisma.videoBookmark.deleteMany({
      where: { userId: (session.user as any).id, videoId },
    });
    return NextResponse.json({ message: "Bookmark removed" });
  }
}
