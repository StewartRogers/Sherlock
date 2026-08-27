/**
 * A stand-in for an AI chat backend: it answers questions about the active
 * casefile by pattern-matching the question and querying the casefile's own
 * data, the same way the rest of the app fakes AI (e.g. the pre-drafted
 * photo captions in data.ts). Nothing here calls out to a real model.
 */
import { CASE_EVIDENCE, formatBytes, TYPE_TAG } from "./data";
import type { ChatCounts, Employer, EmployerSlot, Note, ReportDoc, ScanPage, UploadedDocument } from "./types";

/** Everything collectSearchableItems() needs — a subset of ChatContext, so
 *  callers that don't have a full chat context (e.g. the casefile list) can
 *  still search this same text pool. */
export interface SearchContext {
  notes: Note[];
  scanPages: ScanPage[];
  documents: UploadedDocument[];
  reportByEmployer: { employer: Employer; doc: ReportDoc }[];
}

export interface ChatContext extends SearchContext {
  caseEmployers: Employer[];
  employerForSlot: (slot: EmployerSlot | null) => Employer | null;
  counts: ChatCounts;
}

export interface ChatAnswer {
  text: string;
  sources: string[];
}

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "of", "in", "on", "for", "to", "and", "with",
  "about", "what", "which", "any", "was", "were", "has", "have", "do", "does",
  "did", "this", "that", "it", "me", "tell", "show", "find", "list", "there",
]);

function plural(n: number, word: string): string {
  if (n === 1) return `1 ${word}`;
  const suffix = /(?:[sxz]|[cs]h)$/i.test(word) ? "es" : "s";
  return `${n} ${word}${suffix}`;
}

function truncate(text: string, n: number): string {
  const t = text.trim();
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
}

function wordsOf(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9-]+/g) ?? [];
}

function helpText(): string {
  return (
    'Ask me things like "how many photos are there", "what\'s tagged to Rainshield ' +
    'Roofing", "what\'s still open", "list the orders", or search a keyword like ' +
    '"fall protection". You can also look up a code directly, e.g. "E-3" or "ORD-1".'
  );
}

function lookupCode(code: string, ctx: ChatContext): ChatAnswer | null {
  const evidence = CASE_EVIDENCE.find((e) => e.code === code);
  if (evidence) {
    const emp = ctx.employerForSlot(evidence.employer)?.label ?? "unassigned";
    return {
      text: `${code} — ${evidence.label} (${TYPE_TAG[evidence.type].label}, tagged to ${emp}). ${evidence.description}`,
      sources: [code],
    };
  }
  const note = ctx.notes.find((n) => n.code === code);
  if (note) {
    const emp = note.employers.length
      ? note.employers
          .map((id) => ctx.caseEmployers.find((c) => c.id === id)?.label)
          .filter(Boolean)
          .join(", ")
      : "unassigned";
    return {
      text: `${code} (${note.kind === "request" ? "Request" : "Note"}, tagged to ${emp}) — ${note.text}`,
      sources: [code],
    };
  }
  const doc = ctx.documents.find((d) => d.code === code);
  if (doc) {
    return { text: `${code} — ${doc.name}, ${formatBytes(doc.size)}.`, sources: [code] };
  }
  const scan = ctx.scanPages.find((p) => `SN-${p.id}` === code);
  if (scan) {
    return { text: `${code} — scanned page: ${scan.text}`, sources: [code] };
  }
  for (const { employer, doc: rd } of ctx.reportByEmployer) {
    const order = rd.orders.find((o) => o.code === code);
    if (order) {
      return {
        text: `${code} (order for ${employer.label}) — ${order.text || "(not yet drafted)"}`,
        sources: [code, ...order.evidence],
      };
    }
    const ref = rd.refs.find((r) => r.code === code);
    if (ref) {
      return {
        text: `${code} (reference for ${employer.label}) — ${ref.reference}${ref.details ? `\n\n${ref.details}` : ""}`,
        sources: [code, ...ref.evidence],
      };
    }
  }
  return null;
}

