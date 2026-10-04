import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: location.pathname.startsWith("/admin") ? "/admin/login" : "/owner/login",
      });
    }

    // If trying to access any admin page, verify the user actually has the admin role
    if (location.pathname.startsWith("/admin")) {
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .maybeSingle();

      // Not an admin? Send directly to admin login
      if (!role) {
        throw redirect({ to: "/admin/login" });
      }
    }

    return { user: data.user };
  },
  component: () => <Outlet />,
});
