"use client";

import { useMemo, useRef, useState } from "react";
import { caseContentMatches } from "@/lib/chat";
import {
  caseMeta,
  caseMonth,
  caseYear,
  formatCaseDate,
  MONTH_NAMES,
  weekLabel,
  weekStartOf,
} from "@/lib/data";
import { useSherlock } from "@/lib/store";
import { BackIcon } from "./icons";

interface DateDrill {
  year: number | null;
  month: number | null;
  week: string | null;
  day: string | null;
}

const ALL_DATES: DateDrill = { year: null, month: null, week: null, day: null };

function descNum(a: number, b: number) {
  return b - a;
}

/** A text input that also filters and picks from a suggestion list as you type. */
function EmployerCombobox({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matches = options.filter((o) => o.toLowerCase().includes(value.trim().toLowerCase())).slice(0, 8);

  function selectOption(v: string) {
    onChange(v);
    setOpen(false);
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        id="case-employer"
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls="case-employer-listbox"
        autoComplete="off"
        className="input"
        placeholder="All employers"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          closeTimer.current = setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setHighlight((i) => Math.min(i + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && open && matches[highlight]) {
            e.preventDefault();
            selectOption(matches[highlight]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && matches.length > 0 && (
        <ul
          id="case-employer-listbox"
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 20,
            margin: 0,
            padding: 4,
            listStyle: "none",
            background: "var(--color-bg)",
            border: "1px solid var(--color-divider)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-md)",
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          {matches.map((m, i) => (
            <li key={m} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (closeTimer.current) clearTimeout(closeTimer.current);
                  selectOption(m);
                }}
                onMouseEnter={() => setHighlight(i)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 10px",
                  fontSize: 14,
                  border: "none",
                  borderRadius: "calc(var(--radius-md) - 4px)",
                  cursor: "pointer",
                  background: i === highlight ? "color-mix(in srgb, var(--color-text) 7%, transparent)" : "transparent",
                  color: "var(--color-text)",
                  font: "inherit",
                }}
              >
                {m}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AllCasesScreen() {
  const {
    recentCases,
    openCase,
    backHome,
    activeCaseId,
    caseEmployers,
    notes,
    scanPages,
    documents,
    reportDocs,
    defaultDoc,
  } = useSherlock();
  const [keyword, setKeyword] = useState("");
  const [employerQuery, setEmployerQuery] = useState("");
  const [drill, setDrill] = useState<DateDrill>(ALL_DATES);

  const sortedCases = useMemo(
    () => [...recentCases].sort((a, b) => b.date.localeCompare(a.date)),
    [recentCases],
  );

  const employerOptions = useMemo(
    () => Array.from(new Set(recentCases.flatMap((rc) => rc.employers))).sort((a, b) => a.localeCompare(b)),
    [recentCases],
  );

  /** The one casefile with real evidence/notes/report content behind it this
   *  session — everything else is a name/address/employer card only. Falls
   *  back to the seeded Meridian Townhomes casefile the demo content is
   *  authored against, before anything has been opened. */
  const liveCaseId = activeCaseId ?? "seed-1";
  const searchCtx = useMemo(
    () => ({
      notes,
      scanPages,
      documents,
      reportByEmployer: caseEmployers.map((employer) => ({
        employer,
        doc: reportDocs[employer.id] ?? defaultDoc(employer.id, caseEmployers),
      })),
    }),
    [notes, scanPages, documents, caseEmployers, reportDocs, defaultDoc],
  );

  const kw = keyword.trim().toLowerCase();
  const empQ = employerQuery.trim().toLowerCase();

  const byKeywordEmployer = sortedCases.filter((rc) => {
    if (empQ && !rc.employers.some((e) => e.toLowerCase().includes(empQ))) return false;
    if (kw) {
      const haystack = [rc.name, rc.address, ...rc.employers].join(" ").toLowerCase();
      const matchesShallow = haystack.includes(kw);
      const matchesContent = rc.id === liveCaseId && caseContentMatches(kw, searchCtx);
      if (!matchesShallow && !matchesContent) return false;
    }
    return true;
  });

  const byYear = byKeywordEmployer.filter((rc) => drill.year == null || caseYear(rc.date) === drill.year);
  const byMonth = byYear.filter((rc) => drill.month == null || caseMonth(rc.date) === drill.month);
  const byWeek = byMonth.filter((rc) => drill.week == null || weekStartOf(rc.date) === drill.week);
  const filtered = byWeek.filter((rc) => drill.day == null || rc.date === drill.day);

  const yearOptions = Array.from(new Set(byKeywordEmployer.map((rc) => caseYear(rc.date)))).sort(descNum);
  const monthOptions = Array.from(new Set(byYear.map((rc) => caseMonth(rc.date)))).sort(descNum);
  const weekOptions = Array.from(new Set(byMonth.map((rc) => weekStartOf(rc.date)))).sort((a, b) =>
    b.localeCompare(a),
  );
  const dayOptions = Array.from(new Set(byWeek.map((rc) => rc.date))).sort((a, b) => b.localeCompare(a));

  const hasFilters = kw !== "" || empQ !== "" || drill.year != null;
  function clearFilters() {
    setKeyword("");
    setEmployerQuery("");
    setDrill(ALL_DATES);
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "10px 14px",
          borderBottom: "1px solid var(--color-divider)",
          flex: "none",
        }}
      >
        <button
          type="button"
          onClick={backHome}
          aria-label="Back to home"
          style={{
            flex: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "9px 8px",
            display: "flex",
            alignItems: "center",
            color: "var(--color-text)",
            opacity: 0.7,
          }}
        >
          <BackIcon />
        </button>
        <div style={{ fontSize: 16, fontWeight: 700 }}>All casefiles</div>
      </div>

      <div className="sh-pad" style={{ flex: 1, overflowY: "auto" }}>
        <div className="sh-measure">
          <div className="field" style={{ marginBottom: "var(--space-3)" }}>
            <label htmlFor="case-search">Keyword</label>
            <input
              id="case-search"
              type="search"
              className="input"
              placeholder="Search names, addresses, employers, or case content"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <div style={{ fontSize: 12, opacity: 0.55, marginTop: 6 }}>
              Also searches evidence, notes, and report content — but only for the casefile you
              have open this session; the rest are name/address/employer cards only.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div className="field" style={{ flex: "1 1 220px" }}>
              <label>Date</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <button
                  type="button"
                  className={`sh-pillbtn ${drill.year == null ? "active" : ""}`}
                  onClick={() => setDrill(ALL_DATES)}
                >
                  All dates
                </button>
                {drill.year != null && (
                  <>
                    <span style={{ opacity: 0.4 }}>›</span>
                    <button
                      type="button"
                      className={`sh-pillbtn ${drill.month == null ? "active" : ""}`}
                      onClick={() => setDrill({ year: drill.year, month: null, week: null, day: null })}
                    >
                      {drill.year}
                    </button>
                  </>
                )}
                {drill.month != null && (
                  <>
                    <span style={{ opacity: 0.4 }}>›</span>
                    <button
                      type="button"
                      className={`sh-pillbtn ${drill.week == null ? "active" : ""}`}
                      onClick={() => setDrill({ ...drill, week: null, day: null })}
                    >
                      {MONTH_NAMES[drill.month - 1]}
                    </button>
                  </>
                )}
                {drill.week != null && (
                  <>
                    <span style={{ opacity: 0.4 }}>›</span>
                    <button
                      type="button"
                      className={`sh-pillbtn ${drill.day == null ? "active" : ""}`}
                      onClick={() => setDrill({ ...drill, day: null })}
                    >
                      {weekLabel(drill.week)}
                    </button>
                  </>
                )}
                {drill.day != null && (
                  <>
                    <span style={{ opacity: 0.4 }}>›</span>
                    <button type="button" className="sh-pillbtn active">
                      {formatCaseDate(drill.day)}
                    </button>
                  </>
                )}
              </div>

              {drill.day == null && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                  {drill.week != null
                    ? dayOptions.map((d) => (
                        <button type="button" key={d} className="sh-pillbtn" onClick={() => setDrill({ ...drill, day: d })}>
                          {formatCaseDate(d)}
                        </button>
                      ))
                    : drill.month != null
                      ? weekOptions.map((w) => (
                          <button
                            type="button"
                            key={w}
                            className="sh-pillbtn"
                            onClick={() => setDrill({ ...drill, week: w })}
                          >
                            {weekLabel(w)}
                          </button>
                        ))
                      : drill.year != null
                        ? monthOptions.map((m) => (
                            <button
                              type="button"
                              key={m}
                              className="sh-pillbtn"
                              onClick={() => setDrill({ ...drill, month: m })}
                            >
                              {MONTH_NAMES[m - 1]}
                            </button>
                          ))
                        : yearOptions.map((y) => (
                            <button
                              type="button"
                              key={y}
                              className="sh-pillbtn"
                              onClick={() => setDrill({ year: y, month: null, week: null, day: null })}
                            >
                              {y}
                            </button>
                          ))}
                </div>
              )}
            </div>

            <div className="field" style={{ flex: "1 1 200px" }}>
              <label htmlFor="case-employer">Employer</label>
              <EmployerCombobox value={employerQuery} onChange={setEmployerQuery} options={employerOptions} />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "var(--space-3)",
            }}
          >
            <div className="sh-meta">
              {filtered.length} casefile{filtered.length === 1 ? "" : "s"}
            </div>
            {hasFilters && (
              <button type="button" className="btn btn-ghost" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>

          <div className="sh-section" style={{ marginTop: "var(--space-3)" }}>
            {filtered.length === 0 ? (
              <p className="sh-meta">No casefiles match those filters.</p>
            ) : (
              <div className="sh-list">
                {filtered.map((rc) => (
                  <div className="sh-row" key={rc.id}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="sh-row-title">{rc.name}</div>
                      <div className="sh-row-meta">{caseMeta(rc)}</div>
                      {rc.employers.length > 0 && (
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                          {rc.employers.map((emp) => (
                            <span className="tag tag-neutral" key={emp}>
                              {emp}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ flex: "none" }}
                      onClick={() => openCase(rc.id)}
                      aria-label={`Open ${rc.name}`}
                    >
                      Open
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
