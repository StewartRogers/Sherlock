import type {
  CapturePhoto,
  CaseEvidence,
  Employer,
  EvidenceType,
  GraphEdge,
  GraphNode,
  RecentCase,
  ReportDoc,
} from "./types";

/**
 * Seed report copy, cycled per employer so each has distinct starting text.
 * Written as Sherlock's draft assessment from the tagged evidence — a
 * starting point the inspector confirms and rewrites in WSM 360, not a
 * finished order. Each order/reference carries the evidence codes it was
 * drawn from, shown as thumbnails alongside the text.
 */
export const REPORT_DEFAULTS: ReportDoc[] = [
  {
    note: "Drafted from the photos, notes, and scanned pages tagged to Rainshield Roofing. A worker was observed pressure washing shingles near the leading edge of a steep roof with no personal fall protection in use — roughly 23 feet to grade on a 4:12 pitch. The site's first aid attendant certificate is also nearing its expiry date. Review this summary, then write the Inspection Report in WSM 360 in your own words.",
    noteEvidence: ["E-10", "E-11", "E-12", "E-13", "E-14", "REF-1"],
    orders: [
      {
        text: "Fall protection was not in use at the leading edge of the roof. The evidence shows a worker pressure washing shingles within reach of an unprotected edge, with no anchor point, lanyard, or guardrail visible, and no barrier preventing access to the edge. This reads as a contravention of OHS Regulation 11.2(1)(a): an employment relationship with Rainshield Roofing, work performed at a height where a fall could cause injury, and the absence of an adequate fall protection system. Confirm each condition against the evidence below, then draft the order in WSM 360 with the specific distance to grade and roof pitch.",
        evidence: ["E-10", "E-11", "E-12", "E-13", "E-14"],
      },
    ],
    refs: [
      {
        text: "The site's first aid attendant certificate is due to expire shortly. No order follows from this on its own, but it's worth recording as a regulation reference and following up with the site representative before the certificate lapses.",
        evidence: ["REF-1"],
      },
    ],
  },
  {
    note: "Drafted from the photos and notes tagged to Meridian Construction. Two workers were observed cutting and loading material at ground level with no one directing the work, and no supervisor present at the time, though a supervisor's vehicle was parked on site. Review this summary, then write the Inspection Report in WSM 360 in your own words.",
    noteEvidence: ["—"],
    orders: [
      {
        text: "Two workers were cutting and loading material at ground level with no one directing the work. A supervisor's vehicle was on site, but no supervisor was present or visible during the walkthrough. This reads as a supervision gap rather than a specific task hazard, and may involve both Meridian Construction and Rainshield Roofing depending on whose workers were involved. Confirm the employer relationship and the supervision requirement against the evidence below, then draft the order in WSM 360.",
        evidence: ["—"],
      },
    ],
    refs: [],
  },
];

/** The shots the shutter walks through, in order. */
export const CAPTURE_PHOTOS: CapturePhoto[] = [
  { code: "E-10", label: "Leading edge — drop to grade" },
  { code: "E-11", label: "Roof slope, 4:12 pitch" },
  { code: "E-12", label: "Anchor points" },
  { code: "E-13", label: "Worker at leading edge" },
  { code: "E-14", label: "Pressure washing, no fall protection" },
  { code: "E-15", label: "Ground-level cutting and loading" },
  { code: "E-16", label: "First aid attendant certificate" },
  { code: "E-17", label: "Site access and staging area" },
];

export const CASE_EVIDENCE: CaseEvidence[] = [
  { code: "E-10", label: "Leading edge — drop to grade", employer: "roofing", type: "order" },
  { code: "E-11", label: "Roof slope, 4:12 pitch", employer: "roofing", type: "order" },
  { code: "E-12", label: "Anchor points", employer: "roofing", type: "order" },
  { code: "E-13", label: "Worker at leading edge", employer: "roofing", type: "order" },
  { code: "E-14", label: "Pressure washing, no fall protection", employer: "roofing", type: "order" },
  { code: "—", label: "Ground-level cutting and loading, unsupervised", employer: null, type: "open" },
  { code: "REF-1", label: "First aid certificate — expiring soon", employer: "roofing", type: "reference" },
];

