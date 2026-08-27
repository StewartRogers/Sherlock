"use client";

import { CASES_PER_PAGE, caseMeta } from "@/lib/data";
import { useSherlock } from "@/lib/store";
import { PlusIcon } from "./icons";

export function HomeScreen() {
  const { recentCases, goNewCase, openCase, viewAllCases } = useSherlock();
  const shown = recentCases.slice(0, CASES_PER_PAGE);

  return (
    <div className="sh-pad" style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: "var(--space-6)" }}>Sherlock</div>
      <div className="sh-measure">
        <button
          type="button"
          className="btn btn-primary"
          onClick={goNewCase}
          style={{
            fontSize: 16,
            fontWeight: 600,
            padding: "15px 22px",
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
          }}
        >
          <PlusIcon />
          New casefile
        </button>

        <div className="sh-section">
          <div className="sh-kicker">Recent</div>
          <div className="sh-list">
            {shown.map((rc) => (
              <div className="sh-row" key={rc.id}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="sh-row-title">{rc.name}</div>
                  <div className="sh-row-meta">{caseMeta(rc)}</div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: "none" }}
                  onClick={() => openCase(rc.id)}
                  aria-label={`Open ${rc.name}`}
                >
                  Open
                </button>
              </div>
            ))}
          </div>
          {recentCases.length > CASES_PER_PAGE && (
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={viewAllCases}
              style={{ marginTop: "var(--space-3)" }}
            >
              See all casefiles
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
