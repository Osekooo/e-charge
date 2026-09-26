import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "E-Charge — Find Power. Keep Riding." },
      {
        name: "description",
        content:
          "Find the nearest electric motorcycle charging or battery-swap station in Kenya and navigate there. No account needed.",
      },
      { property: "og:title", content: "E-Charge — Find Power. Keep Riding." },
      {
        property: "og:description",
        content:
          "Live map of verified charging and battery-swap stations for electric riders across Kenya.",
      },
    ],
  }),
  component: Home,
});

const steps = [
  {
    n: "1",
    title: "FIND",
    copy: "See every station near you, sorted by road distance and live availability.",
  },
  {
    n: "2",
    title: "NAVIGATE",
    copy: "Tap once to route straight to the bay, in any traffic.",
  },
  {
    n: "3",
    title: "RIDE",
    copy: "Swap or charge, then clip in and roll out. Power, on your route.",
  },
];

function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 map-surface" />
        <div className="absolute inset-0 map-roads opacity-70" />
        <div className="absolute -top-24 -left-24 size-72 rounded-full bg-signal/25 blur-3xl" />
        <div className="absolute bottom-0 right-0 size-80 rounded-full bg-amber/15 blur-3xl" />

        <div className="relative">
          <SiteHeader />

          <div className="mx-auto flex max-w-2xl flex-col px-5 pt-8 pb-12 sm:px-8">
            <h1 className="mt-8 max-w-[16ch] text-balance text-[42px] leading-none font-semibold text-paper sm:text-[56px]">
              Find Power.
              <br />
              Keep Riding.
            </h1>
            <p className="mt-4 max-w-[42ch] text-base leading-relaxed text-pretty text-frost/85">
              Live map of verified charging and battery-swap stations across Kenya. No account
              needed — just find power and go.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <Link
                to="/find-station"
                className="flex min-h-[56px] items-center justify-between rounded-2xl bg-signal px-5 text-base font-semibold text-ink ring-1 ring-signal transition-colors hover:bg-signal/90"
              >
                <span>FIND NEAREST STATION</span>
                <span className="text-lg">→</span>
              </Link>
              <Link
                to="/register-station"
                className="flex min-h-[56px] items-center justify-center rounded-2xl bg-secondary px-5 text-base font-medium text-paper ring-1 ring-border transition-colors hover:bg-muted"
              >
                REGISTER YOUR STATION
              </Link>
            </div>

            <div className="mt-10 rounded-[20px] frost p-5 ring-1 ring-black/5">
              {steps.map((step, index) => (
                <div key={step.n} className={index === 0 ? "" : "mt-4"}>
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink font-display text-sm font-semibold text-amber">
                      {step.n}
                    </div>
                    <div className="font-display text-[15px] font-semibold text-ink">
                      {step.title}
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-pretty text-ink/70">
                    {step.copy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-ink">
        <div className="absolute inset-0 map-surface opacity-80" />
        <div className="absolute -bottom-16 left-1/2 size-72 -translate-x-1/2 rounded-full bg-signal/20 blur-3xl" />
        <div className="relative mx-auto max-w-md px-5 py-12 sm:px-8">
          <div className="rounded-[22px] frost-dark p-6 ring-1 ring-border">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber">
              Station owners
            </p>
            <h2 className="mt-2 max-w-[24ch] text-balance text-[26px] leading-none font-semibold text-paper">
              Put your station on the map.
            </h2>
            <p className="mt-3 max-w-[38ch] text-sm leading-relaxed text-pretty text-frost/70">
              List charging bays or swap cabinets, set availability, and get riders routed to your
              door.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                to="/owner/login"
                className="flex min-h-[52px] items-center justify-center rounded-2xl bg-signal px-5 text-base font-semibold text-ink ring-1 ring-signal transition-colors hover:bg-signal/90"
              >
                LOG IN
              </Link>
              <Link
                to="/owner/signup"
                className="flex min-h-[52px] items-center justify-center rounded-2xl bg-secondary px-5 text-base font-medium text-paper ring-1 ring-border transition-colors hover:bg-muted"
              >
                CREATE ACCOUNT
              </Link>
            </div>
            <p className="mt-4 text-center text-xs text-frost/50">
              Riders never need an account to find a station.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
