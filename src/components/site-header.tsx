import { Link } from "@tanstack/react-router";
import { useState } from "react";

const links = [
  { to: "/", label: "Home" },
  { to: "/find-station", label: "Find a Station" },
  { to: "/register-station", label: "Register a Station" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-30">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-6 sm:px-8">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="grid size-9 place-items-center rounded-[10px] bg-signal text-[13px] font-semibold text-ink ring-1 ring-border">
            ⚡
          </span>
          <span className="font-display text-[15px] font-semibold tracking-tight text-paper">
            E-Charge
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.slice(1).map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-full px-3 py-2 text-sm text-frost/75 transition-colors hover:bg-secondary hover:text-paper"
              activeProps={{ className: "bg-secondary text-paper" }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/owner/login"
            className="ml-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-paper ring-1 ring-border transition-colors hover:bg-muted"
          >
            Station Owner Login
          </Link>
        </nav>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="grid size-11 place-items-center rounded-xl frost-ink text-paper ring-1 ring-border md:hidden"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open ? (
        <div className="mx-5 mt-3 rounded-[20px] frost-dark p-3 ring-1 ring-border md:hidden">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="flex min-h-[48px] items-center rounded-xl px-4 text-base text-frost/85 transition-colors hover:bg-secondary hover:text-paper"
              activeProps={{ className: "bg-secondary text-paper" }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/owner/login"
            onClick={() => setOpen(false)}
            className="mt-2 flex min-h-[48px] items-center justify-center rounded-xl bg-secondary text-base font-medium text-paper ring-1 ring-border"
          >
            Station Owner Login
          </Link>
        </div>
      ) : null}
    </header>
  );
}
