/**
 * BL-118 — one-off, run by the PO: `npm run instagram:page-token` (add `-- --replace` to renew an existing one).
 * Uses the long-lived user token (IG_ACCESS_TOKEN in ~/.config/zauberlabs/instagram.env) to fetch the Page access token of the
 * Facebook Page linked to our Instagram account (the Page whose instagram_business_account is IG_USER_ID). A Page token derived
 * from a long-lived user token does not expire; the script checks that and appends it to the same file as IG_PAGE_TOKEN
 * (mode 600). It prints the Page's name and id and whether the token expires, never the token itself.
 * The same value then goes into Vercel as IG_PAGE_TOKEN (the PO copies it from the file; agents never see it).
 */
import fs from "node:fs";
import { GRAPH_VERSION } from "../lib/instagram/graph";
import { ENV_FILE, readEnvFile } from "./instagram-env.mjs";

const replace = process.argv.includes("--replace");
const env = readEnvFile();
if (!env.IG_USER_ID || !env.IG_ACCESS_TOKEN) throw new Error(`IG_USER_ID and IG_ACCESS_TOKEN are needed in ${ENV_FILE}`);
if (env.IG_PAGE_TOKEN && !replace) {
  console.log(`IG_PAGE_TOKEN is already in ${ENV_FILE}; nothing changed (use --replace to renew it).`);
  process.exit(0);
}

async function get<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`, { headers: { authorization: `Bearer ${token}` } });
  const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } } & T;
  if (!res.ok || body.error) throw new Error(`GET ${path.split("?")[0]}: ${body.error?.message ?? res.status}`);
  return body;
}

type Page = { id: string; name: string; access_token?: string; instagram_business_account?: { id: string } };
const { data = [] } = await get<{ data?: Page[] }>("me/accounts?fields=id,name,access_token,instagram_business_account", env.IG_ACCESS_TOKEN);
const page = data.find((p) => p.instagram_business_account?.id === env.IG_USER_ID);
if (!page?.access_token) throw new Error(`No Facebook Page linked to Instagram account ${env.IG_USER_ID} among ${data.length} page(s): ${data.map((p) => p.name).join(", ")}`);

const debug = await get<{ data?: { is_valid?: boolean; expires_at?: number; type?: string } }>(
  `debug_token?input_token=${encodeURIComponent(page.access_token)}`,
  page.access_token,
).catch(() => null);
const expires = debug?.data?.expires_at;
const never = expires === 0;

const lines = fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/).filter((l) => !/^\s*(?:export\s+)?IG_PAGE_TOKEN\s*=/.test(l));
while (lines.length && lines[lines.length - 1] === "") lines.pop();
fs.writeFileSync(ENV_FILE, `${lines.join("\n")}\nIG_PAGE_TOKEN=${page.access_token}\n`, { mode: 0o600 });
fs.chmodSync(ENV_FILE, 0o600);
console.log(`IG_PAGE_TOKEN written to ${ENV_FILE} for the Page "${page.name}" (id ${page.id}).`);
console.log(`Expiry: ${never ? "never" : expires ? new Date(expires * 1000).toISOString() : "unknown (Meta's token check did not answer)"}${debug?.data?.type ? `, type ${debug.data.type}` : ""}.`);
if (!never) console.log("Note: Meta did not confirm a never-expiring token; tell the Builder before relying on it.");
