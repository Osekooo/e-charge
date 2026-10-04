import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Field, Notice, PrimaryButton, TextInput } from "@/components/form-controls";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin Login — E-Charge" },
      { name: "description", content: "Sign in to the E-Charge admin console." },
      { property: "og:title", content: "Admin Login — E-Charge" },
      { property: "og:description", content: "Restricted E-Charge admin sign-in." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const { data, error: e } = await supabase.auth.signInWithPassword({ email, password });
    if (e || !data.user) {
      setBusy(false);
      return setError(e?.message ?? "Login failed.");
    }
    // Role is checked against the database (RLS also enforces admin-only writes).
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();
    setBusy(false);
    if (!role) {
      await supabase.auth.signOut();
      return setError("This account does not have admin access.");
    }
    navigate({ to: "/admin/dashboard" });
  }

  return (
    <AuthShell title="Admin sign in" description="Restricted to E-Charge administrators.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field label="Email">
          <TextInput type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password">
          <TextInput type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        {error ? <Notice tone="warn">{error}</Notice> : null}
        <PrimaryButton disabled={busy}>{busy ? "SIGNING IN…" : "SIGN IN"}</PrimaryButton>
      </form>
    </AuthShell>
  );
}
