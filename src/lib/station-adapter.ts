import type { Station } from "@/data/stations";
import type { getApprovedStations } from "./public-stations.functions";

export type PublicStationRow = Awaited<ReturnType<typeof getApprovedStations>>[number];
export type LatLng = { lat: number; lng: number };

/** Straight-line distance in km. Real road distance arrives with routing (Phase 5). */
export function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

type DayHours = { day: string; open: string; close: string; closed: boolean; allDay: boolean };

export function toStation(row: PublicStationRow, rider: LatLng | null): Station {
  const hasCoords = row.latitude != null && row.longitude != null;
  const km =
    rider && hasCoords ? haversineKm(rider, { lat: row.latitude!, lng: row.longitude! }) : null;
  const hours = Array.isArray(row.opening_hours) ? (row.opening_hours as unknown as DayHours[]) : [];
  const pricing: Station["pricing"] = [];
  if (row.swap_price) pricing.push({ label: "Battery swap", value: row.swap_price });
  if (row.charging_price) pricing.push({ label: "Charging", value: row.charging_price });
  if (!pricing.length && row.contact_for_pricing)
    pricing.push({ label: "Price", value: "Contact station" });

  return {
    id: row.id,
    name: row.name,
    area: row.town || row.county,
    county: row.county,
    address: row.address,
    type: row.station_type,
    status: row.is_open ? "open" : "closed",
    verified: true,
    distanceKm: km == null ? NaN : Math.round(km * 10) / 10,
    // Rough city-riding estimate (~22 km/h) until real routing.
    etaMin: km == null ? NaN : Math.max(1, Math.round((km * 1.3 * 60) / 22)),
    availabilityLabel: row.is_open ? "Open" : "Closed",
    availabilityTone: row.is_open ? "good" : "none",
    updatedLabel: `Updated ${new Date(row.updated_at).toLocaleDateString("en-KE")}`,
    services: row.services,
    compatibility: row.compatibility,
    pricing,
    hours: hours.map((h) => ({
      day: h.day,
      value: h.closed ? "Closed" : h.allDay ? "Open 24 hours" : `${h.open} – ${h.close}`,
    })),
    accessInstructions: row.access_instructions,
    phone: row.phone,
    whatsapp: row.whatsapp,
    description: row.description,
    latitude: row.latitude,
    longitude: row.longitude,
  };
}

export const fmtKm = (n: number) => (Number.isFinite(n) ? `${n} km` : "—");
export const fmtMin = (n: number) => (Number.isFinite(n) ? `~${n} min` : "—");
