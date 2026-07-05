import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useAnonymousAuth() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initialize() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        const { error } = await supabase.auth.signInAnonymously();

        if (error) {
          console.error("Anonymous sign in failed:", error);
        }
      }

      const {
        data: { user },
        error: getUserError,
      } = await supabase.auth.getUser();

      if (getUserError) {
        console.error("Failed to verify auth user:", getUserError);
      } else if (__DEV__ && user) {
        console.log("Anonymous user:", user.id);
      }

      setLoading(false);
    }

    void initialize();
  }, []);

  return { loading };
}
