/**
 * BL-118 — the few Instagram Graph API calls we use (Instagram API with Facebook Login, host graph.facebook.com): publishing our
 * own posts and reading the comments on them. Nothing here likes, follows or comments; outward engagement is the PO's own.
 * The token goes in the Authorization header, never in a URL, so it cannot end up in a log line.
 */
export const GRAPH_VERSION = process.env.IG_GRAPH_VERSION || "v24.0";
const BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

export class GraphError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export type Graph = ReturnType<typeof graphClient>;

export function graphClient(token: string, igUserId: string, fetchImpl: Fetch = fetch, sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))) {
  async function call<T>(method: "GET" | "POST", path: string, params: Record<string, string> = {}): Promise<T> {
    const qs = new URLSearchParams(params).toString();
    const url = `${BASE}/${path}${method === "GET" && qs ? `?${qs}` : ""}`;
    const res = await fetchImpl(url, {
      method,
      headers: { authorization: `Bearer ${token}`, ...(method === "POST" ? { "content-type": "application/x-www-form-urlencoded" } : {}) },
      ...(method === "POST" ? { body: qs } : {}),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } } & T;
    // Only Meta's error message is kept: it never contains the token.
    if (!res.ok || body.error) throw new GraphError(`${method} ${path.split("?")[0]}: ${body.error?.message ?? res.status}`, res.status);
    return body;
  }

  /** Waits until a media container has fetched its image (status FINISHED). */
  async function waitFinished(containerId: string, tries = 10) {
    for (let i = 0; i < tries; i++) {
      const { status_code } = await call<{ status_code?: string }>("GET", containerId, { fields: "status_code" });
      if (status_code === "FINISHED") return;
      if (status_code === "ERROR" || status_code === "EXPIRED") throw new GraphError(`container ${containerId}: ${status_code}`, 0);
      await sleep(3000);
    }
    throw new GraphError(`container ${containerId}: not ready`, 0);
  }

  return {
    /** Read only: the account's name and how many posts it has. */
    account: () => call<{ id: string; username?: string; media_count?: number }>("GET", igUserId, { fields: "id,username,media_count" }),
    /** Read only: how many posts went out in the last 24 hours (Instagram allows 100). */
    publishingLimit: () => call<{ data?: { quota_usage?: number; config?: { quota_total?: number } }[] }>("GET", `${igUserId}/content_publishing_limit`, { fields: "quota_usage,config" }),

    /** Publishes one post (one slide = single image, more = carousel). Returns the new media id and its permalink. */
    async publish(images: { url: string; alt: string }[], caption: string): Promise<{ mediaId: string; permalink?: string }> {
      let creationId: string;
      if (images.length === 1) {
        const { id } = await call<{ id: string }>("POST", `${igUserId}/media`, { image_url: images[0].url, alt_text: images[0].alt, caption });
        await waitFinished(id);
        creationId = id;
      } else {
        const children: string[] = [];
        for (const img of images) {
          const { id } = await call<{ id: string }>("POST", `${igUserId}/media`, { image_url: img.url, alt_text: img.alt, is_carousel_item: "true" });
          await waitFinished(id);
          children.push(id);
        }
        const { id } = await call<{ id: string }>("POST", `${igUserId}/media`, { media_type: "CAROUSEL", children: children.join(","), caption });
        await waitFinished(id);
        creationId = id;
      }
      const { id: mediaId } = await call<{ id: string }>("POST", `${igUserId}/media_publish`, { creation_id: creationId });
      const { permalink } = await call<{ permalink?: string }>("GET", mediaId, { fields: "permalink" }).catch(() => ({ permalink: undefined }));
      return { mediaId, permalink };
    },

    /** Read only: the comments on one of our posts (text and time; the commenter's name is not asked for). */
    comments: (mediaId: string) => call<{ data?: { id: string; text?: string; timestamp?: string }[] }>("GET", `${mediaId}/comments`, { fields: "id,text,timestamp" }),
  };
}
