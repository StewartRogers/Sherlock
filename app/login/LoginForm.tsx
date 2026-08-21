"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { safeRedirectPath } from "@/lib/auth";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const entered = passcode.trim();
    if (submitting || !entered) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ passcode: entered }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error ?? "That passcode was not accepted.");
        setPasscode("");
        setSubmitting(false);
        return;
      }

      // Full navigation so the middleware re-runs with the new cookie.
      window.location.assign(safeRedirectPath(searchParams.get("next")));
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form className="sh-measure" onSubmit={onSubmit} style={{ width: "100%", maxWidth: 360 }}>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: "var(--space-2)" }}>Sherlock</div>
      <p className="text-muted" style={{ fontSize: 14, marginBottom: "var(--space-6)" }}>
        This casefile system is private. Enter the passcode to continue.
      </p>

      <div className="field">
        <label htmlFor="passcode">Passcode</label>
        <input
          id="passcode"
          className="input"
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          autoComplete="current-password"
          autoFocus
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "passcode-error" : undefined}
        />
      </div>

      {error && (
        <p
          id="passcode-error"
          role="alert"
          style={{ fontSize: 13, marginTop: "var(--space-2)", color: "var(--color-accent-2-700)" }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        className="btn btn-primary btn-block"
        disabled={submitting || !passcode}
        style={{ padding: "13px 22px", borderRadius: 14, marginTop: "var(--space-4)" }}
      >
        {submitting ? "Checking…" : "Unlock"}
      </button>
    </form>
  );
}
