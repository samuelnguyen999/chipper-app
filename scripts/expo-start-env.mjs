/**
 * Start Expo with a specific Supabase env file.
 * Sets process env from `.env.<mode>` and disables Expo's dotenv merge
 * so `.env` cannot override the selected backend.
 *
 * Usage: node scripts/expo-start-env.mjs <development|production> [...expo args]
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const mode = process.argv[2];
const extraArgs = process.argv.slice(3);

if (mode !== "development" && mode !== "production") {
  console.error(
    "Usage: node scripts/expo-start-env.mjs <development|production> [...expo args]",
  );
  process.exit(1);
}

const envPath = resolve(process.cwd(), `.env.${mode}`);
if (!existsSync(envPath)) {
  console.error(`Missing ${envPath}`);
  process.exit(1);
}

function parseEnvFile(filePath) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const loaded = parseEnvFile(envPath);
const url = loaded.EXPO_PUBLIC_SUPABASE_URL?.trim();
const key = loaded.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!url || !key || key.startsWith("your_")) {
  console.error(
    `Missing or placeholder EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.${mode}`,
  );
  console.error(
    "Add the real URL and publishable/anon key for that Supabase project, then retry.",
  );
  process.exit(1);
}

const env = {
  ...process.env,
  ...loaded,
  EXPO_PUBLIC_SUPABASE_URL: url,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: key,
  // Prevent Expo CLI from merging other `.env*` files over the selected backend.
  EXPO_NO_DOTENV: "1",
};

const projectRef = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "(unknown)";
console.log(`Starting Expo with .env.${mode} (Supabase ref: ${projectRef})`);

const child = spawn("npx", ["expo", "start", "-c", ...extraArgs], {
  env,
  stdio: "inherit",
  shell: true,
  cwd: process.cwd(),
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