/** Look up a case-evidence item's label by its code, for rendering thumbnails. */
export const EVIDENCE_BY_CODE: Record<string, CaseEvidence> = Object.fromEntries(
  CASE_EVIDENCE.map((e) => [e.code, e]),
);

export const DEFAULT_EMPLOYERS: Employer[] = [
  { id: "roofing", label: "Rainshield Roofing — sub" },
  { id: "prime", label: "Meridian Construction — prime" },
];

export const TYPE_TAG: Record<EvidenceType, { label: string; cls: string }> = {
  order: { label: "Order", cls: "tag tag-accent-2" },
  reference: { label: "Reference", cls: "tag tag-outline" },
  request: { label: "Request", cls: "tag tag-outline" },
  open: { label: "Open · needs review", cls: "tag tag-neutral" },
};

export const RECENT_CASES: RecentCase[] = [
  { name: "Meridian Townhomes", meta: "1450 Meridian Rd, Coquitlam · Aug 18, 2026" },
  { name: "Harbourview Apartments", meta: "220 Harbour St, New Westminster · Aug 12, 2026" },
  { name: "Cascade Industrial Park", meta: "90 Cascade Way, Abbotsford · Aug 7, 2026" },
  { name: "Northgate Retail Fitout", meta: "5600 Northgate Dr, Surrey · Jul 30, 2026" },
  { name: "Elmwood Care Facility", meta: "870 Elmwood Ave, Burnaby · Jul 22, 2026" },
  { name: "Riverbend Bridge Repair", meta: "12 Riverbend Rd, Maple Ridge · Jul 15, 2026" },
  { name: "Sunridge Warehouse", meta: "340 Sunridge Blvd, Delta · Jul 9, 2026" },
];

export const CASES_PER_PAGE = 5;

/** Stamped onto a new casefile in place of a real geolocation + clock read. */
export const NEW_CASE_STAMP = {
  address: "1450 Meridian Rd, Coquitlam",
  timestamp: "Aug 18, 2026 · 9:14 a.m.",
};

export const GRAPH_NODES: GraphNode[] = [
  { id: "case", label: "Casefile", x: 80, y: 210, r: 26, base: "var(--color-neutral-700)", anchor: "middle", ty: -36 },
  { id: "roofing", label: "Rainshield Roofing", x: 270, y: 110, r: 22, base: "var(--color-accent-600)", anchor: "middle", ty: -32 },
  { id: "prime", label: "Meridian Construction", x: 270, y: 330, r: 22, base: "var(--color-accent-2-600)", anchor: "middle", ty: 36 },
  { id: "e10", label: "E-10", x: 470, y: 30, r: 14, base: "var(--color-accent-400)", anchor: "start", ty: 4 },
  { id: "e11", label: "E-11", x: 470, y: 75, r: 14, base: "var(--color-accent-400)", anchor: "start", ty: 4 },
  { id: "e12", label: "E-12", x: 470, y: 120, r: 14, base: "var(--color-accent-400)", anchor: "start", ty: 4 },
  { id: "e13", label: "E-13", x: 470, y: 165, r: 14, base: "var(--color-accent-400)", anchor: "start", ty: 4 },
  { id: "e14", label: "E-14", x: 470, y: 210, r: 14, base: "var(--color-accent-400)", anchor: "start", ty: 4 },
  { id: "ref1", label: "REF-1", x: 470, y: 255, r: 14, base: "var(--color-neutral-500)", anchor: "start", ty: 4 },
  { id: "open", label: "Ground-level issue", x: 470, y: 300, r: 15, base: "var(--color-neutral-400)", anchor: "start", ty: 4 },
  { id: "req1", label: "REQ-1", x: 470, y: 355, r: 14, base: "var(--color-neutral-500)", anchor: "start", ty: 4 },
];

export const GRAPH_EDGES: GraphEdge[] = [
  ["case", "roofing"], ["case", "prime"],
  ["roofing", "e10"], ["roofing", "e11"], ["roofing", "e12"], ["roofing", "e13"], ["roofing", "e14"],
  ["roofing", "ref1"], ["roofing", "open"], ["prime", "open"], ["prime", "req1"],
];

/**
 * The demo evidence and graph are authored against two positional employer
 * slots. A casefile started with custom employers fills those slots in order,
 * so the seeded evidence follows whoever the inspector actually named.
 */
export const EMPLOYER_SLOTS = ["roofing", "prime"] as const;
