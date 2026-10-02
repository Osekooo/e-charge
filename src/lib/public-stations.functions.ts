import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const COLUMNS =
  "id,name,description,station_type,services,compatibility,swap_price,charging_price,contact_for_pricing,phone,whatsapp,opening_hours,address,town,county,access_instructions,latitude,longitude,is_open,updated_at";

function publicClient() {
  return createClient<Database>(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
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
