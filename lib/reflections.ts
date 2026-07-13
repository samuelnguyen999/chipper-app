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
