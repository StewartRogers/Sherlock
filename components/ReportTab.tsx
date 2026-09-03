"use client";

import { useState } from "react";
import { EVIDENCE_BY_CODE } from "@/lib/data";
import { useSherlock } from "@/lib/store";
import { EvidenceThumb, EvidenceViewerOverlay, type EvidenceViewItem } from "./EvidenceViewer";
import { CheckIcon, CopyIcon, SparkleIcon } from "./icons";

/** Evidence codes are all photographic in this prototype; certificates and
 * open items share the same construction-site stand-in image. */
function toViewItem(code: string): EvidenceViewItem {
  const evidence = EVIDENCE_BY_CODE[code];
  return { code, label: evidence?.label ?? code, variant: "construction" };
}

function EvidenceRow({ codes, onOpen }: { codes: string[]; onOpen: (item: EvidenceViewItem) => void }) {
  if (!codes.length) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
      {codes.map((code) => (
        <EvidenceThumb key={code} item={toViewItem(code)} onOpen={onOpen} />
      ))}
    </div>
  );
}

/**
 * Copy-to-clipboard and insert-AI-draft controls, shown on the same line as
 * a field's label. "Generate AI" re-inserts Sherlock's drafted text for
 * this field (the same source the field was pre-populated from) — useful
 * once an inspector has edited a field away from the draft and wants it
 * back. It's disabled where no draft exists for the field (e.g. an order
 * added beyond the seeded ones).
 */
function FieldToolbar({ text, draft, onGenerate }: { text: string; draft: string; onGenerate: () => void }) {
  const [copied, setCopied] = useState(false);
  const canGenerate = draft.trim().length > 0;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard permission denied or unavailable; nothing more to do */
    }
  }

  return (
    <div className="sh-field-toolbar">
      <button
        type="button"
        className={`sh-field-toolbar-btn ${copied ? "sh-field-toolbar-btn--ok" : ""}`}
        onClick={handleCopy}
        aria-label={copied ? "Copied" : "Copy text"}
        title={copied ? "Copied" : "Copy text"}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
      <button
        type="button"
        className="sh-field-toolbar-btn"
        onClick={onGenerate}
        disabled={!canGenerate}
        aria-label="Insert Sherlock's AI draft"
        title={canGenerate ? "Insert Sherlock's AI draft" : "No AI draft available for this item"}
      >
        <SparkleIcon />
      </button>
    </div>
  );
}

export function ReportTab() {
  const {
    caseEmployers,
    activeReportEmployer,
    reportDoc,
    defaultDoc,
    setReportEmployer,
    setReportNote,
    setOrderText,
    addOrder,
    setRefField,
    addRef,
  } = useSherlock();
  const [viewing, setViewing] = useState<EvidenceViewItem | null>(null);
  const draftDoc = activeReportEmployer ? defaultDoc(activeReportEmployer, caseEmployers) : null;

  return (
    <div>
      <h2 className="sh-title">Report content</h2>
      <p className="sh-meta">
        Sherlock drafted this from the photos, notes, and scanned pages tagged to each employer —
        one report per employer, with orders and regulation references built from what you
        captured. Review the wording and the call; both are yours to finish in WSM 360.
      </p>

      <div
        className="sh-tabswitch"
        style={{ flexWrap: "wrap", margin: "var(--space-4) 0" }}
        role="radiogroup"
        aria-label="Employer"
      >
        {caseEmployers.map((ce) => {
          const active = activeReportEmployer === ce.id;
          return (
            <button
              type="button"
              key={ce.id}
              className={`sh-tabswitch-btn ${active ? "active" : ""}`}
              role="radio"
              aria-checked={active}
              onClick={() => setReportEmployer(ce.id)}
            >
              {ce.label}
            </button>
          );
        })}
      </div>

      <div className="sh-measure" style={{ marginBottom: "var(--space-6)" }}>
        <div className="field">
          <div className="sh-field-head">
            <label htmlFor="report-note">Inspection note</label>
            <FieldToolbar text={reportDoc.note} draft={draftDoc?.note ?? ""} onGenerate={() => setReportNote(draftDoc?.note ?? "")} />
          </div>
          <textarea
            id="report-note"
            className="input"
            rows={21}
            value={reportDoc.note}
            onChange={(e) => setReportNote(e.target.value)}
            placeholder="Notes for this employer"
          />
          <EvidenceRow codes={reportDoc.noteEvidence} onOpen={setViewing} />
        </div>
      </div>

      <div className="sh-measure">
        <div>
          <div className="sh-kicker">Orders</div>
          {reportDoc.orders.map((item, i) => (
            <div className="field" style={{ marginBottom: "var(--space-4)" }} key={item.code}>
              <div className="sh-field-head">
                <label htmlFor={`order-${i}`}>{item.code}</label>
                <FieldToolbar
                  text={item.text}
                  draft={draftDoc?.orders[i]?.text ?? ""}
                  onGenerate={() => setOrderText(i, draftDoc?.orders[i]?.text ?? "")}
                />
              </div>
              <textarea
                id={`order-${i}`}
                className="input"
                rows={9}
                value={item.text}
                onChange={(e) => setOrderText(i, e.target.value)}
                placeholder="Statement of the issue"
              />
              <EvidenceRow codes={item.evidence} onOpen={setViewing} />
            </div>
          ))}
          <button type="button" className="btn btn-secondary" onClick={addOrder}>
            Add order
          </button>
        </div>

        <div style={{ marginTop: "var(--space-6)" }}>
          <div className="sh-kicker">Regulation references</div>
          {reportDoc.refs.map((item, i) => (
            <div style={{ marginBottom: "var(--space-4)" }} key={item.code}>
              <div className="sh-row-title" style={{ fontSize: 13, marginBottom: 6 }}>
                {item.code}
              </div>
              <div className="sh-cols">
                <div className="field">
                  <div className="sh-field-head">
                    <label htmlFor={`ref-${i}-reference`}>Reference</label>
                    <FieldToolbar
                      text={item.reference}
                      draft={draftDoc?.refs[i]?.reference ?? ""}
                      onGenerate={() => setRefField(i, "reference", draftDoc?.refs[i]?.reference ?? "")}
                    />
                  </div>
                  <textarea
                    id={`ref-${i}-reference`}
                    className="input"
                    rows={6}
                    value={item.reference}
                    onChange={(e) => setRefField(i, "reference", e.target.value)}
                    placeholder="Citation and regulation text"
                  />
                </div>
                <div className="field">
                  <div className="sh-field-head">
                    <label htmlFor={`ref-${i}-details`}>Details discussed</label>
                    <FieldToolbar
                      text={item.details}
                      draft={draftDoc?.refs[i]?.details ?? ""}
                      onGenerate={() => setRefField(i, "details", draftDoc?.refs[i]?.details ?? "")}
                    />
                  </div>
                  <textarea
                    id={`ref-${i}-details`}
                    className="input"
                    rows={6}
                    value={item.details}
                    onChange={(e) => setRefField(i, "details", e.target.value)}
                    placeholder="What was discussed with the site representative"
                  />
                </div>
              </div>
              <EvidenceRow codes={item.evidence} onOpen={setViewing} />
            </div>
          ))}
          <button type="button" className="btn btn-secondary" onClick={addRef}>
            Add regulation reference
          </button>
        </div>
      </div>

      <EvidenceViewerOverlay item={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
