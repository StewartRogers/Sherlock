import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * Everything except Next's own static output goes through the gate, so a new
 * route is protected the moment it is added.
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

const PUBLIC_PATHS = new Set(["/login", "/api/login"]);

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  const secret = process.env.AUTH_SECRET;
  const passcode = process.env.APP_PASSCODE;

  // Fail closed: a missing passcode must never mean an open app.
  if (!secret || !passcode) {
    return new NextResponse(
      "Sherlock is not configured. Set APP_PASSCODE and AUTH_SECRET.",
      { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token && (await verifySessionToken(token, secret))) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;

  const response = NextResponse.redirect(url);
  if (token) response.cookies.delete(SESSION_COOKIE);
  return response;
}
