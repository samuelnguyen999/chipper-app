import filter from "leo-profanity";

/**
 * Client moderation for reflection responses (v1).
 *
 * Call site stays stable: FocusView → {@link moderateReflection} → continue submit only when allowed.
 * Later this can become client check → server moderation → merged decision without UI changes.
 */

export type ModerationReason = "profanity";

export type ModerationResult = {
  allowed: boolean;
  /** Present when the response needs revision. */
  reason?: ModerationReason;
  /**
   * Exact whole-word matches from the response (for inline underline).
   */
  flaggedTerms?: string[];
};

/**
 * leo list + simple plural (`s`), continuous (`ing`), and agent (`er`) forms.
 * e.g. niggers, assholes, bitching, fucker, fuckers, groper.
 */
function buildExpandedBlacklist(): Set<string> {
  const out = new Set<string>();

  for (const raw of filter.list()) {
    const word = raw.toLowerCase();
    if (word.length < 2) continue;

    out.add(word);

    if (!word.endsWith("s")) {
      out.add(`${word}s`);
    }

    if (!word.endsWith("ing")) {
      if (word.endsWith("e") && word.length > 3) {
        out.add(`${word.slice(0, -1)}ing`);
      } else {
        out.add(`${word}ing`);
      }
    }

    if (!word.endsWith("er")) {
      const agent =
        word.endsWith("e") && word.length > 3
          ? `${word.slice(0, -1)}er`
          : `${word}er`;
      out.add(agent);
      out.add(`${agent}s`);
    }
  }

  return out;
}

const EXPANDED_BLACKLIST = buildExpandedBlacklist();

/** Whole-token matches only (no substring-inside-word flagging). */
function findFlaggedWholeWords(text: string): string[] {
  const tokens = text.match(/[A-Za-z0-9']+/g);
  if (!tokens) return [];

  const terms: string[] = [];
  const seen = new Set<string>();

  for (const token of tokens) {
    const key = token.toLowerCase();
    if (!EXPANDED_BLACKLIST.has(key) || seen.has(key)) continue;
    seen.add(key);
    terms.push(token);
  }

  return terms;
}

/** v1 client-only check. Keep private so FocusView never imports the library. */
function checkClientProfanity(response: string): ModerationResult {
  const text = response.trim();
  if (!text) {
    return { allowed: true };
  }

  const flaggedTerms = findFlaggedWholeWords(text);
  if (flaggedTerms.length === 0) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "profanity",
    flaggedTerms,
  };
}

/**
 * Moderate a reflection response before save.
 * Async so a future server pass can await without changing callers.
 */
export async function moderateReflection(response: string): Promise<ModerationResult> {
  // Future: const server = await checkServerModeration(response);
  // then merge client + server into one ModerationResult.
  return checkClientProfanity(response);
}
