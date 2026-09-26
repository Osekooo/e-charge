import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border bg-ink">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="text-sm text-frost/60">
          E-Charge — charging and battery-swap stations for electric riders in Kenya.
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-frost/60">
          <Link to="/find-station" className="hover:text-paper">
            Find a Station
          </Link>
          <Link to="/register-station" className="hover:text-paper">
            Register a Station
          </Link>
          <Link to="/about" className="hover:text-paper">
            About
          </Link>
          <Link to="/contact" className="hover:text-paper">
            Contact
          </Link>
          <Link to="/admin/dashboard" className="hover:text-paper">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
