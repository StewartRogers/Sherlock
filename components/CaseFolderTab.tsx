"use client";

import { useState } from "react";
import { CASE_EVIDENCE, NEW_CASE_STAMP, TYPE_TAG } from "@/lib/data";
import { useSherlock } from "@/lib/store";
import type { Employer, Note } from "@/lib/types";
import { EvidenceThumb, EvidenceViewerOverlay, type EvidenceViewItem } from "./EvidenceViewer";

/** Evidence carried over from earlier in the inspection, before this session. */
const CARRIED_PHOTOS = 7;
const CARRIED_NOTES = 4;

function ChevronIcon() {
  return (
    <svg className="sh-collapse-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function truncateWords(text: string, n: number): { shown: string; isLong: boolean } {
  const words = text.trim().split(/\s+/);
  if (words.length <= n) return { shown: text, isLong: false };
  return { shown: words.slice(0, n).join(" ") + "…", isLong: true };
}

type SectionKey = "photos" | "notes" | "requests" | "scans";

function NoteRows({
  items,
  caseEmployers,
  expandedNotes,
  onToggle,
}: {
  items: Note[];
  caseEmployers: Employer[];
  expandedNotes: Set<number>;
  onToggle: (id: number) => void;
}) {
  return (
    <div className="sh-list">
      {items.map((n) => {
        const isExpanded = expandedNotes.has(n.id);
        const { shown, isLong } = truncateWords(n.text, 25);
        const employerLabels = n.employers.length
          ? n.employers
              .map((id) => caseEmployers.find((ce) => ce.id === id)?.label)
              .filter(Boolean)
              .join(", ")
          : "Unassigned";
        return (
          <div className="sh-row" key={n.id} style={{ flexDirection: "column", alignItems: "stretch", gap: 4 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
              <span className={n.kind === "request" ? "tag tag-accent-2" : "tag tag-neutral"}>{n.code}</span>
              <div style={{ fontSize: 14, flex: 1 }}>
                {isExpanded ? n.text : shown}
                {isLong && (
                  <button
                    type="button"
                    className="sh-linkbtn"
                    style={{ marginLeft: 6 }}
                    onClick={() => onToggle(n.id)}
                  >
                    {isExpanded ? "Less" : "More"}
                  </button>
                )}
              </div>
            </div>
            <div className="sh-row-meta">{employerLabels}</div>
          </div>
        );
      })}
    </div>
  );
}

export function CaseFolderTab() {
  const {
    caseEmployers,
    caseAddress,
    captureStep,
    notes,
    scanPages,
    primaryMap,
    employerForSlot,
    setPrimary,
  } = useSherlock();

  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    photos: true,
    notes: true,
    requests: true,
    scans: true,
  });
  const [viewing, setViewing] = useState<EvidenceViewItem | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());

  const noteItems = notes.filter((n) => n.kind !== "request");
  const requestItems = notes.filter((n) => n.kind === "request");

  const photoCount = captureStep + CARRIED_PHOTOS;
  const noteCount = notes.length + CARRIED_NOTES;
  const openCount = CASE_EVIDENCE.filter((e) => e.type === "open").length;

  function toggleSection(key: SectionKey) {
    setOpen((s) => ({ ...s, [key]: !s[key] }));
  }

  function toggleNoteExpanded(id: number) {
    setExpandedNotes((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const viewingCode = viewing?.code ?? null;
  const viewingEvidence = viewingCode ? CASE_EVIDENCE.find((e) => e.code === viewingCode) : undefined;

  return (
    <div>
      <div className="sh-kicker">Casefile · Active</div>
      <h2 className="sh-title">Meridian Townhomes</h2>
      <p className="sh-meta">
        {caseAddress} · {NEW_CASE_STAMP.timestamp}
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

      {/* — Photos — */}
      <div className="sh-section">
        <button
          type="button"
          className="sh-collapse-head"
          aria-expanded={open.photos}
          onClick={() => toggleSection("photos")}
        >
          <span className="sh-kicker" style={{ margin: 0 }}>
            Photos · {CASE_EVIDENCE.length}
          </span>
          <ChevronIcon />
        </button>
        {open.photos && (
          <div className="sh-list">
            {CASE_EVIDENCE.map((e) => (
              <div className="sh-row" style={{ alignItems: "flex-start", gap: "var(--space-3)" }} key={e.code}>
                <EvidenceThumb
                  size={80}
                  item={{ code: e.code, label: e.label, variant: "construction", meta: e.description }}
                  onOpen={setViewing}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                    <span className="tag tag-neutral">{e.code}</span>
                    <span className="sh-row-title" style={{ fontSize: 14 }}>
                      {e.label}
                    </span>
                  </div>
                  <p className="sh-meta" style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                    {e.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* — Scanned notes — */}
      <div className="sh-section">
        <button
          type="button"
          className="sh-collapse-head"
          aria-expanded={open.scans}
          onClick={() => toggleSection("scans")}
        >
          <span className="sh-kicker" style={{ margin: 0 }}>
            Scanned notes · {scanPages.length}
          </span>
          <ChevronIcon />
        </button>
        {open.scans &&
          (scanPages.length === 0 ? (
            <p className="sh-meta">No pages scanned yet.</p>
          ) : (
            <div className="sh-list">
              {scanPages.map((page) => (
                <div className="sh-row" style={{ alignItems: "flex-start", gap: "var(--space-3)" }} key={page.id}>
                  <EvidenceThumb
                    size={80}
                    item={{ code: `Page ${page.id}`, label: `Scanned page ${page.id}`, variant: "notes", meta: page.text }}
                    onOpen={setViewing}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="sh-row-title" style={{ fontSize: 14, marginBottom: 4 }}>
                      Page {page.id}
                    </div>
                    <p className="sh-meta" style={{ fontSize: 13, lineHeight: 1.5, margin: 0, whiteSpace: "pre-wrap" }}>
                      {page.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))}
      </div>

      {/* — Notes — */}
      <div className="sh-section">
        <button
          type="button"
          className="sh-collapse-head"
          aria-expanded={open.notes}
          onClick={() => toggleSection("notes")}
        >
          <span className="sh-kicker" style={{ margin: 0 }}>
            Notes · {noteItems.length}
          </span>
          <ChevronIcon />
        </button>
        {open.notes &&
          (noteItems.length === 0 ? (
            <p className="sh-meta">No notes yet.</p>
          ) : (
            <NoteRows
              items={noteItems}
              caseEmployers={caseEmployers}
              expandedNotes={expandedNotes}
              onToggle={toggleNoteExpanded}
            />
          ))}
      </div>

      {/* — Requests — */}
      <div className="sh-section">
        <button
          type="button"
          className="sh-collapse-head"
          aria-expanded={open.requests}
          onClick={() => toggleSection("requests")}
        >
          <span className="sh-kicker" style={{ margin: 0 }}>
            Requests · {requestItems.length}
          </span>
          <ChevronIcon />
        </button>
        {open.requests &&
          (requestItems.length === 0 ? (
            <p className="sh-meta">No requests yet.</p>
          ) : (
            <NoteRows
              items={requestItems}
              caseEmployers={caseEmployers}
              expandedNotes={expandedNotes}
              onToggle={toggleNoteExpanded}
            />
          ))}
      </div>

      <EvidenceViewerOverlay item={viewing} onClose={() => setViewing(null)}>
        {viewingEvidence && (
          <>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: "var(--space-2)" }}>
              <span className="tag tag-neutral">
                {employerForSlot(viewingEvidence.employer)?.label ?? "Unassigned"}
              </span>
              <span className={TYPE_TAG[viewingEvidence.type].cls}>{TYPE_TAG[viewingEvidence.type].label}</span>
            </div>
            <div
              style={{ display: "flex", gap: 4, marginTop: "var(--space-3)" }}
              role="group"
              aria-label={`${viewingEvidence.code} exhibit rank`}
            >
              <button
                type="button"
                className={`sh-pillbtn ${primaryMap[viewingEvidence.code] ? "active" : ""}`}
                aria-pressed={!!primaryMap[viewingEvidence.code]}
                onClick={() => setPrimary(viewingEvidence.code, true)}
              >
                Primary
              </button>
              <button
                type="button"
                className={`sh-pillbtn ${!primaryMap[viewingEvidence.code] ? "active" : ""}`}
                aria-pressed={!primaryMap[viewingEvidence.code]}
                onClick={() => setPrimary(viewingEvidence.code, false)}
              >
                Secondary
              </button>
            </div>
          </>
        )}
      </EvidenceViewerOverlay>
    </div>
  );
}
