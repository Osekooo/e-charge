import { useEffect, useRef } from "react";
import type * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

export type MapPin = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  tone: "signal" | "amber" | "danger";
  onClick?: (() => void) | undefined;
};

const NAIROBI = { lat: -1.2864, lng: 36.8172 };
const toneVar = { signal: "var(--signal)", amber: "var(--amber)", danger: "var(--danger)" };

/**
 * Real OpenStreetMap map (Leaflet). Leaflet touches `window`, so it is loaded
 * only in the browser inside useEffect. Free tiles, no API key.
 */
export function LeafletMap({
  className,
  pins = [],
  rider,
  center,
  zoom = 13,
  onPick,
  picked,
  recenterSignal = 0,
}: {
  className?: string;
  pins?: MapPin[];
  rider?: { lat: number; lng: number } | null;
  center?: { lat: number; lng: number } | null;
  zoom?: number;
  /** When set, tapping the map picks a location (owner station picker). */
  onPick?: ((p: { lat: number; lng: number }) => void) | undefined;
  picked?: { lat: number; lng: number } | null;
  /** Bump this number to snap the view back to center/rider (GPS re-center button). */
  recenterSignal?: number;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const lib = useRef<typeof L | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const fitted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((mod) => {
      const Lf = (mod.default ?? mod) as typeof L;
      if (cancelled || !el.current || map.current) return;
      lib.current = Lf;
      const c = center ?? rider ?? NAIROBI;
      const m = Lf.map(el.current, { zoomControl: true, attributionControl: true }).setView(
        [c.lat, c.lng],
        zoom,
      );
      Lf.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(m);
      m.on("click", (e: L.LeafletMouseEvent) => pickRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng }));
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
    if (!Lf || !m || !layer.current) return;
    layer.current.clearLayers();
    const bounds: [number, number][] = [];
    for (const p of pins) {
      const icon = Lf.divIcon({
        className: "",
        html: `<div style="display:inline-flex;align-items:center;gap:4px;white-space:nowrap;transform:translate(-50%,-100%);background:var(--paper);color:var(--ink);font:600 11px/1 'IBM Plex Sans',sans-serif;padding:5px 8px;border-radius:999px;box-shadow:0 2px 6px rgba(0,0,0,.25)"><span style="width:8px;height:8px;border-radius:999px;background:${toneVar[p.tone]}"></span>${escapeHtml(p.label)}</div>`,
      });
      const mk = Lf.marker([p.lat, p.lng], { icon }).addTo(layer.current);
      if (p.onClick) mk.on("click", p.onClick);
      bounds.push([p.lat, p.lng]);
    }
    if (rider) {
      Lf.circleMarker([rider.lat, rider.lng], {
        radius: 8,
        color: "#fff",
        weight: 3,
        fillColor: cssVar("--signal"),
        fillOpacity: 1,
      }).addTo(layer.current);
      bounds.push([rider.lat, rider.lng]);
    }
    if (picked) {
      Lf.circleMarker([picked.lat, picked.lng], {
        radius: 10,
        color: "#fff",
        weight: 3,
        fillColor: cssVar("--amber"),
        fillOpacity: 1,
      }).addTo(layer.current);
    }
    if (!fitted.current && bounds.length > 1) {
      m.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      fitted.current = true;
    }
  }

  useEffect(() => {
    draw();
    if (center && map.current) map.current.setView([center.lat, center.lng], map.current.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins, rider?.lat, rider?.lng, picked?.lat, picked?.lng, center?.lat, center?.lng, recenterSignal]);

  return <div ref={el} className={cn("relative z-0 bg-secondary", className)} />;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#14b8a6";
}
