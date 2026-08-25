"use client";

import { useSherlock } from "@/lib/store";
import { ImageSlot } from "./ImageSlot";

export function ScanTab() {
  const { scanPages, scanPage, setScanPageText } = useSherlock();

  return (
    <div className="sh-measure">
      <div className="sh-kicker">
        {scanPages.length} {scanPages.length === 1 ? "page scanned" : "pages scanned"}
      </div>

      <div
        className="sh-viewer"
        style={{
          background: "var(--color-neutral-800)",
          borderRadius: "var(--radius-lg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "var(--space-4)",
          position: "relative",
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="var(--color-neutral-500)" aria-hidden="true">
          <path
            opacity="0.5"
            d="M9 4l-1.5 2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.5L15 4z"
          />
          <circle cx="12" cy="13" r="4" />
        </svg>
        <button
          type="button"
          className="sh-shutter"
          style={{ position: "absolute", bottom: 14 }}
          onClick={scanPage}
          aria-label="Scan page"
        />
      </div>

      {scanPages.length === 0 ? (
        <p className="sh-meta">No pages scanned yet. Tap the shutter to scan a notebook page.</p>
      ) : (
        <div className="sh-list">
          {scanPages.map((page) => (
            <div className="sh-row" style={{ alignItems: "flex-start", gap: "var(--space-3)" }} key={page.id}>
              <div className="sh-thumb" style={{ width: 88, height: 88, flex: "none" }}>
                <ImageSlot label={`SN-${page.id}`} variant="notes" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                  <span className="tag tag-neutral">SN-{page.id}</span>
                  <span className="sh-row-title" style={{ fontSize: 14 }}>
                    Scanned page
                  </span>
                </div>
                <label className="sh-meta" htmlFor={`scan-text-${page.id}`} style={{ fontSize: 12 }}>
                  Scanned text — edit if the scan isn&apos;t quite right
                </label>
                <textarea
                  id={`scan-text-${page.id}`}
                  className="input"
                  rows={4}
                  value={page.text}
                  onChange={(e) => setScanPageText(page.id, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
