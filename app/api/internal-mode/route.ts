import { NextRequest, NextResponse } from "next/server";
import { INTERNAL_COOKIE, INTERNAL_COOKIE_MAX_AGE, INTERNAL_COOKIE_VALUE, isValidInternalKey } from "@/lib/internal-mode";

// BL-039: GET /api/internal-mode?k=<secret>        → sets the internal marker, redirects to /de?internal=on
//         GET /api/internal-mode?k=<secret>&off=1  → removes it,              redirects to /de?internal=off
// Wrong or missing key, or no secret configured → plain 404 (the route does not reveal that it exists).
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("k");
  if (!isValidInternalKey(key, process.env.ZL_INTERNAL_SECRET)) {
    return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  const off = req.nextUrl.searchParams.get("off") === "1";
  const res = NextResponse.redirect(new URL(`/de?internal=${off ? "off" : "on"}`, req.url), 303);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  res.cookies.set(INTERNAL_COOKIE, off ? "" : INTERNAL_COOKIE_VALUE, {
    // Readable by the analytics beforeSend callback in the browser; carries no personal data, only "1".
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: off ? 0 : INTERNAL_COOKIE_MAX_AGE,
  });
  return res;
}
