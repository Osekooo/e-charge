import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export function AuthShell({
  eyebrow = "Station owners",
  title,
  description,
  children,
  footer,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 map-surface" />
        <div className="absolute inset-0 map-roads opacity-60" />
        <div className="absolute -bottom-16 left-1/2 size-72 -translate-x-1/2 rounded-full bg-signal/20 blur-3xl" />
        <div className="relative">
          <SiteHeader />
          <div className="mx-auto max-w-md px-5 py-12 sm:px-8">
            <div className="rounded-[22px] frost p-6 ring-1 ring-black/5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/50">
                {eyebrow}
              </p>
              <h1 className="mt-2 text-balance font-display text-[26px] leading-none font-semibold text-ink">
                {title}
              </h1>
              {description ? (
                <p className="mt-3 text-sm leading-relaxed text-pretty text-ink/70">
                  {description}
                </p>
              ) : null}
              <div className="mt-6">{children}</div>
            </div>
            {footer ? <div className="mt-4 text-center text-sm text-frost/60">{footer}</div> : null}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
