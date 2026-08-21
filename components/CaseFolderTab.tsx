"use client";

import { CAPTURE_PHOTOS, CASE_EVIDENCE, NEW_CASE_STAMP, TYPE_TAG } from "@/lib/data";
import { useSherlock } from "@/lib/store";
import { ImageSlot } from "./ImageSlot";

/** Evidence carried over from earlier in the inspection, before this session. */
const CARRIED_PHOTOS = 7;
const CARRIED_NOTES = 4;

export function CaseFolderTab() {
  const { caseEmployers, captureStep, notes, primaryMap, employerForSlot, setPrimary } =
    useSherlock();

  const photoCount = captureStep + CARRIED_PHOTOS;
  const noteCount = notes.length + CARRIED_NOTES;
  const openCount = CASE_EVIDENCE.filter((e) => e.type === "open").length;

  /* The report's exhibit picker always shows at least the seeded five. */
  const draftPhotos = CAPTURE_PHOTOS.slice(0, Math.max(captureStep, 5));

  return (
    <div>
      <div className="sh-kicker">Casefile · Active</div>
      <h2 className="sh-title">Meridian Townhomes</h2>
      <p className="sh-meta">
        {NEW_CASE_STAMP.address} · {NEW_CASE_STAMP.timestamp}
      </p>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: "var(--space-3)" }}>
        {caseEmployers.map((ce) => (
          <span className="tag tag-accent" key={ce.id}>
            {ce.label}
          </span>
        ))}
      </div>

      <div className="sh-stats sh-section">
        <div>
          <div className="sh-stat-num">{photoCount}</div>
          <div className="sh-stat-label">Photos</div>
        </div>
        <div>
          <div className="sh-stat-num">{noteCount}</div>
          <div className="sh-stat-label">Notes</div>
        </div>
        <div>
          <div className="sh-stat-num" style={{ color: "var(--color-accent-2)" }}>
            {openCount}
          </div>
          <div className="sh-stat-label">Open</div>
        </div>
      </div>

      <div className="sh-section">
        <div className="sh-kicker">Evidence</div>
        <div className="sh-list">
          {CASE_EVIDENCE.map((e, idx) => {
            const employer = employerForSlot(e.employer);
            const employerLabel = employer?.label ?? "Unassigned";
            const employerCls = employer
              ? `tag ${caseEmployers.indexOf(employer) === 1 ? "tag-accent-2" : "tag-accent"}`
              : "tag tag-neutral";
            const tt = TYPE_TAG[e.type];
            return (
              <div className="sh-row" key={`${e.code}-${idx}`}>
                <div className="sh-thumb" style={{ width: 44, height: 44, flex: "none" }}>
                  <ImageSlot label={e.code} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="sh-row-title" style={{ fontSize: 14 }}>
                    {e.label}
                  </div>
                  <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
                    <span className="tag tag-neutral">{e.code}</span>
                    <span className={employerCls}>{employerLabel}</span>
                    <span className={tt.cls}>{tt.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sh-section">
        <div className="sh-kicker">Evidence — primary / secondary</div>
        <div className="sh-list">
          {draftPhotos.map((p) => {
            const primary = !!primaryMap[p.code];
            return (
              <div className="sh-row" key={p.code}>
                <div className="sh-thumb" style={{ width: 40, height: 40, flex: "none" }}>
                  <ImageSlot label={p.code} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "var(--color-accent)" }}>{p.code}</div>
                  <div className="sh-row-title" style={{ fontSize: 14 }}>
                    {p.label}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4, flex: "none" }} role="group" aria-label={`${p.code} exhibit rank`}>
                  <button
                    type="button"
                    className={`sh-pillbtn ${primary ? "active" : ""}`}
                    aria-pressed={primary}
                    onClick={() => setPrimary(p.code, true)}
                  >
                    Primary
                  </button>
                  <button
                    type="button"
                    className={`sh-pillbtn ${!primary ? "active" : ""}`}
                    aria-pressed={!primary}
                    onClick={() => setPrimary(p.code, false)}
                  >
                    Secondary
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
