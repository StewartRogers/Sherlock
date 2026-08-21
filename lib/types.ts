export type Screen = "home" | "newcase" | "app";

export type Tab = "capture" | "notes" | "scan" | "more" | "case" | "report" | "graph";

export type NoteKind = "note" | "request";

export type EvidenceType = "order" | "reference" | "request" | "open";

export interface Employer {
  id: string;
  label: string;
}

export interface CapturePhoto {
  code: string;
  label: string;
}

export interface CaseEvidence {
  code: string;
  label: string;
  /** Slot key into the case's employer list, or null when unassigned. */
  employer: EmployerSlot | null;
  type: EvidenceType;
}

/** The demo evidence is authored against two positional employer slots. */
export type EmployerSlot = "roofing" | "prime";

export interface Note {
  id: number;
  text: string;
  employers: string[];
  kind: NoteKind;
  code: string;
}

export interface ReportDoc {
  note: string;
  orders: string[];
  refs: string[];
}

export interface RecentCase {
  name: string;
  meta: string;
}

export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  r: number;
  base: string;
  anchor: "middle" | "start";
  ty: number;
}

export type GraphEdge = [string, string];
