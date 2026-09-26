import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth-shell";
import { Field, Notice, PrimaryButton, TextInput } from "@/components/form-controls";

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
      <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
        <Field label="Email">
          <TextInput type="email" placeholder="you@example.com" />
        </Field>
        <PrimaryButton>SEND RESET LINK</PrimaryButton>
        <Notice>
          If the email belongs to an E-Charge account, a reset link will arrive shortly. For your
          safety we do not say whether an email is registered.
        </Notice>
      </form>
    </AuthShell>
  );
}
