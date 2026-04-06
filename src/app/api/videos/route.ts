import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const category = searchParams.get("category");
    const skillLevel = searchParams.get("skillLevel");

    const videos = await prisma.video.findMany({
      where: {
        published: true,
        ...(q && {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
          ],
        }),
        ...(category && category !== "all" && { category }),
        ...(skillLevel && skillLevel !== "all" && { skillLevel }),
      },
      include: {
        tags: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(videos);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, category, skillLevel, tags, filename } = body;

    if (!title || !filename) {
      return NextResponse.json(
        { error: "Title and filename are required" },
        { status: 400 }
      );
    }

    const video = await prisma.video.create({
      data: {
        title,
        description: description || null,
        category,
        skillLevel,
        storagePath: `coaching-videos/${Date.now()}-${filename.replace(/\s/g, "-")}`,
        tags: tags && tags.length > 0 ? {
          connectOrCreate: tags.map((tag: string) => ({
            where: { name: tag.toLowerCase() },
            create: { name: tag.toLowerCase() },
          })),
        } : undefined,
      },
      include: {
        tags: true,
      },
    });

    return NextResponse.json({
      video,
      message: "Video record created. Upload file to storagePath.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create video" },
      { status: 500 }
    );
  }
}
