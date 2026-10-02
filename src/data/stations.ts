export type StationType = "swap" | "charging" | "both";
export type StationStatus = "open" | "busy" | "closed" | "unavailable";

export type Station = {
  id: string;
  name: string;
  area: string;
  county: string;
  address: string;
  type: StationType;
  status: StationStatus;
  verified: boolean;
  distanceKm: number;
  etaMin: number;
  availabilityLabel: string;
  availabilityTone: "good" | "low" | "none";
  updatedLabel: string;
  reopensAt?: string;
  services: string[];
  compatibility: string[];
  pricing: { label: string; value: string }[];
  hours: { day: string; value: string }[];
  accessInstructions: string;
  phone: string;
  whatsapp: string;
  description: string;
  mapPosition?: { left: string; top: string };
  latitude?: number | null;
  longitude?: number | null;
};

/**
 * Demo content for the Phase 1 visual foundation only. These are illustrative
 * placeholders, not real verified businesses — Phase 4 replaces them with
 * owner-registered stations from the database.
 */
export const demoStations: Station[] = [
  {
    id: "ngong-road-swap-hub",
    name: "Ngong Road Swap Hub",
    area: "Kilimani",
    county: "Nairobi",
    address: "Ngong Road, opposite the Adams Arcade stage",
    type: "both",
    status: "open",
    verified: true,
    distanceKm: 1.2,
    etaMin: 5,
    availabilityLabel: "7/10 packs",
    availabilityTone: "good",
    updatedLabel: "updated 2 min ago",
    services: ["Battery swap", "AC charging", "Tyre pressure", "Rider waiting bay"],
    compatibility: ["Standard 48V pack", "Standard 60V pack", "Other"],
    pricing: [
      { label: "Battery swap", value: "KSh 250 per pack" },
      { label: "Charging", value: "KSh 40 per kWh" },
    ],
    hours: [
      { day: "Monday – Friday", value: "06:00 – 21:00" },
      { day: "Saturday", value: "06:00 – 20:00" },
      { day: "Sunday", value: "08:00 – 18:00" },
    ],
    accessInstructions: "Enter through the main gate and turn left past the car wash.",
    phone: "+254 700 000 001",
    whatsapp: "+254 700 000 001",
    description:
      "Swap cabinets and four charging bays with a covered waiting area for riders.",
    mapPosition: { left: "26%", top: "30%" },
  },
  {
    id: "moi-avenue-charge-point",
    name: "Moi Avenue Charge Point",
    area: "CBD",
    county: "Nairobi",
    address: "Moi Avenue, basement parking level 1",
    type: "swap",
    status: "busy",
    verified: true,
    distanceKm: 2.4,
    etaMin: 9,
    availabilityLabel: "2/8 packs",
    availabilityTone: "low",
    updatedLabel: "updated 6 min ago",
    services: ["Battery swap", "Rider waiting bay"],
    compatibility: ["Standard 48V pack", "Other"],
    pricing: [{ label: "Battery swap", value: "KSh 280 per pack" }],
    hours: [
      { day: "Monday – Saturday", value: "05:30 – 22:00" },
      { day: "Sunday", value: "Closed" },
    ],
    accessInstructions: "Use the ramp on the side street, the cabinets are on your right.",
    phone: "+254 700 000 002",
    whatsapp: "+254 700 000 002",
    description: "Busy CBD swap point, quickest between the morning and evening peaks.",
    mapPosition: { left: "64%", top: "24%" },
  },
  {
    id: "westlands-grid-station",
    name: "Westlands Grid Station",
    area: "Westlands",
    county: "Nairobi",
    address: "Waiyaki Way service lane",
    type: "charging",
    status: "closed",
    verified: true,
    distanceKm: 3.1,
    etaMin: 12,
    availabilityLabel: "0/6 points",
    availabilityTone: "none",
    updatedLabel: "updated 40 min ago",
    reopensAt: "06:00",
    services: ["AC charging"],
    compatibility: ["Standard 60V pack", "Other"],
    pricing: [{ label: "Charging", value: "Contact for pricing" }],
    hours: [
      { day: "Monday – Friday", value: "06:00 – 19:00" },
      { day: "Weekends", value: "Closed" },
    ],
    accessInstructions: "Report at the security desk before parking.",
    phone: "+254 700 000 003",
    whatsapp: "+254 700 000 003",
    description: "Six charging points behind the office block, gated overnight.",
    mapPosition: { left: "72%", top: "58%" },
  },
  {
    id: "ruiru-power-yard",
    name: "Ruiru Power Yard",
    area: "Ruiru",
    county: "Kiambu",
    address: "Eastern Bypass, next to the boda stage",
    type: "both",
    status: "open",
    verified: true,
    distanceKm: 8.6,
    etaMin: 24,
    availabilityLabel: "11/12 packs",
    availabilityTone: "good",
    updatedLabel: "updated 18 min ago",
    services: ["Battery swap", "AC charging", "Minor repairs"],
    compatibility: ["Standard 48V pack", "Standard 60V pack", "Other"],
    pricing: [
      { label: "Battery swap", value: "KSh 230 per pack" },
      { label: "Charging", value: "KSh 35 per kWh" },
    ],
    hours: [{ day: "Every day", value: "24 hours" }],
    accessInstructions: "Open yard, ride straight in and park under the shed.",
    phone: "+254 700 000 004",
    whatsapp: "+254 700 000 004",
    description: "Large 24-hour yard serving riders on the Eastern Bypass route.",
    mapPosition: { left: "40%", top: "72%" },
  },
];

export const stationTypeLabels: Record<StationType, string[]> = {
  swap: ["Battery Swap"],
  charging: ["Charging"],
  both: ["Battery Swap", "Charging"],
};

export const statusLabels: Record<StationStatus, string> = {
  open: "OPEN",
  busy: "BUSY",
  closed: "CLOSED",
  unavailable: "UNAVAILABLE",
};

export function findStation(id: string): Station | undefined {
  return demoStations.find((station) => station.id === id);
}
