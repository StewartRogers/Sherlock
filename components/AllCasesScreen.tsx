"use client";

import { useMemo, useState } from "react";
import { caseMeta, formatCaseDate } from "@/lib/data";
import { useSherlock } from "@/lib/store";
import { BackIcon } from "./icons";

export function AllCasesScreen() {
  const { recentCases, openCase, backHome } = useSherlock();
  const [keyword, setKeyword] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [employerFilter, setEmployerFilter] = useState("");

  const sortedCases = useMemo(
    () => [...recentCases].sort((a, b) => b.date.localeCompare(a.date)),
    [recentCases],
  );

  const dateOptions = useMemo(
    () => Array.from(new Set(sortedCases.map((rc) => rc.date))),
    [sortedCases],
  );
  const employerOptions = useMemo(
    () =>
      Array.from(new Set(recentCases.flatMap((rc) => rc.employers))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [recentCases],
  );

  const kw = keyword.trim().toLowerCase();
  const filtered = sortedCases.filter((rc) => {
    if (dateFilter && rc.date !== dateFilter) return false;
    if (employerFilter && !rc.employers.includes(employerFilter)) return false;
    if (kw) {
      const haystack = [rc.name, rc.address, ...rc.employers].join(" ").toLowerCase();
      if (!haystack.includes(kw)) return false;
    }
    return true;
  });

  const hasFilters = kw !== "" || dateFilter !== "" || employerFilter !== "";
  function clearFilters() {
    setKeyword("");
    setDateFilter("");
    setEmployerFilter("");
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
              placeholder="Search by name, address, or employer"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div className="field" style={{ flex: "1 1 160px" }}>
              <label htmlFor="case-date">Date</label>
              <select
                id="case-date"
                className="input"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="">All dates</option>
                {dateOptions.map((d) => (
                  <option key={d} value={d}>
                    {formatCaseDate(d)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ flex: "1 1 160px" }}>
              <label htmlFor="case-employer">Employer</label>
              <select
                id="case-employer"
                className="input"
                value={employerFilter}
                onChange={(e) => setEmployerFilter(e.target.value)}
              >
                <option value="">All employers</option>
                {employerOptions.map((emp) => (
                  <option key={emp} value={emp}>
                    {emp}
                  </option>
                ))}
              </select>
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