function answerForEmployer(emp: Employer, ctx: ChatContext): ChatAnswer {
  const evidence = CASE_EVIDENCE.filter((e) => ctx.employerForSlot(e.employer)?.id === emp.id);
  const empNotes = ctx.notes.filter((n) => n.employers.includes(emp.id));
  const empDocs = ctx.documents.filter((d) => d.employers.includes(emp.id));
  const report = ctx.reportByEmployer.find((r) => r.employer.id === emp.id)?.doc;
  const orders = report?.orders ?? [];
  const refs = report?.refs ?? [];
  const sources = [
    ...evidence.map((e) => e.code),
    ...empNotes.map((n) => n.code),
    ...empDocs.map((d) => d.code),
    ...orders.map((o) => o.code),
    ...refs.map((r) => r.code),
  ];
  const text =
    `${emp.label} has ${plural(evidence.length, "evidence item")}, ` +
    `${plural(empNotes.length, "note/request")}, ${plural(empDocs.length, "document")}, ` +
    `${plural(orders.length, "order")}, and ${plural(refs.length, "regulation reference")}.`;
  return { text, sources };
}

function answerOpenItems(ctx: ChatContext): ChatAnswer {
  const openEvidence = CASE_EVIDENCE.filter((e) => e.type === "open" || e.employer === null);
  const unassignedNotes = ctx.notes.filter((n) => n.employers.length === 0);
  const unassignedDocs = ctx.documents.filter((d) => d.employers.length === 0);
  const sources = [
    ...openEvidence.map((e) => e.code),
    ...unassignedNotes.map((n) => n.code),
    ...unassignedDocs.map((d) => d.code),
  ];
  if (sources.length === 0) {
    return { text: "Nothing is flagged open or unassigned — everything is tagged to an employer.", sources: [] };
  }
  const bits: string[] = [];
  if (openEvidence.length) {
    bits.push(`${plural(openEvidence.length, "evidence item")} still open (${openEvidence.map((e) => e.code).join(", ")})`);
  }
  if (unassignedNotes.length) {
    bits.push(
      `${plural(unassignedNotes.length, "note/request")} not yet tagged to an employer (${unassignedNotes.map((n) => n.code).join(", ")})`,
    );
  }
  if (unassignedDocs.length) {
    bits.push(`${plural(unassignedDocs.length, "document")} not yet tagged (${unassignedDocs.map((d) => d.code).join(", ")})`);
  }
  return { text: `${bits.join("; ")}.`, sources };
}

function answerOrders(ctx: ChatContext): ChatAnswer {
  const all = ctx.reportByEmployer.flatMap(({ employer, doc }) => doc.orders.map((order) => ({ employer, order })));
  if (all.length === 0) return { text: "No orders have been drafted yet.", sources: [] };
  const lines = all.map(({ employer, order }) => `${order.code} (${employer.label}): ${truncate(order.text, 140)}`);
  return { text: `${plural(all.length, "order")} drafted:\n${lines.join("\n")}`, sources: all.map(({ order }) => order.code) };
}

function answerRefs(ctx: ChatContext): ChatAnswer {
  const all = ctx.reportByEmployer.flatMap(({ employer, doc }) => doc.refs.map((ref) => ({ employer, ref })));
  if (all.length === 0) return { text: "No regulation references have been logged yet.", sources: [] };
  const lines = all.map(({ employer, ref }) => `${ref.code} (${employer.label}): ${truncate(ref.reference, 140)}`);
  return { text: `${plural(all.length, "reference")} logged:\n${lines.join("\n")}`, sources: all.map(({ ref }) => ref.code) };
}

function answerRequests(ctx: ChatContext): ChatAnswer {
  const requests = ctx.notes.filter((n) => n.kind === "request");
  if (requests.length === 0) return { text: "No requests have been logged yet.", sources: [] };
  const lines = requests.map((r) => `${r.code}: ${truncate(r.text, 140)}`);
  return { text: `${plural(requests.length, "request")} logged:\n${lines.join("\n")}`, sources: requests.map((r) => r.code) };
}

export interface SearchableItem {
  code: string;
  label: string;
  text: string;
}

/**
 * Every piece of free text in the casefile that's worth searching: evidence
 * captions, notes/requests, scanned pages, document names, and each
 * employer's inspection note, orders, and regulation references. Shared by
 * the chat's keyword search and the casefile list's full-text search.
 */
