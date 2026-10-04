import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const COLUMNS =
  "id,name,description,station_type,services,compatibility,swap_price,charging_price,contact_for_pricing,phone,whatsapp,opening_hours,address,town,county,access_instructions,latitude,longitude,is_open,updated_at";

function publicClient() {
  // Cloudflare builds may not define the server-side SUPABASE_* vars; fall back to the
  // public VITE_* values baked in at build time so every host reads the same backend.
  const url = process.env["SUPABASE_URL"] || import.meta.env["VITE_SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] || import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Backend connection is not configured on this host.");
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

/** All approved stations — the only rows riders may see (RLS enforces this too). */
export const getApprovedStations = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("stations")
    .select(COLUMNS)
    .eq("review_status", "approved")
    .limit(500);
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getPublicStation = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { data: row, error } = await publicClient()
      .from("stations")
      .select(COLUMNS)
      .eq("id", data.id)
      .eq("review_status", "approved")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });
