import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Placeholder map canvas for Phase 1. Phase 4/5 replaces the inner surface with
 * a real map + routing provider while keeping this wrapper and its overlays.
 */
export function MapSurface({
  className,
  children,
  showControls = true,
  showRider = true,
}: {
  className?: string;
  children?: ReactNode;
  showControls?: boolean;
  showRider?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden map-surface", className)}>
      <div className="absolute inset-0 map-roads" />

      {showRider ? (
        <div className="absolute left-[46%] top-[54%]">
          <div className="loc-pulse size-4 rounded-full bg-signal ring-2 ring-paper/70" />
        </div>
      ) : null}

      {children}

      {showControls ? (
        <div className="absolute right-4 top-4 flex gap-2">
          <button
            type="button"
            aria-label="Zoom in"
            className="grid size-11 place-items-center rounded-xl frost-ink text-lg text-paper ring-1 ring-border"
          >
            +
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            className="grid size-11 place-items-center rounded-xl frost-ink text-lg text-paper ring-1 ring-border"
          >
            −
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function MapMarker({
  left,
  top,
  tone,
  label,
}: {
  left: string;
  top: string;
  tone: "signal" | "amber" | "danger";
  label: string;
}) {
  const dot =
    tone === "signal" ? "bg-signal" : tone === "amber" ? "bg-amber" : "bg-danger";

  return (
    <div
      className="absolute flex items-center gap-1 rounded-full bg-paper/90 px-2 py-1 text-[11px] font-semibold text-ink ring-1 ring-black/5"
      style={{ left, top }}
    >
      <span className={cn("size-2 rounded-full", dot)} />
      {label}
    </div>
  );
}
