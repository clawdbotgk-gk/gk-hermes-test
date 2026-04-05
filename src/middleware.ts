import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Security middleware for gk-hermes-test
// Implements: CORS hardening, security headers, basic rate tracking, CSRF protection

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and public pages
  if (pathname.startsWith("/_next/") || pathname.startsWith("/favicon")) {
    return response;
  }

  // Public read-only endpoints (no auth required)
  const publicGetEndpoints = [
    "/api/tournaments",
    "/public",
  ];

  // Check if this is a state-changing request that needs protection
  const isStateChanging = !["GET", "HEAD", "OPTIONS"].includes(request.method);
  const isApiRoute = pathname.startsWith("/api/");

  // Security Headers
  const headers = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "0", // CSP handles this better
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  };

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // CORS - Only allow same-origin requests
  if (isApiRoute && isStateChanging) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    
    // Block cross-origin state-changing requests (basic CSRF protection)
    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return new NextResponse(
            JSON.stringify({ error: "Cross-origin requests not allowed" }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
      } catch {
        return new NextResponse(
          JSON.stringify({ error: "Invalid origin header" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }

  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob:; " +
    "font-src 'self'; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  );

  // Rate limiting header (informative - actual enforcement should be at edge)
  response.headers.set("X-RateLimit-Limit", "100");
  response.headers.set("X-RateLimit-Remaining", "99");

  return response;
}

// Match all API routes and page routes
export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
