import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, Panel } from "@/components/page-shell";

export const Route = createFileRoute("/register-station")({
  head: () => ({
    meta: [
      { title: "Station Owner Portal — E-Charge" },
      {
        name: "description",
        content:
          "List your charging or battery-swap station on E-Charge. Log in or create a station owner account to get started.",
      },
      { property: "og:title", content: "Station Owner Portal — E-Charge" },
      {
        property: "og:description",
        content:
          "Register your charging or battery-swap station and reach electric riders across Kenya.",
      },
    ],
  }),
  component: OwnerPortal,
});

function OwnerPortal() {
  return (
    <PageShell
      eyebrow="Station owner portal"
      title="Put your station on the map."
      intro="List charging bays or swap cabinets, keep availability current, and get riders routed to your door. You need an owner account first."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Panel
          title="I already have an account"
          description="Log in to manage your stations, hours and availability."
        >
          <Link
            to="/owner/login"
            className="flex min-h-[52px] items-center justify-center rounded-2xl bg-signal px-5 text-base font-semibold text-ink ring-1 ring-signal transition-colors hover:bg-signal/90"
          >
            LOG IN
          </Link>
        </Panel>

        <Panel
          title="I'm new here"
          description="Create an owner account, then add your first station."
        >
          <Link
            to="/owner/signup"
            className="flex min-h-[52px] items-center justify-center rounded-2xl bg-paper/60 px-5 text-base font-medium text-ink ring-1 ring-black/10 transition-colors hover:bg-paper/80"
          >
            CREATE ACCOUNT
          </Link>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel
          tone="dark"
          title="How listing works"
          description="Three separate things, in this order."
        >
          <ol className="space-y-3 text-sm text-frost/75">
            <li>
              <span className="font-semibold text-paper">1. Verify your email.</span> This confirms
              the account is yours.
            </li>
            <li>
              <span className="font-semibold text-paper">2. Register your station.</span> Name,
              type, services, pricing, hours and the exact location.
            </li>
            <li>
              <span className="font-semibold text-paper">3. We review it.</span> Only stations our
              team approves get the E-Charge Verified badge and show to riders. Email verification is
              not station verification.
            </li>
          </ol>
        </Panel>
      </div>
    </PageShell>
  );
}
