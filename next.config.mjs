/**
 * The CSP here deliberately omits `default-src`/`script-src`. Next.js injects
 * inline bootstrap scripts, so locking those down needs per-request nonces
 * rather than a static header. The directives that are set cost nothing and
 * close the gaps that matter for a passcode-gated app: it cannot be framed,
 * its forms cannot be pointed elsewhere, and no plugin content can load.
 */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // The casefile screens use geolocation for the jobsite address; the camera
  // and microphone are still placeholders, so nothing needs them yet.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  agentRules: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
