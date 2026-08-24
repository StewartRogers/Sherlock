"use client";

import { useMemo, useState } from "react";
import { CASE_EVIDENCE, EVIDENCE_BY_CODE } from "@/lib/data";
import { edgeKey, useSherlock } from "@/lib/store";
import type { GraphEdge } from "@/lib/types";

type NodeKind = "case" | "employer" | "evidence" | "order" | "reference" | "note" | "request" | "scan";

interface GNode {
  id: string;
  label: string;
  /** Fuller description shown in the side panel; falls back to label. */
  detail?: string;
  kind: NodeKind;
  r: number;
}

const KIND_COLOR: Record<NodeKind, string> = {
  case: "var(--color-neutral-700)",
  employer: "var(--color-accent-600)",
  evidence: "var(--color-accent-400)",
  order: "var(--color-accent-2-600)",
  reference: "var(--color-neutral-500)",
  note: "var(--color-neutral-600)",
  request: "var(--color-accent-2-700)",
  scan: "var(--color-neutral-400)",
};

const KIND_LABEL: Record<NodeKind, string> = {
  case: "Casefile",
  employer: "Employer",
  evidence: "Evidence",
  order: "Order",
  reference: "Reference",
  note: "Note",
  request: "Request",
  scan: "Scanned page",
};

/**
 * A small hand-rolled force simulation (repulsion between every pair, a
 * spring along each edge, weak centering) — enough to settle an organic,
 * non-hierarchical layout without pulling in a graph-layout library.
 */
function layoutNodes(nodes: GNode[], edges: GraphEdge[], width: number, height: number) {
  const pos = new Map<string, { x: number; y: number; vx: number; vy: number }>();
  const cx = width / 2;
  const cy = height / 2;
  nodes.forEach((n, i) => {
    const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2;
    const radius = Math.min(width, height) * 0.32;
    pos.set(n.id, { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius, vx: 0, vy: 0 });
  });

  for (let iter = 0; iter < 260; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = pos.get(nodes[i].id)!;
        const b = pos.get(nodes[j].id)!;
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        const distSq = Math.max(dx * dx + dy * dy, 0.02);
        const dist = Math.sqrt(distSq);
        const force = 1600 / distSq;
        dx /= dist;
        dy /= dist;
        a.vx += dx * force;
        a.vy += dy * force;
        b.vx -= dx * force;
        b.vy -= dy * force;
      }
    }
    for (const [s, t] of edges) {
      const a = pos.get(s);
      const b = pos.get(t);
      if (!a || !b) continue;
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 0.02);
      const force = (dist - 92) * 0.02;
      dx /= dist;
      dy /= dist;
      a.vx += dx * force;
      a.vy += dy * force;
      b.vx -= dx * force;
      b.vy -= dy * force;
    }
    for (const n of nodes) {
      const p = pos.get(n.id)!;
      p.vx += (cx - p.x) * 0.0015;
      p.vy += (cy - p.y) * 0.0015;
      p.vx *= 0.82;
      p.vy *= 0.82;
      p.x = Math.min(width - n.r - 6, Math.max(n.r + 6, p.x + p.vx));
      p.y = Math.min(height - n.r - 6, Math.max(n.r + 6, p.y + p.vy));
    }
  }

  /* The physics settle into whatever size the repulsion/spring balance
     produces, which is usually smaller than the canvas — rescale the
     result to actually fill it rather than leaving it clustered in a
     corner with dead space around it. */
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const n of nodes) {
    const p = pos.get(n.id)!;
    minX = Math.min(minX, p.x - n.r);
    maxX = Math.max(maxX, p.x + n.r);
    minY = Math.min(minY, p.y - n.r);
    maxY = Math.max(maxY, p.y + n.r);
  }
  const margin = 36;
  const scaleX = Math.min((width - margin * 2) / Math.max(maxX - minX, 1), 2.2);
  const scaleY = Math.min((height - margin * 2) / Math.max(maxY - minY, 1), 2.2);
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  for (const n of nodes) {
    const p = pos.get(n.id)!;
    p.x = cx + (p.x - midX) * scaleX;
    p.y = cy + (p.y - midY) * scaleY;
  }

  return pos;
}

