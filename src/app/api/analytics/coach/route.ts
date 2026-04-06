import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get("coachId");

    // Get all users (students)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        skillLevel: true,
        goals: true,
      },
    });

    const students = await Promise.all(
      users.map(async (user) => {
        const videosBookmarked = await prisma.videoBookmark.count({
          where: { userId: user.id },
        });

        const trainingPlans = await prisma.trainingPlan.count({
          where: { userId: user.id },
        });

        const totalItems = await prisma.trainingPlanItem.count({
          where: { plan: { userId: user.id } },
        });

        const completedItems = await prisma.trainingPlanItem.count({
          where: {
            plan: { userId: user.id },
            completedAt: { not: null },
          },
        });

        const lastActive = await prisma.trainingPlanItem.findFirst({
          where: {
            plan: { userId: user.id },
            completedAt: { not: null },
          },
          orderBy: { completedAt: "desc" },
          select: { completedAt: true },
        });

        return {
          studentId: user.id,
          studentName: user.name,
          studentEmail: user.email,
          skillLevel: user.skillLevel,
          goals: user.goals,
          videosBookmarked,
          trainingPlans,
          completedItems,
          completionRate: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
          lastActive: lastActive?.completedAt
            ? new Date(lastActive.completedAt).toLocaleDateString()
            : "Never",
        };
      })
    );

    return NextResponse.json({
      coachId,
      studentCount: students.length,
      students,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch coach analytics" },
      { status: 500 }
    );
  }
}
