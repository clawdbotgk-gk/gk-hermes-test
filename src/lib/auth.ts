import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Authentication helper for API routes.
 * Checks for a valid next-auth session cookie.
 * Returns null if no session found (public access is not allowed for state-changing routes).
 *
 * In the current setup, next-auth sessions are stored in the Session table.
 * We check the sessionToken cookie against the database.
 */

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  userEmail?: string;
  error?: string;
}

/**
 * Verify authentication for a given request.
 * Checks the authjs session cookie (next-auth.session-token or __Secure-next-auth.session-token).
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  // Get session token from cookies (supports both HTTP and HTTPS variants)
  const sessionToken =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value ||
    request.cookies.get("__Host-next-auth.session-token")?.value;

  if (!sessionToken) {
    return {
      authenticated: false,
      error: "No session token found",
    };
  }

  try {
    // Import prisma dynamically to avoid circular deps
    const { prisma } = await import("./prisma");

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    if (!session || session.expires < new Date()) {
      // Clean up expired session
      if (session) {
        await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      }
      return {
        authenticated: false,
        error: "Session expired or invalid",
      };
    }

    return {
      authenticated: true,
      userId: session.user.id,
      userEmail: session.user.email || undefined,
    };
  } catch (error) {
    console.error("Auth verification error:", error);
    return {
      authenticated: false,
      error: "Failed to verify session",
    };
  }
}

/**
 * Require authentication middleware.
 * Wraps an API route handler and ensures the user is authenticated.
 * Returns 401 if not authenticated, otherwise calls the handler with the user info.
 */
export function requireAuth(handler: (req: NextRequest, user: { id: string; email?: string }) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: "Authentication required", detail: auth.error },
        { status: 401 }
      );
    }
    return handler(request, { id: auth.userId!, email: auth.userEmail });
  };
}
