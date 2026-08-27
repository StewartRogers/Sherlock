import type {
  CapturePhoto,
  CaseEvidence,
  Employer,
  EvidenceType,
  JobsiteLocation,
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

/**
 * Sample text Sherlock's scanner would lift from a notebook page — cycled as
 * pages are scanned. Each line opens with the evidence/request code the
 * inspector jotted down on paper, the same code stamped on the matching
 * photo or request, so the scanned page and its evidence cross-reference
 * each other by code alone.
 */
export const SAMPLE_SCAN_TEXT: string[] = [
  "E-5 — worker pressure washing shingles, no harness. Approx 24 ft to grade, 4:12 pitch estimated by eye. Told rep this needs fall protection today, not after.",
  "E-6 — 2 workers cutting + loading, no one directing them. Supervisor's truck in lot but no supervisor seen. Need to figure out who this belongs to.",
  "E-7 — first aid cert on wall expires in 3 wks. Reminded rep to renew before it lapses. Not an order, just a reference.",
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
    note: "This Inspection Report contains an order to stop work.\n\nI conducted an inspection at this workplace, a two-storey townhouse with the wood frame partially completed and roofing work underway. Rainshield Roofing, the roofing contractor for the workplace, was performing roofing related work activities at the time of this inspection.\n\nFall Protection\nAs I approached the site, I observed a worker performing roofing work at the leading edge of the roof, pressure washing shingles with no system of fall protection in use (refer to Order ORD-1). I asked whether fall protection equipment was available on site; none could be produced.\n\nI advised the employer of the requirement to have an appropriate system of fall protection in place when workers are exposed to fall hazards of 10 feet or more above a surface or grade.\n\nStop Work\nI determined that the worker was at high risk of death or serious injury from a fall hazard of approximately 24 feet to the hard-packed ground below, which was covered in construction debris. The employer was informed that a stop work order was being issued, as no compliant fall protection equipment was available on site and the worker had not received the instruction, training, or supervision required to work safely at heights (refer to Order ORD-2). \n\nWe discussed the measures needed to achieve compliance before the stop work order can be canceled. The employer was also advised that violating a stop work order can lead to further enforcement action, including a financial penalty.\n\nOther Observations\nThe site's first aid attendant certificate was also reviewed and found to be nearing its expiry date (refer to Reference RR-1). Two workers were separately observed cutting and loading material at ground level with no one directing the work; this has been logged as an open item pending confirmation of which employer is responsible.\n\nDue Diligence\nWe discussed due diligence. Due diligence requires taking all reasonable steps to protect workers from harm. \"All reasonable steps\" is based on the level of judgment and care a person would reasonably be expected to exercise under the circumstances. An employer that actively manages health and safety and takes all reasonable steps to protect workers from harm is being duly diligent.\n\nResources\nThe following WorkSafeBC resources were discussed with the employer:\n• Due diligence — WorkSafeBC guidance on reasonable care\n• Creating a fall protection plan for your worksite — fillable template\n• Toolbox Meeting Guide — working at heights\n\nReview this draft, then write the Inspection Report in WSM 360 in your own words.",
    noteEvidence: ["E-1", "E-2", "E-3", "E-4", "E-5", "E-7"],
    orders: [
      {
        code: "ORD-1",
        text: "I observed a worker for Rainshield Roofing performing roofing work on a 4:12 sloped roof (confirmed using a roof slope calculator). The worker was not protected by a system of fall protection and was exposed to a fall hazard of approximately 24 feet (confirmed using a Hilti measuring laser) above hard-packed ground covered in construction debris.\n\nThis is in contravention of the Occupational Health and Safety Regulation Section 11.2(1)(a).\n\nUnless elsewhere provided for in this Regulation, an employer must ensure that a fall protection system is used when work is being done at a place from which a fall of 3 m (10 ft) or more may occur.\n\nMeasures to Ensure Compliance:\nPrior to resuming work at heights, the employer must demonstrate a compliant fall protection system appropriate for the work to be performed.",
        evidence: ["E-1", "E-2", "E-3", "E-4", "E-5"],
      },
      {
        code: "ORD-2",
        text: "I determined that the worker for Rainshield Roofing was at high risk of death or serious injury from a fall hazard of approximately 24 feet to the hard-packed ground below, which was covered in construction debris. No compliant fall protection equipment was available on site, and the worker had not received the instruction, training, or supervision required to work safely at heights.\n\nThis is in contravention of the Workers Compensation Act Section 90(2).\n\nThe Board may make an order under subsection (1) if the Board has reasonable grounds for believing there is a high risk of serious injury, serious illness or death to a worker at the workplace.\n\nMeasures to Ensure Compliance:\nAll work at heights on this site must stop immediately. Before work resumes, the employer must demonstrate that a compliant fall protection system is available and in use, and that workers have received the required instruction, training, and supervision to work safely at heights.",
        evidence: ["E-1", "E-2", "E-3", "E-4", "E-5"],
      },
    ],
    refs: [
      {
        code: "RR-1",
        reference:
          "OHS Regulation — First aid assessment\nAn employer must ensure that a worker holding a valid first aid certificate appropriate to the assessed first aid level is available at the workplace, and that the certification remains current.",
        details:
          "The site's designated first aid attendant certificate was reviewed and found to expire within the coming weeks. The site representative was advised to renew or replace the certification before it lapses, so the workplace remains covered by a currently certified attendant.",
        evidence: ["E-7"],
      },
    ],
  },
  {
    note: "Drafted from the photos and notes tagged to Meridian Construction. Two workers were observed cutting and loading material at ground level with no one directing the work, and no supervisor present at the time, though a supervisor's vehicle was parked on site. Review this summary, then write the Inspection Report in WSM 360 in your own words.",
    noteEvidence: ["E-6"],
    orders: [
      {
        code: "ORD-3",
        text: "Two workers were cutting and loading material at ground level with no one directing the work. A supervisor's vehicle was on site, but no supervisor was present or visible during the walkthrough. This reads as a supervision gap rather than a specific task hazard, and may involve both Meridian Construction and Rainshield Roofing depending on whose workers were involved. Confirm the employer relationship and the supervision requirement against the evidence below, then draft the order in WSM 360.",
        evidence: ["E-6"],
      },
    ],
    refs: [],
  },
];

