import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import {
  Field,
  GhostButton,
  Notice,
  PrimaryButton,
  TextInput,
} from "@/components/form-controls";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/owner/signup")({
  head: () => ({
    meta: [
      { title: "Create a Station Owner Account — E-Charge" },
      {
        name: "description",
        content:
          "Create an E-Charge station owner account to list your charging or battery-swap station in Kenya.",
      },
      { property: "og:title", content: "Create a Station Owner Account — E-Charge" },
      {
        property: "og:description",
        content: "Create an owner account, then register your charging or battery-swap station.",
      },
    ],
  }),
  component: OwnerSignup,
});

function OwnerSignup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSignup(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setBusy(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (data.session) {
      navigate({ to: "/owner/dashboard" });
      return;
    }
    setCheckEmail(true);
  }

  async function handleGoogleSignup() {
    setError(null);
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

  if (checkEmail) {
    return (
      <AuthShell
        title="Check your email"
        description={`We sent a confirmation link to ${email}. Click it to activate your account, then log in.`}
        footer={
          <Link to="/owner/login" className="text-paper underline underline-offset-2">
            Back to login
          </Link>
        }
      >
        <Notice>
          Verifying your email is not the same as your station being verified — our team reviews
          stations separately.
        </Notice>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your owner account"
      description="One account can manage several stations."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/owner/login" className="text-paper underline underline-offset-2">
            Log in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSignup}>
        <GhostButton type="button" onClick={handleGoogleSignup}>
          Continue with Google
        </GhostButton>
        <div className="flex items-center gap-3 text-xs text-neutral">
          <span className="h-px flex-1 bg-ink/10" />
          or register with email
          <span className="h-px flex-1 bg-ink/10" />
        </div>
        <Field label="Full name">
          <TextInput
            placeholder="Your name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
        </Field>
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
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Field>
        <Field label="Confirm password">
          <TextInput
            type="password"
            placeholder="Repeat your password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            required
          />
        </Field>
        {error ? <Notice tone="warn">{error}</Notice> : null}
        <PrimaryButton disabled={busy}>
          {busy ? "CREATING ACCOUNT…" : "CREATE ACCOUNT & VERIFY EMAIL"}
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}
