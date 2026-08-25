"use client";

import type { ComponentType } from "react";

import { useSherlock } from "@/lib/store";
import type { Tab } from "@/lib/types";
import { CaptureTab } from "./CaptureTab";
import { CaseFolderTab } from "./CaseFolderTab";
import { GraphTab } from "./GraphTab";
import { MoreTab } from "./MoreTab";
import { NotesTab } from "./NotesTab";
import { ReportTab } from "./ReportTab";
import { RequestsTab } from "./RequestsTab";
import { ScanTab } from "./ScanTab";
import { UploadTab } from "./UploadTab";
import {
  BackIcon,
  CameraIcon,
  FolderIcon,
  GraphIcon,
  MoreIcon,
  NoteIcon,
  ReportIcon,
  RequestIcon,
  ScanIcon,
  UploadIcon,
} from "./icons";

/**
 * The narrow layout collapses Case folder / Report / Evidence graph behind
 * "More"; at container width 720px and up they get their own tabs.
 */
const TABS: { tab: Tab; label: string; icon: ComponentType; wide?: boolean }[] = [
  { tab: "capture", label: "Capture", icon: CameraIcon },
  { tab: "notes", label: "Notes", icon: NoteIcon },
  { tab: "requests", label: "Requests", icon: RequestIcon },
  { tab: "scan", label: "Scan", icon: ScanIcon },
  { tab: "upload", label: "Upload", icon: UploadIcon },
  { tab: "case", label: "Case folder", icon: FolderIcon, wide: true },
  { tab: "report", label: "Report content", icon: ReportIcon, wide: true },
  { tab: "graph", label: "Evidence graph", icon: GraphIcon, wide: true },
];

const PANELS: Record<Tab, ComponentType> = {
  capture: CaptureTab,
  notes: NotesTab,
  requests: RequestsTab,
  scan: ScanTab,
  upload: UploadTab,
  more: MoreTab,
  case: CaseFolderTab,
  report: ReportTab,
  graph: GraphTab,
};

export function AppScreen() {
  const { tab, setTab, backHome } = useSherlock();
  const Panel = PANELS[tab];
  const moreActive = tab === "more" || tab === "case" || tab === "report" || tab === "graph";

  return (
    <>
      <div className="sh-tabs" role="tablist" aria-label="Casefile sections">
        <button
          type="button"
          onClick={backHome}
          aria-label="Back to casefiles"
          style={{
            flex: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "9px 8px 9px 14px",
            display: "flex",
            alignItems: "center",
            color: "var(--color-text)",
            opacity: 0.7,
          }}
        >
          <BackIcon />
        </button>

        {TABS.map(({ tab: t, label, icon: Icon, wide }) => (
          <button
            type="button"
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`sh-tab ${wide ? "sh-wide" : ""} ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            <Icon />
            <span className="sh-tab-label">{label}</span>
          </button>
        ))}

        <button
          type="button"
          role="tab"
          aria-selected={moreActive}
          className={`sh-tab sh-narrow ${moreActive ? "active" : ""}`}
          onClick={() => setTab("more")}
        >
          <MoreIcon />
          <span className="sh-tab-label">More</span>
        </button>
      </div>

      <div className="sh-pad" style={{ flex: 1, overflowY: "auto" }}>
        <Panel />
      </div>
    </>
  );
}
