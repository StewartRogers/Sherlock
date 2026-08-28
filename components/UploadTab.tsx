"use client";

import { useRef, useState } from "react";
import { fileExtLabel, formatBytes } from "@/lib/data";
import { useSherlock } from "@/lib/store";
import { ImageSlot } from "./ImageSlot";
import { UploadIcon } from "./icons";

/** Anything larger than this is a mis-pick, not a site document. */
const MAX_FILE_BYTES = 25 * 1024 * 1024;

export function UploadTab() {
  const { documents, caseEmployers, addDocuments, toggleDocumentEmployer, removeDocument } =
    useSherlock();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rejected, setRejected] = useState<string | null>(null);

  /** Shared by the picker and the drop zone: keep what fits, say what didn't. */
  function accept(files: File[]) {
    if (!files.length) return;
    const tooBig = files.filter((f) => f.size > MAX_FILE_BYTES);
    const keep = files.filter((f) => f.size <= MAX_FILE_BYTES);
    setRejected(
      tooBig.length
        ? `${tooBig.map((f) => f.name).join(", ")} — over ${MAX_FILE_BYTES / 1024 / 1024} MB, not uploaded.`
        : null,
    );
    if (keep.length) addDocuments(keep);
  }

  return (
    <div className="sh-measure">
      <div className="sh-kicker">
        {documents.length} {documents.length === 1 ? "document uploaded" : "documents uploaded"}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={(e) => {
          accept(Array.from(e.target.files ?? []));
          // Cleared so re-picking the same file still fires a change event.
          e.target.value = "";
        }}
        style={{ display: "none" }}
        tabIndex={-1}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          accept(Array.from(e.dataTransfer.files));
        }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--space-2)",
          width: "100%",
          padding: "var(--space-6) var(--space-4)",
          border: "1.5px dashed var(--color-divider)",
          borderRadius: "var(--radius-lg)",
          background: "none",
          color: "var(--color-text)",
          cursor: "pointer",
          fontFamily: "inherit",
          marginBottom: "var(--space-4)",
        }}
      >
        <span style={{ color: "var(--color-accent)" }}>
          <UploadIcon />
        </span>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Upload documents</span>
        <span className="sh-meta" style={{ fontSize: 12 }}>
          Certificates, training records, correspondence — drop a file here or tap to browse
        </span>
      </button>

      {rejected && (
        <p role="alert" className="sh-meta" style={{ marginBottom: "var(--space-4)" }}>
          {rejected}
        </p>
      )}

      {documents.length === 0 ? (
        <p className="sh-meta">No documents uploaded yet.</p>
      ) : (
        <div className="sh-list">
          {documents
            .slice()
            .reverse()
            .map((doc) => (
              <div
                className="sh-row"
                style={{ alignItems: "flex-start", gap: "var(--space-3)" }}
                key={doc.id}
              >
                <div className="sh-thumb" style={{ width: 56, height: 56, flex: "none" }}>
                  <ImageSlot label={fileExtLabel(doc.name)} variant="placeholder" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    className="sh-row-title"
                    style={{ fontSize: 14, marginBottom: 2, overflowWrap: "break-word" }}
                  >
                    {doc.name}
                  </div>
                  <div className="sh-row-meta" style={{ marginBottom: 8 }}>
                    {formatBytes(doc.size)}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    {caseEmployers.map((ce) => {
                      const active = doc.employers.includes(ce.id);
                      return (
                        <button
                          type="button"
                          key={ce.id}
                          className={`sh-pillbtn ${active ? "active" : ""}`}
                          aria-pressed={active}
                          onClick={() => toggleDocumentEmployer(doc.id, ce.id)}
                        >
                          {ce.label}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ fontSize: 12, padding: "4px 8px" }}
                      onClick={() => removeDocument(doc.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
