import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageShell, Panel } from "@/components/page-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/owner/dashboard")({
  head: () => ({
    meta: [
      { title: "Owner Dashboard — E-Charge" },
      {
        name: "description",
        content:
          "Manage your E-Charge stations: availability, opening hours, pricing and review status.",
      },
      { property: "og:title", content: "Owner Dashboard — E-Charge" },
      {
        property: "og:description",
        content: "Your E-Charge station owner dashboard.",
      },
    ],
  }),
  component: OwnerDashboard,
});

function OwnerDashboard() {
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <PageShell
      eyebrow="Owner dashboard"
      title="Welcome to E-Charge."
      intro="Your account is ready. Let's register your charging station — once it's live you'll manage availability and hours from here."
    >
      <Panel
        title="No stations yet"
        description="Add your first station so riders can find it. You can add more later from this dashboard."
      >
        <Link
          to="/owner/stations/new"
          className="flex min-h-[52px] items-center justify-center rounded-2xl bg-signal px-5 text-base font-semibold text-ink ring-1 ring-signal transition-colors hover:bg-signal/90"
        >
          REGISTER MY STATION
        </Link>
      </Panel>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Panel title="Stations" description="0 listed · 0 awaiting review · 0 verified" />
        <Panel title="Availability" description="Update packs or charging points once a station is live." />
        <Panel title="Rider reports" description="Reports about your stations will appear here." />
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={handleSignOut}
          className="text-sm text-ink/60 underline underline-offset-2 hover:text-ink"
        >
          Sign out
        </button>
      </div>
    </PageShell>
  );
}
