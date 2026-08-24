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
    setListItem,
    addListItem,
    removeListItem,
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
        style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "var(--space-4) 0" }}
        role="group"
        aria-label="Employer"
      >
        {caseEmployers.map((ce) => {
          const active = activeReportEmployer === ce.id;
          return (
            <button
              type="button"
              key={ce.id}
              className={`sh-pillbtn ${active ? "active" : ""}`}
              aria-pressed={active}
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
            rows={7}
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
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: "var(--space-3)",
                }}
              >
                <label htmlFor={`order-${i}`}>Order {i + 1}</label>
                <button
                  type="button"
                  className="sh-pillbtn"
                  onClick={() => removeListItem("orders", i)}
                  aria-label={`Remove order ${i + 1}`}
                >
                  Remove
                </button>
              </div>
              <textarea
                id={`order-${i}`}
                className="input"
                rows={9}
                value={item.text}
                onChange={(e) => setListItem("orders", i, e.target.value)}
                placeholder="Statement of the issue"
              />
              <EvidenceRow codes={item.evidence} onOpen={setViewing} />
            </div>
          ))}
          <button type="button" className="btn btn-secondary" onClick={() => addListItem("orders")}>
            Add order
          </button>
        </div>

        <div style={{ marginTop: "var(--space-6)" }}>
          <div className="sh-kicker">Regulation references</div>
          {reportDoc.refs.map((item, i) => (
            <div className="field" style={{ marginBottom: "var(--space-4)" }} key={`ref-${i}`}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: "var(--space-3)",
                }}
              >
                <label htmlFor={`ref-${i}`}>Reference {i + 1}</label>
                <button
                  type="button"
                  className="sh-pillbtn"
                  onClick={() => removeListItem("refs", i)}
                  aria-label={`Remove reference ${i + 1}`}
                >
                  Remove
                </button>
              </div>
              <textarea
                id={`ref-${i}`}
                className="input"
                rows={4}
                value={item.text}
                onChange={(e) => setListItem("refs", i, e.target.value)}
                placeholder="Regulation reference"
              />
              <EvidenceRow codes={item.evidence} onOpen={setViewing} />
            </div>
          ))}
          <button type="button" className="btn btn-secondary" onClick={() => addListItem("refs")}>
            Add regulation reference
          </button>
        </div>
      </div>

      <EvidenceViewerOverlay item={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
