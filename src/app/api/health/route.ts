import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};

  // Database health check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok", latencyMs: Date.now() - startTime };
  } catch (error) {
    checks.database = { status: "error", error: "Database connection failed" };
  }

  // Overall health
  const healthy = checks.database.status === "ok";
  const status = healthy ? "ok" : "degraded";
  const statusCode = healthy ? 200 : 503;

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "0.1.0",
      checks,
    },
    { status: statusCode }
  );
}
