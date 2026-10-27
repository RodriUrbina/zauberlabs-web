import { shopOpenFor } from "@/lib/shop-flag";

/**
 * BL-084 — receives a withdrawal declaration from /[lang]/vertrag-widerrufen (§ 356a BGB).
 * TODO before launch (SHOP_LAUNCHED=1): store the declaration and send the immediate confirmation of receipt by e-mail to the
 * buyer and the PO; that needs an e-mail service. Until then it validates the input, stores nothing and answers 501, and the
 * form says so. Closed like the shop (lib/shop-flag.ts).
 */
export async function POST(req: Request) {
  if (!shopOpenFor(req.headers.get("cookie"))) return Response.json({ error: "Not found" }, { status: 404 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const ok = (k: string, max = 200) => typeof body?.[k] === "string" && (body[k] as string).trim().length > 0 && (body[k] as string).length <= max;
  if (!ok("name") || !ok("email") || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body?.email)) || !ok("order")) {
    return Response.json({ error: "Name, e-mail and order are required" }, { status: 400 });
  }
  return Response.json({ error: "Not connected yet (TODO before launch)" }, { status: 501 });
}
