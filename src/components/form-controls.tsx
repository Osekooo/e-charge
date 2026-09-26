import type { ReactNode } from "react";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink/80">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-neutral">{hint}</span> : null}
    </label>
  );
}

const inputClass =
  "mt-1.5 flex min-h-[48px] w-full rounded-xl bg-paper/70 px-4 text-base text-ink ring-1 ring-black/10 placeholder:text-neutral focus:outline-none focus:ring-2 focus:ring-signal";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputClass} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} rows={3} className={`${inputClass} py-3`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={inputClass} />;
}

export function CheckRow({ label }: { label: string }) {
  return (
    <label className="flex min-h-[44px] items-center gap-3 rounded-xl bg-paper/60 px-4 ring-1 ring-black/5">
      <input type="checkbox" className="size-4 accent-[oklch(0.556_0.0895_186)]" />
      <span className="text-sm text-ink/80">{label}</span>
    </label>
  );
}

export function PrimaryButton({
  children,
  type = "submit",
}: {
  children: ReactNode;
  type?: "submit" | "button";
}) {
  return (
    <button
      type={type}
      className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-signal px-5 text-base font-semibold text-ink ring-1 ring-signal transition-colors hover:bg-signal/90"
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  type = "button",
  onClick,
}: {
  children: ReactNode;
  type?: "submit" | "button";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-paper/60 px-5 text-base font-medium text-ink ring-1 ring-black/10 transition-colors hover:bg-paper/80"
    >
      {children}
    </button>
  );
}

export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "warn";
  children: ReactNode;
}) {
  return (
    <div
      className={
        tone === "warn"
          ? "rounded-2xl bg-amber/12 px-4 py-3 text-sm leading-snug text-pretty text-ink/80 ring-1 ring-amber/30"
          : "rounded-2xl bg-signal/12 px-4 py-3 text-sm leading-snug text-pretty text-ink/80 ring-1 ring-signal/30"
      }
    >
      {children}
    </div>
  );
}
