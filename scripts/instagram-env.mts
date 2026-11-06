import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * BL-118 — the PO's local Instagram credentials, ~/.config/zauberlabs/instagram.env (mode 600, never in the repo). Shared by the
 * dry run and the page-token script. Values are only ever passed on, never printed.
 */
export const ENV_FILE = process.env.IG_ENV_FILE || path.join(os.homedir(), ".config", "zauberlabs", "instagram.env");

export function readEnvFile(file = ENV_FILE): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (m) out[m[1]] = m[2].replace(/^(["'])(.*)\1$/, "$2");
  }
  return out;
}

/** The token as it may be shown: never any part of it, only its length. */
export const describeToken = (t: string | undefined) => (t ? `set (${t.length} characters)` : "missing");
