import Stripe from "stripe";
import { sendBrevoMail } from "@/lib/brevo";
import { handleEvent } from "@/lib/order-confirmation";
import { usableStripeKey } from "@/lib/shop-flag";

/**
 * BL-090 — Stripe webhook: sends our own order confirmation (lib/order-confirmation.ts). Endpoint
 * https://www.zauberlabs.de/api/stripe/webhook, events checkout.session.completed and checkout.session.async_payment_succeeded.
 * Env (never logged): STRIPE_WEBHOOK_SECRET (whsec_…, from the endpoint in the Stripe dashboard), STRIPE_SECRET_KEY,
 * BREVO_API_KEY. Server to server, so not behind the shop gate; the signature is the check.
 * - secret or key missing → 503 (Stripe retries); bad signature → 400; mail not sent → 500 (Stripe retries); else 200.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = usableStripeKey(process.env.STRIPE_SECRET_KEY);
  if (!secret || !key) {
    console.error(`stripe webhook: ${!secret ? "STRIPE_WEBHOOK_SECRET" : "a usable STRIPE_SECRET_KEY"} is not set`);
    return Response.json({ error: "Webhook not configured" }, { status: 503 });
  }
  const stripe = new Stripe(key);
  const raw = await req.text(); // the exact bytes Stripe signed
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return Response.json({ error: "Bad signature" }, { status: 400 });
  }
  try {
    const outcome = await handleEvent(event, {
      retrieveSession: (id) => stripe.checkout.sessions.retrieve(id, { expand: ["line_items", "payment_intent"] }),
      markSent: async (pi, sessionId, at) => {
        await stripe.paymentIntents.update(pi, { metadata: { zl_confirmation_sent: at } }, { idempotencyKey: `zl-order-confirmation-${sessionId}` });
      },
      send: sendBrevoMail,
    });
    return Response.json({ received: true, outcome });
  } catch (err) {
    console.error("stripe webhook: order confirmation failed:", err instanceof Error ? err.message : "unknown error");
    return Response.json({ error: "Not processed" }, { status: 500 });
  }
}
