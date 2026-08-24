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
  /** The longer caption Sherlock would draft from the photo itself. */
  description: string;
}

export interface CaseEvidence {
  code: string;
  label: string;
  /** The longer caption Sherlock would draft from the photo itself. */
  description: string;
  /** Slot key into the case's employer list, or null when unassigned. */
  employer: EmployerSlot | null;
  type: EvidenceType;
}

export interface ScanPage {
  id: number;
  /** Extracted text from the page — editable, since a scan isn't always perfect. */
  text: string;
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

/** A drafted order or regulation reference, with the evidence codes it was drawn from. */
export interface ReportItem {
  text: string;
  evidence: string[];
}

export interface ReportDoc {
  note: string;
  noteEvidence: string[];
  orders: ReportItem[];
  refs: ReportItem[];
}

export interface RecentCase {
  name: string;
  meta: string;
}

export type GraphEdge = [string, string];
