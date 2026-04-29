/**
 * Sets a password for an existing Supabase user by ID.
 * Run: node scripts/set-password.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createInterface } from "readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "../.env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
    .filter(([k, v]) => k && v)
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

const userId = await ask("Enter user ID (from Supabase Auth dashboard): ");
const password = await ask("Enter new password (min 6 chars): ");
rl.close();

if (!userId.trim()) {
  console.error("User ID is required.");
  process.exit(1);
}

if (password.length < 6) {
  console.error("Password must be at least 6 characters.");
  process.exit(1);
}

const { error } = await supabase.auth.admin.updateUserById(userId.trim(), { password });

if (error) {
  console.error("Failed:", error.message);
  process.exit(1);
}

console.log("\n✓ Password updated successfully.");
console.log("You can now sign in at http://localhost:3000/login");
