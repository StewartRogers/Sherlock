"use client";

import { useMemo, useState } from "react";
import { CASE_EVIDENCE, EVIDENCE_BY_CODE, fileExtLabel, formatBytes } from "@/lib/data";
import { edgeKey, useSherlock } from "@/lib/store";
import type { GraphEdge } from "@/lib/types";
import { EvidenceThumb, EvidenceViewerOverlay, type EvidenceViewItem } from "./EvidenceViewer";

type NodeKind =
  | "case"
  | "employer"
  | "evidence"
  | "open"
  | "order"
  | "reference"
  | "note"
  | "request"
  | "scan"
  | "document";

interface GNode {
  id: string;
  /** Short text under the node in the diagram. */
  label: string;
  /** Bold heading shown at the top of the side panel; falls back to label. */
  title?: string;
  /** Fuller description shown in the side panel below the title/thumbnail. */
  body?: string;
  /** A secondary detail line, e.g. a file size. */
  meta?: string;
  /** Set when the node has an actual image to show — a photo or scanned page. */
  thumb?: EvidenceViewItem;
  kind: NodeKind;
  r: number;
}

const KIND_COLOR: Record<NodeKind, string> = {
  case: "var(--color-neutral-700)",
  employer: "var(--color-accent-600)",
  evidence: "var(--color-accent-400)",
  open: "var(--color-accent-2-400)",
  order: "var(--color-accent-2-600)",
  reference: "var(--color-neutral-500)",
  note: "var(--color-neutral-600)",
  request: "var(--color-accent-2-700)",
  scan: "var(--color-neutral-400)",
  document: "var(--color-neutral-800)",
};

