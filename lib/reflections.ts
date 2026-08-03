import { supabase } from "./supabase";

export type SaveReflectionInput = {
  cardType: "ground" | "understand" | "align";
  question: string;
  response: string;
  isPublic: boolean;
};

export type ReflectionRow = {
  id: string;
  user_id: string;
  card_type: string;
  question: string;
  response: string;
  is_public: boolean;
  reflection_date: string;
  created_at: string;
};

/** Thrown / detected when today's reflection already exists (unique constraint). */
export class DuplicateReflectionError extends Error {
  constructor(message = "A reflection for today already exists.") {
    super(message);
    this.name = "DuplicateReflectionError";
  }
}

export function isDuplicateReflectionError(error: unknown): boolean {
  if (error instanceof DuplicateReflectionError) return true;
  if (error == null || typeof error !== "object") return false;

  const code = "code" in error ? String((error as { code: unknown }).code) : "";
  // Postgres unique_violation
  if (code === "23505") return true;

  const message =
    "message" in error
      ? String((error as { message: unknown }).message).toLowerCase()
      : "";
  const details =
    "details" in error
      ? String((error as { details: unknown }).details).toLowerCase()
      : "";
  const combined = `${message} ${details}`;
  return (
    combined.includes("duplicate") ||
    combined.includes("unique") ||
    combined.includes("already exists")
  );
}

function getLocalDateKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function saveReflection({
  cardType,
  question,
  response,
  isPublic,
}: SaveReflectionInput): Promise<ReflectionRow> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("User not authenticated");
  }

  const reflectionInsert = {
    user_id: user.id,
    card_type: cardType,
    question,
    response,
    is_public: isPublic,
    reflection_date: getLocalDateKey(),
  };

  const { error } = await supabase.from("reflections").insert(reflectionInsert);

  if (error) {
    if (isDuplicateReflectionError(error)) {
      throw new DuplicateReflectionError();
    }
    throw error;
  }

  return reflectionInsert as ReflectionRow;
}

export async function getTodaysCommunity(): Promise<ReflectionRow[]> {
  const { data, error } = await supabase
    .from("reflections")
    .select()
    .eq("reflection_date", getLocalDateKey())
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Current user's reflection history (public + private). For Journal / Profile.
 *
 * RLS note: existing select policy is typically `is_public = true` only.
 * Private own-rows need an additional policy before this returns them:
 *
 *   create policy "read own reflections"
 *   on public.reflections
 *   for select
 *   to authenticated
 *   using (auth.uid() = user_id);
 */
export async function getMyReflections(): Promise<ReflectionRow[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("reflections")
    .select(
      "id, user_id, card_type, question, response, is_public, reflection_date, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Toggle `is_public` for a single reflection owned by the current user.
 * Relies on RLS (`auth.uid() = user_id`) plus an explicit `user_id` filter.
 */
export async function updateReflectionVisibility(
  reflectionId: string,
  isPublic: boolean,
): Promise<ReflectionRow> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("reflections")
    .update({ is_public: isPublic })
    .eq("id", reflectionId)
    .eq("user_id", user.id)
    .select(
      "id, user_id, card_type, question, response, is_public, reflection_date, created_at",
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "Reflection not found or visibility could not be updated (check RLS update policy).",
    );
  }

  return data;
}
