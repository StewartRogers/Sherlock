"use client";

import { useSherlock } from "@/lib/store";
import { ImageSlot } from "./ImageSlot";

export function ScanTab() {
  const { scanPageCount, scanNotes, scanPage, setScanNotes } = useSherlock();

  return (
    <div className="sh-measure">
      <div className="sh-kicker">
        {scanPageCount} {scanPageCount === 1 ? "page scanned" : "pages scanned"}
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

      {scanPageCount > 0 && (
        <div className="sh-grid" style={{ marginBottom: "var(--space-4)" }}>
          {Array.from({ length: scanPageCount }, (_, i) => (
            <div key={i} style={{ aspectRatio: "1", position: "relative" }}>
              <div className="sh-thumb" style={{ width: "100%", height: "100%" }}>
                <ImageSlot label={`page ${i + 1}`} />
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 4,
                  left: 4,
                  fontSize: 10,
                  color: "#fff",
                  background: "rgba(0,0,0,0.55)",
                  padding: "1px 5px",
                  borderRadius: 6,
                }}
              >
                {i + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="field">
        <label htmlFor="scan-notes">Notes</label>
        <textarea
          id="scan-notes"
          className="input"
          rows={6}
          value={scanNotes}
          onChange={(e) => setScanNotes(e.target.value)}
          placeholder="Type or add notes from the scanned pages here — keep adding as you scan more"
        />
      </div>
    </div>
  );
}
