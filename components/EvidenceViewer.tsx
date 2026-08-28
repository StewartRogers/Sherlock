"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ImageSlot, type SlotVariant } from "./ImageSlot";

export interface EvidenceViewItem {
  code: string;
  label: string;
  variant: SlotVariant;
  meta?: string;
}

/** A small clickable thumbnail that opens the full-size viewer on click. */
export function EvidenceThumb({
  item,
  onOpen,
  size = 40,
}: {
  item: EvidenceViewItem;
  onOpen: (item: EvidenceViewItem) => void;
  size?: number;
}) {
  return (
    <button
      type="button"
      className="sh-evthumb"
      style={{ width: size, height: size }}
      onClick={() => onOpen(item)}
      aria-label={`View full size: ${item.label}`}
    >
      <ImageSlot label={item.code} variant={item.variant} />
      <span className="sh-evthumb-code">{item.code}</span>
    </button>
  );
}

/** Full-size overlay for a piece of evidence, opened from its thumbnail. */
export function EvidenceViewerOverlay({
  item,
  onClose,
  children,
}: {
  item: EvidenceViewItem | null;
  onClose: () => void;
  children?: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!item) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  /* Move focus into the dialog on open and hand it back on close, so a
     keyboard user is not left tabbing through the page behind the scrim. */
  useEffect(() => {
    if (!item) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previous?.focus?.();
  }, [item]);

  if (!item) return null;

  return (
    <div
      className="sh-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={item.label}
      /* Stop as well as close: the graph wraps this in a click handler that
         clears the node selection, so dismissing a photo used to empty the
         inspector panel behind it too. */
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div className="sh-overlay-panel" onClick={(e) => e.stopPropagation()}>
        <button
          ref={closeRef}
          type="button"
          className="sh-overlay-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <div className="sh-overlay-image">
          <ImageSlot label={item.code} variant={item.variant} />
        </div>
        <div className="sh-overlay-caption">
          <span className="tag tag-neutral">{item.code}</span>
          <span className="sh-row-title" style={{ fontSize: 15 }}>
            {item.label}
          </span>
        </div>
        {item.meta && <p className="sh-meta" style={{ marginTop: 4 }}>{item.meta}</p>}
        {children}
      </div>
    </div>
  );
}
