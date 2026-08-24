"use client";

import { CAPTURE_PHOTOS } from "@/lib/data";
import { useSherlock } from "@/lib/store";
import { ImageSlot } from "./ImageSlot";

export function CaptureTab() {
  const {
    captureStep,
    captureEmployer,
    caseEmployers,
    nudgeDismissed,
    shutter,
    dismissNudge,
    toggleCaptureEmployer,
    applyTagsToUntagged,
  } = useSherlock();

  if (captureStep === 0) {
    return (
      <div className="sh-measure">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--space-3)",
            padding: "var(--space-6) 0",
            textAlign: "center",
          }}
        >
          <p className="sh-meta">No evidence captured yet.</p>
          <button type="button" className="sh-shutter" onClick={shutter} aria-label="Capture photo" />
          <p className="sh-meta" style={{ fontSize: 12 }}>
            Tap to take a photo
          </p>
        </div>
      </div>
    );
  }

  const captured = CAPTURE_PHOTOS.slice(0, captureStep);
  const lastTags = captureEmployer[captureStep - 1] ?? [];
  const untaggedCount = captured.filter((_, i) => !(captureEmployer[i] ?? []).length).length;
  const nudgeVisible = captureStep === 1 && !nudgeDismissed;
  const atLimit = captureStep >= CAPTURE_PHOTOS.length;

  return (
    <div className="sh-measure">
      <div className="sh-kicker">
        {captureStep} {captureStep === 1 ? "photo captured" : "photos captured"}
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
          onClick={shutter}
          disabled={atLimit}
          aria-label={atLimit ? "All demo photos captured" : "Capture photo"}
        />
      </div>

      {nudgeVisible && (
        <div className="card elev-md" style={{ marginBottom: "var(--space-4)" }}>
          <div className="card-kicker">Suggested by Sherlock</div>
          <p className="card-body" style={{ opacity: 0.85, fontSize: 14 }}>
            Roof work at height. Should you take another photo showing the distance to grade and the
            leading edge?
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={dismissNudge}>
              Not now
            </button>
            <button type="button" className="btn btn-primary" onClick={shutter}>
              Add another
            </button>
          </div>
        </div>
      )}

      {untaggedCount > 0 && lastTags.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            flexWrap: "wrap",
            marginBottom: "var(--space-4)",
          }}
        >
          <span className="sh-meta" style={{ fontSize: 13 }}>
            {untaggedCount} {untaggedCount === 1 ? "photo untagged" : "photos untagged"}
          </span>
          <button type="button" className="btn btn-secondary" onClick={applyTagsToUntagged}>
            Apply latest tags to untagged
          </button>
        </div>
      )}

      <div className="sh-list">
        {captured.map((p, idx) => {
          const tags = (captureEmployer[idx] ?? [])
            .map((id) => caseEmployers.find((c) => c.id === id)?.label)
            .filter((l): l is string => Boolean(l));
          return (
            <div className="sh-row" style={{ alignItems: "flex-start", gap: "var(--space-3)" }} key={p.code}>
              <div className="sh-thumb" style={{ width: 88, height: 88, flex: "none" }}>
                <ImageSlot label={p.code} variant="construction" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                  <span className="tag tag-neutral">{p.code}</span>
                  <span className="sh-row-title" style={{ fontSize: 14 }}>
                    {p.label}
                  </span>
                </div>
                <p className="sh-meta" style={{ fontSize: 13, lineHeight: 1.5, margin: "0 0 8px" }}>
                  {p.description}
                </p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {caseEmployers.map((ce) => {
                    const active = (captureEmployer[idx] ?? []).includes(ce.id);
                    return (
                      <button
                        type="button"
                        key={ce.id}
                        className={`sh-pillbtn ${active ? "active" : ""}`}
                        aria-pressed={active}
                        onClick={() => toggleCaptureEmployer(idx, ce.id)}
                      >
                        {ce.label}
                      </button>
                    );
                  })}
                  {!tags.length && (
                    <span className="sh-meta" style={{ fontSize: 12, alignSelf: "center" }}>
                      No employer tagged yet
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
