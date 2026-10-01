import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell, Panel } from "@/components/page-shell";
import { Notice } from "@/components/form-controls";
import { supabase } from "@/integrations/supabase/client";
import { reviewStatusLabels, type StationRow } from "@/lib/owner-stations";

export const Route = createFileRoute("/_authenticated/owner/dashboard")({
  validateSearch: (s: Record<string, unknown>): { submitted?: string } =>
    s.submitted ? { submitted: String(s.submitted) } : {},
  head: () => ({
    meta: [
      { title: "Owner Dashboard — E-Charge" },
      {
        name: "description",
        content:
          "Manage your E-Charge stations: availability, opening hours, pricing and review status.",
      },
      { property: "og:title", content: "Owner Dashboard — E-Charge" },
      { property: "og:description", content: "Your E-Charge station owner dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OwnerDashboard,
});

function OwnerDashboard() {
  const navigate = useNavigate();
  const { submitted } = Route.useSearch();
  const { user } = Route.useRouteContext();
  const stations = useQuery({
    queryKey: ["my-stations", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stations")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as StationRow[];
    },
  });

  async function toggleOpen(s: StationRow) {
    await supabase.from("stations").update({ is_open: !s.is_open }).eq("id", s.id);
    stations.refetch();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  const list = stations.data ?? [];
  const count = (st: StationRow["review_status"]) => list.filter((s) => s.review_status === st).length;

  return (
    <PageShell
      eyebrow="Owner dashboard"
      title="Your stations."
      intro="Register stations, track their review status and tell riders whether you're open."
    >
      {submitted ? (
        <div className="mb-4">
          <Notice>Your station has been submitted and is awaiting E-Charge verification.</Notice>
        </div>
      ) : null}

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Panel title="Stations" description={`${list.length} listed`} />
        <Panel title="Awaiting review" description={`${count("pending")} pending`} />
        <Panel title="Verified" description={`${count("approved")} approved`} />
      </div>

      <Panel title={list.length ? "Manage stations" : "No stations yet"} description={list.length ? undefined : "Add your first station so riders can find it."}>
        {stations.isLoading ? <p className="text-sm text-ink/60">Loading…</p> : null}
        {stations.error ? <Notice tone="warn">We couldn't load your stations. Please refresh.</Notice> : null}
        <div className="space-y-2">
          {list.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-paper/60 p-4 ring-1 ring-black/5">
              <div>
                <p className="font-semibold text-ink">{s.name}</p>
                <p className="text-xs text-ink/60">
                  {[s.town, s.county].filter(Boolean).join(", ") || "Location set"} · {reviewStatusLabels[s.review_status]}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleOpen(s)}
                className={`min-h-[44px] rounded-xl px-4 text-sm font-semibold ring-1 ${s.is_open ? "bg-signal/15 text-ink ring-signal/40" : "bg-danger/10 text-ink ring-danger/30"}`}
              >
                {s.is_open ? "Open now — tap to close" : "Closed — tap to open"}
              </button>
            </div>
          ))}
        </div>
        <Link
          to="/owner/stations/new"
          className="mt-4 flex min-h-[52px] items-center justify-center rounded-2xl bg-signal px-5 text-base font-semibold text-ink ring-1 ring-signal transition-colors hover:bg-signal/90"
        >
          {list.length ? "ADD ANOTHER STATION" : "REGISTER MY STATION"}
        </Link>
      </Panel>

      <div className="mt-4">
        <button type="button" onClick={handleSignOut} className="text-sm text-ink/60 underline underline-offset-2 hover:text-ink">
          Sign out
        </button>
      </div>
    </PageShell>
  );
}
