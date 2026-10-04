import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Field, Notice, PrimaryButton, TextInput } from "@/components/form-controls";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/owner/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a New Password — E-Charge" },
      { name: "description", content: "Set a new password for your E-Charge account." },
      { property: "og:title", content: "Choose a New Password — E-Charge" },
      { property: "og:description", content: "Set a new password for your E-Charge account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // The reset link signs the user in with a short-lived recovery session.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => data.session && setReady(true));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    const { error: e } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (e) return setError(e.message);
    navigate({ to: "/owner/dashboard" });
  }

  return (
    <AuthShell
      title="Choose a new password"
      description="Enter your new password twice."
      footer={
        <Link to="/owner/login" className="text-paper underline underline-offset-2">
          Back to login
        </Link>
      }
    >
      {!ready ? (
        <Notice tone="warn">
          Open this page from the reset link in your email. If the link expired, request a new one
          from <Link to="/owner/forgot-password" className="underline">Forgot Password</Link>.
        </Notice>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Field label="New password">
            <TextInput type="password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          <Field label="Confirm new password">
            <TextInput type="password" placeholder="Repeat your password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </Field>
          {error ? <Notice tone="warn">{error}</Notice> : null}
          <PrimaryButton disabled={busy}>{busy ? "SAVING…" : "SAVE NEW PASSWORD"}</PrimaryButton>
        </form>
      )}
    </AuthShell>
  );
}
