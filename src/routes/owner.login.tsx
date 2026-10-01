import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Field, GhostButton, Notice, PrimaryButton, TextInput } from "@/components/form-controls";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/owner/login")({
  head: () => ({
    meta: [
      { title: "Station Owner Login — E-Charge" },
      {
        name: "description",
        content: "Log in to your E-Charge station owner portal to manage your stations.",
      },
      { property: "og:title", content: "Station Owner Login — E-Charge" },
      {
        property: "og:description",
        content: "Sign in to manage your charging or battery-swap stations on E-Charge.",
      },
    ],
  }),
  component: OwnerLogin,
});

function OwnerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleEmailLogin(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    navigate({ to: "/owner/dashboard" });
  }

  async function handleGoogleLogin() {
    setError(null);
    localStorage.setItem("echarge_post_auth_redirect", "/owner/dashboard");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(result.error.message ?? "Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/owner/dashboard" });
  }

  return (
    <AuthShell
      title="Log in to your portal"
      description="Manage your stations, hours and availability."
      footer={
        <>
          New here?{" "}
          <Link to="/owner/signup" className="text-paper underline underline-offset-2">
            Create an account
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleEmailLogin}>
        <GhostButton type="button" onClick={handleGoogleLogin}>
          Continue with Google
        </GhostButton>
        <div className="flex items-center gap-3 text-xs text-neutral">
          <span className="h-px flex-1 bg-ink/10" />
          or use your email
          <span className="h-px flex-1 bg-ink/10" />
        </div>
        <Field label="Email">
          <TextInput
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>
        <Field label="Password">
          <TextInput
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Field>
        <div className="text-right">
          <Link
            to="/owner/forgot-password"
            className="text-sm text-ink/70 underline underline-offset-2"
          >
            Forgot Password?
          </Link>
        </div>
        {error ? <Notice tone="warn">{error}</Notice> : null}
        <PrimaryButton disabled={busy}>{busy ? "LOGGING IN…" : "LOG IN"}</PrimaryButton>
      </form>
    </AuthShell>
  );
}
