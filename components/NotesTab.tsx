"use client";

import { useSherlock } from "@/lib/store";
import { MicIcon } from "./icons";

const WAVE_BARS = [
  { height: 8, delay: "0s" },
  { height: 15, delay: ".15s" },
  { height: 11, delay: ".3s" },
  { height: 16, delay: ".1s" },
  { height: 9, delay: ".25s" },
];

export function NotesTab() {
  const {
    caseEmployers,
    notes,
    transcript,
    recording,
    draftNoteKind,
    draftNoteEmployers,
    editingNoteId,
    setDraftKind,
    toggleDraftNoteEmployer,
    setTranscript,
    toggleRecord,
    saveNote,
    editNoteTags,
    toggleNoteEmployer,
    setNoteKind,
  } = useSherlock();

  const nextNoteCode = `N-${notes.filter((n) => n.kind !== "request").length + 1}`;
  const nextReqCode = `REQ-${notes.filter((n) => n.kind === "request").length + 1}`;

  return (
    <div className="sh-measure">
      <h2 className="sh-title">Notes</h2>
      <p className="sh-meta">Speak or type a note, and tag which employer it belongs to.</p>

      <div className="sh-section field">
        <label id="note-type-label">Type</label>
        <div style={{ display: "flex", gap: 6 }} role="group" aria-labelledby="note-type-label">
          <button
            type="button"
            className={`sh-pillbtn ${draftNoteKind === "note" ? "active" : ""}`}
            aria-pressed={draftNoteKind === "note"}
            onClick={() => setDraftKind("note")}
          >
            Note · {nextNoteCode}
          </button>
          <button
            type="button"
            className={`sh-pillbtn ${draftNoteKind === "request" ? "active" : ""}`}
            aria-pressed={draftNoteKind === "request"}
            onClick={() => setDraftKind("request")}
          >
            Request · {nextReqCode}
          </button>
        </div>
      </div>

      <div className="sh-section field">
        <label id="note-employer-label">Employer</label>
        <div
          style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
          role="group"
          aria-labelledby="note-employer-label"
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

      <textarea
        className="input"
        rows={4}
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Tap the mic, or type your note here"
        aria-label="Note text"
        style={{ marginTop: "var(--space-3)" }}
      />

      <div
        style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: "var(--space-2)" }}
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
        onClick={saveNote}
        disabled={!transcript.trim()}
        style={{ marginTop: "var(--space-3)" }}
      >
        {draftNoteKind === "request" ? "Save request" : "Save note"}
      </button>

      {notes.length > 0 && (
        <div className="sh-section">
          <div className="sh-kicker">Notes and requests captured</div>
          <div className="sh-list">
            {notes
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
                            Note
                          </button>
                          <button
                            type="button"
                            className={`sh-pillbtn ${n.kind === "request" ? "active" : ""}`}
                            aria-pressed={n.kind === "request"}
                            onClick={() => setNoteKind(n.id, "request")}
                          >
                            Request
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
      )}
    </div>
  );
}
