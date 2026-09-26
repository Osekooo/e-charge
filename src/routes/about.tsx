import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, Panel } from "@/components/page-shell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About E-Charge" },
      {
        name: "description",
        content:
          "E-Charge helps electric motorcycle riders in Kenya find charging and battery-swap stations, and helps station owners reach them.",
      },
      { property: "og:title", content: "About E-Charge" },
      {
        property: "og:description",
        content:
          "Why E-Charge exists: fewer stranded riders, more visible charging and swap stations across Kenya.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <PageShell
      eyebrow="About"
      title="Running low? Find power nearby."
      intro="E-Charge is built for electric motorcycle and boda boda riders in Kenya. When the battery drops, you should not have to guess where the nearest swap cabinet or charger is."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Panel
          title="For riders"
          description="Open the map, see verified stations near you sorted by real road travel time, and ride there. No account, no forms, and battery level is always optional."
        />
        <Panel
          title="For station owners"
          description="List your station once, keep hours and availability current, and riders looking for power in your area will find you."
        />
        <Panel
          title="Verification you can trust"
          description="Owners cannot give themselves a badge. Our team reviews every station before it shows as E-Charge Verified, and riders can report anything that looks wrong."
        />
        <Panel
          title="Open to every system"
          description="E-Charge is not tied to one motorcycle or battery manufacturer. Stations list the systems they support, including anything not yet on our list."
        />
      </div>

      <div className="mt-4">
        <Panel tone="dark" description="Questions, partnerships or a station to list?">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/contact"
              className="flex min-h-[52px] flex-1 items-center justify-center rounded-2xl bg-signal px-5 text-base font-semibold text-ink ring-1 ring-signal"
            >
              CONTACT US
            </Link>
            <Link
              to="/register-station"
              className="flex min-h-[52px] flex-1 items-center justify-center rounded-2xl bg-secondary px-5 text-base font-medium text-paper ring-1 ring-border"
            >
              REGISTER YOUR STATION
            </Link>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
