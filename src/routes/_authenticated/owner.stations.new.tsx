import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, Panel } from "@/components/page-shell";
import {
  CheckRow,
  Field,
  GhostButton,
  Notice,
  PrimaryButton,
  Select,
  TextArea,
  TextInput,
} from "@/components/form-controls";
import { supabase } from "@/integrations/supabase/client";
import { uploadStationPhoto, type DayHours, type StationInsert } from "@/lib/owner-stations";

export const Route = createFileRoute("/_authenticated/owner/stations/new")({
  head: () => ({
    meta: [
      { title: "Register a Station — E-Charge" },
      {
        name: "description",
        content:
          "Add your charging or battery-swap station to E-Charge: type, services, compatibility, pricing, hours and location.",
      },
      { property: "og:title", content: "Register a Station — E-Charge" },
      {
        property: "og:description",
        content: "Add your charging or battery-swap station details to E-Charge.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewStation,
});

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const services = [
  "Battery swap",
  "AC charging",
  "DC fast charging",
  "Minor repairs",
  "Tyre pressure",
  "Rider waiting bay",
  "Other",
];
const systems = [
  "Standard 48V pack",
  "Standard 60V pack",
  "Standard 72V pack",
  "Universal charger",
  "Other",
];

function toggle(list: string[], value: string, on: boolean) {
  return on ? [...list, value] : list.filter((v) => v !== value);
}

function NewStation() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    email: "",
    description: "",
    station_type: "both" as NonNullable<StationInsert["station_type"]>,
    swap_price: "",
    charging_price: "",
    contact_for_pricing: false,
    address: "",
    town: "",
    county: "",
    access_instructions: "",
  });
  const [svc, setSvc] = useState<string[]>([]);
  const [compat, setCompat] = useState<string[]>([]);
  const [hours, setHours] = useState<DayHours[]>(
    days.map((day) => ({ day, open: "06:00", close: "20:00", closed: false, allDay: false })),
  );
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const setDay = (i: number, patch: Partial<DayHours>) =>
    setHours((h) => h.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  function locate() {
    setError(null);
    if (!navigator.geolocation) return setError("Your device can't share its location.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("We couldn't get your location. Allow location access and try again.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError("Please add a station name.");
    if (!coords) return setError("Please set the station location so riders can be routed there.");
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("Please log in again.");
      const photo_paths: string[] = [];
      for (const file of photos) photo_paths.push(await uploadStationPhoto(user.id, file));
      const { error: insertError } = await supabase.from("stations").insert({
        ...form,
        owner_id: user.id,
        services: svc,
        compatibility: compat,
        opening_hours: hours,
        latitude: coords.lat,
        longitude: coords.lng,
        photo_paths,
      });
      if (insertError) throw insertError;
      navigate({ to: "/owner/dashboard", search: { submitted: "1" } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell
      eyebrow="Station registration"
      title="Register your station."
      intro="Fill in what riders need to know. Our team reviews the station before it appears as verified."
    >
      <form className="space-y-4" onSubmit={submit}>
        <Panel title="Basic information">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Station name">
              <TextInput placeholder="e.g. Ngong Road Swap Hub" value={form.name} onChange={set("name")} required />
            </Field>
            <Field label="Phone">
              <TextInput placeholder="+254 7…" value={form.phone} onChange={set("phone")} />
            </Field>
            <Field label="WhatsApp">
              <TextInput placeholder="+254 7…" value={form.whatsapp} onChange={set("whatsapp")} />
            </Field>
            <Field label="Email">
              <TextInput type="email" placeholder="station@example.com" value={form.email} onChange={set("email")} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Description">
              <TextArea placeholder="What riders will find at your station" value={form.description} onChange={set("description")} />
            </Field>
          </div>
        </Panel>

        <Panel title="Station type">
          <Field label="What do you offer?">
            <Select value={form.station_type} onChange={set("station_type")}>
              <option value="swap">Battery Swap</option>
              <option value="charging">Charging</option>
              <option value="both">Battery Swap + Charging</option>
            </Select>
          </Field>
        </Panel>

        <Panel title="Services" description="Pick everything available at this station.">
          <div className="grid gap-2 sm:grid-cols-2">
            {services.map((s) => (
              <CheckRow key={s} label={s} checked={svc.includes(s)} onChange={(on) => setSvc((l) => toggle(l, s, on))} />
            ))}
          </div>
        </Panel>

        <Panel title="Compatibility" description="Which motorcycle or battery systems can use this station?">
          <div className="grid gap-2 sm:grid-cols-2">
            {systems.map((s) => (
              <CheckRow key={s} label={s} checked={compat.includes(s)} onChange={(on) => setCompat((l) => toggle(l, s, on))} />
            ))}
          </div>
        </Panel>

        <Panel title="Pricing">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Battery swap price" hint="Leave blank if not offered">
              <TextInput placeholder="KSh per pack" value={form.swap_price} onChange={set("swap_price")} />
            </Field>
            <Field label="Charging price" hint="Leave blank if not offered">
              <TextInput placeholder="KSh per kWh or per hour" value={form.charging_price} onChange={set("charging_price")} />
            </Field>
          </div>
          <div className="mt-3">
            <CheckRow
              label="Contact me for pricing instead"
              checked={form.contact_for_pricing}
              onChange={(on) => setForm((f) => ({ ...f, contact_for_pricing: on }))}
            />
          </div>
        </Panel>

        <Panel title="Opening hours">
          <div className="space-y-2">
            {hours.map((d, i) => (
              <div key={d.day} className="grid items-center gap-2 sm:grid-cols-[7rem_1fr_1fr_auto]">
                <span className="text-sm text-ink/80">{d.day}</span>
                <TextInput type="time" value={d.open} disabled={d.closed || d.allDay} onChange={(e) => setDay(i, { open: e.target.value })} />
                <TextInput type="time" value={d.close} disabled={d.closed || d.allDay} onChange={(e) => setDay(i, { close: e.target.value })} />
                <div className="flex gap-2">
                  <CheckRow label="Closed" checked={d.closed} onChange={(on) => setDay(i, { closed: on, allDay: on ? false : d.allDay })} />
                  <CheckRow label="24 hours" checked={d.allDay} onChange={(on) => setDay(i, { allDay: on, closed: on ? false : d.closed })} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Station location" description="Stand at your station and tap the button — no need to type coordinates.">
          <GhostButton onClick={locate} disabled={locating}>
            {locating ? "GETTING LOCATION…" : coords ? "UPDATE TO MY CURRENT LOCATION" : "USE MY CURRENT LOCATION"}
          </GhostButton>
          {coords ? (
            <div className="mt-3">
              <Notice>
                Location set ({coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}).{" "}
                <a
                  className="underline"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`}
                >
                  Check it on a map
                </a>
              </Notice>
            </div>
          ) : null}
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Street / address">
              <TextInput placeholder="Road, building or landmark" value={form.address} onChange={set("address")} />
            </Field>
            <Field label="Town or area">
              <TextInput placeholder="e.g. Kilimani" value={form.town} onChange={set("town")} />
            </Field>
            <Field label="County">
              <TextInput placeholder="e.g. Nairobi" value={form.county} onChange={set("county")} />
            </Field>
            <Field label="Access instructions">
              <TextInput placeholder="Enter through the main gate and turn left." value={form.access_instructions} onChange={set("access_instructions")} />
            </Field>
          </div>
        </Panel>

        <Panel title="Photos" description="Up to 3: the entrance, the cabinets and the waiting area.">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setPhotos(Array.from(e.target.files ?? []).slice(0, 3))}
            className="block w-full text-sm text-ink/80 file:mr-3 file:rounded-xl file:border-0 file:bg-signal file:px-4 file:py-2 file:font-semibold file:text-ink"
          />
          {photos.length ? (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {photos.map((p) => (
                <img key={p.name} src={URL.createObjectURL(p)} alt="" className="aspect-4/3 w-full rounded-xl object-cover" />
              ))}
            </div>
          ) : null}
        </Panel>

        <Panel>
          <div className="space-y-3">
            {error ? <Notice tone="warn">{error}</Notice> : null}
            <PrimaryButton disabled={busy}>{busy ? "SUBMITTING…" : "SUBMIT STATION FOR REVIEW"}</PrimaryButton>
            <Notice>
              Submitted stations stay pending until our team approves them. Only approved stations show
              the E-Charge Verified badge.
            </Notice>
          </div>
        </Panel>
      </form>
    </PageShell>
  );
}
