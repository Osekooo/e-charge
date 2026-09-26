import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth-shell";
import { Field, GhostButton, PrimaryButton, TextInput } from "@/components/form-controls";

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
      <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
        <GhostButton>Continue with Google</GhostButton>
        <div className="flex items-center gap-3 text-xs text-neutral">
          <span className="h-px flex-1 bg-ink/10" />
          or use your email
          <span className="h-px flex-1 bg-ink/10" />
        </div>
        <Field label="Email">
          <TextInput type="email" placeholder="you@example.com" />
        </Field>
        <Field label="Password">
          <TextInput type="password" placeholder="••••••••" />
        </Field>
        <div className="text-right">
          <Link
            to="/owner/forgot-password"
            className="text-sm text-ink/70 underline underline-offset-2"
          >
            Forgot Password?
          </Link>
        </div>
        <PrimaryButton>LOG IN</PrimaryButton>
        <p className="text-center text-xs text-neutral">
          Sign-in starts working once accounts are switched on.
        </p>
      </form>
    </AuthShell>
  );
}
