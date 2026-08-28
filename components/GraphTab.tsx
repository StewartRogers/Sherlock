"use client";

import { useMemo, useRef, useState } from "react";
import { CASE_EVIDENCE, EVIDENCE_BY_CODE, fileExtLabel, formatBytes } from "@/lib/data";
import { edgeKey, useSherlock } from "@/lib/store";
import type { GraphEdge } from "@/lib/types";
import { EvidenceThumb, EvidenceViewerOverlay, type EvidenceViewItem } from "./EvidenceViewer";

type NodeKind =
  | "employer"
  | "evidence"
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

/**
 * Eight hand-picked hues (plus a neutral for Documents), each checked pairwise
 * against a simulated-colorblindness distance metric so they read as distinct
 * kinds rather than a rainbow. DISCONNECTED_COLOR is a ninth, reserved color —
 * checked against all eight and kept clear of every one of them — so a node
 * that isn't linked to any employer is never mistaken for a category.
 */
const KIND_COLOR: Record<NodeKind, string> = {
  employer: "#2a78d6",
  evidence: "#1baf7a",
  order: "#eb6834",
  request: "#e87ba4",
  reference: "#4a3aa7",
  note: "#eda100",
  scan: "#008300",
  document: "var(--color-neutral-800)",
};

const DISCONNECTED_COLOR = "#d03b3b";

/** Legend order, matching how the kinds were named in the request. */
const LEGEND_KINDS: NodeKind[] = [
  "evidence",
  "note",
  "request",
  "scan",
  "document",
  "order",
  "reference",
  "employer",
];

const KIND_LABEL: Record<NodeKind, string> = {
  employer: "Employer",
  evidence: "Evidence",
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

/** Converts a pointer event's screen coordinates into the SVG's own viewBox
    coordinate space, so a drag position lines up with node positions regardless
    of how the SVG is scaled on the page. */
function toSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const local = pt.matrixTransform(ctm.inverse());
  return { x: local.x, y: local.y };
}