export function GraphTab() {
  const {
    caseEmployers,
    notes,
    scanPageCount,
    reportDocs,
    defaultDoc,
    employerForSlot,
    graphLinks,
    removedGraphLinks,
    selectedGraphNode,
    selectGraphNode,
    addGraphLink,
    removeGraphLink,
  } = useSherlock();

  const [addTarget, setAddTarget] = useState("");
  const width = 640;
  const height = 420;

  const nodes = useMemo<GNode[]>(() => {
    const list: GNode[] = [{ id: "case", label: "Casefile", kind: "case", r: 20 }];
    for (const ce of caseEmployers) list.push({ id: ce.id, label: ce.label, kind: "employer", r: 16 });
    for (const e of CASE_EVIDENCE) list.push({ id: e.code, label: e.code, detail: e.label, kind: "evidence", r: 11 });
    for (let i = 0; i < scanPageCount; i++) {
      list.push({ id: `scan-${i + 1}`, label: `Scanned page ${i + 1}`, kind: "scan", r: 9 });
    }
    for (const n of notes) {
      list.push({ id: `note-${n.id}`, label: n.code, kind: n.kind === "request" ? "request" : "note", r: 9 });
    }
    for (const ce of caseEmployers) {
      const doc = reportDocs[ce.id] ?? defaultDoc(ce.id, caseEmployers);
      doc.orders.forEach((_, i) =>
        list.push({ id: `order-${ce.id}-${i}`, label: `Order ${i + 1}`, kind: "order", r: 10 }),
      );
      doc.refs.forEach((_, i) =>
        list.push({ id: `ref-${ce.id}-${i}`, label: `Reference ${i + 1}`, kind: "reference", r: 10 }),
      );
    }
    return list;
  }, [caseEmployers, notes, scanPageCount, reportDocs, defaultDoc]);

  const labelById = useMemo(() => new Map(nodes.map((n) => [n.id, n.label])), [nodes]);
  const detailById = useMemo(() => new Map(nodes.map((n) => [n.id, n.detail ?? n.label])), [nodes]);
  const kindById = useMemo(() => new Map(nodes.map((n) => [n.id, n.kind])), [nodes]);

  /** Edges Sherlock infers from tags already on the data — the starting point before manual edits. */
  const inferredEdges = useMemo<GraphEdge[]>(() => {
    const edges: GraphEdge[] = [];
    for (const ce of caseEmployers) edges.push(["case", ce.id]);

    for (const e of CASE_EVIDENCE) {
      const emp = employerForSlot(e.employer);
      if (emp) edges.push([emp.id, e.code]);
    }

    for (const n of notes) {
      for (const empId of n.employers) edges.push([empId, `note-${n.id}`]);
    }

    for (const ce of caseEmployers) {
      const doc = reportDocs[ce.id] ?? defaultDoc(ce.id, caseEmployers);
      doc.orders.forEach((item, i) => {
        const id = `order-${ce.id}-${i}`;
        edges.push([ce.id, id]);
        for (const code of item.evidence) if (EVIDENCE_BY_CODE[code]) edges.push([id, code]);
      });
      doc.refs.forEach((item, i) => {
        const id = `ref-${ce.id}-${i}`;
        edges.push([ce.id, id]);
        for (const code of item.evidence) if (EVIDENCE_BY_CODE[code]) edges.push([id, code]);
      });
    }
    return edges;
  }, [caseEmployers, notes, reportDocs, defaultDoc, employerForSlot]);

  const edges = useMemo<GraphEdge[]>(() => {
    const removed = new Set(removedGraphLinks);
    const seen = new Set<string>();
    const merged: GraphEdge[] = [];
    for (const [a, b] of [...inferredEdges, ...graphLinks]) {
      if (!labelById.has(a) || !labelById.has(b)) continue;
      const key = edgeKey(a, b);
      if (removed.has(key) || seen.has(key)) continue;
      seen.add(key);
      merged.push([a, b]);
    }
    return merged;
  }, [inferredEdges, graphLinks, removedGraphLinks, labelById]);

  const pos = useMemo(() => layoutNodes(nodes, edges, width, height), [nodes, edges]);

  const sel = selectedGraphNode;
  const linkedTo = useMemo(() => {
    const set = new Set<string>();
    if (sel) for (const [a, b] of edges) {
      if (a === sel) set.add(b);
      if (b === sel) set.add(a);
    }
    return set;
  }, [sel, edges]);

  const addableNodes = useMemo(
    () => (sel ? nodes.filter((n) => n.id !== sel && !linkedTo.has(n.id)) : []),
    [sel, nodes, linkedTo],
  );

  return (
    <div className="sh-cols">
      <div className="sh-measure">
        <h2 className="sh-title">Knowledge graph</h2>
        <p className="sh-meta">
          Tap a node to trace what it connects to and edit its links. Editing links changes
          connections only — the evidence underneath stays exactly as captured.
        </p>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", height: "auto", maxHeight: 460, marginTop: "var(--space-4)" }}
          role="group"
          aria-label="Casefile knowledge graph"
        >
          {edges.map(([a, b]) => {
            const pa = pos.get(a);
            const pb = pos.get(b);
            if (!pa || !pb) return null;
            const active = sel !== null && (a === sel || b === sel);
            return (
              <line
                key={`${a}::${b}`}
                x1={pa.x}
                y1={pa.y}
                x2={pb.x}
                y2={pb.y}
                stroke={active ? "var(--color-accent)" : sel ? "var(--color-neutral-200)" : "var(--color-divider)"}
                strokeWidth={active ? 2 : 1}
              />
            );
          })}

          {nodes.map((n) => {
            const p = pos.get(n.id);
            if (!p) return null;
            const isSel = sel === n.id;
            const dim = sel !== null && !isSel && !linkedTo.has(n.id);
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
                aria-label={`${n.detail ?? n.label} (${KIND_LABEL[n.kind]})`}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={n.r}
                  fill={dim ? "var(--color-neutral-300)" : KIND_COLOR[n.kind]}
                  stroke={isSel ? "var(--color-text)" : "none"}
                  strokeWidth={isSel ? 2 : 0}
                />
                <text
                  x={p.x}
                  y={p.y + n.r + 12}
                  fontSize={10}
                  fill="var(--color-text)"
                  textAnchor="middle"
                  opacity={dim ? 0.45 : 1}
                  style={{ pointerEvents: "none" }}
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="sh-measure">
        {sel ? (
          <div className="card elev-md">
            <div className="card-kicker">{KIND_LABEL[kindById.get(sel) ?? "evidence"]}</div>
            <p className="card-body" style={{ fontWeight: 600, marginBottom: 0 }}>
              {detailById.get(sel)}
            </p>

            <div className="sh-section" style={{ marginTop: "var(--space-4)" }}>
              <div className="sh-kicker">Linked to</div>
              {linkedTo.size === 0 ? (
                <p className="sh-meta">Nothing linked yet.</p>
              ) : (
                <div className="sh-list">
                  {[...linkedTo].map((id) => (
                    <div className="sh-row" key={id}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="sh-row-title" style={{ fontSize: 14 }}>
                          {detailById.get(id)}
                        </div>
                        <div className="sh-row-meta">{KIND_LABEL[kindById.get(id) ?? "evidence"]}</div>
                      </div>
                      <button
                        type="button"
                        className="sh-pillbtn"
                        onClick={() => removeGraphLink(sel, id)}
                        aria-label={`Remove link to ${detailById.get(id)}`}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="sh-section" style={{ marginTop: "var(--space-4)" }}>
              <div className="sh-kicker">Add a link</div>
              {addableNodes.length === 0 ? (
                <p className="sh-meta">Everything else is already linked.</p>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <select
                    className="input"
                    value={addTarget}
                    onChange={(e) => setAddTarget(e.target.value)}
                    aria-label="Node to link"
                  >
                    <option value="">Choose a node…</option>
                    {addableNodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.detail ?? n.label} · {KIND_LABEL[n.kind]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={!addTarget}
                    onClick={() => {
                      addGraphLink(sel, addTarget);
                      setAddTarget("");
                    }}
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="sh-meta">Select a node to see its links and edit them.</p>
        )}
      </div>
    </div>
  );
}
