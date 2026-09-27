import { createFileRoute } from "@tanstack/react-router";
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

function NewStation() {
  return (
    <PageShell
      eyebrow="Station registration"
      title="Register your station."
      intro="Fill in what riders need to know. You can save and come back — our team reviews the station before it appears as verified."
    >
      <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
        <Panel title="Basic information">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Station name">
              <TextInput placeholder="e.g. Ngong Road Swap Hub" />
            </Field>
            <Field label="Phone">
              <TextInput placeholder="+254 7…" />
            </Field>
            <Field label="WhatsApp">
              <TextInput placeholder="+254 7…" />
            </Field>
            <Field label="Email">
              <TextInput type="email" placeholder="station@example.com" />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Description">
              <TextArea placeholder="What riders will find at your station" />
            </Field>
          </div>
        </Panel>

        <Panel title="Station type">
          <Field label="What do you offer?">
            <Select defaultValue="Battery Swap + Charging">
              <option>Battery Swap</option>
              <option>Charging</option>
              <option>Battery Swap + Charging</option>
            </Select>
          </Field>
        </Panel>

        <Panel title="Services" description="Pick everything available at this station.">
          <div className="grid gap-2 sm:grid-cols-2">
            {services.map((service) => (
              <CheckRow key={service} label={service} />
            ))}
          </div>
        </Panel>

        <Panel
          title="Compatibility"
          description="Which motorcycle or battery systems can use this station?"
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {systems.map((system) => (
              <CheckRow key={system} label={system} />
            ))}
          </div>
        </Panel>

        <Panel title="Pricing">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Battery swap price" hint="Leave blank if not offered">
              <TextInput placeholder="KSh per pack" />
            </Field>
            <Field label="Charging price" hint="Leave blank if not offered">
              <TextInput placeholder="KSh per kWh or per hour" />
            </Field>
          </div>
          <div className="mt-3">
            <CheckRow label="Contact me for pricing instead" />
          </div>
        </Panel>

        <Panel title="Opening hours">
          <div className="space-y-2">
            {days.map((day) => (
              <div key={day} className="grid items-center gap-2 sm:grid-cols-[7rem_1fr_1fr_auto]">
                <span className="text-sm text-ink/80">{day}</span>
                <TextInput type="time" defaultValue="06:00" />
                <TextInput type="time" defaultValue="20:00" />
                <div className="flex gap-2">
                  <CheckRow label="Closed" />
                  <CheckRow label="24 hours" />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Station location"
          description="Set the exact spot riders should be routed to. No need to type coordinates."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <GhostButton>USE MY CURRENT LOCATION</GhostButton>
            <GhostButton>PICK ON THE MAP</GhostButton>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Street / address">
              <TextInput placeholder="Road, building or landmark" />
            </Field>
            <Field label="Town or area">
              <TextInput placeholder="e.g. Kilimani" />
            </Field>
            <Field label="County">
              <TextInput placeholder="e.g. Nairobi" />
            </Field>
            <Field label="Access instructions">
              <TextInput placeholder="Enter through the main gate and turn left." />
            </Field>
          </div>
          <div className="mt-3 grid h-40 place-items-center rounded-2xl bg-ink/8 text-xs text-ink/50">
            Map location picker
          </div>
        </Panel>

        <Panel title="Photos" description="Show the entrance, the cabinets and the waiting area.">
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="grid aspect-4/3 place-items-center rounded-xl bg-ink/8 text-[11px] text-ink/40"
              >
                + Photo
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="space-y-3">
            <PrimaryButton>SUBMIT STATION FOR REVIEW</PrimaryButton>
            <Notice tone="warn">
              Nothing is saved yet — this form gets connected when station registration goes live.
              Submitted stations stay pending until our team approves them, and only approved
              stations show the E-Charge Verified badge.
            </Notice>
          </div>
        </Panel>
      </form>
    </PageShell>
  );
}
