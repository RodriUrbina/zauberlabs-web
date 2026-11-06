import { createHash, timingSafeEqual } from "node:crypto";
import { graphClient, type Graph } from "./graph";

/**
 * BL-118 — the Vercel settings of the Instagram publisher (entered by the PO in the Vercel dashboard, never in the repo):
 *   IG_USER_ID           the Instagram account id (zauberlabs.de)
 *   IG_PAGE_TOKEN        the Page access token of the "Zauberlabs" Facebook Page (does not expire; scripts/instagram-page-token.mjs)
 *   IG_PUBLISH_ENABLED   "1" only once the PO says go; anything else = the cron only reports what it would post
 *   CRON_SECRET          Vercel sends it to the cron routes as "Authorization: Bearer …"; other callers get 401
 *   BREVO_API_KEY        already set for the shop; the comment digest and the publish notices use it
 */
const sha = (s: string) => createHash("sha256").update(s).digest();

export function cronAuthorized(authorization: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return timingSafeEqual(sha(authorization ?? ""), sha(`Bearer ${secret}`));
}

/** Real publishing needs the switch AND the production deployment, so a preview can never post. */
export const publishingEnabled = () => process.env.IG_PUBLISH_ENABLED === "1" && process.env.VERCEL_ENV === "production";

export function graphFromEnv(): Graph | null {
  const token = process.env.IG_PAGE_TOKEN;
  const user = process.env.IG_USER_ID;
  return token && user ? graphClient(token, user) : null;
}
