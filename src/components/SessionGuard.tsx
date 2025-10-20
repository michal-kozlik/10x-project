import { useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

interface SessionGuardProps {
  children: React.ReactNode;
}

export default function SessionGuard({ children }: SessionGuardProps) {
  useEffect(() => {
    async function checkSession() {
      const supabase = (window as any).supabase as SupabaseClient;
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";
      }
    }

    checkSession();
  }, []);

  return <>{children}</>;
}
