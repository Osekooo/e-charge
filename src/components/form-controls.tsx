import { useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

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
  const [show, setShow] = useState(false);
  if (props.type !== "password") return <input {...props} className={inputClass} />;
  return (
    <span className="relative block">
      <input {...props} type={show ? "text" : "password"} className={`${inputClass} pr-12`} />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-1.5 top-1/2 mt-[3px] flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
      >
        {show ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
      </button>
    </span>
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} rows={3} className={`${inputClass} py-3`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={inputClass} />;
}

export function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-[44px] items-center gap-3 rounded-xl bg-paper/60 px-4 ring-1 ring-black/5">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange ? (event) => onChange(event.target.checked) : undefined}
        className="size-4 accent-[oklch(0.556_0.0895_186)]"
      />
      <span className="text-sm text-ink/80">{label}</span>
    </label>
  );
}

export function PrimaryButton({
  children,
  type = "submit",
  disabled,
}: {
  children: ReactNode;
  type?: "submit" | "button";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-signal px-5 text-base font-semibold text-ink ring-1 ring-signal transition-all hover:bg-signal/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  type = "button",
  onClick,
  disabled,
}: {
  children: ReactNode;
  type?: "submit" | "button";
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-paper/60 px-5 text-base font-medium text-ink ring-1 ring-black/10 transition-all hover:bg-paper/80 active:scale-[0.98] disabled:opacity-60"
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
