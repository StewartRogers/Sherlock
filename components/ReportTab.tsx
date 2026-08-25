"use client";

import { useState } from "react";
import { EVIDENCE_BY_CODE } from "@/lib/data";
import { useSherlock } from "@/lib/store";
import { EvidenceThumb, EvidenceViewerOverlay, type EvidenceViewItem } from "./EvidenceViewer";

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

export function ReportTab() {
  const {
    caseEmployers,
    activeReportEmployer,
    reportDoc,
    setReportEmployer,
    setReportNote,
    setOrderText,
    addOrder,
    setRefField,
    addRef,
  } = useSherlock();
  const [viewing, setViewing] = useState<EvidenceViewItem | null>(null);

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
          <label htmlFor="report-note">Inspection note</label>
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
            <div className="field" style={{ marginBottom: "var(--space-4)" }} key={`order-${i}`}>
              <label htmlFor={`order-${i}`}>{item.code}</label>
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
            <div style={{ marginBottom: "var(--space-4)" }} key={`ref-${i}`}>
              <div className="sh-row-title" style={{ fontSize: 13, marginBottom: 6 }}>
                {item.code}
              </div>
              <div className="sh-cols">
                <div className="field">
                  <label htmlFor={`ref-${i}-reference`}>Reference</label>
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
                  <label htmlFor={`ref-${i}-details`}>Details discussed</label>
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
