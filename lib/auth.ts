/**
 * Passcode gate — shared session helpers.
 *
 * Runs in both the Edge middleware and Node route handlers, so everything here
 * uses Web Crypto and nothing from `node:*`.
 *
 * The cookie holds `<payload>.<signature>`: an expiry stamp signed with
 * AUTH_SECRET. The passcode itself is never written to the cookie, and the
 * signature means a visitor cannot mint a session without the secret.
 */

export const SESSION_COOKIE = "sherlock_session";

/** How long a passcode entry is good for before it has to be typed again. */
export const SESSION_TTL_SECONDS = 60 * 60 * 12;

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmac(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toBase64Url(new Uint8Array(signature));
}

/**
 * Constant-time comparison. Both sides are hashed first so that unequal
 * lengths do not leak through the comparison loop.
 */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [left, right] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(a)),
    crypto.subtle.digest("SHA-256", encoder.encode(b)),
  ]);
  const x = new Uint8Array(left);
  const y = new Uint8Array(right);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export async function createSessionToken(secret: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = toBase64Url(encoder.encode(JSON.stringify({ exp })));
  return `${payload}.${await hmac(payload, secret)}`;
}

export async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if (!(await safeEqual(signature, await hmac(payload, secret)))) return false;

  try {
    const claims = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    return typeof claims?.exp === "number" && claims.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

/**
 * Only same-origin, non-protocol-relative paths may be used as a post-login
 * destination — otherwise `?next=` becomes an open redirect.
 */
export function safeRedirectPath(value: string | null | undefined): string {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}
