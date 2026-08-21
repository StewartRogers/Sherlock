"use client";

import { useSherlock } from "@/lib/store";
import type { Tab } from "@/lib/types";

const ENTRIES: { tab: Tab; title: string; meta: string }[] = [
  { tab: "case", title: "Case folder", meta: "Every piece of evidence in this casefile" },
  { tab: "report", title: "Report content", meta: "Orders, regulation references, and IR notes" },
  { tab: "graph", title: "Knowledge graph", meta: "How the evidence connects together" },
];

export function MoreTab() {
  const { setTab } = useSherlock();

  async function lock() {
    await fetch("/api/login", { method: "DELETE" });
    window.location.assign("/login");
  }

  return (
    <div className="sh-measure">
      <div className="sh-kicker">More</div>
      <div className="sh-list">
        {ENTRIES.map((e) => (
          <button
            type="button"
            className="sh-row"
            key={e.tab}
            style={{ cursor: "pointer" }}
            onClick={() => setTab(e.tab)}
          >
            <div style={{ flex: 1 }}>
              <div className="sh-row-title">{e.title}</div>
              <div className="sh-row-meta">{e.meta}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="sh-section">
        <div className="sh-kicker">Session</div>
        <div className="sh-list">
          <button type="button" className="sh-row" style={{ cursor: "pointer" }} onClick={lock}>
            <div style={{ flex: 1 }}>
              <div className="sh-row-title">Lock this device</div>
              <div className="sh-row-meta">Require the passcode again on this browser</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
