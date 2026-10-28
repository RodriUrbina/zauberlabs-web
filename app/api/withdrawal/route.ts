import { sendBrevoMail } from "@/lib/brevo";
import { shopOpenFor } from "@/lib/shop-flag";
import { berlinTime, confirmationText, FIELDS, type Declaration } from "@/lib/withdrawal-mail";

/**
 * BL-084/BL-085 — the withdrawal function (§ 356a BGB). Receives the declaration from /[lang]/vertrag-widerrufen and at once
 * sends the confirmation of receipt on a durable medium (e-mail) with the content of the declaration and the date and time
 * of receipt (§ 356a Abs. 4), to the customer, with a copy (bcc) to us. Sent through Brevo's transactional e-mail API
 * (Datenschutz § 12/§ 15). Nothing is stored on our side: the copy in our mailbox is the record.
 *
 * Env (set on Vercel by the PO; never logged):
 * - BREVO_API_KEY: required. Without it the route answers 503 and the form tells the customer to write to us instead, so
 *   no declaration is lost silently.
 * - SHOP_MAIL_FROM: sender address, default hello@zauberlabs.de; must be a verified sender in the Brevo account.
 * - BREVO_API_URL: only for local tests against a mock (default https://api.brevo.com/v3/smtp/email).
 * Closed like the shop (lib/shop-flag.ts).
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!shopOpenFor(req.headers.get("cookie"))) return Response.json({ error: "Not found" }, { status: 404 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (typeof body?.website === "string" && body.website) return Response.json({ ok: true }); // honeypot: bots only

  const d = {} as Declaration;
  for (const [k, max] of Object.entries(FIELDS) as [keyof typeof FIELDS, number][]) {
    const v = typeof body?.[k] === "string" ? (body[k] as string).trim() : "";
    if (v.length > max) return Response.json({ error: `${k} is too long` }, { status: 400 });
    d[k] = v.replace(/[\r\n]+/g, " ");
  }
  if (!d.name || !d.order || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) {
    return Response.json({ error: "Name, e-mail and order are required" }, { status: 400 });
  }

  const receivedAt = new Date();
  const sent = await sendBrevoMail({
    to: { email: d.email, name: d.name },
    subject: `Eingangsbestätigung deines Widerrufs (${d.order})`,
    text: confirmationText(d, receivedAt),
  });
  if (sent === "no-key") {
    console.error("withdrawal: BREVO_API_KEY is not set; no confirmation could be sent");
    return Response.json({ error: "Confirmation e-mail is not available" }, { status: 503 });
  }
  if (sent === "refused") {
    console.error("withdrawal: Brevo did not accept the e-mail");
    return Response.json({ error: "Confirmation e-mail could not be sent" }, { status: 502 });
  }
  return Response.json({ ok: true, receivedAt: receivedAt.toISOString(), receivedAtText: berlinTime(receivedAt) });
}
