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
  REPORT_DEFAULTS,
} from "./data";
import type {
  Employer,
  EmployerSlot,
  Note,
  NoteKind,
  ReportDoc,
  Screen,
  Tab,
} from "./types";

interface SherlockState {
  screen: Screen;
  visibleCases: number;
  tab: Tab;
  caseEmployers: Employer[];
  newCaseEmployers: string[];
  newEmployerText: string;
  captureStep: number;
  nudgeDismissed: boolean;
  /** Photo index -> employer ids tagged on that photo. */
  captureEmployer: Record<number, string[]>;
  selectedCapture: number | null;
  recording: boolean;
  transcript: string;
  notes: Note[];
  draftNoteEmployers: string[];
  draftNoteKind: NoteKind;
  editingNoteId: number | null;
  scanPageCount: number;
  scanNotes: string;
  /** Evidence code -> included in the report as a primary exhibit. */
  primaryMap: Record<string, boolean>;
  reportEmployer: string;
  reportDocs: Record<string, ReportDoc>;
  selectedGraphNode: string | null;
}

const INITIAL: SherlockState = {
  screen: "home",
  visibleCases: 5,
  tab: "capture",
  caseEmployers: DEFAULT_EMPLOYERS,
  newCaseEmployers: [],
  newEmployerText: "",
  captureStep: 0,
  nudgeDismissed: false,
  captureEmployer: {},
  selectedCapture: null,
  recording: false,
  transcript: "",
  notes: [],
  draftNoteEmployers: [],
  draftNoteKind: "note",
  editingNoteId: null,
  scanPageCount: 0,
  scanNotes: "",
  primaryMap: { "E-10": true, "E-11": true },
  reportEmployer: "roofing",
  reportDocs: {},
  selectedGraphNode: null,
};

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
        const employers: Employer[] = s.newCaseEmployers.length
          ? s.newCaseEmployers.map((label, i) => ({ id: `emp${i}`, label }))
          : DEFAULT_EMPLOYERS;
        return {
          screen: "app",
          tab: "capture",
          caseEmployers: employers,
          captureEmployer: {},
          captureStep: 0,
          selectedCapture: null,
          reportEmployer: employers[0].id,
          reportDocs: {},
          notes: [],
          editingNoteId: null,
        };
      }),
    [patch],
  );

  /* — capture — */
  const shutter = useCallback(
    () =>
      patch((s) => {
        const step = Math.min(s.captureStep + 1, CAPTURE_PHOTOS.length);
        return { captureStep: step, selectedCapture: step - 1 };
      }),
    [patch],
  );
  const dismissNudge = useCallback(() => patch(() => ({ nudgeDismissed: true })), [patch]);
  const selectCapture = useCallback(
    (selectedCapture: number) => patch(() => ({ selectedCapture })),
    [patch],
  );
  const toggleCaptureEmployer = useCallback(
    (index: number, id: string) =>
      patch((s) => {
        const cur = s.captureEmployer[index] ?? [];
        const next = cur.includes(id) ? cur.filter((v) => v !== id) : [...cur, id];
        return { captureEmployer: { ...s.captureEmployer, [index]: next } };
      }),
    [patch],
  );
  const applyTagsToUntagged = useCallback(
    () =>
      patch((s) => {
        const sel = s.selectedCapture ?? s.captureStep - 1;
        const tags = s.captureEmployer[sel] ?? [];
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
  const setDraftKind = useCallback(
    (draftNoteKind: NoteKind) => patch(() => ({ draftNoteKind })),
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
    () =>
      patch((s) => {
        const text = s.transcript.trim();
        if (!text) return null;
        const kind = s.draftNoteKind;
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
    () => patch((s) => ({ scanPageCount: s.scanPageCount + 1 })),
    [patch],
  );
  const setScanNotes = useCallback((scanNotes: string) => patch(() => ({ scanNotes })), [patch]);

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
  const setListItem = useCallback(
    (key: "orders" | "refs", i: number, v: string) =>
      updateDoc((d) => ({
        ...d,
        [key]: d[key].map((item, j) => (j === i ? { ...item, text: v } : item)),
      })),
    [updateDoc],
  );
  const addListItem = useCallback(
    (key: "orders" | "refs") =>
      updateDoc((d) => ({ ...d, [key]: [...d[key], { text: "", evidence: [] }] })),
    [updateDoc],
  );
  const removeListItem = useCallback(
    (key: "orders" | "refs", i: number) =>
      updateDoc((d) => ({ ...d, [key]: d[key].filter((_, j) => j !== i) })),
    [updateDoc],
  );

  /* — graph — */
  const selectGraphNode = useCallback(
    (id: string) =>
      patch((s) => ({ selectedGraphNode: s.selectedGraphNode === id ? null : id })),
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
    employerForSlot,
    goNewCase,
    backHome,
    showMoreCases,
    setTab,
    openCase,
    setNewEmployerText,
    addEmployer,
    removeNewEmployer,
    startInspection,
    shutter,
    dismissNudge,
    selectCapture,
    toggleCaptureEmployer,
    applyTagsToUntagged,
    toggleRecord,
    setTranscript,
    setDraftKind,
    toggleDraftNoteEmployer,
    saveNote,
    editNoteTags,
    toggleNoteEmployer,
    setNoteKind,
    scanPage,
    setScanNotes,
    setPrimary,
    setReportEmployer,
    setReportNote,
    setListItem,
    addListItem,
    removeListItem,
    selectGraphNode,
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