/** Drag has to move a few px before it counts as a drag rather than a tap. */
const DRAG_THRESHOLD = 8;

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
    clearGraphSelection,
    addGraphLink,
    removeGraphLink,
  } = useSherlock();

  const [addTarget, setAddTarget] = useState("");
  const [viewing, setViewing] = useState<EvidenceViewItem | null>(null);
  const width = 640;
  const height = 420;

  const svgRef = useRef<SVGSVGElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const [dragFrom, setDragFrom] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

  const nodes = useMemo<GNode[]>(() => {
    const list: GNode[] = [];
    for (const ce of caseEmployers) list.push({ id: ce.id, label: ce.label, kind: "employer", r: 16 });
    for (const e of CASE_EVIDENCE) {
      list.push({
        id: e.code,
        label: e.code,
        title: e.label,
        body: e.description,
        thumb: { code: e.code, label: e.label, variant: "construction", meta: e.description },
        kind: "evidence",
        r: 11,
      });
    }
    for (const page of scanPages) {
      list.push({
        id: `scan-${page.id}`,
        label: `SN-${page.id}`,
        title: `SN-${page.id} — Scanned page`,
        body: page.text,
        thumb: { code: `SN-${page.id}`, label: "Scanned page", variant: "notes", meta: page.text },
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
      doc.orders.forEach((item) =>
        list.push({
          id: `order-${item.code}`,
          label: item.code,
          title: `${item.code} — Order for ${ce.label}`,
          body: item.text,
          kind: "order",
          r: 10,
        }),
      );
      doc.refs.forEach((item) =>
        list.push({
          id: `ref-${item.code}`,
          label: item.code,
          title: `${item.code} — Reference for ${ce.label}`,
          body: `Reference:\n${item.reference}\n\nDetails discussed:\n${item.details}`,
          kind: "reference",
          r: 10,
        }),
      );
    }
    for (const d of documents) {
      list.push({
        id: `doc-${d.id}`,
        label: d.code,
        title: `${d.code} — ${d.name}`,
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
      doc.orders.forEach((item) => {
        const id = `order-${item.code}`;
        edges.push([ce.id, id]);
        for (const code of item.evidence) if (EVIDENCE_BY_CODE[code]) edges.push([id, code]);
      });
      doc.refs.forEach((item) => {
        const id = `ref-${item.code}`;
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

  /** The node (other than excludeId) whose circle the point falls inside, if any —
      used to find a drop target while dragging a connection from one node to another. */
  function findNodeAt(pt: { x: number; y: number }, excludeId: string) {
    for (const n of nodes) {
      if (n.id === excludeId) continue;
      const p = pos.get(n.id);
      if (!p) continue;
      if (Math.hypot(pt.x - p.x, pt.y - p.y) <= n.r + 6) return n;
    }
    return null;
  }

  /** Anything (other than an employer node itself) with no path — direct or
      via a chain of other links, e.g. evidence -> order -> employer — to an
      employer. Only truly stranded artifacts get flagged; a note linked only
      to another note, never reaching an employer, still counts as stranded. */
  const employerIds = useMemo(() => new Set(caseEmployers.map((ce) => ce.id)), [caseEmployers]);
  const reachesEmployer = useMemo(() => {
    const adjacent = new Map<string, string[]>();
    for (const [a, b] of edges) {
      (adjacent.get(a) ?? adjacent.set(a, []).get(a)!).push(b);
      (adjacent.get(b) ?? adjacent.set(b, []).get(b)!).push(a);
    }
    const seen = new Set<string>(employerIds);
    const queue = [...employerIds];
    while (queue.length) {
      const cur = queue.shift()!;
      for (const next of adjacent.get(cur) ?? []) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    return seen;
  }, [edges, employerIds]);
  const isDisconnected = (n: GNode) => n.kind !== "employer" && !reachesEmployer.has(n.id);

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

  /** Named, ref-reading event handlers, passed directly as the JSX prop (no
      wrapping arrow) so the node id has to travel via a data attribute rather
      than a closure — that's what lets React's ref-safety lint see these as
      real event handlers instead of ref reads happening during render. */
  function handleNodePointerDown(e: React.PointerEvent<SVGGElement>) {
    const id = e.currentTarget.dataset.nodeId;
    if (!id) return;
    e.stopPropagation();
    const svg = svgRef.current;
    if (!svg) return;
    const pt = toSvgPoint(svg, e.clientX, e.clientY);
    dragStart.current = pt;
    dragged.current = false;
    setDragFrom(id);
    setDragPos(pt);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  /** A gesture the browser took over (touch scroll, long-press menu) fires
      pointercancel instead of pointerup; without this the dashed drag line
      stays anchored to the node indefinitely. */
  function handleNodePointerCancel() {
    dragStart.current = null;
    dragged.current = false;
    setDragFrom(null);
    setDragPos(null);
  }

  function handleNodePointerMove(e: React.PointerEvent<SVGGElement>) {
    const id = e.currentTarget.dataset.nodeId;
    if (!id || dragFrom !== id) return;
    const svg = svgRef.current;
    if (!svg) return;
    const pt = toSvgPoint(svg, e.clientX, e.clientY);
    if (dragStart.current && Math.hypot(pt.x - dragStart.current.x, pt.y - dragStart.current.y) > DRAG_THRESHOLD) {
      dragged.current = true;
    }
    setDragPos(pt);
  }

  function handleNodePointerUp(e: React.PointerEvent<SVGGElement>) {
    const id = e.currentTarget.dataset.nodeId;
    if (!id) return;
    e.stopPropagation();
    if (dragFrom !== id) return;
    const svg = svgRef.current;
    const pt = svg ? toSvgPoint(svg, e.clientX, e.clientY) : null;
    if (dragged.current && pt) {
      const target = findNodeAt(pt, id);
      if (target) addGraphLink(id, target.id);
    } else {
      selectGraphNode(id);
    }
    setDragFrom(null);
    setDragPos(null);
    dragStart.current = null;
  }

  return (
    <div className="sh-cols" onClick={clearGraphSelection}>
      <div className="sh-measure">
        <h2 className="sh-title">Evidence graph</h2>
        <p className="sh-meta">
          Tap a node to trace what it connects to and edit its links. Drag from one node to
          another to connect them, or tap a line to remove it. Tap empty space to deselect.
          Editing links changes connections only — the evidence underneath stays exactly as
          captured.
        </p>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", height: "auto", maxHeight: 460, marginTop: "var(--space-4)", touchAction: "none" }}
          role="group"
          aria-label="Casefile evidence graph"
        >
          {edges.map(([a, b]) => {
            const pa = pos.get(a);
            const pb = pos.get(b);
            if (!pa || !pb) return null;
            const active = sel !== null && (a === sel || b === sel);
            return (
              <g key={`${a}::${b}`}>
                <line
                  x1={pa.x}
                  y1={pa.y}
                  x2={pb.x}
                  y2={pb.y}
                  className="sh-graph-edge-hit"
                  stroke="transparent"
                  strokeWidth={14}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeGraphLink(a, b);
                  }}
                  aria-hidden="true"
                />
                <line
                  x1={pa.x}
                  y1={pa.y}
                  x2={pb.x}
                  y2={pb.y}
                  className="sh-graph-edge-line"
                  stroke={active ? "var(--color-accent)" : sel ? "var(--color-neutral-200)" : "var(--color-divider)"}
                  strokeWidth={active ? 2 : 1}
                  style={{ pointerEvents: "none" }}
                />
              </g>
            );
          })}

          {dragFrom &&
            dragPos &&
            (() => {
              const from = pos.get(dragFrom);
              if (!from) return null;
              return (
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={dragPos.x}
                  y2={dragPos.y}
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  style={{ pointerEvents: "none" }}
                />
              );
            })()}

          {(() => {
            const dragHoverTarget = dragFrom && dragPos ? findNodeAt(dragPos, dragFrom) : null;
            return nodes.map((n) => {
            const p = pos.get(n.id);
            if (!p) return null;
            const isSel = sel === n.id;
            const dim = sel !== null && !isSel && !linkedTo.has(n.id);
            const flagged = isDisconnected(n);
            const baseColor = flagged ? DISCONNECTED_COLOR : KIND_COLOR[n.kind];
            const isDropTarget = dragHoverTarget?.id === n.id;
            return (
              <g
                key={n.id}
                data-node-id={n.id}
                onPointerDown={handleNodePointerDown}
                onPointerMove={handleNodePointerMove}
                onPointerUp={handleNodePointerUp}
                onPointerCancel={handleNodePointerCancel}
                onLostPointerCapture={handleNodePointerCancel}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    selectGraphNode(n.id);
                  }
                }}
                style={{ cursor: "pointer", touchAction: "none" }}
                tabIndex={0}
                role="button"
                aria-pressed={isSel}
                aria-label={`${n.title ?? n.label} (${KIND_LABEL[n.kind]}${flagged ? ", not connected to an employer" : ""})`}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={n.r}
                  fill={dim ? `color-mix(in srgb, ${baseColor} 35%, white)` : baseColor}
                  stroke={isSel || isDropTarget ? "var(--color-text)" : "color-mix(in srgb, var(--color-text) 30%, transparent)"}
                  strokeWidth={isSel || isDropTarget ? 2 : 1}
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
            });
          })()}
        </svg>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 14px", marginTop: "var(--space-3)" }}>
          {LEGEND_KINDS.map((k) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, opacity: 0.75 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: KIND_COLOR[k],
                  flex: "none",
                }}
                aria-hidden="true"
              />
              {KIND_LABEL[k]}
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, opacity: 0.75 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: DISCONNECTED_COLOR,
                flex: "none",
              }}
              aria-hidden="true"
            />
            Not connected to an employer
          </div>
        </div>
      </div>

      <div className="sh-measure">
        {sel ? (
          (() => {
            const node = nodeById.get(sel);
            /* The selection survives its node — delete the document a node
               stands for and this used to render a blank titled card. */
            if (!node) {
              return <p className="sh-meta">Select a node to see its links and edit them.</p>;
            }
            return (
              <div className="card elev-md" onClick={(e) => e.stopPropagation()}>
                <div className="card-kicker">{KIND_LABEL[kindById.get(sel) ?? "evidence"]}</div>
                <p
                  className="card-body"
                  style={{ fontWeight: 600, marginBottom: node ? 8 : 0, overflowWrap: "break-word" }}
                >
                  {titleById.get(sel)}
                </p>

                {node && isDisconnected(node) && (
                  <p
                    className="sh-meta"
                    style={{ fontSize: 12, marginBottom: 8, color: DISCONNECTED_COLOR }}
                  >
                    Not linked to an employer yet — tag it to one, or add a link below, to fold it
                    into that employer&apos;s report.
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
                            /* Only act on the row itself. Without this the
                               Remove button's Enter keydown bubbles here and
                               preventDefault cancels its activation, so the
                               keyboard path removed nothing and re-selected
                               the node instead. */
                            if (e.target !== e.currentTarget) return;
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
                        /* The selection can move while a target is chosen.
                           Rather than clear it from an effect, treat a target
                           that is no longer offered as no target at all. */
                        value={addableNodes.some((n) => n.id === addTarget) ? addTarget : ""}
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
                        disabled={!addableNodes.some((n) => n.id === addTarget)}
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
