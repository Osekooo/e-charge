import { useEffect, useRef } from "react";
import type * as L from "leaflet";
import "leaflet/dist/leaflet.css";

type P = { lat: number; lng: number };

/** Full-screen navigation map: route line, rider dot, station pin, camera follow. Browser-only Leaflet. */
export function NavMap({
  rider,
  station,
  route,
  follow,
}: {
  rider: P | null;
  station: P;
  route: [number, number][];
  follow: boolean;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const lib = useRef<typeof L | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const fitted = useRef(false);
  const state = useRef({ rider, station, route, follow });
  state.current = { rider, station, route, follow };

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((mod) => {
      const Lf = (mod.default ?? mod) as typeof L;
      if (cancelled || !el.current || map.current) return;
      lib.current = Lf;
      const m = Lf.map(el.current, { zoomControl: false }).setView([station.lat, station.lng], 15);
      Lf.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(m);
      layer.current = Lf.layerGroup().addTo(m);
      map.current = m;
      draw();
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function draw() {
    const Lf = lib.current;
    const m = map.current;
    const g = layer.current;
    if (!Lf || !m || !g) return;
    const { rider, station, route, follow } = state.current;
    const v = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    g.clearLayers();
    if (route.length > 1) {
      Lf.polyline(route, { color: "#fff", weight: 11, opacity: 0.9 }).addTo(g);
      Lf.polyline(route, { color: v("--signal") || "#14b8a6", weight: 7 }).addTo(g);
    }
    Lf.circleMarker([station.lat, station.lng], {
      radius: 12, color: "#fff", weight: 4, fillColor: v("--amber") || "#f59e0b", fillOpacity: 1,
    }).addTo(g);
    if (rider) {
      Lf.circleMarker([rider.lat, rider.lng], {
        radius: 10, color: "#fff", weight: 4, fillColor: v("--signal") || "#14b8a6", fillOpacity: 1,
      }).addTo(g);
    }
    if (!fitted.current && route.length > 1) {
      m.fitBounds(route, { padding: [80, 80] });
      fitted.current = true;
    } else if (follow && rider && fitted.current) {
      m.panTo([rider.lat, rider.lng], { animate: true });
    }
  }

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rider?.lat, rider?.lng, route, follow]);

  return <div ref={el} className="absolute inset-0 z-0 bg-secondary" />;
}