export function collectSearchableItems(ctx: SearchContext): SearchableItem[] {
  const items: SearchableItem[] = [];
  for (const e of CASE_EVIDENCE) {
    items.push({ code: e.code, label: e.label, text: `${e.label} ${e.description}` });
  }
  for (const n of ctx.notes) {
    items.push({ code: n.code, label: n.kind === "request" ? "Request" : "Note", text: n.text });
  }
  for (const p of ctx.scanPages) {
    items.push({ code: `SN-${p.id}`, label: "Scanned page", text: p.text });
  }
  for (const d of ctx.documents) {
    items.push({ code: d.code, label: "Document", text: d.name });
  }
  for (const { employer, doc } of ctx.reportByEmployer) {
    items.push({ code: employer.id, label: `Inspection note (${employer.label})`, text: doc.note });
    for (const o of doc.orders) {
      items.push({ code: o.code, label: `Order (${employer.label})`, text: o.text });
    }
    for (const r of doc.refs) {
      items.push({ code: r.code, label: `Reference (${employer.label})`, text: `${r.reference} ${r.details}` });
    }
  }
  return items;
}

/** Whether any searchable text in the casefile contains the given phrase. */
export function caseContentMatches(query: string, ctx: SearchContext): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return collectSearchableItems(ctx).some((it) => it.text.toLowerCase().includes(q));
}

interface Hit extends SearchableItem {
  score: number;
}

function answerKeywordSearch(query: string, ctx: ChatContext): ChatAnswer {
  const terms = wordsOf(query).filter((w) => w.length > 2 && !STOPWORDS.has(w));
  if (terms.length === 0) return { text: helpText(), sources: [] };

  function score(haystack: string): number {
    const h = haystack.toLowerCase();
    return terms.reduce((n, t) => n + (h.includes(t) ? 1 : 0), 0);
  }

  const hits: Hit[] = collectSearchableItems(ctx)
    .map((item) => ({ ...item, score: score(item.text) }))
    .filter((hit) => hit.score > 0);

  if (hits.length === 0) {
    return {
      text: `I couldn't find anything in this casefile about "${query}". Try a different keyword, an employer name, or an evidence code like E-3.`,
      sources: [],
    };
  }

  hits.sort((a, b) => b.score - a.score);
  const top = hits.slice(0, 5);
  const lines = top.map((h) => `${h.code} — ${h.label}: ${truncate(h.text, 160)}`);
  return {
    text: `${plural(hits.length, "match")} for "${query}":\n${lines.join("\n")}`,
    sources: top.map((h) => h.code),
  };
}

export function askSherlock(query: string, ctx: ChatContext): ChatAnswer {
  const q = query.trim();
  if (!q) return { text: helpText(), sources: [] };
  const lower = q.toLowerCase();

  const codeMatch = q.match(/\b([a-z]{1,3}-\d+)\b/i);
  if (codeMatch) {
    const found = lookupCode(codeMatch[1].toUpperCase(), ctx);
    if (found) return found;
  }

  if (/^(hi|hello|hey)\b/.test(lower) || lower === "help") {
    return { text: helpText(), sources: [] };
  }

  if (/how many|count of|number of/.test(lower)) {
    const c = ctx.counts;
    if (/photo/.test(lower)) return { text: `This casefile has ${plural(c.photos, "photo")}.`, sources: [] };
    if (/document/.test(lower)) return { text: `There ${c.documents === 1 ? "is" : "are"} ${plural(c.documents, "uploaded document")}.`, sources: [] };
    if (/request/.test(lower)) return { text: `There ${c.requests === 1 ? "is" : "are"} ${plural(c.requests, "open request")}.`, sources: [] };
    if (/scan/.test(lower)) return { text: `${plural(c.scans, "page")} scanned.`, sources: [] };
    if (/note/.test(lower)) return { text: `This casefile has ${plural(c.notes, "note")}.`, sources: [] };
    if (/order/.test(lower)) {
      const total = ctx.reportByEmployer.reduce((n, r) => n + r.doc.orders.length, 0);
      return { text: `${plural(total, "order")} drafted across ${plural(ctx.caseEmployers.length, "employer")}.`, sources: [] };
    }
  }

  const employerMatch = ctx.caseEmployers.find((ce) => {
    const short = ce.label.split(" — ")[0].toLowerCase();
    return lower.includes(ce.label.toLowerCase()) || lower.includes(short);
  });
  if (employerMatch) return answerForEmployer(employerMatch, ctx);

  if (/\bopen\b|unassigned|needs review/.test(lower)) return answerOpenItems(ctx);
  if (/\border(s)?\b/.test(lower)) return answerOrders(ctx);
  if (/reference|regulation|\breg\b/.test(lower)) return answerRefs(ctx);
  if (/\brequest(s)?\b/.test(lower)) return answerRequests(ctx);

  return answerKeywordSearch(q, ctx);
}
