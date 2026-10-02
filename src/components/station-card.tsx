import { Link } from "@tanstack/react-router";
import {
  stationTypeLabels,
  statusLabels,
  type Station,
  type StationStatus,
} from "@/data/stations";
import { cn } from "@/lib/utils";
import { fmtKm, fmtMin } from "@/lib/station-adapter";

const statusStyles: Record<StationStatus, string> = {
  open: "bg-signal/15 text-signal ring-signal/30",
  busy: "bg-amber/15 text-ink ring-amber/30",
  closed: "bg-danger/15 text-danger ring-danger/30",
  unavailable: "bg-danger/15 text-danger ring-danger/30",
};

const availabilityStyles = {
  good: "text-signal",
  low: "text-amber",
  none: "text-danger",
} as const;

export function StationCard({ station }: { station: Station }) {
  const dimmed = station.status === "closed" || station.status === "unavailable";

  return (
    <article
      className={cn(
        "rounded-[18px] p-4 ring-1 ring-black/5",
        dimmed ? "bg-paper/50" : "bg-paper/70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className={cn(
              "truncate font-display text-[17px] font-semibold",
              dimmed ? "text-ink/70" : "text-ink",
            )}
          >
            {station.name}
          </h3>
          <p className={cn("mt-0.5 text-sm", dimmed ? "text-ink/50" : "text-ink/60")}>
            {station.area}{Number.isFinite(station.distanceKm) ? ` · ${fmtKm(station.distanceKm)} · ETA ${fmtMin(station.etaMin)}` : ""}
          </p>
        </div>
        <div
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
            statusStyles[station.status],
          )}
        >
          {statusLabels[station.status]}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {stationTypeLabels[station.type].map((label) => (
          <span
            key={label}
            className={cn(
              "rounded-md bg-ink/8 px-2 py-1 text-[11px] font-medium",
              dimmed ? "text-ink/70" : "text-ink",
            )}
          >
            {label}
          </span>
        ))}
        {station.verified ? (
          <span className="rounded-md bg-amber/15 px-2 py-1 text-[11px] font-semibold text-ink ring-1 ring-amber/30">
            ✓ E-Charge Verified
          </span>
        ) : null}
      </div>

      {dimmed ? (
        <div className="mt-3 flex items-center gap-2 text-sm text-ink/50">
          {station.reopensAt ? <span>Reopens {station.reopensAt}</span> : <span>Unavailable</span>}
          <span className="text-neutral">· {station.updatedLabel}</span>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className={cn("font-semibold", availabilityStyles[station.availabilityTone])}>
            {station.availabilityLabel}
          </span>
          <span className="text-neutral">· {station.updatedLabel}</span>
        </div>
      )}

      {dimmed ? null : (
        <div className="mt-4 flex gap-2">
          <Link
            to="/stations/$stationId"
            params={{ stationId: station.id }}
            className="flex min-h-[46px] flex-1 items-center justify-center rounded-xl bg-signal px-4 text-sm font-semibold text-ink ring-1 ring-signal transition-colors hover:bg-signal/90"
          >
            NAVIGATE HERE
          </Link>
          <Link
            to="/stations/$stationId"
            params={{ stationId: station.id }}
            hash="report"
            className="flex min-h-[46px] items-center justify-center rounded-xl bg-paper/60 px-4 text-sm font-medium text-ink ring-1 ring-black/10 transition-colors hover:bg-paper/80"
          >
            REPORT
          </Link>
        </div>
      )}
    </article>
  );
}
