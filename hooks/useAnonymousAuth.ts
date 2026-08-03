import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function isStaleAuthUserError(error: { message?: string } | null): boolean {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    message.includes("user from sub claim in jwt does not exist") ||
    message.includes("user not found")
  );
}

/** Shared so root + screens don't re-run anonymous ensure in parallel. */
let ensurePromise: Promise<string | null> | null = null;

async function ensureAnonymousSession(): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error("Anonymous sign in failed:", error);
      return null;
    }
  }

  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser();

  if (!getUserError) {
    if (__DEV__ && user) {
      console.log("Anonymous user:", user.id);
    }
    return user?.id ?? null;
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
    return null;
  }

  const {
    data: { user: newUser },
  } = await supabase.auth.getUser();

  if (__DEV__ && newUser) {
    console.log(
      "Anonymous user (recreated):",
      newUser.id,
      isStaleAuthUserError(getUserError) ? "(stale JWT)" : "",
    );
  }

  return newUser?.id ?? null;
}

function ensureAnonymousSessionOnce(): Promise<string | null> {
  if (!ensurePromise) {
    ensurePromise = ensureAnonymousSession().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }
  return ensurePromise;
}

export function useAnonymousAuth() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void ensureAnonymousSessionOnce()
      .then((id) => {
        if (!cancelled) {
          setUserId(id);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { loading, userId };
}
