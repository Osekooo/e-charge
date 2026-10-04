import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
  `${station.type === "both" ? "Both" : station.type === "swap" ? "Swap" : "Charging"}${
    Number.isFinite(station.distanceKm)
      ? ` · ${station.distanceKm}km`
      : ""
  }`;

const distanceMeters = (a: LatLng, b: LatLng) => {
  const earthRadius = 6371000;

  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLat = lat2 - lat1;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;

  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) ** 2;

  return (
    2 *
    earthRadius *
    Math.asin(Math.min(1, Math.sqrt(value)))
  );
};

const interpolatePosition = (
  from: LatLng,
  to: LatLng,
  progress: number,
): LatLng => ({
  lat: from.lat + (to.lat - from.lat) * progress,
  lng: from.lng + (to.lng - from.lng) * progress,
});

function FindStation() {
  const [locationState, setLocationState] =
    useState<LocationState>("prompt");

  const [query, setQuery] = useState("");
  const [battery, setBattery] = useState("");
  const [radiusKm, setRadiusKm] = useState(10);

  const [rider, setRider] = useState<LatLng | null>(null);
  const [gps, setGps] = useState<LatLng | null>(null);

  const [heading, setHeading] = useState<number | null>(null);

  const [locStatus, setLocStatus] = useState<
    "idle" | "locating" | "done" | "error"
  >("idle");

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  /*
   * gpsMode means:
   *
   * true  = rider marker follows real device GPS
   * false = rider marker is showing a searched/picked place
   */
  const [gpsMode, setGpsMode] = useState(true);

  const navigate = useNavigate();

  const {
    data: rows = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["approved-stations"],
    queryFn: () => getApprovedStations(),
  });

  // ─────────────────────────────────────────────────────────────
  // LOCATION ENGINE REFS
  // ─────────────────────────────────────────────────────────────

  const gpsWatchId = useRef<number | null>(null);

  const lastAcceptedGps =
    useRef<LatLng | null>(null);

  const lastGpsTimestamp =
    useRef<number | null>(null);

  const riderRef =
    useRef<LatLng | null>(null);

  const targetGpsRef =
    useRef<LatLng | null>(null);

  const animationFrame =
    useRef<number | null>(null);

  const animationStart =
    useRef<LatLng | null>(null);

  const animationStartTime =
    useRef<number | null>(null);

  const animationDuration =
    useRef<number>(800);

  const trackingEnabled =
    useRef(true);

  const firstGpsFix =
    useRef(false);

  const recenterOnNextGps =
    useRef(false);

  const manualLocationRequest =
    useRef(false);

  /*
   * Keep rider state and riderRef synchronized.
   * The ref lets the animation engine know where the
   * marker is currently displayed.
   */
  const updateRider = (position: LatLng | null) => {
    riderRef.current = position;
    setRider(position);
  };

  const setGpsTrackingMode = (enabled: boolean) => {
    trackingEnabled.current = enabled;
    setGpsMode(enabled);
  };

  // ─────────────────────────────────────────────────────────────
  // SMOOTH GPS MARKER ANIMATION
  // ─────────────────────────────────────────────────────────────

  const animateRiderTo = (target: LatLng) => {
    targetGpsRef.current = target;

    /*
     * If there is no visible rider yet, show the first GPS fix
     * immediately.
     */
    if (!riderRef.current) {
      updateRider(target);
      return;
    }

    /*
     * If an animation is already running, don't start another one.
     * Simply changing targetGpsRef causes the existing animation
     * to smoothly chase the newest GPS position.
     */
    if (animationFrame.current !== null) {
      return;
    }

    animationStart.current = riderRef.current;
    animationStartTime.current = performance.now();

    const correctionDistance = distanceMeters(
      riderRef.current,
      target,
    );

    /*
     * Small corrections happen quickly.
     * Larger GPS corrections glide more slowly.
     *
     * This is the part intended to make the marker feel much
     * closer to the "Google Maps adjusts slowly" behavior.
     */
    animationDuration.current = Math.min(
      1800,
      Math.max(450, correctionDistance * 10),
    );

    const animate = (now: number) => {
      const start = animationStart.current;
      const latestTarget = targetGpsRef.current;

      if (!start || !latestTarget) {
        animationFrame.current = null;
        return;
      }

      const elapsed =
        now -
        (animationStartTime.current ?? now);

      const rawProgress = Math.min(
        1,
        elapsed / animationDuration.current,
      );

      /*
       * Smooth ease-out:
       * fast at the beginning, gentle as it reaches the
       * corrected position.
       */
      const easedProgress =
        1 - Math.pow(1 - rawProgress, 3);

      const nextPosition = interpolatePosition(
        start,
        latestTarget,
        easedProgress,
      );

      updateRider(nextPosition);

      if (rawProgress < 1) {
        animationFrame.current =
          requestAnimationFrame(animate);
      } else {
        /*
         * There may have been a newer GPS target while we
         * were animating. If so, immediately begin another
         * smooth correction toward it.
         */
        const remainingDistance =
          distanceMeters(
            nextPosition,
            latestTarget,
          );

        animationFrame.current = null;

        if (remainingDistance > 1) {
          animateRiderTo(latestTarget);
        } else {
          updateRider(latestTarget);
          targetGpsRef.current = latestTarget;
        }
      }
    };

    animationFrame.current =
      requestAnimationFrame(animate);
  };

  // ─────────────────────────────────────────────────────────────
  // ACCEPT / FILTER GPS READINGS
  // ─────────────────────────────────────────────────────────────

  const acceptGpsPosition = (
    position: GeolocationPosition,
  ) => {
    const {
      latitude,
      longitude,
      accuracy,
      heading: gpsHeading,
      speed,
    } = position.coords;

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(accuracy)
    ) {
      return;
    }

    /*
     * Very poor GPS fixes are not allowed to move the rider.
     *
     * We still allow a reasonably weak first fix so the map
     * can get an approximate position and then improve it.
     */
    if (accuracy > 100) {
      console.log(
        `E-Charge GPS ignored: ${accuracy.toFixed(
          1,
        )}m accuracy`,
      );

      return;
    }

    const nextPosition: LatLng = {
      lat: latitude,
      lng: longitude,
    };

    const previousPosition =
      lastAcceptedGps.current;

    const now =
      position.timestamp || Date.now();

    const previousTime =
      lastGpsTimestamp.current;

    const secondsSincePrevious =
      previousTime != null
        ? Math.max(
            (now - previousTime) / 1000,
            0.1,
          )
        : 0;

    const movedMeters = previousPosition
      ? distanceMeters(
          previousPosition,
          nextPosition,
        )
      : 0;

    /*
     * Browser GPS speed can be null.
     * When available, use it for heading decisions.
     */
    const reportedSpeed =
      speed != null &&
      Number.isFinite(speed) &&
      speed >= 0
        ? speed
        : null;

    const calculatedSpeed =
      previousPosition &&
      secondsSincePrevious > 0
        ? movedMeters /
          secondsSincePrevious
        : 0;

    const effectiveSpeed =
      reportedSpeed ?? calculatedSpeed;

    /*
     * ─────────────────────────────────────────────
     * OUTLIER PROTECTION
     * ─────────────────────────────────────────────
     *
     * A GPS reading that suddenly jumps a long distance
     * is treated as GPS noise instead of instantly moving
     * the rider marker.
     */
    if (
      previousPosition &&
      secondsSincePrevious < 5 &&
      movedMeters > 150
    ) {
      console.log(
        `E-Charge GPS jump rejected: ${movedMeters.toFixed(
          1,
        )}m`,
      );

      return;
    }

    /*
     * ─────────────────────────────────────────────
     * STATIONARY GPS FILTER
     * ─────────────────────────────────────────────
     *
     * When the rider is standing still, GPS naturally
     * moves around by several metres.
     *
     * Don't move the marker for tiny corrections.
     */
    const stationary =
      effectiveSpeed < 1.5;

    const noiseThreshold = Math.max(
      7,
      accuracy * 0.35,
    );

    if (
      previousPosition &&
      stationary &&
      movedMeters < noiseThreshold
    ) {
      setHeading(
        gpsHeading != null &&
          !Number.isNaN(gpsHeading) &&
          effectiveSpeed > 1
          ? gpsHeading
          : null,
      );

      return;
    }

    /*
     * ─────────────────────────────────────────────
     * SECONDARY JUMP PROTECTION
     * ─────────────────────────────────────────────
     *
     * A sudden large movement with poor accuracy is
     * suspicious. A significantly improved accuracy
     * reading is allowed because it may be correcting
     * the initial approximate position.
     */
    if (previousPosition) {
      const accuracyImproved =
        accuracy <
        (lastAcceptedGps.current
          ? Math.max(
              5,
              accuracy,
            )
          : accuracy);

      const maximumReasonableMovement =
        Math.max(
          60,
          effectiveSpeed * secondsSincePrevious +
            accuracy * 1.5 +
            25,
        );

      if (
        movedMeters >
          maximumReasonableMovement &&
        !accuracyImproved &&
        !stationary
      ) {
        console.log(
          `E-Charge GPS movement rejected: ${movedMeters.toFixed(
            1,
          )}m`,
        );

        return;
      }
    }

    // This reading is accepted.
    lastAcceptedGps.current =
      nextPosition;

    lastGpsTimestamp.current = now;

    setGps(nextPosition);

    setLocationState("granted");

    /*
     * GPS heading is only useful when the device is
     * actually moving.
     */
    setHeading(
      gpsHeading != null &&
        !Number.isNaN(gpsHeading) &&
        effectiveSpeed > 1
        ? gpsHeading
        : null,
    );

    /*
     * If the rider is currently using real GPS,
     * smoothly move toward the new position.
     *
     * If they searched/picked a place, keep that
     * place visible instead.
     */
    if (trackingEnabled.current) {
      animateRiderTo(nextPosition);
    }

    /*
     * First GPS fix:
     *
     * Show the rider automatically and center the
     * map once.
     */
    if (
      !firstGpsFix.current
    ) {
      firstGpsFix.current = true;

      if (trackingEnabled.current) {
        updateRider(nextPosition);

        setRecenterTick(
          (tick) => tick + 1,
        );
      }
    }

    /*
     * Manual "Use My Location":
     * make sure the map recenters after the next
     * valid GPS reading.
     */
    if (
      recenterOnNextGps.current &&
      trackingEnabled.current
    ) {
      setRecenterTick(
        (tick) => tick + 1,
      );

      recenterOnNextGps.current =
        false;
    }

    if (manualLocationRequest.current) {
      setLocStatus("done");

      manualLocationRequest.current =
        false;

      window.setTimeout(() => {
        setLocStatus(
          (current) =>
            current === "done"
              ? "idle"
              : current,
        );
      }, 1200);
    } else {
      setLocStatus("idle");
    }

    console.log(
      `E-Charge GPS accepted: ${accuracy.toFixed(
        1,
      )}m accuracy`,
    );
  };

  // ─────────────────────────────────────────────────────────────
  // START CONTINUOUS GPS WATCH
  // ─────────────────────────────────────────────────────────────

  const startLocationTracking = () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.geolocation
    ) {
      setLocationState("denied");
      setLocStatus("error");
      return;
    }

    /*
     * Prevent duplicate watchers.
     */
    if (gpsWatchId.current !== null) {
      return;
    }

    setLocStatus("locating");

    gpsWatchId.current =
      navigator.geolocation.watchPosition(
        (position) => {
          acceptGpsPosition(position);
        },
        (error) => {
          console.log(
            "E-Charge GPS error:",
            error.code,
            error.message,
          );

          /*
           * Permission denied is different from a temporary
           * GPS/network/device failure.
           */
          if (error.code === 1) {
            setLocationState("denied");
            setLocStatus("error");

            window.setTimeout(() => {
              setLocStatus("idle");
            }, 2500);

            return;
          }

          /*
           * If we have never obtained a fix, tell the user
           * that the location is currently unavailable.
           *
           * The watch remains alive and can recover later.
           */
          if (!firstGpsFix.current) {
            setLocStatus("error");

            window.setTimeout(() => {
              setLocStatus(
                (current) =>
                  current === "error"
                    ? "idle"
                    : current,
              );
            }, 2500);
          }
        },
        {
          enableHighAccuracy: true,

          /*
           * Fresh readings are preferred.
           */
          maximumAge: 0,

          /*
           * Give the device enough time to obtain
           * a good GPS fix.
           */
          timeout: 30000,
        },
      );
  };

  // ─────────────────────────────────────────────────────────────
  // MANUAL "USE MY LOCATION"
  // ─────────────────────────────────────────────────────────────

  const requestLocation = () => {
    setGpsTrackingMode(true);

    manualLocationRequest.current =
      true;

    recenterOnNextGps.current =
      true;

    setLocStatus("locating");

    /*
     * If we already have a known GPS position,
     * immediately return the marker there while
     * the fresh GPS watcher continues correcting it.
     */
    if (lastAcceptedGps.current) {
      updateRider(
        lastAcceptedGps.current,
      );

      setRecenterTick(
        (tick) => tick + 1,
      );
    }

    startLocationTracking();
  };

  // ─────────────────────────────────────────────────────────────
  // AUTOMATIC LOCATION STARTUP
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    /*
     * If browser permission is already granted,
     * this immediately starts tracking.
     *
     * If permission is still "prompt", the browser
     * may ask the user for permission.
     */
    startLocationTracking();

    return () => {
      if (
        gpsWatchId.current !== null
      ) {
        navigator.geolocation.clearWatch(
          gpsWatchId.current,
        );

        gpsWatchId.current = null;
      }

      if (
        animationFrame.current !== null
      ) {
        cancelAnimationFrame(
          animationFrame.current,
        );

        animationFrame.current = null;
      }
    };
  }, []);

  const locLabel =
    locStatus === "locating"
      ? "⟳ LOCATING…"
      : locStatus === "done"
        ? "✓ LOCATION UPDATED"
        : locStatus === "error"
          ? "LOCATION UNAVAILABLE"
          : "◎ USE MY LOCATION";

  // ─────────────────────────────────────────────────────────────
  // PLACE SEARCH
  // ─────────────────────────────────────────────────────────────

  const [placeBusy, setPlaceBusy] =
    useState(false);

  const [placeError, setPlaceError] =
    useState<string | null>(null);

  const searchPlace = async () => {
    const term = query.trim();

    if (!term) return;

    setPlaceBusy(true);
    setPlaceError(null);

    /*
     * Stop automatic rider movement while the user
     * is intentionally viewing another place.
     */
    setGpsTrackingMode(false);

    if (
      animationFrame.current !== null
    ) {
      cancelAnimationFrame(
        animationFrame.current,
      );

      animationFrame.current = null;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ke&q=${encodeURIComponent(
          term,
        )}`,
        {
          headers: {
            Accept:
              "application/json",
          },
        },
      );

      const hits =
        (await res.json()) as {
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

      updateRider({
        lat: Number(hit.lat),
        lng: Number(hit.lon),
      });

      setLocationState("granted");

      setRecenterTick(
        (tick) => tick + 1,
      );

      setQuery("");

      setRadiusKm(15);

      if (
        typeof window !== "undefined"
      ) {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    } catch {
      setPlaceError(
        "Place search failed. Check your connection and try again.",
      );
    } finally {
      setPlaceBusy(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // STATION RESULTS
  // ─────────────────────────────────────────────────────────────

  const results = useMemo(() => {
    const term =
      query.trim().toLowerCase();

    return rows
      .map((row) =>
        toStation(row, rider),
      )
      .filter(
        (station) =>
          !rider ||
          !Number.isFinite(
            station.distanceKm,
          ) ||
          station.distanceKm <=
            radiusKm,
      )
      .filter((station) =>
        term.length === 0
          ? true
          : [
              station.name,
              station.area,
              station.county,
              station.address,
            ]
              .join(" ")
              .toLowerCase()
              .includes(term),
      )
      .sort(
        (a, b) =>
          (a.distanceKm || 1e9) -
          (b.distanceKm || 1e9),
      );
  }, [
    rows,
    rider,
    query,
    radiusKm,
  ]);

  const selected = selectedId
    ? results.find(
        (station) =>
          station.id ===
          selectedId,
      ) ?? null
    : null;

  // ─────────────────────────────────────────────────────────────
  // PAGE
  // ─────────────────────────────────────────────────────────────

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
            gpsMode ? heading : null
          }
          selectedId={selectedId}
          onPick={
            locationState === "granted"
              ? (point) => {
                  /*
                   * Picking a point manually means the
                   * rider marker should stay there until
                   * "Use My Location" is pressed.
                   */
                  setGpsTrackingMode(
                    false,
                  );

                  if (
                    animationFrame.current !==
                    null
                  ) {
                    cancelAnimationFrame(
                      animationFrame.current,
                    );

                    animationFrame.current =
                      null;
                  }

                  updateRider(point);

                  setRecenterTick(
                    (tick) => tick + 1,
                  );
                }
              : undefined
          }
          pins={results
            .filter(
              (station) =>
                station.latitude !=
                  null &&
                station.longitude !=
                  null,
            )
            .map((station) => ({
              id: station.id,
              lat: station.latitude!,
              lng: station.longitude!,
              tone: markerTone(
                station,
              ),
              label: `${station.name} · ${markerLabel(
                station,
              )}`,
              onClick: () =>
                setSelectedId(
                  station.id,
                ),
            }))}
        />

        <button
          type="button"
          onClick={requestLocation}
          disabled={
            locStatus === "locating"
          }
          aria-label="Use my current location"
          className={`absolute right-3 bottom-4 z-[500] flex min-h-[48px] items-center gap-2 rounded-xl px-4 text-sm font-semibold shadow-lg ring-1 transition-all active:scale-95 ${
            locStatus === "done"
              ? "bg-signal text-ink ring-signal"
              : "bg-paper text-ink ring-black/10 hover:bg-paper/90"
          }`}
        >
          <span
            className={
              locStatus ===
              "locating"
                ? "inline-block animate-spin"
                : ""
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
                      selected.status ===
                      "open"
                        ? "font-semibold text-signal"
                        : "font-semibold text-danger"
                    }
                  >
                    {selected.status ===
                    "open"
                      ? "Open now"
                      : "Closed"}
                  </span>

                  {Number.isFinite(
                    selected.distanceKm,
                  )
                    ? ` · ${selected.distanceKm} km away`
                    : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedId(
                    null,
                  )
                }
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
                    params: {
                      stationId:
                        selected.id,
                    },
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
                    params: {
                      stationId:
                        selected.id,
                    },
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
          {locationState ===
          "prompt" ? (
            <div className="rounded-2xl bg-signal/12 px-4 py-4 ring-1 ring-signal/30">
              <p className="font-display text-[15px] font-semibold text-ink">
                Allow E-Charge to access
                your location
              </p>

              <p className="mt-1 text-sm leading-snug text-pretty text-ink/70">
                This is needed to find
                nearby stations and
                calculate routes.
              </p>

              <button
                type="button"
                onClick={
                  requestLocation
                }
                className="mt-3 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-signal text-sm font-semibold text-ink ring-1 ring-signal transition-colors hover:bg-signal/90"
              >
                {locLabel}
              </button>
            </div>
          ) : null}

          {locationState ===
          "denied" ? (
            <div className="rounded-2xl bg-amber/12 px-4 py-4 ring-1 ring-amber/30">
              <p className="font-display text-[15px] font-semibold text-ink">
                Location access is
                required to find nearby
                stations.
              </p>

              <p className="mt-1 text-sm leading-snug text-pretty text-ink/70">
                You can try again, or
                pick your starting point
                on the map instead.
              </p>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={
                    requestLocation
                  }
                  className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-ink text-sm font-semibold text-paper transition-colors hover:bg-ink/90"
                >
                  {locStatus ===
                  "locating"
                    ? "⟳ LOCATING…"
                    : "TRY AGAIN"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGpsTrackingMode(
                      false,
                    );

                    updateRider(
                      null,
                    );

                    setLocationState(
                      "granted",
                    );
                  }}
                  className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-paper/70 text-sm font-medium text-ink ring-1 ring-black/10 transition-colors hover:bg-paper"
                >
                  CHOOSE LOCATION ON
                  MAP
                </button>
              </div>
            </div>
          ) : null}

          {locationState ===
          "granted" ? (
            <div className="flex items-center gap-2 rounded-2xl bg-signal/12 px-4 py-3 ring-1 ring-signal/30">
              <span className="size-3 shrink-0 rounded-full bg-signal" />

              <p className="text-sm leading-snug text-pretty text-ink/80">
                {!rider
                  ? "Tap the map to set your starting point."
                  : gpsMode
                    ? "Using your live location. E-Charge is continuously adjusting your position."
                    : "Showing a searched or picked place — tap Use My Location to return."}{" "}
                Showing stations within{" "}
                <strong className="font-semibold">
                  {radiusKm} km
                </strong>
                , nearest first.
              </p>
            </div>
          ) : null}

          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-paper/60 px-4 py-3 ring-1 ring-black/5">
            <span className="text-lg text-neutral">
              ⌕
            </span>

            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value,
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
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
              onClick={
                searchPlace
              }
              disabled={
                placeBusy ||
                !query.trim()
              }
              className="min-h-[44px] rounded-xl bg-ink px-4 text-sm font-semibold text-paper transition-colors hover:bg-ink/90 disabled:opacity-50"
            >
              {placeBusy
                ? "SEARCHING…"
                : "SEARCH THIS PLACE ON THE MAP"}
            </button>

            <span className="text-xs text-neutral">
              Heading somewhere?
              Search a town or area
              to see stations there.
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
                Battery level
                (optional)
              </span>

              <input
                value={battery}
                onChange={(event) =>
                  setBattery(
                    event.target.value,
                  )
                }
                inputMode="numeric"
                placeholder="—"
                className="w-12 bg-transparent text-sm text-ink placeholder:text-neutral focus:outline-none"
              />

              <span className="text-sm text-ink/60">
                %
              </span>
            </label>

            <span className="text-xs text-neutral">
              Battery level is never
              required to search.
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
                Could not load stations.
                Check your connection and
                try again.
              </p>
            ) : results.length >
              0 ? (
              results.map(
                (station) => (
                  <StationCard
                    key={station.id}
                    station={
                      station
                    }
                  />
                ),
              )
            ) : (
              <div className="rounded-[18px] bg-paper/70 p-5 text-center ring-1 ring-black/5">
                <p className="font-display text-[17px] font-semibold text-ink">
                  No verified stations
                  found nearby.
                </p>

                <p className="mt-1 text-sm text-ink/60">
                  We searched a{" "}
                  {radiusKm} km radius
                  around your
                  location.
                </p>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() =>
                      setRadiusKm(
                        (value) =>
                          value + 10,
                      )
                    }
                    className="flex min-h-[46px] flex-1 items-center justify-center rounded-xl bg-signal text-sm font-semibold text-ink ring-1 ring-signal"
                  >
                    EXPAND SEARCH
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setRadiusKm(
                        500,
                      );
                    }}
                    className="flex min-h-[46px] flex-1 items-center justify-center rounded-xl bg-paper/70 text-sm font-medium text-ink ring-1 ring-black/10"
                  >
                    VIEW ALL
                    STATIONS
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-neutral">
            Only E-Charge verified
            stations are shown.
            Distances are straight-line
            estimates for now; road
            distance arrives with in-app
            navigation.{" "}
            <Link
              to="/register-station"
              className="underline underline-offset-2"
            >
              Own a station?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
