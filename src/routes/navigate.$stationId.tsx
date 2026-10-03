import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { getPublicStation } from "@/lib/public-stations.functions";
import { fmtKm, haversineKm, type LatLng } from "@/lib/station-adapter";

const NavMap = lazy(() => import("@/components/nav-map").then((m) => ({ default: m.NavMap })));

export const Route = createFileRoute("/navigate/$stationId")({
  ssr: false,
  loader: async ({ params }) => {
    if (!/^[0-9a-f-]{36}$/i.test(params.stationId)) throw notFound();
    const row = await getPublicStation({ data: { id: params.stationId } });
    if (!row) throw notFound();
    return { row };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.row.name ?? "Station";
    const t = `Navigating to ${name} — E-Charge`;
    const d = `Live road directions to ${name} for electric motorcycle riders.`;
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center bg-ink p-6 text-paper">
      <div className="text-center">
        <p className="font-display text-2xl">Station not available</p>
        <Link to="/find-station" className="mt-4 inline-block underline">Find another station</Link>
      </div>
    </div>
  ),
  component: Navigate,
});

type Step = { text: string; distM: number; loc: [number, number] };
type RouteData = { line: [number, number][]; distM: number; durS: number; steps: Step[] };

const ARRIVE_M = 40;
const OFF_ROUTE_M = 60;
const BODA_SPEED_FACTOR = 1.15; // OSRM car times; bodas are a bit slower in town traffic

async function fetchRoute(from: LatLng, to: LatLng): Promise<RouteData> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Routing service unavailable");
  const json = await res.json();
  const r = json.routes?.[0];
  if (!r) throw new Error("No road route found");
  return {
    line: r.geometry.coordinates.map(([x, y]: [number, number]) => [y, x]),
    distM: r.distance,
    durS: r.duration * BODA_SPEED_FACTOR,
    steps: r.legs[0].steps.map((s: any) => ({
      text: describe(s.maneuver, s.name),
      distM: s.distance,
      loc: [s.maneuver.location[1], s.maneuver.location[0]],
    })),
  };
}

function describe(m: { type: string; modifier?: string }, road: string) {
  const on = road ? ` onto ${road}` : "";
  const mod = m.modifier ? m.modifier.replace("slight", "slight").replace("sharp", "sharp") : "";
  switch (m.type) {
    case "depart": return `Head out${road ? ` on ${road}` : ""}`;
    case "arrive": return "Arrive at the station";
    case "roundabout":
    case "rotary": return `Take the roundabout${on}`;
    case "merge": return `Merge${on}`;
    case "fork": return `Keep ${mod}${on}`;
    case "end of road": return `At the end of the road, turn ${mod}${on}`;
    default: return mod === "straight" ? `Continue straight${on}` : mod ? `Turn ${mod}${on}` : `Continue${on}`;
  }
}

function distToLineM(p: LatLng, line: [number, number][]) {
  let best = Infinity;
  for (let i = 0; i < line.length; i += 2) {
    const pt = line[i]!;
    const d = haversineKm(p, { lat: pt[0], lng: pt[1] }) * 1000;
    if (d < best) best = d;
  }
  return best;
}

