import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  safeEqual,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 8;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;

/**
 * Per-instance throttle. Serverless instances come and go, so this is friction
 * against casual guessing rather than a hard limit — the real defence is a
 * passcode long enough not to be guessed. Put Vercel's WAF rate limiting in
 * front of this route if you want a durable ceiling.
 */
const attempts = new Map<string, { count: number; resetAt: number }>();

function throttle(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_ATTEMPTS;
}

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  const expected = process.env.APP_PASSCODE;

  if (!secret || !expected) {
    return NextResponse.json(
      { error: "Sherlock is not configured. Set APP_PASSCODE and AUTH_SECRET." },
      { status: 503 },
    );
  }

  if (!throttle(clientKey(request))) {
    return NextResponse.json(
      { error: "Too many attempts. Wait a few minutes and try again." },
      { status: 429 },
    );
  }

  let passcode = "";
  try {
    const body = await request.json();
    passcode = typeof body?.passcode === "string" ? body.passcode : "";
  } catch {
    return NextResponse.json({ error: "That passcode was not accepted." }, { status: 400 });
  }

  if (!(await safeEqual(passcode, expected))) {
    return NextResponse.json({ error: "That passcode was not accepted." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: await createSessionToken(secret),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}

/** Lock the app again on this device. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
