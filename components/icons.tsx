/** Interface icons, drawn in the duotone manner the design system specifies. */

const box = { width: 18, height: 18, viewBox: "0 0 24 24" } as const;

export function PlusIcon() {
  return (
    <svg {...box} fill="currentColor" aria-hidden="true">
      <path d="M11 5a1 1 0 1 1 2 0v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6z" />
    </svg>
  );
}

export function BackIcon() {
  return (
    <svg {...box} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M4 12l6-8M4 12l6 8M4 12h16" />
    </svg>
  );
}

export function ProfileIcon() {
  return (
    <svg {...box} fill="currentColor" aria-hidden="true">
      <path opacity="0.35" d="M4 21a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

export function CameraIcon() {
  return (
    <svg {...box} fill="currentColor" aria-hidden="true">
      <path opacity="0.35" d="M9 4l-1.5 2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.5L15 4z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export function NoteIcon() {
  return (
    <svg {...box} fill="currentColor" aria-hidden="true">
      <path opacity="0.35" d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
      <path d="M8 12h8v1.5H8zM8 15h8v1.5H8zM8 9h5v1.5H8z" />
    </svg>
  );
}

export function ScanIcon() {
  return (
    <svg {...box} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M4 4h4M4 4v4M20 4h-4M20 4v4M4 20h4M4 20v-4M20 20h-4M20 20v-4" />
    </svg>
  );
}

export function FolderIcon() {
  return (
    <svg {...box} fill="currentColor" aria-hidden="true">
      <path opacity="0.35" d="M2 5a2 2 0 0 1 2-2h4l2 2h10a2 2 0 0 1 2 2v1H2z" />
      <path d="M2 8h20v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" />
    </svg>
  );
}

export function ReportIcon() {
  return (
    <svg {...box} fill="currentColor" aria-hidden="true">
      <path opacity="0.35" d="M5 3h11l4 4v14H5z" />
      <path d="M8 13h8v1.5H8zM8 16h8v1.5H8zM8 10h5v1.5H8z" />
    </svg>
  );
}

export function GraphIcon() {
  return (
    <svg {...box} fill="currentColor" aria-hidden="true">
      <path opacity="0.35" d="M4 4h6v6H4zM14 14h6v6h-6z" />
      <path d="M9.2 8.6l6.2 6.2-1.1 1.1-6.2-6.2z" />
    </svg>
  );
}

export function RequestIcon() {
  return (
    <svg {...box} fill="currentColor" aria-hidden="true">
      <path opacity="0.35" d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
      <path d="M9 15.5l2 2 4.5-4.5-1.1-1.1L11 15.3l-.9-.9z" />
    </svg>
  );
}

export function UploadIcon() {
  return (
    <svg {...box} fill="currentColor" aria-hidden="true">
      <path opacity="0.35" d="M4 16h2v3h12v-3h2v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M11 4.6l-4.2 4.2 1.1 1.1L11 6.8V16h2V6.8l3.1 3.1 1.1-1.1z" />
    </svg>
  );
}

export function MoreIcon() {
  return (
    <svg {...box} fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

/** Two overlapping pages, outlined — the back page's first text line runs into the front page. */
export function CopyIcon() {
  return (
    <svg
      {...box}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.5 17.5h-7v-16h9l3 3v2" />
      <path d="M11.5 1.5v3h3M5 6.5h4.5M5 10h4.5M5 13.5h4.5" />
      <path d="M9.5 6.5h9l3 3v13h-12z" />
      <path d="M18.5 6.5v3h3M12 12.5h4.5M18 12.5h1M12 16h7M12 19.5h7" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg {...box} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  );
}

/** "AI" in an open rounded square, with a four-point star in the gap at its corner. */
export function AiIcon() {
  return (
    <svg {...box} fill="none" aria-hidden="true">
      <path
        d="M20 12V7a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v9a4 4 0 0 0 4 4h5"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="round"
      />
      <path
        d="M8 15.5l2.5-7 2.5 7M9 13h3M15.5 8.5v7"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 14q.7 3.8 4.5 4.5-3.8.7-4.5 4.5-.7-3.8-4.5-4.5 3.8-.7 4.5-4.5z"
        fill="currentColor"
      />
    </svg>
  );
}

export function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path opacity="0.35" d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z" />
      <path d="M6 11h1.5a4.5 4.5 0 0 0 9 0H18a6 6 0 0 1-5.25 5.95V20h2.75v1.5h-7V20h2.75v-3.05A6 6 0 0 1 6 11z" />
    </svg>
  );
}
