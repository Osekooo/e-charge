import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageShell, Panel } from "@/components/page-shell";
import { Notice } from "@/components/form-controls";
import { supabase } from "@/integrations/supabase/client";
import { reviewStatusLabels, signedPhotoUrls, type StationRow } from "@/lib/owner-stations";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — E-Charge" },
      { name: "description", content: "Review, verify and manage E-Charge station submissions." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin Dashboard — E-Charge" },
      { property: "og:description", content: "Review and verify station submissions." },
    ],
  }),
  component: AdminDashboard,
});

type Status = StationRow["review_status"];
const tabs: Status[] = ["pending", "approved", "rejected", "suspended"];

function AdminDashboard() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Status>("pending");

  const role = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user!.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
  });

  const stations = useQuery({
    queryKey: ["admin-stations"],
    enabled: role.data === true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (role.isLoading) return <PageShell eyebrow="Admin" title="Checking access…">{null}</PageShell>;
  if (!role.data)
    return (
      <PageShell eyebrow="Admin" title="Admins only.">
        <Notice tone="warn">
          This account doesn't have admin access. Ask the E-Charge team to grant it.{" "}
          <Link to="/owner/dashboard" className="underline">Go to owner dashboard</Link>
        </Notice>
      </PageShell>
    );

  const all = stations.data ?? [];
  const count = (s: Status) => all.filter((r) => r.review_status === s).length;
  const list = all.filter((r) => r.review_status === tab);

  return (
    <PageShell
      eyebrow="Admin"
      title="Review and verify stations."
      intro="Only approved stations appear to riders. Owners can never verify their own stations."
    >
      <div className="grid gap-4 sm:grid-cols-4">
        {tabs.map((s) => (
          <Panel key={s} title={reviewStatusLabels[s]} description={`${count(s)} stations`} />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setTab(s)}
            className={cn(
              "min-h-[44px] rounded-xl px-4 text-sm font-semibold ring-1",
              tab === s ? "bg-signal text-ink ring-signal" : "bg-paper/10 text-paper ring-border",
            )}
          >
            {reviewStatusLabels[s]} ({count(s)})
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {stations.isLoading ? <p className="text-sm text-neutral">Loading…</p> : null}
        {stations.isError ? <Notice tone="warn">Could not load stations.</Notice> : null}
        {!stations.isLoading && list.length === 0 ? (
          <p className="text-sm text-neutral">No stations here.</p>
        ) : null}
        {list.map((st) => (
          <ReviewCard key={st.id} st={st} onDone={() => qc.invalidateQueries({ queryKey: ["admin-stations"] })} />
        ))}
      </div>
    </PageShell>
  );
}

function ReviewCard({ st, onDone }: { st: StationRow; onDone: () => void }) {
  const [busy, setBusy] = useState<Status | null>(null);
  const [err, setErr] = useState("");
  const photos = useQuery({
    queryKey: ["admin-photos", st.id],
    queryFn: () => signedPhotoUrls(st.photo_paths),
  });

  const setStatus = async (review_status: Status) => {
    setBusy(review_status);
    setErr("");
    const { error } = await supabase.from("stations").update({ review_status }).eq("id", st.id);
    setBusy(null);
    if (error) setErr(error.message);
    else onDone();
  };

  const hasCoords = st.latitude != null && st.longitude != null;
  const actions: { label: string; to: Status; primary?: boolean }[] =
    st.review_status === "pending"
      ? [{ label: "APPROVE", to: "approved", primary: true }, { label: "REJECT", to: "rejected" }]
      : st.review_status === "approved"
        ? [{ label: "SUSPEND", to: "suspended" }]
        : [{ label: "APPROVE", to: "approved", primary: true }];

  return (
    <article className="rounded-[18px] bg-paper/90 p-4 text-ink ring-1 ring-black/5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-[17px] font-semibold">{st.name}</h3>
          <p className="text-sm text-ink/60">
            {[st.address, st.town, st.county].filter(Boolean).join(", ") || "No address"}
          </p>
        </div>
        <span className="text-xs text-ink/50">
          Submitted {new Date(st.created_at).toLocaleDateString("en-KE")}
        </span>
      </div>

      <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
        <Row k="Type" v={st.station_type} />
        <Row k="Phone" v={st.phone || "—"} />
        <Row k="WhatsApp" v={st.whatsapp || "—"} />
        <Row k="Email" v={st.email || "—"} />
        <Row k="Swap price" v={st.swap_price || "—"} />
        <Row k="Charging price" v={st.charging_price || "—"} />
        <Row k="Batteries" v={st.compatibility.join(", ") || "—"} />
        <Row k="Services" v={st.services.join(", ") || "—"} />
      </dl>
      {st.description ? <p className="mt-2 text-sm text-ink/70">{st.description}</p> : null}

      {hasCoords ? (
        <a
          href={`https://www.openstreetmap.org/?mlat=${st.latitude}&mlon=${st.longitude}#map=17/${st.latitude}/${st.longitude}`}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-sm font-semibold text-signal underline"
        >
          Check location on map ↗
        </a>
      ) : (
        <p className="mt-2 text-sm font-semibold text-danger">No GPS location — riders can't find it on the map.</p>
      )}

      {photos.data?.length ? (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {photos.data.map((u) => (
            <img key={u} src={u} alt="Station" className="h-24 w-32 shrink-0 rounded-lg object-cover" />
          ))}
        </div>
      ) : null}

      {err ? <p className="mt-2 text-sm text-danger">{err}</p> : null}
      <div className="mt-4 flex gap-2">
        {actions.map((a) => (
          <button
            key={a.to}
            type="button"
            disabled={busy !== null}
            onClick={() => setStatus(a.to)}
            className={cn(
              "flex min-h-[46px] flex-1 items-center justify-center rounded-xl text-sm font-semibold ring-1 transition-all active:scale-[0.98] disabled:opacity-60",
              a.primary ? "bg-signal text-ink ring-signal" : "bg-paper text-ink ring-black/10",
            )}
          >
            {busy === a.to ? "WORKING…" : a.label}
          </button>
        ))}
      </div>
    </article>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-ink/50">{k}:</dt>
      <dd className="min-w-0 break-words">{v}</dd>
    </div>
  );
}
