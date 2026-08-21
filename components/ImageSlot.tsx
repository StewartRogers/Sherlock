/**
 * Stands in for a captured photograph or scanned page. The prototype has no
 * camera, so each slot shows the evidence code it would carry.
 */
export function ImageSlot({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`sh-slot halftone ${className}`} role="img" aria-label={`Placeholder for ${label}`}>
      <span>{label}</span>
    </div>
  );
}
