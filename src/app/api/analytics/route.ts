import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const period = searchParams.get("period") || "30d";

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const daysAgo = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 30;
    const since = new Date();
    since.setDate(since.getDate() - daysAgo);

    // Video watch metrics
    const videoBookmarks = await prisma.videoBookmark.count({
      where: { userId, bookmarkedAt: { gte: since } },
    });

    // Training plan progress
    const plans = await prisma.trainingPlan.findMany({
      where: { userId },
      include: {
        items: {
          where: { completedAt: { not: null } },
        },
      },
    });
    const totalItems = await prisma.trainingPlanItem.count({
      where: { plan: { userId } },
    });
    const completedItems = plans.reduce((acc, p) => acc + p.items.length, 0);

    // Weekly activity breakdown
    const weeklyActivity: { week: string; completed: number }[] = [];
    for (let i = 0; i < Math.min(daysAgo / 7, 12); i++) {
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 7);

      const count = await prisma.trainingPlanItem.count({
        where: {
          plan: { userId },
          completedAt: { gte: weekStart, lt: weekEnd },
        },
      });
      weeklyActivity.unshift({
        week: weekEnd.toISOString().slice(0, 7),
        completed: count,
      });
    }

    return NextResponse.json({
      period,
      videoBookmarks,
      trainingPlans: plans.length,
      completedItems,
      totalItems,
      completionRate: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
      weeklyActivity,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
