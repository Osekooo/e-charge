import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
  const [locationState, setLocationState] = useState<LocationState>("prompt");
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

  const requestLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationState("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRider({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationState("granted");
      },
      () => setLocationState("denied"),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  // Look up a place in Kenya (OpenStreetMap Nominatim — free, no API key) so
  // riders can check stations where they are heading, not just where they are.
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
      const hits = (await res.json()) as { lat: string; lon: string; display_name: string }[];
      const hit = hits[0];
      if (!hit) {
        setPlaceError(`Couldn't find "${term}" in Kenya. Try a nearby town or landmark.`);
        return;
      }
      setRider({ lat: Number(hit.lat), lng: Number(hit.lon) });
      setLocationState("granted");
      setQuery("");
      setRadiusKm(10);
    } catch {
      setPlaceError("Place search failed. Check your connection and try again.");
    } finally {
      setPlaceBusy(false);
    }
  };

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows
      .map((row) => toStation(row, rider))
      .filter((station) => !rider || !Number.isFinite(station.distanceKm) || station.distanceKm <= radiusKm)
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
          onPick={locationState === "granted" ? (p) => setRider(p) : undefined}
          pins={results
            .filter((st) => st.latitude != null && st.longitude != null)
            .map((st) => ({
              id: st.id,
              lat: st.latitude!,
              lng: st.longitude!,
              tone: markerTone(st),
              label: `${st.name} · ${markerLabel(st)}`,
              onClick: () => navigate({ to: "/stations/$stationId", params: { stationId: st.id } }),
            }))}
        />
        {rider ? (
          <button
            type="button"
            onClick={() => setRecenterTick((t) => t + 1)}
            aria-label="Re-center map on my location"
            className="absolute bottom-4 right-3 z-[500] flex min-h-[48px] items-center gap-2 rounded-xl bg-paper px-4 text-sm font-semibold text-ink shadow-lg ring-1 ring-black/10 transition-colors hover:bg-paper/90"
          >
            <span className="size-2.5 rounded-full bg-signal" />
            RE-CENTER
          </button>
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
                USE MY LOCATION
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
                  TRY AGAIN
                </button>
                <button
                  type="button"
                  onClick={() => { setRider(null); setLocationState("granted"); }}
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
                {rider ? "Using your location (tap the map to move it)." : "Tap the map to set your starting point."} Showing stations within{" "}
                <strong className="font-semibold">{radiusKm} km</strong>, nearest first.
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
            <p className="mt-2 rounded-xl bg-amber/12 px-3 py-2 text-sm text-ink ring-1 ring-amber/30">{placeError}</p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 rounded-xl bg-paper/60 px-3 py-2 ring-1 ring-black/5">
              <span className="text-xs text-ink/60">Battery level (optional)</span>
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
            <h2 className="font-display text-lg font-semibold text-ink">Nearby stations</h2>
            <span className="text-xs text-neutral">
              {rider ? `${results.length} within ${radiusKm} km` : `${results.length} stations`}
            </span>
          </div>

          <div className="mt-3 space-y-3">
            {isLoading ? (
              <p className="py-6 text-center text-sm text-ink/60">Loading stations…</p>
            ) : isError ? (
              <p className="py-6 text-center text-sm text-danger">Could not load stations. Check your connection and try again.</p>
            ) : results.length > 0 ? (
              results.map((station) => <StationCard key={station.id} station={station} />)
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
            Only E-Charge verified stations are shown. Distances are straight-line estimates for
            now; road distance arrives with in-app navigation.{" "}
            <Link to="/register-station" className="underline underline-offset-2">
              Own a station?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
