import type {
  CapturePhoto,
  CaseEvidence,
  Employer,
  EvidenceType,
  RecentCase,
  ReportDoc,
} from "./types";

const DESC = {
  e10: "A steep residential roof photographed from ground level, showing the unguarded leading edge running the width of the structure. No perimeter guardrail, warning line, or safety net is visible along this edge. The drop to grade below appears substantial, consistent with a two-storey building, and the ground surface is hard-packed dirt with construction debris rather than any protective surface. No anchor points, temporary railings, or catch platforms are visible anywhere along this section of roof. This condition presents a clear fall hazard for any worker operating at or near this edge without a personal fall arrest system or equivalent guardrail protection in place.",
  e11: "Close-up view of the roof surface showing asphalt shingles on a moderate slope, estimated at approximately a 4:12 pitch. The surface appears damp in sections, likely from the pressure washing observed nearby, which would further reduce traction for anyone standing or walking on it. No slip-resistant footwear, roof brackets, or toe boards are visible in the frame. A pitch of this steepness combined with a wet surface meaningfully increases the likelihood of a slip leading to a fall, particularly in the absence of any fall restraint or arrest equipment. This photo is best used to support the roof-pitch detail required for a fall-protection order.",
  e12: "Wide shot of the roof structure showing the ridge line and surrounding surface where a fall-protection anchor point would typically be installed. No permanent or temporary anchor points, lifelines, or tie-off locations are visible anywhere in this section of roof. Without an engineered anchor, any personal fall arrest system worn by a worker would have nowhere compliant to connect, rendering a harness alone ineffective. This gap is a key piece of evidence for the missing fall-protection-system element of the order, since it shows not just that protection wasn't worn, but that the roof was not equipped to support it even if it had been.",
  e13: "A worker is visible near the leading edge of the roof, oriented toward the edge with both hands occupied by equipment rather than any fall-arrest connection. No harness, lanyard, or visible fall-protection hardware is worn. The worker's stance places their center of gravity close to the unguarded drop, with no guardrail or physical barrier between them and the edge. This image directly supports the employment-relationship and work-at-height conditions of the fall-protection order, showing a worker actively performing tasks in a position where a fall to grade would be reasonably likely without intervention.",
  e14: "A worker is shown actively operating a pressure washer against the roof shingles, positioned within a few feet of the unprotected leading edge. Water spray and hose management appear to be affecting footing, and no harness, anchor line, or guardrail is present in the frame. The task itself, pressure washing a sloped and now-wetted surface at height, compounds the fall risk already present from the missing edge protection. This is the primary photo supporting the fall-protection order: it shows the specific work being performed, the height involved, and the complete absence of any personal or collective fall-protection measure at the moment of exposure.",
  ground: "Two workers are visible at ground level operating a cutting tool and loading cut material onto a nearby cart, with no third person present to direct or supervise the task. A vehicle consistent with a site supervisor's truck is parked nearby, but no one matching a supervisory role is visible anywhere in the frame. Neither worker appears to be wearing hearing or eye protection appropriate to the cutting operation being performed. The combination of an unsupervised cutting task and a supervisor's vehicle present but unoccupied suggests a possible gap in on-site supervision rather than a single momentary lapse, worth following up with the site representative.",
  firstAid: "A wall-mounted certificate for the site's designated first aid attendant, posted in what appears to be a site office or lunchroom area. The certificate's expiry date is legible and falls within the coming weeks, meaning the qualification will lapse if not renewed before that date. No renewal or replacement certificate is posted alongside it. While the attendant is currently qualified, the approaching expiry is worth flagging to the site representative now so the certification can be renewed before it lapses, avoiding a period where the site would be without a certified first aid attendant.",
  e17: "A general view of the site's access point and material staging area, showing the route workers and vehicles use to enter the active work zone. Stacked lumber, a dumpster, and assorted equipment are visible along the edge of the path, narrowing the usable width in places. No signage indicating an active roofing operation overhead is visible at this access point, and no delineation separates pedestrian access from the area beneath the roof's leading edge. This photo provides useful site-context evidence, showing how workers and visitors move through the site relative to the overhead work observed elsewhere in this casefile.",
};

/** Sample text Sherlock's scanner would lift from a notebook page — cycled as pages are scanned. */
export const SAMPLE_SCAN_TEXT: string[] = [
  "E-14 — worker pressure washing shingles, no harness. Approx 23 ft to grade, 4:12 pitch estimated by eye. Told rep this needs fall protection today, not after.",
  "Ground level — 2 workers cutting + loading, no one directing them. Supervisor's truck in lot but no supervisor seen. Need to figure out who this belongs to.",
  "REF-1 — first aid cert on wall expires in 3 wks. Reminded rep to renew before it lapses. Not an order, just a reference.",
  "REQ-1 — training records not on site today. Asked rep to email them over. Following up if not received in a few days.",
];

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
  { code: "E-10", label: "Leading edge — drop to grade", description: DESC.e10 },
  { code: "E-11", label: "Roof slope, 4:12 pitch", description: DESC.e11 },
  { code: "E-12", label: "Anchor points", description: DESC.e12 },
  { code: "E-13", label: "Worker at leading edge", description: DESC.e13 },
  { code: "E-14", label: "Pressure washing, no fall protection", description: DESC.e14 },
  { code: "E-15", label: "Ground-level cutting and loading", description: DESC.ground },
  { code: "E-16", label: "First aid attendant certificate", description: DESC.firstAid },
  { code: "E-17", label: "Site access and staging area", description: DESC.e17 },
];

export const CASE_EVIDENCE: CaseEvidence[] = [
  { code: "E-10", label: "Leading edge — drop to grade", description: DESC.e10, employer: "roofing", type: "order" },
  { code: "E-11", label: "Roof slope, 4:12 pitch", description: DESC.e11, employer: "roofing", type: "order" },
  { code: "E-12", label: "Anchor points", description: DESC.e12, employer: "roofing", type: "order" },
  { code: "E-13", label: "Worker at leading edge", description: DESC.e13, employer: "roofing", type: "order" },
  {
    code: "E-14",
    label: "Pressure washing, no fall protection",
    description: DESC.e14,
    employer: "roofing",
    type: "order",
  },
  {
    code: "—",
    label: "Ground-level cutting and loading, unsupervised",
    description: DESC.ground,
    employer: null,
    type: "open",
  },
  {
    code: "REF-1",
    label: "First aid certificate — expiring soon",
    description: DESC.firstAid,
    employer: "roofing",
    type: "reference",
  },
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

/**
 * The demo evidence and graph are authored against two positional employer
 * slots. A casefile started with custom employers fills those slots in order,
 * so the seeded evidence follows whoever the inspector actually named.
 */
export const EMPLOYER_SLOTS = ["roofing", "prime"] as const;
