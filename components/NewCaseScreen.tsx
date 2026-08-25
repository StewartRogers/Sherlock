"use client";

import { useState } from "react";
import { NEW_CASE_STAMP, nearestJobsite } from "@/lib/data";
import { useSherlock } from "@/lib/store";

export function NewCaseScreen() {
  const {
    newCaseEmployers,
    newEmployerText,
    setNewEmployerText,
    newCaseAddress,
    setNewCaseAddress,
    addEmployer,
    removeNewEmployer,
    startInspection,
    backHome,
  } = useSherlock();
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  function useCurrentLocation() {
    if (!("geolocation" in navigator)) {
      setLocateError("Location services aren't available on this device.");
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const site = nearestJobsite(pos.coords.latitude, pos.coords.longitude);
        setNewCaseAddress(site.address);
        setLocating(false);
      },
      (err) => {
        setLocateError(
          err.code === err.PERMISSION_DENIED
            ? "Location access was denied — enter the address manually."
            : "Couldn't get your location — enter the address manually.",
        );
        setLocating(false);
      },
      { timeout: 10000 },
    );
  }

  return (
    <div className="sh-pad" style={{ flex: 1, overflowY: "auto" }}>
      <div className="sh-measure">
        <div className="sh-kicker">New casefile</div>
        <h2 className="sh-title">Start an inspection</h2>
        <p className="sh-meta">
          Sherlock will save the date and time automatically, then keep everything you capture
          organized in one place.
        </p>

        <div className="sh-section field">
          <label htmlFor="site-address">Site address</label>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              id="site-address"
              type="text"
              className="input"
              placeholder={NEW_CASE_STAMP.address}
              value={newCaseAddress}
              onChange={(e) => setNewCaseAddress(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={useCurrentLocation}
              disabled={locating}
            >
              {locating ? "Locating…" : "Use my location"}
            </button>
          </div>
          {locateError && (
            <div style={{ fontSize: 12, color: "var(--color-accent-2-700)", marginTop: 6 }}>
              {locateError}
            </div>
          )}
          <div style={{ fontSize: 12, opacity: 0.55, marginTop: 6 }}>
            Picks the nearest known jobsite from your location — review and edit before starting.
          </div>
          <div style={{ fontSize: 14, opacity: 0.65, marginTop: "var(--space-2)" }}>
            {NEW_CASE_STAMP.timestamp}
          </div>
        </div>

        <div className="sh-section field">
          <label htmlFor="employer-name">Employers on site</label>
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: "var(--space-2)",
            }}
          >
            {newCaseEmployers.map((emp, i) => (
              <span className="tag tag-accent" key={`${emp}-${i}`} style={{ gap: 6 }}>
                {emp}
                <button
                  type="button"
                  onClick={() => removeNewEmployer(i)}
                  aria-label={`Remove ${emp}`}
                  style={{
                    background: "none",
                    border: 0,
                    cursor: "pointer",
                    color: "inherit",
                    font: "inherit",
                    lineHeight: 1,
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <form
            style={{ display: "flex", gap: 6 }}
            onSubmit={(e) => {
              e.preventDefault();
              addEmployer();
            }}
          >
            <input
              id="employer-name"
              type="text"
              className="input"
              placeholder="Employer name"
              value={newEmployerText}
              onChange={(e) => setNewEmployerText(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-secondary">
              Add
            </button>
          </form>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={startInspection}
          style={{ marginTop: "var(--space-6)" }}
        >
          Start inspection
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-block"
          onClick={backHome}
          style={{ marginTop: "var(--space-2)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
