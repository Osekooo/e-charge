import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel } from "@/components/page-shell";
import { Field, PrimaryButton, TextArea, TextInput } from "@/components/form-controls";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact E-Charge" },
      {
        name: "description",
        content:
          "Get in touch with the E-Charge team about stations, rider support or partnerships in Kenya.",
      },
      { property: "og:title", content: "Contact E-Charge" },
      {
        property: "og:description",
        content: "Message the E-Charge team about stations, rider support or partnerships.",
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <PageShell
      eyebrow="Contact"
      title="Talk to the E-Charge team."
      intro="Station questions, a listing that needs fixing, or a partnership idea — send it through and we will come back to you."
    >
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Send a message">
          <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
            <Field label="Your name">
              <TextInput placeholder="Full name" />
            </Field>
            <Field label="Email">
              <TextInput type="email" placeholder="you@example.com" />
            </Field>
            <Field label="Phone (optional)">
              <TextInput placeholder="+254 7…" />
            </Field>
            <Field label="Message">
              <TextArea placeholder="How can we help?" />
            </Field>
            <PrimaryButton>SEND MESSAGE</PrimaryButton>
            <p className="text-center text-xs text-neutral">
              Messages start being delivered once email sending is switched on.
            </p>
          </form>
        </Panel>

        <Panel
          tone="dark"
          title="Other ways to reach us"
          description="We are still setting up our public support lines — until then, use the form and we will reply by email."
        >
          <ul className="space-y-2 text-sm text-frost/75">
            <li>Riders: report a station from its page.</li>
            <li>Owners: log in to your portal for listing help.</li>
            <li>Press &amp; partners: use the form and mention your organisation.</li>
          </ul>
        </Panel>
      </div>
    </PageShell>
  );
}
