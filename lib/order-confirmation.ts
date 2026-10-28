import type Stripe from "stripe";
import { orderMail, type Order } from "./order-mail";

/**
 * BL-090 — what the Stripe webhook does with a verified event: send the order confirmation once per paid order.
 *
 * Events: checkout.session.completed when payment_status is "paid" (cards, wallets), and
 * checkout.session.async_payment_succeeded (methods that settle later, if ever switched on). Everything else is acknowledged.
 *
 * Once only, WITHOUT storage of our own (PO: nothing stored beyond Stripe): after Brevo accepted the mail, the order's
 * PaymentIntent gets metadata `zl_confirmation_sent=<ISO time>` (with a Stripe idempotency key), and that flag is checked
 * before sending. Known, accepted race: two deliveries of the same event in the same second could both pass the check before
 * either marks it. Stripe retries are minutes to hours apart and we answer 200 only after sending and marking, so in practice
 * one mail goes out; at worst a customer gets the confirmation twice. (A strict lock would need storage of our own.)
 *
 * The Stripe and Brevo calls come in as `deps`, so tests run it with fakes and no keys.
 */
export type Deps = {
  /** The Checkout Session with line_items and payment_intent expanded. */
  retrieveSession: (id: string) => Promise<Stripe.Checkout.Session>;
  /** Marks the PaymentIntent as confirmed (metadata), idempotent per session. */
  markSent: (paymentIntentId: string, sessionId: string, at: string) => Promise<void>;
  send: (mail: { to: { email: string; name?: string }; subject: string; text: string }) => Promise<"sent" | "no-key" | "refused">;
};

export type Outcome = "ignored" | "unpaid" | "already-sent" | "no-email" | "sent";

const HANDLED = new Set(["checkout.session.completed", "checkout.session.async_payment_succeeded"]);

/** The order as the e-mail needs it, from Stripe's data only (line names already carry the BMW colours, BL-089). */
export function orderFromSession(s: Stripe.Checkout.Session, pi: Stripe.PaymentIntent): Order {
  // API 2026-09-30: the shipping address sits in collected_information.shipping_details (older API versions: shipping_details).
  const ship = s.collected_information?.shipping_details ?? (s as unknown as { shipping_details?: Stripe.Checkout.Session.CollectedInformation.ShippingDetails }).shipping_details ?? null;
  const a = ship?.address;
  const address = [ship?.name, a?.line1, a?.line2, [a?.postal_code, a?.city].filter(Boolean).join(" "), a?.state, a?.country].filter((x): x is string => !!x && x.trim() !== "");
  return {
    lang: s.locale === "en" ? "en" : "de",
    ref: pi.id,
    created: new Date(s.created * 1000),
    email: s.customer_details?.email ?? "",
    name: s.customer_details?.name || ship?.name || "",
    items: (s.line_items?.data ?? []).map((li) => ({ name: li.description ?? "", quantity: li.quantity ?? 1, amount: li.amount_total })),
    shipping: s.shipping_cost?.amount_total ?? 0,
    total: s.amount_total ?? 0,
    address,
    country: a?.country ?? "",
  };
}

export async function handleEvent(event: Stripe.Event, deps: Deps): Promise<Outcome> {
  if (!HANDLED.has(event.type)) return "ignored";
  const obj = event.data.object as Stripe.Checkout.Session;
  if (event.type === "checkout.session.completed" && obj.payment_status !== "paid") return "unpaid";

  const session = await deps.retrieveSession(obj.id);
  const pi = session.payment_intent;
  if (!pi || typeof pi === "string") throw new Error(`session ${session.id} has no expanded payment_intent`);
  if (pi.metadata?.zl_confirmation_sent) return "already-sent";

  const order = orderFromSession(session, pi);
  if (!order.email) return "no-email";
  const mail = orderMail(order);
  const sent = await deps.send({ to: { email: order.email, name: order.name || undefined }, ...mail });
  if (sent !== "sent") throw new Error(`order confirmation not sent (${sent})`); // non-200 → Stripe retries later
  await deps.markSent(pi.id, session.id, new Date().toISOString());
  return "sent";
}
