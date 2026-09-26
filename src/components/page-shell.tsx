import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export function PageShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 map-surface opacity-80" />
        <div className="absolute -top-24 -left-24 size-72 rounded-full bg-signal/20 blur-3xl" />
        <div className="relative">
          <SiteHeader />
          <div className="mx-auto max-w-5xl px-5 pt-10 pb-10 sm:px-8">
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="mt-2 max-w-[22ch] text-balance text-[34px] leading-none font-semibold text-paper sm:text-[44px]">
              {title}
            </h1>
            {intro ? (
              <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-pretty text-frost/80">
                {intro}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 sm:px-8">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
  tone = "light",
}: {
  title?: string;
  description?: string;
  children?: ReactNode;
  tone?: "light" | "dark";
}) {
  const isDark = tone === "dark";
  return (
    <section
      className={
        isDark
          ? "rounded-[22px] frost-dark p-6 ring-1 ring-border"
          : "rounded-[22px] frost p-6 ring-1 ring-black/5"
      }
    >
      {title ? (
        <h2
          className={
            isDark
              ? "font-display text-xl font-semibold text-paper"
              : "font-display text-xl font-semibold text-ink"
          }
        >
          {title}
        </h2>
      ) : null}
      {description ? (
        <p
          className={
            isDark
              ? "mt-2 text-sm leading-relaxed text-pretty text-frost/70"
              : "mt-2 text-sm leading-relaxed text-pretty text-ink/70"
          }
        >
          {description}
        </p>
      ) : null}
      {children ? <div className={title || description ? "mt-5" : ""}>{children}</div> : null}
    </section>
  );
}
