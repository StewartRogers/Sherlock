"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { askSherlock, type ChatContext } from "./chat";
import {
  CAPTURE_PHOTOS,
  CARRIED_NOTES,
  CARRIED_PHOTOS,
  DEFAULT_EMPLOYERS,
  EMPLOYER_SLOTS,
  NEW_CASE_STAMP,
  RECENT_CASES,
  REPORT_DEFAULTS,
  SAMPLE_SCAN_TEXT,
} from "./data";
import type {
  ChatMessage,
  Employer,
  EmployerSlot,
  GraphEdge,
  Note,
  NoteKind,
  RecentCase,
  ReportDoc,
  ScanPage,
  Screen,
  Tab,
  UploadedDocument,
} from "./types";

interface SherlockState {
  screen: Screen;
  recentCases: RecentCase[];
  /** The recent-case entry, if any, that's the live casefile currently in memory. */
  activeCaseId: string | null;
  tab: Tab;
  caseEmployers: Employer[];
  caseAddress: string;
  newCaseEmployers: string[];
  newEmployerText: string;
  newCaseAddress: string;
  captureStep: number;
  nudgeDismissed: boolean;
  /** Photo index -> employer ids tagged on that photo. */
  captureEmployer: Record<number, string[]>;
  recording: boolean;
  transcript: string;
  notes: Note[];
  draftNoteEmployers: string[];
  editingNoteId: number | null;
  scanPages: ScanPage[];
  documents: UploadedDocument[];
  /** Evidence code -> included in the report as a primary exhibit. */
  primaryMap: Record<string, boolean>;
  reportEmployer: string;
  reportDocs: Record<string, ReportDoc>;
  selectedGraphNode: string | null;
  /** Manually added graph links, layered on top of the links Sherlock infers from tags. */
  graphLinks: GraphEdge[];
  /** Edge keys (see edgeKey()) the inspector has removed, including inferred ones. */
  removedGraphLinks: string[];
  chatMessages: ChatMessage[];
}

const INITIAL: SherlockState = {
  screen: "home",
  recentCases: RECENT_CASES,
  activeCaseId: null,
  tab: "capture",
  caseEmployers: DEFAULT_EMPLOYERS,
  caseAddress: NEW_CASE_STAMP.address,
  newCaseEmployers: [],
  newEmployerText: "",
  newCaseAddress: "",
  captureStep: 0,
  nudgeDismissed: false,
  captureEmployer: {},
  recording: false,
  transcript: "",
  notes: [],
  draftNoteEmployers: [],
  editingNoteId: null,
  scanPages: [],
  documents: [],
  primaryMap: { "E-1": true, "E-2": true },
  reportEmployer: "roofing",
  reportDocs: {},
  selectedGraphNode: null,
  graphLinks: [],
  removedGraphLinks: [],
  chatMessages: [],
};

/**
 * Everything that belongs to one casefile rather than to the session. Opening
 * or starting a different casefile spreads this in, so nothing — a note tagged
 * to an employer that no longer exists, a scan page, a deleted graph edge —
 * survives into the next one.
 */
const PER_CASE_RESET = {
  tab: INITIAL.tab,
  captureStep: INITIAL.captureStep,
  nudgeDismissed: INITIAL.nudgeDismissed,
  captureEmployer: INITIAL.captureEmployer,
  recording: INITIAL.recording,
  transcript: INITIAL.transcript,
  notes: INITIAL.notes,
  draftNoteEmployers: INITIAL.draftNoteEmployers,
  editingNoteId: INITIAL.editingNoteId,
  scanPages: INITIAL.scanPages,
  documents: INITIAL.documents,
  primaryMap: INITIAL.primaryMap,
  reportDocs: INITIAL.reportDocs,
  selectedGraphNode: INITIAL.selectedGraphNode,
  graphLinks: INITIAL.graphLinks,
  removedGraphLinks: INITIAL.removedGraphLinks,
  chatMessages: INITIAL.chatMessages,
} satisfies Partial<SherlockState>;

