import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * Everything except Next's own static output goes through the gate, so a new
 * route is protected the moment it is added. The exclusions are anchored —
 * an unanchored `favicon.ico` would also exempt `/favicon.icoXYZ`.
 *
 * Next 16 renamed this convention from `middleware` to `proxy`; it always runs
 * on the Node.js runtime, which is why lib/auth.ts sticks to Web Crypto.
 */
export const config = {
  matcher: ["/((?!_next/static/|_next/image/|favicon\\.ico$).*)"],
};

const PUBLIC_PATHS = new Set(["/login", "/api/login"]);

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  const secret = process.env.AUTH_SECRET?.trim();
  // Trimmed so that a whitespace-only value counts as unset. Left untrimmed it
  // is truthy here but collapses to "" at the comparison in /api/login, which
  // would hand a session to anyone submitting an empty passcode.
  const passcode = process.env.APP_PASSCODE?.trim();

  // Fail closed: a missing passcode must never mean an open app.
  if (!secret || !passcode) {
    return new NextResponse("Service unavailable.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
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