const KIND_LABEL: Record<NodeKind, string> = {
  case: "Casefile",
  employer: "Employer",
  evidence: "Evidence",
  open: "Open item · needs review",
  order: "Order",
  reference: "Reference",
  note: "Note",
  request: "Request",
  scan: "Scanned page",
  document: "Document",
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
    scanPages,
    documents,
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
  const [viewing, setViewing] = useState<EvidenceViewItem | null>(null);
  const width = 640;
  const height = 420;

  const nodes = useMemo<GNode[]>(() => {
    const list: GNode[] = [{ id: "case", label: "Casefile", kind: "case", r: 20 }];
    for (const ce of caseEmployers) list.push({ id: ce.id, label: ce.label, kind: "employer", r: 16 });
    for (const e of CASE_EVIDENCE) {
      const isOpen = e.type === "open";
      list.push({
        id: e.code,
        label: isOpen ? "Open item" : e.code,
        title: e.label,
        body: e.description,
        thumb: { code: e.code, label: e.label, variant: "construction", meta: e.description },
        kind: isOpen ? "open" : "evidence",
        r: 11,
      });
    }
    for (const page of scanPages) {
      list.push({
        id: `scan-${page.id}`,
        label: `Page ${page.id}`,
        title: `Scanned page ${page.id}`,
        body: page.text,
        thumb: { code: `Page ${page.id}`, label: `Scanned page ${page.id}`, variant: "notes", meta: page.text },
        kind: "scan",
        r: 9,
      });
    }
    for (const n of notes) {
      list.push({
        id: `note-${n.id}`,
        label: n.code,
        title: n.code,
        body: n.text,
        kind: n.kind === "request" ? "request" : "note",
        r: 9,
      });
    }
    for (const ce of caseEmployers) {
      const doc = reportDocs[ce.id] ?? defaultDoc(ce.id, caseEmployers);
      doc.orders.forEach((item, i) =>
        list.push({
          id: `order-${ce.id}-${i}`,
          label: `Order ${i + 1}`,
          title: `Order ${i + 1} · ${ce.label}`,
          body: item.text,
          kind: "order",
          r: 10,
        }),
      );
      doc.refs.forEach((item, i) =>
        list.push({
          id: `ref-${ce.id}-${i}`,
          label: `Reference ${i + 1}`,
          title: `Reference ${i + 1} · ${ce.label}`,
          body: `Reference:\n${item.reference}\n\nDetails discussed:\n${item.details}`,
          kind: "reference",
          r: 10,
        }),
      );
    }
    for (const d of documents) {
      list.push({
        id: `doc-${d.id}`,
        label: d.name,
        title: d.name,
        meta: formatBytes(d.size),
        thumb: { code: fileExtLabel(d.name), label: d.name, variant: "placeholder", meta: formatBytes(d.size) },
        kind: "document",
        r: 10,
      });
    }
    return list;
  }, [caseEmployers, notes, scanPages, documents, reportDocs, defaultDoc]);

  const labelById = useMemo(() => new Map(nodes.map((n) => [n.id, n.label])), [nodes]);
  const titleById = useMemo(() => new Map(nodes.map((n) => [n.id, n.title ?? n.label])), [nodes]);
  const kindById = useMemo(() => new Map(nodes.map((n) => [n.id, n.kind])), [nodes]);
  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

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

    for (const d of documents) {
      for (const empId of d.employers) edges.push([empId, `doc-${d.id}`]);
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
  }, [caseEmployers, notes, documents, reportDocs, defaultDoc, employerForSlot]);

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
                aria-label={`${n.title ?? n.label} (${KIND_LABEL[n.kind]})`}
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
          (() => {
            const node = nodeById.get(sel);
            return (
              <div className="card elev-md">
                <div className="card-kicker">{KIND_LABEL[kindById.get(sel) ?? "evidence"]}</div>
                <p
                  className="card-body"
                  style={{ fontWeight: 600, marginBottom: node ? 8 : 0, overflowWrap: "break-word" }}
                >
                  {titleById.get(sel)}
                </p>

                {node?.kind === "open" && (
                  <p className="sh-meta" style={{ fontSize: 12, marginBottom: 8 }}>
                    Sherlock couldn&apos;t confidently tie this to one employer or evidence code yet.
                    Tag it to an employer to fold it into that report, or resolve it directly.
                  </p>
                )}

                {node?.meta && (
                  <p className="sh-meta" style={{ fontSize: 12, marginBottom: 8 }}>
                    {node.meta}
                  </p>
                )}

                {node?.thumb && (
                  <div style={{ marginBottom: 8 }}>
                    <EvidenceThumb item={node.thumb} onOpen={setViewing} size={96} />
                  </div>
                )}

                {node?.body && (
                  <p className="sh-meta" style={{ whiteSpace: "pre-wrap" }}>
                    {node.body}
                  </p>
                )}

                <div className="sh-section" style={{ marginTop: "var(--space-4)" }}>
                  <div className="sh-kicker">Linked to</div>
                  {linkedTo.size === 0 ? (
                    <p className="sh-meta">Nothing linked yet.</p>
                  ) : (
                    <div className="sh-list">
                      {[...linkedTo].map((id) => (
                        <div
                          className="sh-row"
                          key={id}
                          role="button"
                          tabIndex={0}
                          style={{ cursor: "pointer" }}
                          onClick={() => selectGraphNode(id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              selectGraphNode(id);
                            }
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="sh-row-title" style={{ fontSize: 14 }}>
                              {titleById.get(id)}
                            </div>
                            <div className="sh-row-meta">{KIND_LABEL[kindById.get(id) ?? "evidence"]}</div>
                          </div>
                          <button
                            type="button"
                            className="sh-pillbtn"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeGraphLink(sel, id);
                            }}
                            aria-label={`Remove link to ${titleById.get(id)}`}
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
                            {n.title ?? n.label} · {KIND_LABEL[n.kind]}
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
            );
          })()
        ) : (
          <p className="sh-meta">Select a node to see its links and edit them.</p>
        )}
      </div>

      <EvidenceViewerOverlay item={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
