import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { LeafletMap } from "@/components/leaflet-map";
import { getApprovedStations } from "@/lib/public-stations.functions";
import { toStation, type LatLng } from "@/lib/station-adapter";
import { StationCard } from "@/components/station-card";
import type { Station } from "@/data/stations";

export const Route = createFileRoute("/find-station")({
  head: () => ({
    meta: [
      { title: "Find a Station — E-Charge" },
      {
        name: "description",
        content:
          "Search nearby electric motorcycle charging and battery-swap stations by name, area, town or county, and navigate to the nearest one.",
      },
      { property: "og:title", content: "Find a Station — E-Charge" },
      {
        property: "og:description",
        content:
          "Nearby verified charging and battery-swap stations with road distance, ETA and live availability.",
      },
    ],
  }),
  component: FindStation,
});

type LocationState = "prompt" | "granted" | "denied";

const markerTone = (station: Station) =>
  station.status === "closed" || station.status === "unavailable"
    ? "danger"
    : station.type === "both"
      ? "signal"
      : "amber";

const markerLabel = (station: Station) =>
  `${station.type === "both" ? "Both" : station.type === "swap" ? "Swap" : "Charging"}${Number.isFinite(station.distanceKm) ? ` · ${station.distanceKm}km` : ""}`;

function FindStation() {
  const [locationState, setLocationState] =
    useState<LocationState>("prompt");
  const [query, setQuery] = useState("");
  const [battery, setBattery] = useState("");
  const [radiusKm, setRadiusKm] = useState(10);
  const [rider, setRider] = useState<LatLng | null>(null);
  const [recenterTick, setRecenterTick] = useState(0);
  const navigate = useNavigate();

  const { data: rows = [], isLoading, isError } = useQuery({
    queryKey: ["approved-stations"],
    queryFn: () => getApprovedStations(),
  });

  // gps is the rider's true device position.
  // rider is the active search origin, which can also be a searched place.
  const [gps, setGps] = useState<LatLng | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [locStatus, setLocStatus] = useState<
    "idle" | "locating" | "done" | "error"
  >("idle");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Used to ignore tiny GPS drift when the rider is stationary.
  const lastAcceptedGps = useRef<LatLng | null>(null);

  const requestLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationState("denied");
      setLocStatus("error");
      return;
    }

    setLocStatus("locating");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const {
          latitude,
          longitude,
          accuracy,
          heading: gpsHeading,
          speed,
        } = pos.coords;

        // Do not use weak readings. Low-quality readings are the main reason
        // maps jump far away or shake while a rider is standing still.
        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          accuracy > 80
        ) {
          setLocStatus("error");
          setTimeout(() => setLocStatus("idle"), 2500);
          return;
        }

        const nextPosition = { lat: latitude, lng: longitude };
        const previousPosition = lastAcceptedGps.current;

        // Around 13 metres. Ignore smaller movements caused by normal GPS noise.
        const hasMeaningfullyMoved =
          !previousPosition ||
          Math.abs(nextPosition.lat - previousPosition.lat) > 0.00012 ||
          Math.abs(nextPosition.lng - previousPosition.lng) > 0.00012;

        if (hasMeaningfullyMoved) {
          lastAcceptedGps.current = nextPosition;
          setGps(nextPosition);
          setRider(nextPosition);
        }

        // GPS heading is only reliable while moving.
        setHeading(
          gpsHeading != null &&
            !Number.isNaN(gpsHeading) &&
            (speed ?? 0) > 1
            ? gpsHeading
            : null,
        );

        setLocationState("granted");

        // The map only recenters because the rider deliberately tapped
        // "Use My Location", not because ordinary page updates happened.
        setRecenterTick((tick) => tick + 1);

        setLocStatus("done");
        setTimeout(() => setLocStatus("idle"), 1800);
      },
      () => {
        setLocationState("denied");
        setLocStatus("error");
        setTimeout(() => setLocStatus("idle"), 2500);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  };

  const locLabel =
    locStatus === "locating"
      ? "⟳ LOCATING…"
      : locStatus === "done"
        ? "✓ LOCATION UPDATED"
        : locStatus === "error"
          ? "LOCATION UNAVAILABLE"
          : "◎ USE MY LOCATION";

  // Search a Kenyan destination without replacing the rider's actual GPS
  // location. This lets riders see stations around where they are going.
  const [placeBusy, setPlaceBusy] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);

  const searchPlace = async () => {
    const term = query.trim();

    if (!term) return;

    setPlaceBusy(true);
    setPlaceError(null);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ke&q=${encodeURIComponent(term)}`,
        { headers: { Accept: "application/json" } },
      );

      const hits = (await res.json()) as {
        lat: string;
        lon: string;
        display_name: string;
      }[];

      const hit = hits[0];

      if (!hit) {
        setPlaceError(
          `Couldn't find "${term}" in Kenya. Try a nearby town or landmark.`,
        );
        return;
      }

      setRider({
        lat: Number(hit.lat),
        lng: Number(hit.lon),
      });

      setLocationState("granted");
      setRecenterTick((tick) => tick + 1);
      setQuery("");
      setRadiusKm(15);

      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      setPlaceError(
        "Place search failed. Check your connection and try again.",
      );
    } finally {
      setPlaceBusy(false);
    }
  };

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();

    return rows
      .map((row) => toStation(row, rider))
      .filter(
        (station) =>
          !rider ||
          !Number.isFinite(station.distanceKm) ||
          station.distanceKm <= radiusKm,
      )
      .filter((station) =>
        term.length === 0
          ? true
          : [station.name, station.area, station.county, station.address]
              .join(" ")
              .toLowerCase()
              .includes(term),
      )
      .sort((a, b) => (a.distanceKm || 1e9) - (b.distanceKm || 1e9));
  }, [rows, rider, query, radiusKm]);

  const selected = selectedId
    ? results.find((station) => station.id === selectedId) ?? null
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <div className="relative">
        <div className="absolute inset-0 map-surface" />
        <div className="relative">
          <SiteHeader />
        </div>
      </div>

      <div className="relative">
        <LeafletMap
          className="h-[300px] sm:h-[340px]"
          rider={rider}
          center={rider}
          recenterSignal={recenterTick}
          riderHeading={
            rider && gps && rider.lat === gps.lat && rider.lng === gps.lng
              ? heading
              : null
          }
          selectedId={selectedId}
          onPick={
            locationState === "granted" ? (point) => setRider(point) : undefined
          }
          pins={results
            .filter(
              (station) =>
                station.latitude != null && station.longitude != null,
            )
            .map((station) => ({
              id: station.id,
              lat: station.latitude!,
              lng: station.longitude!,
              tone: markerTone(station),
              label: `${station.name} · ${markerLabel(station)}`,
              onClick: () => setSelectedId(station.id),
            }))}
        />

        <button
          type="button"
          onClick={requestLocation}
          disabled={locStatus === "locating"}
          aria-label="Use my current location"
          className={`absolute right-3 bottom-4 z-[500] flex min-h-[48px] items-center gap-2 rounded-xl px-4 text-sm font-semibold shadow-lg ring-1 transition-all active:scale-95 ${
            locStatus === "done"
              ? "bg-signal text-ink ring-signal"
              : "bg-paper text-ink ring-black/10 hover:bg-paper/90"
          }`}
        >
          <span
            className={
              locStatus === "locating" ? "inline-block animate-spin" : ""
            }
          >
            {locLabel.slice(0, 2)}
          </span>
          {locLabel.slice(2)}
        </button>

        {selected ? (
          <div className="absolute inset-x-3 top-3 z-[500] rounded-2xl bg-paper/95 p-3 text-ink shadow-xl ring-1 ring-black/10 sm:left-auto sm:w-80">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-display text-[15px] font-semibold">
                  {selected.name}
                </p>
                <p className="text-xs text-ink/60">
                  <span
                    className={
                      selected.status === "open"
                        ? "font-semibold text-signal"
                        : "font-semibold text-danger"
                    }
                  >
                    {selected.status === "open" ? "Open now" : "Closed"}
                  </span>
                  {Number.isFinite(selected.distanceKm)
                    ? ` · ${selected.distanceKm} km away`
                    : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label="Close"
                className="size-8 shrink-0 rounded-lg text-ink/60 hover:bg-ink/5"
              >
                ✕
              </button>
            </div>

            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  navigate({
                    to: "/navigate/$stationId",
                    params: { stationId: selected.id },
                  })
                }
                className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-signal text-sm font-semibold text-ink transition-all active:scale-95"
              >
                START NAVIGATION
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate({
                    to: "/stations/$stationId",
                    params: { stationId: selected.id },
                  })
                }
                className="flex min-h-[44px] items-center justify-center rounded-xl bg-paper px-3 text-sm font-medium ring-1 ring-black/10 transition-all active:scale-95"
              >
                DETAILS
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="sheet-in -mt-6 flex-1 rounded-t-[24px] frost px-5 pt-3 pb-16 ring-1 ring-black/5 sm:px-8">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ink/20" />

        <div className="mx-auto max-w-2xl">
          {locationState === "prompt" ? (
            <div className="rounded-2xl bg-signal/12 px-4 py-4 ring-1 ring-signal/30">
              <p className="font-display text-[15px] font-semibold text-ink">
                Allow E-Charge to access your location
              </p>
              <p className="mt-1 text-sm leading-snug text-pretty text-ink/70">
                This is needed to find nearby stations and calculate routes.
              </p>
              <button
                type="button"
                onClick={requestLocation}
                className="mt-3 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-signal text-sm font-semibold text-ink ring-1 ring-signal transition-colors hover:bg-signal/90"
              >
                {locLabel}
              </button>
            </div>
          ) : null}

          {locationState === "denied" ? (
            <div className="rounded-2xl bg-amber/12 px-4 py-4 ring-1 ring-amber/30">
              <p className="font-display text-[15px] font-semibold text-ink">
                Location access is required to find nearby stations.
              </p>
              <p className="mt-1 text-sm leading-snug text-pretty text-ink/70">
                You can try again, or pick your starting point on the map instead.
              </p>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={requestLocation}
                  className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-ink text-sm font-semibold text-paper transition-colors hover:bg-ink/90"
                >
                  {locStatus === "locating" ? "⟳ LOCATING…" : "TRY AGAIN"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRider(null);
                    setLocationState("granted");
                  }}
                  className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-paper/70 text-sm font-medium text-ink ring-1 ring-black/10 transition-colors hover:bg-paper"
                >
                  CHOOSE LOCATION ON MAP
                </button>
              </div>
            </div>
          ) : null}

          {locationState === "granted" ? (
            <div className="flex items-center gap-2 rounded-2xl bg-signal/12 px-4 py-3 ring-1 ring-signal/30">
              <span className="size-3 shrink-0 rounded-full bg-signal" />
              <p className="text-sm leading-snug text-pretty text-ink/80">
                {!rider
                  ? "Tap the map to set your starting point."
                  : gps &&
                      rider.lat === gps.lat &&
                      rider.lng === gps.lng
                    ? "Using your location."
                    : "Showing a searched or picked place — tap Use My Location to return."}{" "}
                Showing stations within{" "}
                <strong className="font-semibold">{radiusKm} km</strong>,
                nearest first.
              </p>
            </div>
          ) : null}

          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-paper/60 px-4 py-3 ring-1 ring-black/5">
            <span className="text-lg text-neutral">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  searchPlace();
                }
              }}
              className="w-full bg-transparent text-base text-ink placeholder:text-neutral focus:outline-none"
              placeholder="Search station, area, town or county"
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={searchPlace}
              disabled={placeBusy || !query.trim()}
              className="min-h-[44px] rounded-xl bg-ink px-4 text-sm font-semibold text-paper transition-colors hover:bg-ink/90 disabled:opacity-50"
            >
              {placeBusy ? "SEARCHING…" : "SEARCH THIS PLACE ON THE MAP"}
            </button>

            <span className="text-xs text-neutral">
              Heading somewhere? Search a town or area to see stations there.
            </span>
          </div>

          {placeError ? (
            <p className="mt-2 rounded-xl bg-amber/12 px-3 py-2 text-sm text-ink ring-1 ring-amber/30">
              {placeError}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 rounded-xl bg-paper/60 px-3 py-2 ring-1 ring-black/5">
              <span className="text-xs text-ink/60">
                Battery level (optional)
              </span>
              <input
                value={battery}
                onChange={(event) => setBattery(event.target.value)}
                inputMode="numeric"
                placeholder="—"
                className="w-12 bg-transparent text-sm text-ink placeholder:text-neutral focus:outline-none"
              />
              <span className="text-sm text-ink/60">%</span>
            </label>

            <span className="text-xs text-neutral">
              Battery level is never required to search.
            </span>
          </div>

          <div className="mt-5 flex items-baseline justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">
              Nearby stations
            </h2>
            <span className="text-xs text-neutral">
              {rider
                ? `${results.length} within ${radiusKm} km`
                : `${results.length} stations`}
            </span>
          </div>

          <div className="mt-3 space-y-3">
            {isLoading ? (
              <p className="py-6 text-center text-sm text-ink/60">
                Loading stations…
              </p>
            ) : isError ? (
              <p className="py-6 text-center text-sm text-danger">
                Could not load stations. Check your connection and try again.
              </p>
            ) : results.length > 0 ? (
              results.map((station) => (
                <StationCard key={station.id} station={station} />
              ))
            ) : (
              <div className="rounded-[18px] bg-paper/70 p-5 text-center ring-1 ring-black/5">
                <p className="font-display text-[17px] font-semibold text-ink">
                  No verified stations found nearby.
                </p>
                <p className="mt-1 text-sm text-ink/60">
                  We searched a {radiusKm} km radius around your location.
                </p>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setRadiusKm((value) => value + 10)}
                    className="flex min-h-[46px] flex-1 items-center justify-center rounded-xl bg-signal text-sm font-semibold text-ink ring-1 ring-signal"
                  >
                    EXPAND SEARCH
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setRadiusKm(500);
                    }}
                    className="flex min-h-[46px] flex-1 items-center justify-center rounded-xl bg-paper/70 text-sm font-medium text-ink ring-1 ring-black/10"
                  >
                    VIEW ALL STATIONS
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-neutral">
            Only E-Charge verified stations are shown. Distances are straight-line
            estimates for now; road distance arrives with in-app navigation.{" "}
            <Link to="/register-station" className="underline underline-offset-2">
              Own a station?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
