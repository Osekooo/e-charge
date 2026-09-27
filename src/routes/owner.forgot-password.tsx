import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Field, Notice, PrimaryButton, TextInput } from "@/components/form-controls";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/owner/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Your Password — E-Charge" },
      {
        name: "description",
        content: "Request a password reset link for your E-Charge station owner account.",
      },
      { property: "og:title", content: "Reset Your Password — E-Charge" },
      {
        property: "og:description",
        content: "Get a reset link for your E-Charge station owner account.",
      },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleReset(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/owner/login`,
    });
    setBusy(false);
    // Always show the same message so we never reveal whether an email is registered.
    setSent(true);
  }

  return (
    <AuthShell
      title="Reset your password"
      description="Enter the email on your owner account and we will send a reset link."
      footer={
        <Link to="/owner/login" className="text-paper underline underline-offset-2">
          Back to login
        </Link>
      }
    >
      {sent ? (
        <Notice>
          If the email belongs to an E-Charge account, a reset link will arrive shortly. For your
          safety we do not say whether an email is registered.
        </Notice>
      ) : (
        <form className="space-y-4" onSubmit={handleReset}>
          <Field label="Email">
            <TextInput
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Field>
          <PrimaryButton disabled={busy}>
            {busy ? "SENDING…" : "SEND RESET LINK"}
          </PrimaryButton>
        </form>
      )}
    </AuthShell>
  );
}
