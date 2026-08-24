"use client";

import { CAPTURE_PHOTOS } from "@/lib/data";
import { useSherlock } from "@/lib/store";
import { ImageSlot } from "./ImageSlot";

export function CaptureTab() {
  const {
    captureStep,
    captureEmployer,
    selectedCapture,
    caseEmployers,
    nudgeDismissed,
    shutter,
    dismissNudge,
    selectCapture,
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
  /* A stale selection (from a shorter session) falls back to the newest shot. */
  const selIdx =
    selectedCapture !== null && selectedCapture < captureStep ? selectedCapture : captureStep - 1;
  const selPhoto = captured[selIdx];
  const selTags = (captureEmployer[selIdx] ?? [])
    .map((id) => caseEmployers.find((c) => c.id === id)?.label)
    .filter((l): l is string => Boolean(l));
  const untaggedCount = captured.filter((_, i) => !(captureEmployer[i] ?? []).length).length;
  const nudgeVisible = captureStep === 1 && !nudgeDismissed;
  const atLimit = captureStep >= CAPTURE_PHOTOS.length;

  return (
    <div className="sh-cols">
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
          <div className="card elev-md">
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
      </div>

      <div className="sh-measure">
        <div className="sh-grid">
          {captured.map((p, idx) => {
            const tags = captureEmployer[idx] ?? [];
            return (
              <button
                type="button"
                className={`sh-capcell ${idx === selIdx ? "sel" : ""}`}
                onClick={() => selectCapture(idx)}
                aria-label={`Edit employer tags for ${p.code}`}
                key={p.code}
              >
                <div className="sh-thumb" style={{ width: "100%", height: "100%" }}>
                  <ImageSlot label={p.code} variant="construction" />
                </div>
                <span className="sh-capfoot">
                  <span>{p.code}</span>
                  <span
                    style={{
                      padding: "2px 4px",
                      borderRadius: 999,
                      background: tags.length ? "var(--color-accent)" : "var(--color-accent-2)",
                    }}
                  >
                    {tags.length ? String(tags.length) : "!"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {selPhoto && (
          <div className="sh-section">
            <div className="sh-kicker">
              Employers on {selPhoto.code} — tap a photo&rsquo;s tag bar to retag it
            </div>
            <p className="sh-meta" style={{ fontSize: 13, margin: "0 0 var(--space-2)" }}>
              {(selTags.length ? selTags.join(" + ") : "No employer tagged yet") + " · " + selPhoto.label}
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {caseEmployers.map((ce) => {
                const active = (captureEmployer[selIdx] ?? []).includes(ce.id);
                return (
                  <button
                    type="button"
                    key={ce.id}
                    className={`sh-pillbtn ${active ? "active" : ""}`}
                    aria-pressed={active}
                    onClick={() => toggleCaptureEmployer(selIdx, ce.id)}
                  >
                    {ce.label}
                  </button>
                );
              })}
            </div>
            {untaggedCount > 0 && selTags.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-3)",
                  flexWrap: "wrap",
                  marginTop: "var(--space-3)",
                }}
              >
                <span className="sh-meta" style={{ fontSize: 13 }}>
                  {untaggedCount} {untaggedCount === 1 ? "photo untagged" : "photos untagged"}
                </span>
                <button type="button" className="btn btn-secondary" onClick={applyTagsToUntagged}>
                  Apply these tags to untagged
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
