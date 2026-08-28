/**
 * Post-login destination handling.
 *
 * Lives apart from lib/auth.ts because the login form is a client component:
 * keeping the signing helpers out of the browser bundle means a future
 * module-level constant in lib/auth.ts can never leak into client JS.
 */

/** Control characters and backslash — see safeRedirectPath. */
const UNSAFE_IN_PATH = /[\u0000-\u001F\u007F\\]/g;

/**
 * Only same-origin paths may be used as a post-login destination.
 *
 * A `startsWith("//")` check on its own is not enough: browsers normalise a
 * backslash to a slash and strip raw tab/newline/carriage-return characters
 * before parsing, so `/\evil.com` and `/<LF>/evil.com` both resolve to
 * `//evil.com` — a cross-origin navigation. Strip those first, then resolve
 * against a throwaway origin and keep only the path.
 */
export function safeRedirectPath(value: string | null | undefined): string {
  if (!value) return "/";

  const cleaned = value.replace(UNSAFE_IN_PATH, "");
  if (!cleaned.startsWith("/") || cleaned.startsWith("//")) return "/";

  try {
    const base = "https://sherlock.invalid";
    const url = new URL(cleaned, base);
    if (url.origin !== base) return "/";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
}