/**
 * Note codes are positional, so they have to be re-derived whenever the set
 * changes. Renumbering only the note that moved would leave a gap that the
 * next save fills, producing two notes with the same code.
 */
function renumberNotes(notes: Note[]): Note[] {
  const seq: Record<NoteKind, number> = { note: 0, request: 0 };
  return notes.map((n) => {
    seq[n.kind] += 1;
    return { ...n, code: (n.kind === "request" ? "REQ-" : "N-") + seq[n.kind] };
  });
}

/** The report employer, falling back to the first when the selection is stale. */
function resolveReportEmployer(
  employers: Employer[],
  selected: string,
): string | undefined {
  return employers.some((c) => c.id === selected) ? selected : employers[0]?.id;
}

/** Normalizes a pair of node ids so a link's direction doesn't matter for lookups. */
export function edgeKey(a: string, b: string): string {
  return [a, b].sort().join("::");
}

function useSherlockState() {
  const [state, setState] = useState<SherlockState>(INITIAL);

  const patch = useCallback(
    (fn: (s: SherlockState) => Partial<SherlockState> | null) =>
      setState((s) => {
        const next = fn(s);
        return next ? { ...s, ...next } : s;
      }),
    [],
  );

  /* — navigation — */
  const goNewCase = useCallback(() => patch(() => ({ screen: "newcase" })), [patch]);
  const backHome = useCallback(() => patch(() => ({ screen: "home" })), [patch]);
  const viewAllCases = useCallback(() => patch(() => ({ screen: "cases" })), [patch]);
  const setTab = useCallback((tab: Tab) => patch(() => ({ tab })), [patch]);

  /** Cards for casefiles started this session resume the live in-memory data;
      the static demo cards still just open the canned Meridian Townhomes case. */
  const openCase = useCallback(
    (id: string) =>
      patch((s) => {
        if (id === s.activeCaseId) return { screen: "app", tab: "capture" };

        /* A different casefile: clear the last one's contents and take the
           employers and address from its card, so nothing carries across. */
        const entry = s.recentCases.find((c) => c.id === id);
        const caseEmployers: Employer[] = entry?.employers.length
          ? entry.employers.map((label, i) => ({ id: `emp${i}`, label }))
          : DEFAULT_EMPLOYERS;
        return {
          ...PER_CASE_RESET,
          screen: "app",
          activeCaseId: id,
          caseEmployers,
          caseAddress: entry?.address ?? NEW_CASE_STAMP.address,
          reportEmployer: caseEmployers[0].id,
        };
      }),
    [patch],
  );

  /* — new casefile — */
  const setNewEmployerText = useCallback(
    (newEmployerText: string) => patch(() => ({ newEmployerText })),
    [patch],
  );
  const setNewCaseAddress = useCallback(
    (newCaseAddress: string) => patch(() => ({ newCaseAddress })),
    [patch],
  );
  const addEmployer = useCallback(
    () =>
      patch((s) => {
        const name = s.newEmployerText.trim();
        if (!name) return null;
        return { newCaseEmployers: [...s.newCaseEmployers, name], newEmployerText: "" };
      }),
    [patch],
  );
  const removeNewEmployer = useCallback(
    (index: number) =>
      patch((s) => ({
        newCaseEmployers: s.newCaseEmployers.filter((_, i) => i !== index),
      })),
    [patch],
  );
  const startInspection = useCallback(
    () =>
      patch((s) => {
        /* Carry over a name still sitting in the employer-name field —
           typed but not committed with Add or Enter — instead of silently
           dropping it and falling back to the default employers. */
        const pending = s.newEmployerText.trim();
        const names = pending ? [...s.newCaseEmployers, pending] : s.newCaseEmployers;
        const employers: Employer[] = names.length
          ? names.map((label, i) => ({ id: `emp${i}`, label }))
          : DEFAULT_EMPLOYERS;
        const address = s.newCaseAddress.trim() || NEW_CASE_STAMP.address;
        const caseId = `case-${Date.now()}`;
        const entry: RecentCase = {
          id: caseId,
          name: employers[0].label,
          address,
          date: NEW_CASE_STAMP.date,
          employers: employers.map((e) => e.label),
        };
        return {
          ...PER_CASE_RESET,
          screen: "app",
          recentCases: [entry, ...s.recentCases],
          activeCaseId: caseId,
          caseEmployers: employers,
          caseAddress: address,
          newCaseEmployers: [],
          newEmployerText: "",
          newCaseAddress: "",
          reportEmployer: employers[0].id,
        };
      }),
    [patch],
  );

  /* — capture — */
  const shutter = useCallback(
    () => patch((s) => ({ captureStep: Math.min(s.captureStep + 1, CAPTURE_PHOTOS.length) })),
    [patch],
  );
  const dismissNudge = useCallback(() => patch(() => ({ nudgeDismissed: true })), [patch]);
  const toggleCaptureEmployer = useCallback(
    (index: number, id: string) =>
      patch((s) => {
        const cur = s.captureEmployer[index] ?? [];
        const next = cur.includes(id) ? cur.filter((v) => v !== id) : [...cur, id];
        return { captureEmployer: { ...s.captureEmployer, [index]: next } };
      }),
    [patch],
  );
  /** Copies the most recently captured photo's tags onto every still-untagged photo. */
  const applyTagsToUntagged = useCallback(
    () =>
      patch((s) => {
        const last = s.captureStep - 1;
        const tags = s.captureEmployer[last] ?? [];
        if (!tags.length) return null;
        const next = { ...s.captureEmployer };
        for (let i = 0; i < s.captureStep; i++) {
          if (!(next[i] ?? []).length) next[i] = [...tags];
        }
        return { captureEmployer: next };
      }),
    [patch],
  );

  /* — notes — */
  const toggleRecord = useCallback(() => patch((s) => ({ recording: !s.recording })), [patch]);
  const setTranscript = useCallback(
    (transcript: string) => patch(() => ({ transcript })),
    [patch],
  );
  const toggleDraftNoteEmployer = useCallback(
    (id: string) =>
      patch((s) => ({
        draftNoteEmployers: s.draftNoteEmployers.includes(id)
          ? s.draftNoteEmployers.filter((v) => v !== id)
          : [...s.draftNoteEmployers, id],
      })),
    [patch],
  );
  const saveNote = useCallback(
    (kind: NoteKind) =>
      patch((s) => {
        const text = s.transcript.trim();
        if (!text) return null;
        return {
          notes: renumberNotes([
            ...s.notes,
            {
              id: Date.now(),
              text,
              employers: s.draftNoteEmployers,
              kind,
              code: "",
            },
          ]),
          transcript: "",
          draftNoteEmployers: [],
          recording: false,
        };
      }),
    [patch],
  );
  const editNoteTags = useCallback(
    (id: number) => patch((s) => ({ editingNoteId: s.editingNoteId === id ? null : id })),
    [patch],
  );
  const toggleNoteEmployer = useCallback(
    (id: number, empId: string) =>
      patch((s) => {
        const adding = !s.notes.find((n) => n.id === id)?.employers.includes(empId);
        return {
          notes: s.notes.map((n) =>
            n.id !== id
              ? n
              : {
                  ...n,
                  employers: adding
                    ? [...n.employers, empId]
                    : n.employers.filter((v) => v !== empId),
                },
          ),
          /* Re-applying a tag must undo an earlier manual removal, or the
             graph keeps suppressing an edge the tag says should be there. */
          removedGraphLinks: adding
            ? s.removedGraphLinks.filter((k) => k !== edgeKey(empId, `note-${id}`))
            : s.removedGraphLinks,
        };
      }),
    [patch],
  );
  const setNoteKind = useCallback(
    (id: number, kind: NoteKind) =>
      patch((s) => ({
        notes: renumberNotes(s.notes.map((n) => (n.id !== id ? n : { ...n, kind }))),
      })),
    [patch],
  );

  /* — scan — */
  const scanPage = useCallback(
    () =>
      patch((s) => {
        const id = s.scanPages.length + 1;
        const text = SAMPLE_SCAN_TEXT[(id - 1) % SAMPLE_SCAN_TEXT.length];
        return { scanPages: [...s.scanPages, { id, text }] };
      }),
    [patch],
  );
  const setScanPageText = useCallback(
    (id: number, text: string) =>
      patch((s) => ({ scanPages: s.scanPages.map((p) => (p.id === id ? { ...p, text } : p)) })),
    [patch],
  );

  /* — upload — */
  const addDocuments = useCallback(
    (files: File[]) =>
      patch((s) => {
        if (!files.length) return null;
        /* Counting the surviving documents would re-issue a code after a
           delete: remove D-2 of three and the next upload is a second D-3. */
        const start = s.documents.reduce((max, d) => {
          const n = Number(d.code.replace("D-", ""));
          return Number.isFinite(n) && n > max ? n : max;
        }, 0);
        const added: UploadedDocument[] = files.map((f, i) => ({
          id: Date.now() + i,
          code: `D-${start + i + 1}`,
          name: f.name,
          size: f.size,
          employers: [],
        }));
        return { documents: [...s.documents, ...added] };
      }),
    [patch],
  );
  const toggleDocumentEmployer = useCallback(
    (id: number, empId: string) =>
      patch((s) => {
        const adding = !s.documents.find((d) => d.id === id)?.employers.includes(empId);
        return {
          documents: s.documents.map((d) =>
            d.id !== id
              ? d
              : {
                  ...d,
                  employers: adding
                    ? [...d.employers, empId]
                    : d.employers.filter((v) => v !== empId),
                },
          ),
          removedGraphLinks: adding
            ? s.removedGraphLinks.filter((k) => k !== edgeKey(empId, `doc-${id}`))
            : s.removedGraphLinks,
        };
      }),
    [patch],
  );
  const removeDocument = useCallback(
    (id: number) =>
      patch((s) => {
        /* Drop the graph state that pointed at this document too, so a later
           upload reusing the node id cannot inherit its links. */
        const node = `doc-${id}`;
        return {
          documents: s.documents.filter((d) => d.id !== id),
          graphLinks: s.graphLinks.filter(([a, b]) => a !== node && b !== node),
          removedGraphLinks: s.removedGraphLinks.filter((k) => !k.split("::").includes(node)),
          selectedGraphNode: s.selectedGraphNode === node ? null : s.selectedGraphNode,
        };
      }),
    [patch],
  );

  /* — report — */
  const setPrimary = useCallback(
    (code: string, val: boolean) =>
      patch((s) => ({ primaryMap: { ...s.primaryMap, [code]: val } })),
    [patch],
  );
  const setReportEmployer = useCallback(
    (reportEmployer: string) => patch(() => ({ reportEmployer })),
    [patch],
  );

  /** The report employer, falling back to the first when the selection is stale. */
  const activeReportEmployer = resolveReportEmployer(state.caseEmployers, state.reportEmployer);

  /** The open casefile's name, so screens don't hard-code the seed casefile's. */
  const caseName =
    state.recentCases.find((c) => c.id === state.activeCaseId)?.name ?? RECENT_CASES[0].name;

  const defaultDoc = useCallback(
    (empId: string, employers: Employer[]): ReportDoc => {
      const i = Math.max(
        employers.findIndex((c) => c.id === empId),
        0,
      );
      /* The seed reports are authored against the two positional employer
         slots. Cycling them past that handed a third employer a copy of the
         first one's ORD-1/ORD-2/RR-1, so the same code existed twice and the
         graph collapsed both into one node. Beyond the authored slots the
         inspector starts from an empty report. */
      const d = REPORT_DEFAULTS[i];
      if (!d) return { note: "", noteEvidence: [], orders: [], refs: [] };
      return {
        note: d.note,
        noteEvidence: [...d.noteEvidence],
        orders: d.orders.map((o) => ({ ...o, evidence: [...o.evidence] })),
        refs: d.refs.map((r) => ({ ...r, evidence: [...r.evidence] })),
      };
    },
    [],
  );

  const updateDoc = useCallback(
    (fn: (d: ReportDoc) => ReportDoc) =>
      patch((s) => {
        const emp = resolveReportEmployer(s.caseEmployers, s.reportEmployer);
        if (!emp) return null;
        const cur = s.reportDocs[emp] ?? defaultDoc(emp, s.caseEmployers);
        return { reportDocs: { ...s.reportDocs, [emp]: fn(cur) } };
      }),
    [patch, defaultDoc],
  );

  const setReportNote = useCallback(
    (note: string) => updateDoc((d) => ({ ...d, note })),
    [updateDoc],
  );
  const setOrderText = useCallback(
    (i: number, v: string) =>
      updateDoc((d) => ({
        ...d,
        orders: d.orders.map((item, j) => (j === i ? { ...item, text: v } : item)),
      })),
    [updateDoc],
  );
  const addOrder = useCallback(
    () =>
      patch((s) => {
        const emp = resolveReportEmployer(s.caseEmployers, s.reportEmployer);
        if (!emp) return null;
        const total = s.caseEmployers.reduce(
          (sum, ce) => sum + (s.reportDocs[ce.id] ?? defaultDoc(ce.id, s.caseEmployers)).orders.length,
          0,
        );
        const cur = s.reportDocs[emp] ?? defaultDoc(emp, s.caseEmployers);
        return {
          reportDocs: {
            ...s.reportDocs,
            [emp]: { ...cur, orders: [...cur.orders, { code: `ORD-${total + 1}`, text: "", evidence: [] }] },
          },
        };
      }),
    [patch, defaultDoc],
  );
  const setRefField = useCallback(
    (i: number, field: "reference" | "details", v: string) =>
      updateDoc((d) => ({
        ...d,
        refs: d.refs.map((item, j) => (j === i ? { ...item, [field]: v } : item)),
      })),
    [updateDoc],
  );
  const addRef = useCallback(
    () =>
      patch((s) => {
        const emp = resolveReportEmployer(s.caseEmployers, s.reportEmployer);
        if (!emp) return null;
        const total = s.caseEmployers.reduce(
          (sum, ce) => sum + (s.reportDocs[ce.id] ?? defaultDoc(ce.id, s.caseEmployers)).refs.length,
          0,
        );
        const cur = s.reportDocs[emp] ?? defaultDoc(emp, s.caseEmployers);
        return {
          reportDocs: {
            ...s.reportDocs,
            [emp]: {
              ...cur,
              refs: [...cur.refs, { code: `RR-${total + 1}`, reference: "", details: "", evidence: [] }],
            },
          },
        };
      }),
    [patch, defaultDoc],
  );

  /* — graph — */
  const selectGraphNode = useCallback(
    (id: string) =>
      patch((s) => ({ selectedGraphNode: s.selectedGraphNode === id ? null : id })),
    [patch],
  );
  const clearGraphSelection = useCallback(
    () => patch(() => ({ selectedGraphNode: null })),
    [patch],
  );
  const addGraphLink = useCallback(
    (a: string, b: string) =>
      patch((s) => {
        if (a === b) return null;
        const key = edgeKey(a, b);
        if (s.graphLinks.some(([x, y]) => edgeKey(x, y) === key)) return null;
        return {
          graphLinks: [...s.graphLinks, [a, b]],
          removedGraphLinks: s.removedGraphLinks.filter((k) => k !== key),
        };
      }),
    [patch],
  );
  const removeGraphLink = useCallback(
    (a: string, b: string) =>
      patch((s) => {
        const key = edgeKey(a, b);
        return {
          graphLinks: s.graphLinks.filter(([x, y]) => edgeKey(x, y) !== key),
          removedGraphLinks: s.removedGraphLinks.includes(key)
            ? s.removedGraphLinks
            : [...s.removedGraphLinks, key],
        };
      }),
    [patch],
  );

  const reportDoc = activeReportEmployer
    ? state.reportDocs[activeReportEmployer] ??
      defaultDoc(activeReportEmployer, state.caseEmployers)
    : defaultDoc("", []);

  /** Resolve one of the two authored evidence slots to a live employer. */
  const employerForSlot = useCallback(
    (slot: EmployerSlot | null): Employer | null => {
      if (!slot) return null;
      const i = EMPLOYER_SLOTS.indexOf(slot);
      return i >= 0 ? state.caseEmployers[i] ?? null : null;
    },
    [state.caseEmployers],
  );

  /* — chat — */
  const sendChatQuestion = useCallback(
    (text: string) =>
      patch((s) => {
        const q = text.trim();
        if (!q) return null;
        const slotFor = (slot: EmployerSlot | null): Employer | null => {
          if (!slot) return null;
          const i = EMPLOYER_SLOTS.indexOf(slot);
          return i >= 0 ? s.caseEmployers[i] ?? null : null;
        };
        const ctx: ChatContext = {
          caseEmployers: s.caseEmployers,
          notes: s.notes,
          scanPages: s.scanPages,
          documents: s.documents,
          reportByEmployer: s.caseEmployers.map((employer) => ({
            employer,
            doc: s.reportDocs[employer.id] ?? defaultDoc(employer.id, s.caseEmployers),
          })),
          employerForSlot: slotFor,
          counts: {
            photos: s.captureStep + CARRIED_PHOTOS,
            notes: s.notes.length + CARRIED_NOTES,
            requests: s.notes.filter((n) => n.kind === "request").length,
            scans: s.scanPages.length,
            documents: s.documents.length,
          },
        };
        const answer = askSherlock(q, ctx);
        const userMsg: ChatMessage = { id: Date.now(), role: "user", text: q };
        const replyMsg: ChatMessage = {
          id: Date.now() + 1,
          role: "assistant",
          text: answer.text,
          sources: answer.sources,
        };
        return { chatMessages: [...s.chatMessages, userMsg, replyMsg] };
      }),
    [patch, defaultDoc],
  );

  return {
    ...state,
    activeReportEmployer,
    caseName,
    reportDoc,
    defaultDoc,
    employerForSlot,
    goNewCase,
    backHome,
    viewAllCases,
    setTab,
    openCase,
    setNewEmployerText,
    setNewCaseAddress,
    addEmployer,
    removeNewEmployer,
    startInspection,
    shutter,
    dismissNudge,
    toggleCaptureEmployer,
    applyTagsToUntagged,
    toggleRecord,
    setTranscript,
    toggleDraftNoteEmployer,
    saveNote,
    editNoteTags,
    toggleNoteEmployer,
    setNoteKind,
    scanPage,
    setScanPageText,
    addDocuments,
    toggleDocumentEmployer,
    removeDocument,
    setPrimary,
    setReportEmployer,
    setReportNote,
    setOrderText,
    addOrder,
    setRefField,
    addRef,
    selectGraphNode,
    clearGraphSelection,
    addGraphLink,
    removeGraphLink,
    sendChatQuestion,
  };
}

type SherlockStore = ReturnType<typeof useSherlockState>;

const SherlockContext = createContext<SherlockStore | null>(null);

export function SherlockProvider({ children }: { children: ReactNode }) {
  const store = useSherlockState();
  return <SherlockContext.Provider value={store}>{children}</SherlockContext.Provider>;
}

export function useSherlock(): SherlockStore {
  const store = useContext(SherlockContext);
  if (!store) throw new Error("useSherlock must be used inside <SherlockProvider>");
  return store;
}

