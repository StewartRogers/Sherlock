"use client";

import { RECENT_CASES } from "@/lib/data";
import { useSherlock } from "@/lib/store";
import { PlusIcon } from "./icons";

export function HomeScreen() {
  const { visibleCases, goNewCase, openCase, showMoreCases } = useSherlock();
  const shown = RECENT_CASES.slice(0, visibleCases);

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
              <div className="sh-row" key={rc.name}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="sh-row-title">{rc.name}</div>
                  <div className="sh-row-meta">{rc.meta}</div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: "none" }}
                  onClick={openCase}
                  aria-label={`Open ${rc.name}`}
                >
                  Open
                </button>
              </div>
            ))}
          </div>
          {visibleCases < RECENT_CASES.length && (
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={showMoreCases}
              style={{ marginTop: "var(--space-3)" }}
            >
              See more
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
