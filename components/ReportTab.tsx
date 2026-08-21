"use client";

import { useSherlock } from "@/lib/store";

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

  return (
    <div>
      <h2 className="sh-title">Report content</h2>
      <p className="sh-meta">
        One report per employer — orders, regulation references, and IR notes. Sherlock&rsquo;s
        wording is a starting point; the words and the call are yours in WSM 360.
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

      <div className="sh-measure">
        <div className="field" style={{ marginBottom: "var(--space-6)" }}>
          <label htmlFor="report-note">Inspection note</label>
          <textarea
            id="report-note"
            className="input"
            rows={5}
            value={reportDoc.note}
            onChange={(e) => setReportNote(e.target.value)}
            placeholder="Notes for this employer"
          />
        </div>

        <div className="sh-kicker">Orders</div>
        {reportDoc.orders.map((text, i) => (
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
              rows={4}
              value={text}
              onChange={(e) => setListItem("orders", i, e.target.value)}
              placeholder="Statement of the issue"
            />
          </div>
        ))}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => addListItem("orders")}
          style={{ marginBottom: "var(--space-6)" }}
        >
          Add order
        </button>

        <div className="sh-kicker">Regulation references</div>
        {reportDoc.refs.map((text, i) => (
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
              rows={3}
              value={text}
              onChange={(e) => setListItem("refs", i, e.target.value)}
              placeholder="Regulation reference"
            />
          </div>
        ))}
        <button type="button" className="btn btn-secondary" onClick={() => addListItem("refs")}>
          Add regulation reference
        </button>
      </div>
    </div>
  );
}
