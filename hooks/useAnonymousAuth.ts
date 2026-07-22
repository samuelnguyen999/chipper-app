import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function isStaleAuthUserError(error: { message?: string } | null): boolean {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    message.includes("user from sub claim in jwt does not exist") ||
    message.includes("user not found")
  );
}

async function ensureAnonymousSession() {
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error("Anonymous sign in failed:", error);
    }
    return;
  }

  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser();

  if (!getUserError) {
    if (__DEV__ && user) {
      console.log("Anonymous user:", user.id);
    }
    return;
  }

  // Stale JWT after project restore / deleted anonymous user — clear and recreate.
  console.warn(
    "Auth session invalid; signing out and creating a new anonymous user:",
    getUserError.message,
  );
  await supabase.auth.signOut();
  const { error: signInError } = await supabase.auth.signInAnonymously();
  if (signInError) {
    console.error("Anonymous sign in failed after session reset:", signInError);
    return;
  }

  if (__DEV__) {
    const {
      data: { user: newUser },
    } = await supabase.auth.getUser();
    if (newUser) {
      console.log(
        "Anonymous user (recreated):",
        newUser.id,
        isStaleAuthUserError(getUserError) ? "(stale JWT)" : "",
      );
    }
  }
}

export function useAnonymousAuth() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initialize() {
      try {
        await ensureAnonymousSession();
      } finally {
        setLoading(false);
      }
    }

    void initialize();
  }, []);

  return { loading };
}
