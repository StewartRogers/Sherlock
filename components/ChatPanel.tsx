"use client";

import { useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types";

const SUGGESTIONS = ["What's still open?", "List the orders", "How many photos are there?"];

export function ChatPanel({
  messages,
  onAsk,
  onSourceClick,
}: {
  messages: ChatMessage[];
  onAsk: (text: string) => void;
  onSourceClick: (code: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  function ask(text: string) {
    const q = text.trim();
    if (!q) return;
    onAsk(q);
    setDraft("");
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  return (
    <div>
      {messages.length === 0 ? (
        <div>
          <p className="sh-meta">
            Ask about this casefile&rsquo;s evidence, notes, employers, or report content.
          </p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: "var(--space-2)" }}>
            {SUGGESTIONS.map((s) => (
              <button type="button" key={s} className="sh-pillbtn" onClick={() => ask(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div
          ref={listRef}
          className="sh-list"
          style={{ maxHeight: 360, overflowY: "auto", paddingRight: 2 }}
        >
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "88%",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div
                style={{
                  padding: "9px 12px",
                  borderRadius: 14,
                  fontSize: 14,
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  background: m.role === "user" ? "var(--color-accent)" : "var(--color-surface)",
                  color: m.role === "user" ? "var(--color-bg)" : "var(--color-text)",
                  border: m.role === "user" ? "none" : "1px solid var(--color-divider)",
                }}
              >
                {m.text}
              </div>
              {!!m.sources?.length && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {m.sources.map((code) => (
                    <button
                      type="button"
                      key={code}
                      className="tag tag-outline"
                      style={{ cursor: "pointer", border: "1px solid var(--color-divider)", color: "inherit" }}
                      onClick={() => onSourceClick(code)}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <form
        style={{ display: "flex", gap: 6, marginTop: "var(--space-3)" }}
        onSubmit={(e) => {
          e.preventDefault();
          ask(draft);
        }}
      >
        <input
          type="text"
          className="input"
          placeholder="Ask about this casefile…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="Ask about this casefile"
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-secondary" disabled={!draft.trim()}>
          Ask
        </button>
      </form>
    </div>
  );
}