/** The shots the shutter walks through, in order. */
export const CAPTURE_PHOTOS: CapturePhoto[] = [
  { code: "E-1", label: "Leading edge — drop to grade", description: DESC.e10 },
  { code: "E-2", label: "Roof slope, 4:12 pitch", description: DESC.e11 },
  { code: "E-3", label: "Anchor points", description: DESC.e12 },
  { code: "E-4", label: "Worker at leading edge", description: DESC.e13 },
  { code: "E-5", label: "Pressure washing, no fall protection", description: DESC.e14 },
  { code: "E-6", label: "Ground-level cutting and loading", description: DESC.ground },
  { code: "E-7", label: "First aid attendant certificate", description: DESC.firstAid },
  { code: "E-8", label: "Site access and staging area", description: DESC.e17 },
];

export const CASE_EVIDENCE: CaseEvidence[] = [
  { code: "E-1", label: "Leading edge — drop to grade", description: DESC.e10, employer: "roofing", type: "order" },
  { code: "E-2", label: "Roof slope, 4:12 pitch", description: DESC.e11, employer: "roofing", type: "order" },
  { code: "E-3", label: "Anchor points", description: DESC.e12, employer: "roofing", type: "order" },
  { code: "E-4", label: "Worker at leading edge", description: DESC.e13, employer: "roofing", type: "order" },
  {
    code: "E-5",
    label: "Pressure washing, no fall protection",
    description: DESC.e14,
    employer: "roofing",
    type: "order",
  },
  {
    code: "E-6",
    label: "Ground-level cutting and loading, unsupervised",
    description: DESC.ground,
    employer: null,
    type: "open",
  },
  {
    code: "E-7",
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
  {
    id: "seed-1",
    name: "Meridian Townhomes",
    address: "1450 Meridian Rd, Coquitlam",
    date: "2026-08-18",
    employers: ["Rainshield Roofing", "Meridian Construction"],
  },
  {
    id: "seed-2",
    name: "Harbourview Apartments",
    address: "220 Harbour St, New Westminster",
    date: "2026-08-12",
    employers: ["Harbourview Construction", "Coastal Electrical"],
  },
  {
    id: "seed-3",
    name: "Cascade Industrial Park",
    address: "90 Cascade Way, Abbotsford",
    date: "2026-08-07",
    employers: ["Cascade Builders", "Pinecrest Roofing"],
  },
  {
    id: "seed-4",
    name: "Northgate Retail Fitout",
    address: "5600 Northgate Dr, Surrey",
    date: "2026-07-30",
    employers: ["Northgate Interiors", "Apex Electrical"],
  },
  {
    id: "seed-5",
    name: "Elmwood Care Facility",
    address: "870 Elmwood Ave, Burnaby",
    date: "2026-07-22",
    employers: ["Elmwood Construction", "Summit Mechanical"],
  },
  {
    id: "seed-6",
    name: "Riverbend Bridge Repair",
    address: "12 Riverbend Rd, Maple Ridge",
    date: "2026-07-15",
    employers: ["Riverbend Contracting"],
  },
  {
    id: "seed-7",
    name: "Sunridge Warehouse",
    address: "340 Sunridge Blvd, Delta",
    date: "2026-07-09",
    employers: ["Sunridge Logistics", "Delta Steel"],
  },
];

export const CASES_PER_PAGE = 5;

/** Evidence carried over from earlier in the inspection, before this session. */
export const CARRIED_PHOTOS = 7;
export const CARRIED_NOTES = 4;

/** Stamped onto a new casefile in place of a real geolocation + clock read. */
export const NEW_CASE_STAMP = {
  address: "1450 Meridian Rd, Coquitlam",
  date: "2026-08-18",
  timestamp: "Aug 18, 2026 · 9:14 a.m.",
};

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Formats a RecentCase's ISO date (YYYY-MM-DD) as e.g. "Aug 18, 2026". */
export function formatCaseDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTH_ABBR[(m ?? 1) - 1]} ${d}, ${y}`;
}

/** The address · date line shown under a casefile's name. */
export function caseMeta(rc: RecentCase): string {
  return `${rc.address} · ${formatCaseDate(rc.date)}`;
}

export function caseYear(iso: string): number {
  return Number(iso.slice(0, 4));
}

/** 1-12. */
export function caseMonth(iso: string): number {
  return Number(iso.slice(5, 7));
}

/** The Monday that starts the ISO week containing this date, as YYYY-MM-DD. */
export function weekStartOf(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - ((day + 6) % 7));
  return date.toISOString().slice(0, 10);
}

/** "Week of Aug 17, 2026" label for a Monday-start week key from weekStartOf(). */
export function weekLabel(weekStartIso: string): string {
  return `Week of ${formatCaseDate(weekStartIso)}`;
}

/**
 * Known jobsites Sherlock can match a device's coordinates against, standing
 * in for a real reverse-geocoding service. "Use my location" finds the
 * nearest one and drops its address into the field for the inspector to edit.
 */
export const JOBSITE_LOCATIONS: JobsiteLocation[] = [
  { address: "1450 Meridian Rd, Coquitlam", lat: 49.2838, lng: -122.7932 },
  { address: "220 Harbour St, New Westminster", lat: 49.2057, lng: -122.911 },
  { address: "90 Cascade Way, Abbotsford", lat: 49.0504, lng: -122.3045 },
  { address: "5600 Northgate Dr, Surrey", lat: 49.1913, lng: -122.849 },
  { address: "870 Elmwood Ave, Burnaby", lat: 49.2488, lng: -122.9805 },
  { address: "12 Riverbend Rd, Maple Ridge", lat: 49.2193, lng: -122.5984 },
  { address: "340 Sunridge Blvd, Delta", lat: 49.0847, lng: -122.911 },
];

/** Great-circle distance in km, for picking the closest jobsite to a coordinate. */
function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** The jobsite in JOBSITE_LOCATIONS closest to the given coordinate. */
export function nearestJobsite(lat: number, lng: number): JobsiteLocation {
  return JOBSITE_LOCATIONS.reduce((closest, site) =>
    haversineKm(lat, lng, site.lat, site.lng) < haversineKm(lat, lng, closest.lat, closest.lng)
      ? site
      : closest,
  );
}

/** A short file-type label for a document's stand-in thumbnail, e.g. "PDF". */
export function fileExtLabel(name: string): string {
  const ext = name.split(".").pop();
  return ext && ext !== name ? ext.slice(0, 4).toUpperCase() : "DOC";
}

/** Formats a byte count for display next to an uploaded document. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`;
}

/**
 * The demo evidence and graph are authored against two positional employer
 * slots. A casefile started with custom employers fills those slots in order,
 * so the seeded evidence follows whoever the inspector actually named.
 */
export const EMPLOYER_SLOTS = ["roofing", "prime"] as const;
