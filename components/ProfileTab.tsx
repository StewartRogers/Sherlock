"use client";

import { useState } from "react";
import { NEW_CASE_STAMP } from "@/lib/data";
import { useSherlock } from "@/lib/store";
import { useCurrentLocation } from "@/lib/useCurrentLocation";

/** The casefile's own details — site address and employers — editable after the inspection starts. */
export function ProfileTab() {
  const {
    caseName,
    caseAddress,
    caseEmployers,
    setCaseAddress,
    addCaseEmployer,
    renameCaseEmployer,
    removeCaseEmployer,
    employerTags,
  } = useSherlock();

  const [addressDraft, setAddressDraft] = useState(caseAddress);
  const { locating, locateError, locate } = useCurrentLocation(setAddressDraft);
  const addressChanged = addressDraft.trim() !== caseAddress;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [newEmployer, setNewEmployer] = useState("");

  /** Why a name can't be saved, or null when it can. */
  function nameProblem(value: string, exceptId?: string): string | null {
    const key = value.trim().toLowerCase();
    if (!key) return null;
    return caseEmployers.some((e) => e.id !== exceptId && e.label.trim().toLowerCase() === key)
      ? "An employer with that name is already on this casefile."
      : null;
  }

  const renameIssue = editingId ? nameProblem(renameDraft, editingId) : null;
  const addIssue = nameProblem(newEmployer);

  function startRename(id: string, label: string) {
    setEditingId(id);
    setRenameDraft(label);
  }

  function commitRename() {
    if (!editingId || !renameDraft.trim() || renameIssue) return;
    renameCaseEmployer(editingId, renameDraft);
    setEditingId(null);
  }

  return (
    <div className="sh-measure">
      <div className="sh-kicker">Casefile profile</div>
      <h2 className="sh-title">{caseName}</h2>
      <p className="sh-meta">{NEW_CASE_STAMP.timestamp}</p>

      <form
        className="sh-section field"
        onSubmit={(e) => {
          e.preventDefault();
          if (addressChanged && addressDraft.trim()) setCaseAddress(addressDraft);
        }}
      >
        <label htmlFor="profile-address">Site address</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <input
            id="profile-address"
            type="text"
            className="input"
            value={addressDraft}
            onChange={(e) => setAddressDraft(e.target.value)}
            style={{ flex: "1 1 220px" }}
          />
          <button type="button" className="btn btn-secondary" onClick={locate} disabled={locating}>
            {locating ? "Locating…" : "Use my location"}
          </button>
        </div>
        {locateError && (
          <div style={{ fontSize: 12, color: "var(--color-accent-2-700)", marginTop: 6 }}>
            {locateError}
          </div>
        )}
        <div style={{ display: "flex", gap: 6, marginTop: "var(--space-2)" }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!addressChanged || !addressDraft.trim()}
          >
            Save address
          </button>
          {addressChanged && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setAddressDraft(caseAddress)}
            >
              Discard
            </button>
          )}
        </div>
      </form>

      <div className="sh-section field">
        <span className="field-label">Employers on site</span>
        <div className="sh-list">
          {caseEmployers.map((ce) => {
            const tags = employerTags(ce.id);
            const onlyOne = caseEmployers.length <= 1;
            const reasonId = `employer-${ce.id}-usage`;

            if (editingId === ce.id) {
              return (
                <form
                  key={ce.id}
                  className="sh-row"
                  style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    commitRename();
                  }}
                >
                  <input
                    type="text"
                    className="input"
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    aria-label={`Rename ${ce.label}`}
                    autoFocus
                  />
                  {renameIssue && (
                    <div style={{ fontSize: 12, color: "var(--color-accent-2-700)" }}>{renameIssue}</div>
                  )}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={!renameDraft.trim() || Boolean(renameIssue)}
                    >
                      Save
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              );
            }

            return (
              <div className="sh-row" key={ce.id} style={{ flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                  <div className="sh-row-title" style={{ overflowWrap: "break-word" }}>
                    {ce.label}
                  </div>
                  <div className="sh-row-meta" id={reasonId}>
                    {tags.length
                      ? `Tagged to ${tags.join(", ")}`
                      : onlyOne
                        ? "A casefile needs at least one employer"
                        : "Not tagged to anything yet"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => startRename(ce.id, ce.label)}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => removeCaseEmployer(ce.id)}
                    disabled={tags.length > 0 || onlyOne}
                    aria-describedby={reasonId}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <form
          style={{ display: "flex", gap: 6, marginTop: "var(--space-3)" }}
          onSubmit={(e) => {
            e.preventDefault();
            if (!newEmployer.trim() || addIssue) return;
            addCaseEmployer(newEmployer);
            setNewEmployer("");
          }}
        >
          <input
            type="text"
            className="input"
            placeholder="Employer name"
            aria-label="New employer name"
            value={newEmployer}
            onChange={(e) => setNewEmployer(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            className="btn btn-secondary"
            disabled={!newEmployer.trim() || Boolean(addIssue)}
          >
            Add
          </button>
        </form>
        {addIssue && (
          <div style={{ fontSize: 12, color: "var(--color-accent-2-700)", marginTop: 6 }}>{addIssue}</div>
        )}
      </div>
    </div>
  );
}
