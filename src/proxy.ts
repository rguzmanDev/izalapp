import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/registro"];

// Optimistic check only: pages and Server Actions still validate the session via requireUser().
export function proxy(request: NextRequest) {
  const isPublic = PUBLIC_PATHS.includes(request.nextUrl.pathname);
  if (isPublic || getSessionCookie(request)) return NextResponse.next();

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|icon|apple-icon).*)",
  ],
};
