import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { shopOpenFor } from "./shop-flag";

/** BL-084 — for the shop and its prepared pages: 404 unless the shop is open for this request (see lib/shop-flag.ts). */
export async function requireShopOpen() {
  if (!shopOpenFor((await headers()).get("cookie"))) notFound();
}
