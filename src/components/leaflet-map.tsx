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

const toneVar = {
  signal: "var(--signal)",
  amber: "var(--amber)",
  danger: "var(--danger)",
};

/**
 * Real OpenStreetMap map using Leaflet.
 * Leaflet uses browser APIs, so it loads only after the page opens in a browser.
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
  riderHeading = null,
  selectedId = null,
}: {
  riderHeading?: number | null;
  selectedId?: string | null;
  className?: string;
  pins?: MapPin[];
  rider?: { lat: number; lng: number } | null;
  center?: { lat: number; lng: number } | null;
  zoom?: number;
  onPick?: ((point: { lat: number; lng: number }) => void) | undefined;
  picked?: { lat: number; lng: number } | null;
  recenterSignal?: number;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const lib = useRef<typeof L | null>(null);
  const pickRef = useRef(onPick);

  pickRef.current = onPick;

  const fitted = useRef(false);
  const lastCenter = useRef<{ lat: number; lng: number } | null>(null);
  const lastRecenterSignal = useRef(recenterSignal);

  useEffect(() => {
    let cancelled = false;

    import("leaflet").then((mod) => {
      const Lf = (mod.default ?? mod) as typeof L;

      if (cancelled || !el.current || map.current) return;

      lib.current = Lf;

      const initialCenter = center ?? rider ?? NAIROBI;

      const leafletMap = Lf.map(el.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([initialCenter.lat, initialCenter.lng], zoom);

      Lf.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(leafletMap);

      leafletMap.on("click", (event: L.LeafletMouseEvent) => {
        pickRef.current?.({
          lat: event.latlng.lat,
          lng: event.latlng.lng,
        });
      });

      layer.current = Lf.layerGroup().addTo(leafletMap);
      map.current = leafletMap;

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
    const leafletMap = map.current;

    if (!Lf || !leafletMap || !layer.current) return;

    layer.current.clearLayers();

    const bounds: [number, number][] = [];

    for (const pin of pins) {
      const selected = pin.id === selectedId;
      const color = toneVar[pin.tone];
      const size = selected ? 40 : 32;

      const icon = Lf.divIcon({
        className: "",
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        html: `<div title="${escapeHtml(pin.label)}" style="position:relative;width:${size}px;height:${size}px">
          ${
            pin.tone === "signal"
              ? `<span class="ec-pin-pulse" style="background:${color}"></span>`
              : ""
          }
          <div style="position:absolute;inset:0;border-radius:50% 50% 50% 6px;transform:rotate(-45deg);background:${color};border:${selected ? 3 : 2}px solid var(--paper);box-shadow:0 0 ${selected ? 18 : 10}px ${color},0 3px 8px rgba(0,0,0,.35)"></div>
          <svg viewBox="0 0 24 24" style="position:absolute;inset:22%;width:56%;height:56%" fill="var(--ink)">
            <path d="M13 2 4 14h7l-1 8 9-12h-7z"/>
          </svg>
        </div>`,
      });

      const marker = Lf.marker([pin.lat, pin.lng], {
        icon,
        zIndexOffset: selected ? 1000 : 0,
        title: pin.label,
      }).addTo(layer.current);

      if (pin.onClick) {
        marker.on("click", pin.onClick);
      }

      bounds.push([pin.lat, pin.lng]);
    }

    if (rider) {
      const rotation = riderHeading ?? 0;

      const riderIcon = Lf.divIcon({
        className: "",
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        html: `<div style="position:relative;width:44px;height:44px">
          <span class="ec-pin-pulse" style="background:var(--signal)"></span>
          <div style="position:absolute;inset:4px;border-radius:999px;background:var(--ink);border:3px solid var(--paper);box-shadow:0 3px 10px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;transition:transform .4s ease;transform:rotate(${rotation}deg)">
            ${
              riderHeading != null
                ? '<span style="position:absolute;top:-9px;left:50%;transform:translateX(-50%);border:6px solid transparent;border-bottom:8px solid var(--signal)"></span>'
                : ""
            }
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--signal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(-90deg)">
              <circle cx="5" cy="16" r="3"/>
              <circle cx="19" cy="16" r="3"/>
              <path d="M5 16h5l4-6h3l2 6M14 10l-2-3H9M17 10l1-3h2"/>
            </svg>
          </div>
        </div>`,
      });

      Lf.marker([rider.lat, rider.lng], {
        icon: riderIcon,
        zIndexOffset: 2000,
        title: "You are here",
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
      leafletMap.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 15,
      });

      fitted.current = true;
    }
  }

  useEffect(() => {
    draw();

    const leafletMap = map.current;

    if (!center || !leafletMap) return;

    const manuallyRequestedRecenter =
      recenterSignal !== lastRecenterSignal.current;

    // Prevent shaking: the map moves only when first receiving a centre,
    // or after the rider deliberately taps Use My Location / searches a place.
    const shouldMoveMap = !lastCenter.current || manuallyRequestedRecenter;

    if (shouldMoveMap) {
      leafletMap.flyTo(
        [center.lat, center.lng],
        Math.max(leafletMap.getZoom(), 14),
        {
          duration: lastCenter.current ? 0.7 : 1.1,
        },
      );

      lastCenter.current = center;
      lastRecenterSignal.current = recenterSignal;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pins,
    rider?.lat,
    rider?.lng,
    picked?.lat,
    picked?.lng,
    center?.lat,
    center?.lng,
    recenterSignal,
    riderHeading,
    selectedId,
  ]);

  return <div ref={el} className={cn("relative z-0 bg-secondary", className)} />;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    return `&#${character.charCodeAt(0)};`;
  });
}

function cssVar(name: string) {
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    "#14b8a6"
  );
}
