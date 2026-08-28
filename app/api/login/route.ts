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
 * Ceiling on distinct throttle keys held at once. Without it, a caller that
 * varies its forwarded-for header every request grows the map until the
 * instance runs out of memory.
 */
const MAX_TRACKED_CLIENTS = 5_000;

/**
 * Per-instance throttle. Serverless instances come and go, so this is friction
 * against casual guessing rather than a hard limit — the real defence is a
 * passcode long enough not to be guessed. Put Vercel's WAF rate limiting in
 * front of this route if you want a durable ceiling.
 */
const attempts = new Map<string, { count: number; resetAt: number }>();

/** Drop expired buckets so the map cannot grow without bound. */
function sweep(now: number) {
  for (const [key, entry] of attempts) {
    if (now > entry.resetAt) attempts.delete(key);
  }
}

function throttle(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    if (attempts.size >= MAX_TRACKED_CLIENTS) sweep(now);
    // Still full after sweeping: every bucket is live, so refuse rather than
    // keep allocating.
    if (attempts.size >= MAX_TRACKED_CLIENTS) return false;
    attempts.set(key, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_ATTEMPTS;
}

/** A correct passcode should not spend the budget for the next one. */
function clearThrottle(key: string) {
  attempts.delete(key);
}

/**
 * Prefer headers the platform sets itself. `x-forwarded-for` is attacker
 * controlled on any deployment whose front proxy does not overwrite it, and a
 * spoofable key means a fresh attempt budget per request.
 */
function clientKey(request: NextRequest): string {
  const platform =
    request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-real-ip");
  if (platform) return platform.trim();

  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

/**
 * Reject cross-site callers. Same-origin fetches send `Origin`; browsers that
 * send neither header are old enough that the app does not target them.
 */
function sameOrigin(request: NextRequest): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site) return site === "same-origin" || site === "none";

  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.AUTH_SECRET?.trim();
  // Trimmed here as well as at the comparison: a passcode of nothing but
  // whitespace is truthy, but trims to "" and would then match an empty
  // submission — a misconfiguration that opens the app rather than closing it.
  const expected = process.env.APP_PASSCODE?.trim();

  if (!secret || !expected) {
    // Deliberately vague: an unauthenticated caller has no business learning
    // which variable is missing.
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }

  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "That passcode was not accepted." }, { status: 403 });
  }

  const key = clientKey(request);
  if (!throttle(key)) {
    return NextResponse.json(
      { error: "Too many attempts. Wait a few minutes and try again." },
      { status: 429 },
    );
  }

  let passcode = "";
  try {
    const body = await request.json();
    // Trimmed because the passcode is meant to be pasted, and a paste routinely
    // carries a trailing space or newline. Both sides are trimmed so a stray
    // space in the dashboard value cannot lock everyone out either.
    passcode = typeof body?.passcode === "string" ? body.passcode.trim() : "";
  } catch {
    return NextResponse.json({ error: "That passcode was not accepted." }, { status: 400 });
  }

  if (!passcode || !(await safeEqual(passcode, expected))) {
    return NextResponse.json({ error: "That passcode was not accepted." }, { status: 401 });
  }

  clearThrottle(key);

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
export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
