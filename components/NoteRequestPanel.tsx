"use client";

import { useSherlock } from "@/lib/store";
import type { NoteKind } from "@/lib/types";
import { MicIcon } from "./icons";

const WAVE_BARS = [
  { height: 8, delay: "0s" },
  { height: 15, delay: ".15s" },
  { height: 11, delay: ".3s" },
  { height: 16, delay: ".1s" },
  { height: 9, delay: ".25s" },
];

const COPY: Record<
  NoteKind,
  {
    title: string;
    blurb: string;
    codePrefix: string;
    placeholder: string;
    saveLabel: string;
    empty: string;
    listKicker: string;
  }
> = {
  note: {
    title: "Notes",
    blurb: "Speak or type a note, and tag which employer it belongs to.",
    codePrefix: "N-",
    placeholder: "Tap the mic, or type your note here",
    saveLabel: "Save note",
    empty: "No notes captured yet.",
    listKicker: "Notes captured",
  },
  request: {
    title: "Requests",
    blurb: "Speak or type a request for information or documents, and tag which employer it's for.",
    codePrefix: "REQ-",
    placeholder: "Tap the mic, or type what you're requesting",
    saveLabel: "Save request",
    empty: "No requests captured yet.",
    listKicker: "Requests captured",
  },
};

/** Shared composer + list for the Notes and Requests tabs, which differ only in kind. */
export function NoteRequestPanel({ kind }: { kind: NoteKind }) {
  const {
    caseEmployers,
    notes,
    transcript,
    recording,
    draftNoteEmployers,
    editingNoteId,
    toggleDraftNoteEmployer,
    setTranscript,
    toggleRecord,
    saveNote,
    editNoteTags,
    toggleNoteEmployer,
    setNoteKind,
  } = useSherlock();

  const copy = COPY[kind];
  const items = notes.filter((n) => n.kind === kind);
  const nextCode = `${copy.codePrefix}${items.length + 1}`;

  return (
    <div>
      <h2 className="sh-title">{copy.title}</h2>
      <p className="sh-meta">{copy.blurb}</p>

      <div className="sh-measure" style={{ marginTop: "var(--space-4)" }}>
        <div className="sh-section field" style={{ marginTop: 0 }}>
          <label id={`${kind}-employer-label`}>Employer</label>
          <div
            style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
            role="group"
            aria-labelledby={`${kind}-employer-label`}
          >
            {caseEmployers.map((ce) => {
              const active = draftNoteEmployers.includes(ce.id);
              return (
                <button
                  type="button"
                  key={ce.id}
                  className={`sh-pillbtn ${active ? "active" : ""}`}
                  aria-pressed={active}
                  onClick={() => toggleDraftNoteEmployer(ce.id)}
                >
                  {ce.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="sh-meta" style={{ fontSize: 12, marginTop: "var(--space-3)" }}>
          Will be logged as {nextCode}
        </div>
        <textarea
          className="input"
          rows={4}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={copy.placeholder}
          aria-label={`${copy.title} text`}
          style={{ marginTop: 4 }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            marginTop: "var(--space-2)",
          }}
        >
          <button
            type="button"
            className="btn btn-secondary btn-icon"
            style={{ width: 36, height: 36, borderRadius: "50%", flex: "none" }}
            onClick={toggleRecord}
            aria-pressed={recording}
            aria-label={recording ? "Stop recording" : "Record"}
          >
            <MicIcon />
          </button>
          {recording ? (
            <div style={{ display: "flex", gap: 3, alignItems: "center", height: 18 }} aria-hidden="true">
              {WAVE_BARS.map((b, i) => (
                <span key={i} className="sh-bar" style={{ height: b.height, animationDelay: b.delay }} />
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, opacity: 0.6 }}>Tap to record</div>
          )}
          <span role="status" className="sr-only" style={{ position: "absolute", left: -9999 }}>
            {recording ? "Listening…" : ""}
          </span>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => saveNote(kind)}
          disabled={!transcript.trim()}
          style={{ marginTop: "var(--space-3)" }}
        >
          {copy.saveLabel}
        </button>

        {items.length > 0 ? (
          <div className="sh-section" style={{ marginTop: 0 }}>
            <div className="sh-kicker">{copy.listKicker}</div>
            <div className="sh-list">
              {items
                .slice()
                .reverse()
                .map((n) => {
                  const isEditing = editingNoteId === n.id;
                  const employerLabels = n.employers.length
                    ? n.employers
                        .map((id) => caseEmployers.find((ce) => ce.id === id)?.label)
                        .filter(Boolean)
                        .join(", ")
                    : "Unassigned";
                  return (
                    <div
                      className="sh-row"
                      key={n.id}
                      style={{ flexDirection: "column", alignItems: "stretch", gap: 4 }}
                    >
                      <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                        <span className={n.kind === "request" ? "tag tag-accent-2" : "tag tag-neutral"}>
                          {n.code}
                        </span>
                        <div style={{ fontSize: 14, flex: 1 }}>{n.text}</div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "var(--space-3)",
                          flexWrap: "wrap",
                        }}
                      >
                        <div className="sh-row-meta" style={{ flex: 1 }}>
                          {employerLabels}
                        </div>
                        <button
                          type="button"
                          className="sh-pillbtn"
                          onClick={() => editNoteTags(n.id)}
                          aria-expanded={isEditing}
                        >
                          {isEditing ? "Done" : "Edit tags"}
                        </button>
                      </div>
                      {isEditing && (
                        <>
                          <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                            <button
                              type="button"
                              className={`sh-pillbtn ${n.kind !== "request" ? "active" : ""}`}
                              aria-pressed={n.kind !== "request"}
                              onClick={() => setNoteKind(n.id, "note")}
                            >
                              Move to Notes
                            </button>
                            <button
                              type="button"
                              className={`sh-pillbtn ${n.kind === "request" ? "active" : ""}`}
                              aria-pressed={n.kind === "request"}
                              onClick={() => setNoteKind(n.id, "request")}
                            >
                              Move to Requests
                            </button>
                          </div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
                            {caseEmployers.map((ce) => {
                              const active = n.employers.includes(ce.id);
                              return (
                                <button
                                  type="button"
                                  key={ce.id}
                                  className={`sh-pillbtn ${active ? "active" : ""}`}
                                  aria-pressed={active}
                                  onClick={() => toggleNoteEmployer(n.id, ce.id)}
                                >
                                  {ce.label}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          <p className="sh-meta">{copy.empty}</p>
        )}
      </div>
    </div>
  );
}
