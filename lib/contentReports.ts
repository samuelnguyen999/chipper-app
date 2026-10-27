import { supabase } from "./supabase";

export type ReportReflectionResult =
  | { status: "sent" }
  | { status: "duplicate" }
  | { status: "failed" };

/**
 * Insert a report. The database sets id, reporter, and timestamp.
 * A 409 is the unique constraint (`23505`): this user already reported the reflection.
 */
export async function reportReflection(
  reflectionId: string,
): Promise<ReportReflectionResult> {
  try {
    const { error, status } = await supabase.from("content_reports").insert({
      reflection_id: reflectionId,
    });

    if (!error) return { status: "sent" };
    if (isDuplicateReportError(error) || status === 409) {
      return { status: "duplicate" };
    }
    return { status: "failed" };
  } catch (error) {
    if (isDuplicateReportError(error)) return { status: "duplicate" };
    return { status: "failed" };
  }
}

export function isDuplicateReportError(error: unknown): boolean {
  if (error == null || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code: unknown }).code) : "";
  if (code === "23505") return true;

  const message =
    "message" in error
      ? String((error as { message: unknown }).message).toLowerCase()
      : "";
  return message.includes("duplicate") || message.includes("unique");
}
