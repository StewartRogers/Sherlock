import { ConstructionSitePhoto, NotesPagePhoto } from "./illustrations";

export type SlotVariant = "placeholder" | "construction" | "notes";

/**
 * Stands in for a captured photograph or scanned page. The prototype has no
 * camera, so "construction"/"notes" show an illustrative stand-in image;
 * "placeholder" (the default, used where the exact evidence code matters
 * more than a picture, e.g. the case folder) keeps the plain coded tile.
 */
export function ImageSlot({
  label,
  variant = "placeholder",
}: {
  label: string;
  variant?: SlotVariant;
}) {
  if (variant === "placeholder") {
    return (
      <div className="sh-slot halftone" role="img" aria-label={`Placeholder for ${label}`}>
        <span>{label}</span>
      </div>
    );
  }

  const Illustration = variant === "construction" ? ConstructionSitePhoto : NotesPagePhoto;
  const description = variant === "construction" ? "Construction site photo" : "Notebook page photo";

  return (
    <div className="sh-slot-photo" role="img" aria-label={`${description} for ${label}`}>
      <Illustration />
    </div>
  );
}
