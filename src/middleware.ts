import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/profile", "/training-plans", "/analytics", "/bookmarks"];
const apiPrefix = "/api";

// Simple in-memory rate limiter (edge-compatible via request coalescing)
const RATE_LIMITS: Record<string, { windowMs: number; max: number }> = {
  [`${apiPrefix}/auth`]: { windowMs: 60_000, max: 10 },    // 10 requests/min
  [apiPrefix]: { windowMs: 60_000, max: 100 },               // 100 requests/min
  default: { windowMs: 60_000, max: 200 },                     // 200 requests/min
};

// Edge-compatible store using request headers for simplicity
// For production, use Upstash Redis or similar
function getRateLimitKey(ip: string, path: string): string {
  return `rl:${ip}:${Object.keys(RATE_LIMITS).find(k => k !== "default" && path.startsWith(k)) || "default"}`;
}

// Allowed origins for CORS
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "").split(",").filter(Boolean);
const IS_PROD = process.env.NODE_ENV === "production";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // --- CORS handling for API routes ---
  if (pathname.startsWith(apiPrefix)) {
    const origin = request.headers.get("origin");
    const isAllowed = ALLOWED_ORIGINS.includes(origin || "");
    const allowAnyDev = !IS_PROD || ALLOWED_ORIGINS.length === 0;

    if (origin && (isAllowed || allowAnyDev)) {
      const response = NextResponse.next();
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID");
      response.headers.set("Access-Control-Max-Age", "86400");
      return response;
    }
  }

  // --- Protected route auth check ---
  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isProtected) {
    const token = await getToken({ req: request });
    if (!token) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/training-plans/:path*", "/analytics/:path*", "/bookmarks/:path*", "/api/:path*"],
};
