"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import {
  CAPTURE_PHOTOS,
  DEFAULT_EMPLOYERS,
  EMPLOYER_SLOTS,
  NEW_CASE_STAMP,
  REPORT_DEFAULTS,
} from "./data";
import { SAMPLE_SCAN_TEXT } from "./data";
import type {
  Employer,
  EmployerSlot,
  GraphEdge,
  Note,
  NoteKind,
  ReportDoc,
  ScanPage,
  Screen,
  Tab,
  UploadedDocument,
} from "./types";

interface SherlockState {
  screen: Screen;
  visibleCases: number;
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
}

const INITIAL: SherlockState = {
  screen: "home",
  visibleCases: 5,
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
  primaryMap: { "E-10": true, "E-11": true },
  reportEmployer: "roofing",
  reportDocs: {},
  selectedGraphNode: null,
  graphLinks: [],
  removedGraphLinks: [],
};

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
  const showMoreCases = useCallback(
    () => patch((s) => ({ visibleCases: s.visibleCases + 5 })),
    [patch],
  );
  const setTab = useCallback((tab: Tab) => patch(() => ({ tab })), [patch]);

  const openCase = useCallback(
    () =>
      patch(() => ({
        screen: "app",
        tab: "capture",
        caseEmployers: DEFAULT_EMPLOYERS,
      })),
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
        return {
          screen: "app",
          tab: "capture",
          caseEmployers: employers,
          caseAddress: s.newCaseAddress.trim() || NEW_CASE_STAMP.address,
          newCaseEmployers: [],
          newEmployerText: "",
          newCaseAddress: "",
          captureEmployer: {},
          captureStep: 0,
          reportEmployer: employers[0].id,
          reportDocs: {},
          notes: [],
          editingNoteId: null,
          documents: [],
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
        const seq = s.notes.filter((n) => n.kind === kind).length + 1;
        return {
          notes: [
            ...s.notes,
            {
              id: Date.now(),
              text,
              employers: s.draftNoteEmployers,
              kind,
              code: (kind === "request" ? "REQ-" : "N-") + seq,
            },
          ],
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
      patch((s) => ({
        notes: s.notes.map((n) =>
          n.id !== id
            ? n
            : {
                ...n,
                employers: n.employers.includes(empId)
                  ? n.employers.filter((v) => v !== empId)
                  : [...n.employers, empId],
              },
        ),
      })),
    [patch],
  );
  const setNoteKind = useCallback(
    (id: number, kind: NoteKind) =>
      patch((s) => {
        const others = s.notes.filter((n) => n.id !== id && n.kind === kind);
        return {
          notes: s.notes.map((n) =>
            n.id !== id
              ? n
              : { ...n, kind, code: (kind === "request" ? "REQ-" : "N-") + (others.length + 1) },
          ),
        };
      }),
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
        const added: UploadedDocument[] = files.map((f, i) => ({
          id: Date.now() + i,
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
      patch((s) => ({
        documents: s.documents.map((d) =>
          d.id !== id
            ? d
            : {
                ...d,
                employers: d.employers.includes(empId)
                  ? d.employers.filter((v) => v !== empId)
                  : [...d.employers, empId],
              },
        ),
      })),
    [patch],
  );
  const removeDocument = useCallback(
    (id: number) => patch((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),
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
  const activeReportEmployer = state.caseEmployers.some((c) => c.id === state.reportEmployer)
    ? state.reportEmployer
    : state.caseEmployers[0]?.id;

  const defaultDoc = useCallback(
    (empId: string, employers: Employer[]): ReportDoc => {
      const i = Math.max(
        employers.findIndex((c) => c.id === empId),
        0,
      );
      const d = REPORT_DEFAULTS[i % REPORT_DEFAULTS.length];
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
        const emp = s.caseEmployers.some((c) => c.id === s.reportEmployer)
          ? s.reportEmployer
          : s.caseEmployers[0]?.id;
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
    () => updateDoc((d) => ({ ...d, orders: [...d.orders, { text: "", evidence: [] }] })),
    [updateDoc],
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
      updateDoc((d) => ({ ...d, refs: [...d.refs, { reference: "", details: "", evidence: [] }] })),
    [updateDoc],
  );

  /* — graph — */
  const selectGraphNode = useCallback(
    (id: string) =>
      patch((s) => ({ selectedGraphNode: s.selectedGraphNode === id ? null : id })),
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
    : REPORT_DEFAULTS[0];

  /** Resolve one of the two authored evidence slots to a live employer. */
  const employerForSlot = useCallback(
    (slot: EmployerSlot | null): Employer | null => {
      if (!slot) return null;
      const i = EMPLOYER_SLOTS.indexOf(slot);
      return i >= 0 ? state.caseEmployers[i] ?? null : null;
    },
    [state.caseEmployers],
  );

  return {
    ...state,
    activeReportEmployer,
    reportDoc,
    defaultDoc,
    employerForSlot,
    goNewCase,
    backHome,
    showMoreCases,
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
    addGraphLink,
    removeGraphLink,
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

