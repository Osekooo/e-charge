import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LeafletMap } from "@/components/leaflet-map";
import { getPublicStation } from "@/lib/public-stations.functions";
import { fmtKm, fmtMin, toStation, type LatLng } from "@/lib/station-adapter";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GhostButton, Notice, PrimaryButton, Select, TextArea } from "@/components/form-controls";
import { stationTypeLabels, statusLabels } from "@/data/stations";

export const Route = createFileRoute("/stations/$stationId")({
  loader: async ({ params }) => {
    if (!/^[0-9a-f-]{36}$/i.test(params.stationId)) throw notFound();
    const row = await getPublicStation({ data: { id: params.stationId } });
    if (!row) throw notFound();
    return { row, station: toStation(row, null) };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Station not found — E-Charge" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { station } = loaderData;
    const description = `${station.name} in ${station.area}, ${station.county} — ${stationTypeLabels[station.type].join(" and ")}. Road distance, availability and directions on E-Charge.`;
    return {
      meta: [
        { title: `${station.name} — E-Charge` },
        { name: "description", content: description },
        { property: "og:title", content: `${station.name} — E-Charge` },
        { property: "og:description", content: description },
      ],
    };
  },
  errorComponent: StationError,
  notFoundComponent: StationNotFound,
  component: StationProfile,
});

const reportReasons = [
  "Wrong location",
  "Station closed",
  "No batteries available",
  "No charging available",
  "Incorrect pricing",
  "Incorrect information",
  "Station does not exist",
  "Other",
];

