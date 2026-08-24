"use client";

import { useId } from "react";

/**
 * Stand-in photography for the prototype's placeholder evidence — there is
 * no real camera, so these fill the thumbnail the way a real capture would.
 * Flat, faceless illustrations by design: no people ever appear in them.
 */

export function ConstructionSitePhoto() {
  const skyId = useId();

  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      style={{ display: "block" }}
      role="presentation"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bcd7e6" />
          <stop offset="100%" stopColor="#e9eff1" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="400" height="300" fill={`url(#${skyId})`} />

      <path
        d="M0 190 L60 165 L130 195 L210 160 L290 192 L400 170 L400 300 L0 300 Z"
        fill="#cdd6c9"
        opacity="0.6"
      />

      <rect x="0" y="248" width="400" height="52" fill="#a9967f" />
      <rect x="0" y="248" width="400" height="6" fill="#94826c" />

      {/* tower crane */}
      <rect x="336" y="70" width="6" height="180" fill="#8a8f95" />
      <rect x="300" y="66" width="98" height="6" fill="#e0a028" />
      <rect x="330" y="60" width="16" height="12" fill="#8a8f95" />
      <line x1="342" y1="72" x2="308" y2="70" stroke="#c9c5c1" strokeWidth="1.5" />
      <line x1="342" y1="72" x2="392" y2="70" stroke="#c9c5c1" strokeWidth="1.5" />
      <rect x="380" y="70" width="14" height="10" fill="#6b645d" />

      {/* building frame under construction */}
      <g stroke="#7d7a76" strokeWidth="5" fill="none">
        <line x1="70" y1="250" x2="70" y2="120" />
        <line x1="130" y1="250" x2="130" y2="110" />
        <line x1="190" y1="250" x2="190" y2="118" />
        <line x1="250" y1="250" x2="250" y2="108" />
        <line x1="70" y1="200" x2="250" y2="200" />
        <line x1="70" y1="150" x2="250" y2="150" />
        <line x1="70" y1="120" x2="190" y2="118" />
      </g>
      <g stroke="#b0aca6" strokeWidth="2.5">
        <line x1="70" y1="250" x2="130" y2="200" />
        <line x1="130" y1="250" x2="70" y2="200" />
        <line x1="130" y1="200" x2="190" y2="150" />
        <line x1="190" y1="200" x2="130" y2="150" />
      </g>

      {/* safety cone */}
      <polygon points="300,250 292,220 308,220" fill="#ed8b00" />
      <rect x="288" y="248" width="24" height="6" fill="#ed8b00" />
      <rect x="293" y="228" width="14" height="4" fill="#fff" opacity="0.85" />

      {/* material stack */}
      <rect x="40" y="236" width="34" height="8" fill="#8c6a45" />
      <rect x="40" y="226" width="34" height="8" fill="#96754e" />
      <rect x="40" y="216" width="34" height="8" fill="#8c6a45" />
    </svg>
  );
}

export function NotesPagePhoto() {
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      style={{ display: "block" }}
      role="presentation"
      aria-hidden="true"
    >
      <rect x="0" y="0" width="400" height="300" fill="#f4f1ea" />
      <line x1="46" y1="0" x2="46" y2="300" stroke="#d9a7a0" strokeWidth="2" />
      {Array.from({ length: 9 }, (_, i) => (
        <line
          key={i}
          x1="0"
          y1={34 + i * 28}
          x2="400"
          y2={34 + i * 28}
          stroke="#c9c5c1"
          strokeWidth="1"
        />
      ))}

      {/* handwriting */}
      <path
        d="M60 26 q10 -14 20 0 q10 -14 20 0 q10 -14 20 0 q10 -14 20 0"
        stroke="#453f39"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M60 54 q8 -10 16 0 q8 -10 16 0 q8 -10 16 0 q8 -10 16 0 q8 -10 16 0 q8 -10 16 0"
        stroke="#6b645d"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.65"
      />
      <path
        d="M60 82 q8 -10 16 0 q8 -10 16 0 q8 -10 16 0 q8 -10 16 0"
        stroke="#6b645d"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.65"
      />
      <circle cx="58" cy="107" r="3.5" fill="none" stroke="#6399ae" strokeWidth="2" />
      <path
        d="M76 110 q8 -10 16 0 q8 -10 16 0 q8 -10 16 0 q8 -10 16 0 q8 -10 16 0"
        stroke="#6b645d"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.65"
      />
      <circle cx="58" cy="135" r="3.5" fill="none" stroke="#6399ae" strokeWidth="2" />
      <path
        d="M76 138 q8 -10 16 0 q8 -10 16 0 q8 -10 16 0"
        stroke="#6b645d"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.65"
      />
      <path
        d="M60 166 q8 -10 16 0 q8 -10 16 0 q8 -10 16 0 q8 -10 16 0 q8 -10 16 0"
        stroke="#6b645d"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.65"
      />

      {/* pen resting across the page */}
      <g transform="rotate(-22 260 190)">
        <rect x="140" y="184" width="220" height="12" rx="6" fill="#2f2b27" />
        <rect x="140" y="184" width="34" height="12" rx="6" fill="#8c8580" />
        <polygon points="352,184 372,190 352,196" fill="#453f39" />
      </g>
    </svg>
  );
}
