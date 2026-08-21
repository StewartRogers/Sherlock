"use client";

import { GRAPH_EDGES, GRAPH_NODES } from "@/lib/data";
import { useSherlock } from "@/lib/store";
import type { EmployerSlot } from "@/lib/types";

const SLOT_IDS: EmployerSlot[] = ["roofing", "prime"];

export function GraphTab() {
  const { selectedGraphNode, selectGraphNode, employerForSlot } = useSherlock();

  const nodesById = Object.fromEntries(GRAPH_NODES.map((n) => [n.id, n]));
  const sel = selectedGraphNode;

  /* Everything one hop from the selection stays lit; the rest greys back. */
  const connected = new Set<string>();
  if (sel) {
    for (const [a, b] of GRAPH_EDGES) {
      if (a === sel) connected.add(b);
      if (b === sel) connected.add(a);
    }
  }

  return (
    <div>
      <h2 className="sh-title">Knowledge graph</h2>
      <p className="sh-meta">
        Tap a node to trace what it connects to. Editing links changes connections only — the
        evidence underneath stays exactly as captured.
      </p>

      <svg
        viewBox="0 0 640 420"
        style={{ width: "100%", height: "auto", maxHeight: 460, marginTop: "var(--space-4)" }}
        role="group"
        aria-label="Casefile knowledge graph"
      >
        {GRAPH_EDGES.map(([a, b]) => {
          const na = nodesById[a];
          const nb = nodesById[b];
          const active = sel !== null && (a === sel || b === sel);
          return (
            <line
              key={`${a}-${b}`}
              x1={na.x}
              y1={na.y}
              x2={nb.x}
              y2={nb.y}
              stroke={
                active
                  ? "var(--color-accent)"
                  : sel
                    ? "var(--color-neutral-200)"
                    : "var(--color-divider)"
              }
              strokeWidth={active ? 2 : 1}
            />
          );
        })}

        {GRAPH_NODES.map((n) => {
          const isSel = sel === n.id;
          const dim = sel !== null && !isSel && !connected.has(n.id);
          const slot = SLOT_IDS.includes(n.id as EmployerSlot) ? (n.id as EmployerSlot) : null;
          const label = employerForSlot(slot)?.label ?? n.label;
          return (
            <g
              key={n.id}
              onClick={() => selectGraphNode(n.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  selectGraphNode(n.id);
                }
              }}
              style={{ cursor: "pointer" }}
              tabIndex={0}
              role="button"
              aria-pressed={isSel}
              aria-label={label}
            >
              <circle
                cx={n.x}
                cy={n.y}
                r={n.r}
                fill={dim ? "var(--color-neutral-300)" : n.base}
                stroke={isSel ? "var(--color-text)" : "none"}
                strokeWidth={isSel ? 2 : 0}
              />
              <text
                x={n.anchor === "middle" ? n.x : n.x + n.r + 6}
                y={n.y + n.ty}
                fontSize={13}
                fill="var(--color-text)"
                textAnchor={n.anchor}
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
