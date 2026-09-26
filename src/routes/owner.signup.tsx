import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth-shell";
import {
  Field,
  GhostButton,
  Notice,
  PrimaryButton,
  TextInput,
} from "@/components/form-controls";

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
      <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
        <GhostButton>Continue with Google</GhostButton>
        <div className="flex items-center gap-3 text-xs text-neutral">
          <span className="h-px flex-1 bg-ink/10" />
          or register with email
          <span className="h-px flex-1 bg-ink/10" />
        </div>
        <Field label="Email">
          <TextInput type="email" placeholder="you@example.com" />
        </Field>
        <Field label="Password">
          <TextInput type="password" placeholder="At least 8 characters" />
        </Field>
        <Field label="Confirm password">
          <TextInput type="password" placeholder="Repeat your password" />
        </Field>
        <PrimaryButton>CREATE ACCOUNT &amp; VERIFY EMAIL</PrimaryButton>
        <Notice>
          After registering, check your email to verify your E-Charge account. Verifying your email
          is not the same as your station being verified — our team reviews stations separately.
        </Notice>
      </form>
    </AuthShell>
  );
}