function Navigate() {
  const { row } = Route.useLoaderData();
  const station = { lat: row.latitude ?? 0, lng: row.longitude ?? 0 };
  const hasCoords = row.latitude != null && row.longitude != null;
  const [rider, setRider] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [follow, setFollow] = useState(true);
  const [arrived, setArrived] = useState(false);
  const routing = useRef(false);

  useEffect(() => {
    if (!hasCoords) return;
    if (!navigator.geolocation) return setError("This device can't share location.");
    const id = navigator.geolocation.watchPosition(
      (pos) => setRider({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError("Allow location access so E-Charge can guide you."),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [hasCoords]);

  // Initial route + re-route when off the line.
  useEffect(() => {
    if (!rider || arrived || routing.current) return;
    if (route && distToLineM(rider, route.line) < OFF_ROUTE_M) return;
    routing.current = true;
    fetchRoute(rider, station)
      .then((r) => { setRoute(r); setError(null); })
      .catch((e) => setError(e.message))
      .finally(() => { routing.current = false; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rider?.lat, rider?.lng, arrived]);

  const remainingM = rider ? haversineKm(rider, station) * 1000 : null;
  useEffect(() => {
    if (remainingM != null && remainingM <= ARRIVE_M && !arrived) {
      setArrived(true);
      navigator.vibrate?.([200, 100, 200]);
    }
  }, [remainingM, arrived]);

  // Next maneuver = first step whose point is still ahead (closest upcoming).
  let next: Step | null = null;
  let nextDistM = 0;
  if (route && rider) {
    let idx = 0, best = Infinity;
    route.steps.forEach((s, i) => {
      const d = haversineKm(rider, { lat: s.loc[0], lng: s.loc[1] });
      if (d < best) { best = d; idx = i; }
    });
    const passed = best * 1000 < 25;
    next = route.steps[Math.min(passed ? idx + 1 : idx, route.steps.length - 1)] ?? null;
    if (next) nextDistM = haversineKm(rider, { lat: next.loc[0], lng: next.loc[1] }) * 1000;
  }
  const ratio = route && remainingM != null ? Math.min(1, remainingM / Math.max(1, haversineKm(route.line[0] ? { lat: route.line[0][0], lng: route.line[0][1] } : station, station) * 1000)) : 1;
  const leftM = route ? route.distM * ratio : remainingM;
  const leftMin = route ? Math.max(1, Math.round((route.durS * ratio) / 60)) : null;
  const eta = leftMin ? new Date(Date.now() + leftMin * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;

  if (!hasCoords) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink p-6 text-center text-paper">
        <div>
          <p className="font-display text-2xl">This station has no map location yet.</p>
          <a href={`tel:${row.phone}`} className="mt-6 inline-flex min-h-[56px] items-center rounded-2xl bg-signal px-6 font-semibold text-ink">CALL STATION</a>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-ink text-paper">
      <Suspense fallback={null}>
        <NavMap rider={rider} station={station} route={route?.line ?? []} follow={follow} />
      </Suspense>

      {/* Maneuver banner */}
      <div className="absolute inset-x-3 top-3 z-10 rounded-2xl bg-ink/95 p-4 shadow-xl ring-1 ring-paper/10">
        {arrived ? (
          <p className="font-display text-2xl">You have arrived at {row.name}!</p>
        ) : next ? (
          <>
            <p className="font-display text-3xl font-semibold text-signal">{fmtDist(nextDistM)}</p>
            <p className="mt-1 text-lg leading-snug">{next.text}</p>
          </>
        ) : (
          <p className="text-lg">{error ?? "Finding your location and the road route…"}</p>
        )}
        {error && next ? <p className="mt-2 text-sm text-amber">{error}</p> : null}
      </div>

      {!follow && !arrived ? (
        <button onClick={() => setFollow(true)} className="absolute right-3 top-40 z-10 min-h-[48px] rounded-xl bg-paper px-4 text-sm font-semibold text-ink shadow-lg">RE-CENTER</button>
      ) : null}

      {/* Bottom dock */}
      <div className="absolute inset-x-3 bottom-3 z-10 rounded-2xl bg-ink/95 p-4 shadow-xl ring-1 ring-paper/10">
        {arrived ? (
          <div className="space-y-2 text-sm">
            <p className="text-paper/70">{row.address}{row.town ? `, ${row.town}` : ""}</p>
            {row.swap_price ? <p>Swap: <b>{row.swap_price}</b></p> : null}
            {row.charging_price ? <p>Charging: <b>{row.charging_price}</b></p> : null}
            {row.compatibility?.length ? <p>Batteries: {row.compatibility.join(", ")}</p> : null}
            {row.access_instructions ? <p>{row.access_instructions}</p> : null}
          </div>
        ) : (
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="font-display text-3xl font-semibold">{leftMin ? `${leftMin} min` : "—"}</p>
              <p className="text-sm text-paper/70">{leftM != null ? fmtKm(leftM / 1000) : "…"}{eta ? ` · arrive ${eta}` : ""}</p>
            </div>
            <p className="max-w-[45%] truncate text-right text-sm text-paper/80">{row.name}</p>
          </div>
        )}
        <div className="mt-3 flex gap-2">
          {row.phone ? (
            <a href={`tel:${row.phone}`} className="flex min-h-[56px] flex-1 items-center justify-center rounded-xl bg-signal font-semibold text-ink">CALL</a>
          ) : null}
          <button onClick={() => setFollow((f) => !f)} className="min-h-[56px] rounded-xl bg-paper/10 px-4 text-sm font-semibold">{follow ? "FREE MAP" : "FOLLOW"}</button>
          <Link to="/stations/$stationId" params={{ stationId: row.id }} className="flex min-h-[56px] items-center justify-center rounded-xl bg-danger px-5 font-semibold text-paper">{arrived ? "DONE" : "EXIT"}</Link>
        </div>
      </div>
    </div>
  );
}

function fmtDist(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.max(10, Math.round(m / 10) * 10)} m`;
}
