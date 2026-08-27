"use client";

import { useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { ChatPanel } from "./ChatPanel";
import { ChatIcon } from "./icons";

export function ChatOverlay({
  messages,
  onAsk,
  onSourceClick,
}: {
  messages: ChatMessage[];
  onAsk: (text: string) => void;
  onSourceClick: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);

  function jumpTo(code: string) {
    onSourceClick(code);
    setOpen(false);
  }

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Chat with your data"
          style={{
            position: "fixed",
            right: "var(--space-4)",
            bottom: "calc(64px + var(--space-4) * 2)",
            width: "min(380px, calc(100vw - 32px))",
            maxHeight: "min(560px, calc(100vh - 140px))",
            display: "flex",
            flexDirection: "column",
            background: "var(--color-bg)",
            border: "1px solid var(--color-divider)",
            borderRadius: 16,
            boxShadow: "var(--shadow-lg)",
            overflow: "hidden",
            zIndex: 60,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              borderBottom: "1px solid var(--color-divider)",
              flex: "none",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700 }}>Chat with your data</div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              style={{
                background: "none",
                border: 0,
                cursor: "pointer",
                fontSize: 18,
                lineHeight: 1,
                color: "var(--color-text)",
                opacity: 0.6,
                padding: 4,
              }}
            >
              ×
            </button>
          </div>
          <div style={{ padding: 14, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <ChatPanel messages={messages} onAsk={onAsk} onSourceClick={jumpTo} />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat with your data" : "Chat with your data"}
        aria-expanded={open}
        style={{
          position: "fixed",
          right: "var(--space-4)",
          bottom: "var(--space-4)",
          width: 52,
          height: 52,
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-accent)",
          color: "var(--color-bg)",
          boxShadow: "var(--shadow-lg)",
          zIndex: 60,
        }}
      >
        <ChatIcon />
      </button>
    </>
  );
}