function StationProfile() {
  const { row } = Route.useLoaderData();
  const [rider, setRider] = useState<LatLng | null>(null);
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setRider({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
    );
  }, []);
  const station = toStation(row, rider);

  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <div className="relative">
        <div className="absolute inset-0 map-surface" />
        <div className="relative">
          <SiteHeader />
        </div>
      </div>

      {station.latitude != null && station.longitude != null ? (
        <LeafletMap
          className="h-[240px]"
          center={{ lat: station.latitude, lng: station.longitude }}
          zoom={15}
          rider={rider}
          pins={[{ id: station.id, lat: station.latitude, lng: station.longitude, tone: "signal", label: station.name }]}
        />
      ) : (
        <div className="h-[120px] map-surface" />
      )}

      <main className="sheet-in -mt-6 flex-1 rounded-t-[24px] frost px-5 pt-6 pb-16 ring-1 ring-black/5 sm:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-[26px] leading-tight font-semibold text-ink">
                {station.name}
              </h1>
              <p className="mt-1 text-sm text-ink/60">
                {station.address} · {station.area}, {station.county}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-signal/15 px-2.5 py-1 text-[11px] font-semibold text-signal ring-1 ring-signal/30">
              {statusLabels[station.status]}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {stationTypeLabels[station.type].map((label) => (
              <span
                key={label}
                className="rounded-md bg-ink/8 px-2 py-1 text-[11px] font-medium text-ink"
              >
                {label}
              </span>
            ))}
            {station.verified ? (
              <span className="rounded-md bg-amber/15 px-2 py-1 text-[11px] font-semibold text-ink ring-1 ring-amber/30">
                ✓ E-Charge Verified
              </span>
            ) : null}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-pretty text-ink/70">
            {station.description}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Stat label="Distance (approx.)" value={fmtKm(station.distanceKm)} />
            <Stat label="Travel time" value={fmtMin(station.etaMin)} />
            <Stat
              label="Availability"
              value={station.availabilityLabel}
              hint={station.updatedLabel}
            />
          </div>

          <div className="mt-4">
            <Notice tone="warn">
              Availability is reported by the station owner and may be out of date. Always confirm
              before a long ride.
            </Notice>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <a
              href="#report"
              className="order-2 flex min-h-[52px] items-center justify-center rounded-2xl bg-paper/60 px-5 text-base font-medium text-ink ring-1 ring-black/10 sm:order-1"
            >
              REPORT THIS STATION
            </a>
            <Link
              to="/navigate/$stationId"
              params={{ stationId: station.id }}
              className="order-1 flex min-h-[52px] flex-1 items-center justify-center rounded-2xl bg-signal px-5 text-base font-semibold text-ink ring-1 ring-signal transition-colors hover:bg-signal/90 sm:order-2"
            >
              NAVIGATE HERE
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Block title="Services">
              <ul className="space-y-1 text-sm text-ink/70">
                {station.services.map((service) => (
                  <li key={service}>· {service}</li>
                ))}
              </ul>
            </Block>
            <Block title="Works with">
              <ul className="space-y-1 text-sm text-ink/70">
                {station.compatibility.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </Block>
            <Block title="Pricing">
              <ul className="space-y-1 text-sm text-ink/70">
                {station.pricing.map((item) => (
                  <li key={item.label}>
                    {item.label}: <span className="text-ink">{item.value}</span>
                  </li>
                ))}
              </ul>
            </Block>
            <Block title="Opening hours">
              <ul className="space-y-1 text-sm text-ink/70">
                {station.hours.map((item) => (
                  <li key={item.day}>
                    {item.day}: <span className="text-ink">{item.value}</span>
                  </li>
                ))}
              </ul>
            </Block>
            <Block title="Getting in">
              <p className="text-sm text-ink/70">{station.accessInstructions}</p>
            </Block>
            <Block title="Contact">
              <p className="text-sm text-ink/70">Phone: {station.phone}</p>
              <p className="text-sm text-ink/70">WhatsApp: {station.whatsapp}</p>
            </Block>
          </div>

          <Block title="Photos" className="mt-4">
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="grid aspect-4/3 place-items-center rounded-xl bg-ink/8 text-[11px] text-ink/40"
                >
                  Photo
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-neutral">
              Owners upload station photos when photo storage is switched on.
            </p>
          </Block>

          <section
            id="report"
            className="mt-8 scroll-mt-6 rounded-[22px] bg-paper/70 p-6 ring-1 ring-black/5"
          >
            <h2 className="font-display text-xl font-semibold text-ink">Report this station</h2>
            <p className="mt-2 text-sm text-ink/70">
              Tell us what is wrong and our team will review it.
            </p>
            <form className="mt-5 space-y-3" onSubmit={(event) => event.preventDefault()}>
              <Select defaultValue={reportReasons[0]}>
                {reportReasons.map((reason) => (
                  <option key={reason}>{reason}</option>
                ))}
              </Select>
              <TextArea placeholder="Add any detail that helps (optional)" />
              <PrimaryButton>SEND REPORT</PrimaryButton>
              <p className="text-center text-xs text-neutral">
                Reports are saved for review once the database is connected.
              </p>
            </form>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-paper/70 px-4 py-3 ring-1 ring-black/5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-neutral">{label}</p>
      <p className="mt-1 font-display text-lg font-semibold text-ink">{value}</p>
      {hint ? <p className="text-xs text-neutral">{hint}</p> : null}
    </div>
  );
}

function Block({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[18px] bg-paper/70 p-4 ring-1 ring-black/5 ${className ?? ""}`}>
      <h2 className="font-display text-[15px] font-semibold text-ink">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function StationNotFound() {
  return (
    <CenteredMessage
      title="Station not found"
      body="This station may have been removed or the link is wrong."
    />
  );
}

function StationError() {
  return (
    <CenteredMessage
      title="This station didn't load"
      body="Something went wrong on our end. Try again in a moment."
    />
  );
}

function CenteredMessage({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center px-5">
        <div className="max-w-sm rounded-[22px] frost-dark p-6 text-center ring-1 ring-border">
          <h1 className="font-display text-xl font-semibold text-paper">{title}</h1>
          <p className="mt-2 text-sm text-frost/70">{body}</p>
          <div className="mt-5">
            <Link to="/find-station">
              <GhostButton>BACK TO STATIONS</GhostButton>
            </Link>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
