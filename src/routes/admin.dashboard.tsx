import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel } from "@/components/page-shell";
import { Notice } from "@/components/form-controls";
import { demoStations } from "@/data/stations";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — E-Charge" },
      {
        name: "description",
        content:
          "E-Charge admin dashboard: review station submissions, verification and rider reports.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin Dashboard — E-Charge" },
      {
        property: "og:description",
        content: "Review station submissions, verification and rider reports.",
      },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <PageShell
      eyebrow="Admin"
      title="Review and verify stations."
      intro="Station submissions, verification decisions and rider reports live here. Owners can never verify their own stations."
    >
      <div className="grid gap-4 sm:grid-cols-4">
        <Panel title="Pending" description="2 stations awaiting review" />
        <Panel title="Verified" description={`${demoStations.length} stations live`} />
        <Panel title="Reports" description="3 open rider reports" />
        <Panel title="Owners" description="5 owner accounts" />
      </div>

      <div className="mt-4">
        <Panel title="Submission queue">
          <div className="space-y-2">
            {demoStations.slice(0, 3).map((station, index) => (
              <div
                key={station.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-paper/60 px-4 py-3 ring-1 ring-black/5"
              >
                <div>
                  <p className="font-display text-[15px] font-semibold text-ink">{station.name}</p>
                  <p className="text-xs text-ink/60">
                    {station.area}, {station.county} · submitted {index + 1} day
                    {index === 0 ? "" : "s"} ago
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="rounded-lg bg-signal/15 px-3 py-1.5 text-xs font-semibold text-signal ring-1 ring-signal/30">
                    Approve
                  </span>
                  <span className="rounded-lg bg-danger/15 px-3 py-1.5 text-xs font-semibold text-danger ring-1 ring-danger/30">
                    Reject
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-4">
        <Notice tone="warn">
          Structure only for now. Admin access, approvals and reports become real once accounts and
          the database are switched on.
        </Notice>
      </div>
    </PageShell>
  );
}
