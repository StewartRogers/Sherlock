"use client";

import { useRef } from "react";
import { fileExtLabel, formatBytes } from "@/lib/data";
import { useSherlock } from "@/lib/store";
import { ImageSlot } from "./ImageSlot";
import { UploadIcon } from "./icons";

export function UploadTab() {
  const { documents, caseEmployers, addDocuments, toggleDocumentEmployer, removeDocument } =
    useSherlock();
  const inputRef = useRef<HTMLInputElement>(null);

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
          const files = Array.from(e.target.files ?? []);
          if (files.length) addDocuments(files);
          e.target.value = "";
        }}
        style={{ display: "none" }}
        tabIndex={-1}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
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
          Certificates, training records, correspondence — any file from this device
        </span>
      </button>

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
