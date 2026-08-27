"use client";

import { useState } from "react";
import {
  CARRIED_NOTES,
  CARRIED_PHOTOS,
  CASE_EVIDENCE,
  fileExtLabel,
  formatBytes,
  NEW_CASE_STAMP,
  TYPE_TAG,
} from "@/lib/data";
import { useSherlock } from "@/lib/store";
import type { Employer, Note } from "@/lib/types";
import { ChatOverlay } from "./ChatOverlay";
import { EvidenceThumb, EvidenceViewerOverlay, type EvidenceViewItem } from "./EvidenceViewer";

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

type SectionKey = "photos" | "notes" | "requests" | "scans" | "documents";

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
    documents,
    primaryMap,
    employerForSlot,
    setPrimary,
    chatMessages,
    sendChatQuestion,
    reportDocs,
    defaultDoc,
    setTab,
    setReportEmployer,
  } = useSherlock();

  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    photos: true,
    notes: true,
    requests: true,
    scans: true,
    documents: true,
  });
  const [viewing, setViewing] = useState<EvidenceViewItem | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());

  const noteItems = notes.filter((n) => n.kind !== "request");
  const requestItems = notes.filter((n) => n.kind === "request");

  const photoCount = captureStep + CARRIED_PHOTOS;
  const noteCount = notes.length + CARRIED_NOTES;

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

  /** Jumps to whatever a chat answer's source code points at. */
  function handleSourceClick(code: string) {
    const evidence = CASE_EVIDENCE.find((e) => e.code === code);
    if (evidence) {
      setOpen((s) => ({ ...s, photos: true }));
      setViewing({ code: evidence.code, label: evidence.label, variant: "construction", meta: evidence.description });
      return;
    }
    const scan = scanPages.find((p) => `SN-${p.id}` === code);
    if (scan) {
      setOpen((s) => ({ ...s, scans: true }));
      setViewing({ code, label: "Scanned page", variant: "notes", meta: scan.text });
      return;
    }
    const doc = documents.find((d) => d.code === code);
    if (doc) {
      setOpen((s) => ({ ...s, documents: true }));
      setViewing({ code: doc.code, label: doc.name, variant: "placeholder", meta: formatBytes(doc.size) });
      return;
    }
    const note = notes.find((n) => n.code === code);
    if (note) {
      setOpen((s) => ({ ...s, [note.kind === "request" ? "requests" : "notes"]: true }));
      setExpandedNotes((s) => new Set(s).add(note.id));
      return;
    }
    if (/^(ORD|RR)-/.test(code)) {
      for (const ce of caseEmployers) {
        const doc = reportDocs[ce.id] ?? defaultDoc(ce.id, caseEmployers);
        if (doc.orders.some((o) => o.code === code) || doc.refs.some((r) => r.code === code)) {
          setReportEmployer(ce.id);
          break;
        }
      }
      setTab("report");
    }
  }

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

      <div className="sh-stats sh-section" style={{ flexWrap: "wrap" }}>
        <div>
          <div className="sh-stat-num">{photoCount}</div>
          <div className="sh-stat-label">Photos</div>
        </div>
        <div>
          <div className="sh-stat-num">{noteCount}</div>
          <div className="sh-stat-label">Notes</div>
        </div>
        <div>
          <div className="sh-stat-num">{requestItems.length}</div>
          <div className="sh-stat-label">Requests</div>
        </div>
        <div>
          <div className="sh-stat-num">{scanPages.length}</div>
          <div className="sh-stat-label">Scanned notes</div>
        </div>
        <div>
          <div className="sh-stat-num">{documents.length}</div>
          <div className="sh-stat-label">Documents</div>
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
                    item={{ code: `SN-${page.id}`, label: "Scanned page", variant: "notes", meta: page.text }}
                    onOpen={setViewing}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                      <span className="tag tag-neutral">SN-{page.id}</span>
                      <span className="sh-row-title" style={{ fontSize: 14 }}>
                        Scanned page
                      </span>
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

      {/* — Uploaded documents — */}
      <div className="sh-section">
        <button
          type="button"
          className="sh-collapse-head"
          aria-expanded={open.documents}
          onClick={() => toggleSection("documents")}
        >
          <span className="sh-kicker" style={{ margin: 0 }}>
            Documents · {documents.length}
          </span>
          <ChevronIcon />
        </button>
        {open.documents &&
          (documents.length === 0 ? (
            <p className="sh-meta">No documents uploaded yet.</p>
          ) : (
            <div className="sh-list">
              {documents.map((d) => {
                const employerLabels = d.employers.length
                  ? d.employers
                      .map((id) => caseEmployers.find((ce) => ce.id === id)?.label)
                      .filter(Boolean)
                      .join(", ")
                  : "Unassigned";
                return (
                  <div
                    className="sh-row"
                    style={{ alignItems: "flex-start", gap: "var(--space-3)" }}
                    key={d.id}
                  >
                    <EvidenceThumb
                      size={80}
                      item={{ code: fileExtLabel(d.name), label: d.name, variant: "placeholder", meta: formatBytes(d.size) }}
                      onOpen={setViewing}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                        <span className="tag tag-neutral">{d.code}</span>
                        <span
                          className="sh-row-title"
                          style={{ fontSize: 14, overflowWrap: "break-word" }}
                        >
                          {d.name}
                        </span>
                      </div>
                      <p className="sh-meta" style={{ fontSize: 13, margin: 0 }}>
                        {formatBytes(d.size)} · {employerLabels}
                      </p>
                    </div>
                  </div>
                );
              })}
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

      <ChatOverlay messages={chatMessages} onAsk={sendChatQuestion} onSourceClick={handleSourceClick} />
    </div>
  );
}
