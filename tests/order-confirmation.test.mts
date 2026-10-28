import { test, describe } from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import { handleEvent, type Deps } from "../lib/order-confirmation";
import { adjustmentOf, orderMail, vatIn } from "../lib/order-mail";
import { agb } from "../lib/legal/agb";
import { widerruf } from "../lib/legal/widerruf";
import { clausesText, blocksText } from "../lib/legal/blocks";

const SECRET = "whsec_test_dummy_not_real";

/** A paid Checkout Session as Stripe returns it (expanded), trimmed to what we read. */
function session(over: Partial<Record<string, unknown>> = {}, piMeta: Record<string, string> = {}) {
  return {
    id: "cs_test_123",
    object: "checkout.session",
    payment_status: "paid",
    locale: "de",
    created: 1793091600, // 2026-10-28 08:00 UTC
    amount_total: 2180, // = lines (1690 + 490) + shipping (0)
    shipping_cost: { amount_total: 0 },
    customer_details: { email: "erika@example.org", name: "Erika Muster" },
    collected_information: { shipping_details: { name: "Erika Muster", address: { line1: "Musterweg 1", line2: null, postal_code: "10115", city: "Berlin", state: null, country: "DE" } } },
    line_items: { data: [
      { description: "Sticker-Set: alle 4 Motive (Limousine Japanrot, Touring Laguna-seca Blau, Cabrio Jetschwarz, M3 Phönixgelb)", quantity: 1, amount_subtotal: 1690, amount_total: 1690 },
      { description: "Sticker: M3 Phönixgelb", quantity: 1, amount_subtotal: 490, amount_total: 490 },
    ] },
    payment_intent: { id: "pi_test_456", object: "payment_intent", metadata: piMeta },
    ...over,
  } as unknown as Stripe.Checkout.Session;
}

const event = (type: string, obj: Record<string, unknown>) => ({ id: "evt_1", type, data: { object: obj } }) as unknown as Stripe.Event;

/** Fake Stripe + Brevo: the PaymentIntent metadata lives in memory, like Stripe would keep it. */
function fakes(start: Stripe.Checkout.Session = session()) {
  const piMeta: Record<string, string> = { ...((start.payment_intent as Stripe.PaymentIntent).metadata ?? {}) };
  const mails: { to: { email: string }; subject: string; text: string; html?: string }[] = [];
  const marks: string[] = [];
  const deps: Deps = {
    retrieveSession: async () => ({ ...start, payment_intent: { ...(start.payment_intent as Stripe.PaymentIntent), metadata: { ...piMeta } } }) as Stripe.Checkout.Session,
    markSent: async (pi, sessionId, at) => { piMeta.zl_confirmation_sent = at; marks.push(`${pi}|${sessionId}`); },
    send: async (m) => { mails.push(m); return "sent"; },
  };
  return { deps, mails, marks };
}

describe("order confirmation (BL-090)", () => {
  test("the same paid event twice → exactly one e-mail; the PaymentIntent is marked once", async () => {
    const f = fakes();
    const e = event("checkout.session.completed", { id: "cs_test_123", payment_status: "paid" });
    assert.equal(await handleEvent(e, f.deps), "sent");
    assert.equal(await handleEvent(e, f.deps), "already-sent");
    assert.equal(f.mails.length, 1);
    assert.deepEqual(f.marks, ["pi_test_456|cs_test_123"]);
    assert.equal(f.mails[0].to.email, "erika@example.org");
    assert.equal(f.mails[0].subject, "Deine Bestellung bei zauberlabs (pi_test_456)");
  });

  test("unpaid sessions and other events send nothing; async_payment_succeeded sends", async () => {
    const f = fakes();
    assert.equal(await handleEvent(event("checkout.session.completed", { id: "cs_test_123", payment_status: "unpaid" }), f.deps), "unpaid");
    assert.equal(await handleEvent(event("customer.created", { id: "cus_1" }), f.deps), "ignored");
    assert.equal(f.mails.length, 0);
    assert.equal(await handleEvent(event("checkout.session.async_payment_succeeded", { id: "cs_test_123", payment_status: "paid" }), f.deps), "sent");
    assert.equal(f.mails.length, 1);
  });

  test("Brevo refusing → throws (the route answers 500, Stripe retries) and nothing is marked", async () => {
    const f = fakes();
    f.deps.send = async () => "refused";
    await assert.rejects(handleEvent(event("checkout.session.completed", { id: "cs_test_123", payment_status: "paid" }), f.deps));
    assert.equal(f.marks.length, 0);
  });

  test("the e-mail (text + HTML): order details from Stripe that add up, address, delivery time, links per locale; no legal clause text in the body", () => {
    const f = fakes();
    return handleEvent(event("checkout.session.completed", { id: "cs_test_123", payment_status: "paid" }), f.deps).then(() => {
      const t = f.mails[0].text.replace(/\u00a0/g, " "); // amounts use Intl's non-breaking space
      for (const part of [
        "Bestellnummer: pi_test_456",
        "- 1 × Sticker-Set: alle 4 Motive (Limousine Japanrot, Touring Laguna-seca Blau, Cabrio Jetschwarz, M3 Phönixgelb) — 16,90 €",
        "- 1 × Sticker: M3 Phönixgelb — 4,90 €",
        "Versand: kostenlos",
        `Gesamt: 21,80 € (inkl. 19 % MwSt.: 3,48 €)`,
        "Musterweg 1\n10115 Berlin\nDeutschland",
        "Lieferzeit: 3–5 Werktage",
        "AGB: https://www.zauberlabs.de/de/agb",
        "Widerrufsbelehrung: https://www.zauberlabs.de/de/widerrufsbelehrung",
        "Vertrag widerrufen: https://www.zauberlabs.de/de/vertrag-widerrufen",
        "Danke für deinen Kauf!",
        "Von E46-Fans für E46-Fans – danke, dass du dabei bist.",
      ]) assert.ok(t.includes(part), part);
      const h = (f.mails[0].html ?? "").replace(/\u00a0/g, " ");
      for (const part of [
        "1 × Sticker-Set: alle 4 Motive (Limousine Japanrot, Touring Laguna-seca Blau, Cabrio Jetschwarz, M3 Phönixgelb)", "16,90 €", "4,90 €", "kostenlos", "21,80 €", "inkl. 19 % MwSt.: 3,48 €",
        'href="https://www.zauberlabs.de/de/agb"', 'href="https://www.zauberlabs.de/de/widerrufsbelehrung"', 'href="https://www.zauberlabs.de/de/vertrag-widerrufen"',
        'src="https://www.zauberlabs.de/email/spark.png"', "zauber<span",
      ]) assert.ok(h.includes(part), `html: ${part}`);
      // PO 2026-10-28: links only — no legal clause text, no "Kaufvertrag", no 14-day sentence in the body.
      for (const body of [t, h]) {
        assert.ok(!body.includes("Geltungsbereich und Vertragspartner") && !body.includes("Sie haben das Recht, binnen vierzehn Tagen"), "no AGB/Widerruf text");
        assert.ok(!body.includes(clausesText(agb("de").clauses).slice(0, 80)) && !body.includes(blocksText(widerruf("de").blocks).slice(0, 80)));
        assert.ok(!/Kaufvertrag|innerhalb von 14 Tagen/.test(body));
      }
      assert.ok(!/Rabatt\/Anpassung/.test(t), "a consistent order has no adjustment line");
      assert.equal(vatIn(2180), 348, "the VAT line is 19/119 of the total");
    });
  });

  test("English e-mail: EN links, EU delivery time, no binding note, no contract wording; HTML adds up", () => {
    const { subject, text, html } = orderMail({ lang: "en", ref: "pi_1", created: new Date(1793091600000), email: "a@b.de", name: "A", items: [{ name: "Sticker: Sedan Japan Red", quantity: 2, amount: 980 }], shipping: 690, total: 1670, address: ["A", "Rue 1", "75001 Paris", "France"], country: "FR" });
    assert.equal(subject, "Your zauberlabs order (pi_1)");
    const t = text.replace(/\u00a0/g, " ");
    for (const part of ["Thanks for your purchase!", "- 2 × Sticker: Sedan Japan Red — €9.80", "Shipping: €6.90", "Total: €16.70 (incl. 19 % VAT: €2.67)", "7–14 working days",
      "Terms: https://www.zauberlabs.de/en/agb", "Withdrawal information: https://www.zauberlabs.de/en/widerrufsbelehrung", "Withdraw from contract: https://www.zauberlabs.de/en/vertrag-widerrufen",
      "From one E46 fan to another – thanks for being part of it."]) assert.ok(t.includes(part), part);
    assert.ok(!/binding|convenience translation|purchase contract/i.test(text + html));
    assert.ok(html.includes('href="https://www.zauberlabs.de/en/agb"') && html.includes("€16.70"));
    assert.ok(!html.includes("Scope and seller"), "no EN AGB text");
  });

  test("webhook route: missing secret → 503; bad signature → 400; a valid signature on an unrelated event → 200 without any API call", async () => {
    const { POST } = await import("../app/api/stripe/webhook/route");
    const env = { ...process.env };
    const payload = JSON.stringify({ id: "evt_1", object: "event", type: "customer.created", data: { object: { id: "cus_1" } } });
    const call = (sig: string) => POST(new Request("https://www.zauberlabs.de/api/stripe/webhook", { method: "POST", headers: { "stripe-signature": sig }, body: payload }));
    try {
      delete process.env.STRIPE_WEBHOOK_SECRET;
      process.env.STRIPE_SECRET_KEY = "sk_test_not_a_real_key";
      assert.equal((await call("t=1,v1=x")).status, 503);
      process.env.STRIPE_WEBHOOK_SECRET = SECRET;
      assert.equal((await call("t=1,v1=deadbeef")).status, 400);
      const good = new Stripe("sk_test_not_a_real_key").webhooks.generateTestHeaderString({ payload, secret: SECRET });
      const res = await call(good);
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), { received: true, outcome: "ignored" });
      const wrongSecret = new Stripe("sk_test_not_a_real_key").webhooks.generateTestHeaderString({ payload, secret: "whsec_other" });
      assert.equal((await call(wrongSecret)).status, 400);
    } finally {
      process.env = env;
    }
  });
  test("a Stripe discount shows as its own line, so the mail adds up to Stripe's total (never recomputed)", async () => {
    // A 10 % promo code: lines keep their pre-discount subtotal, Stripe's amount_total is lower, total_details.amount_discount > 0.
    const disc = session({
      amount_total: 1962, // 2180 − 218
      total_details: { amount_discount: 218, amount_shipping: 0, amount_tax: 0 },
      line_items: { data: [
        { description: "Sticker-Set: alle 4 Motive (Limousine Japanrot, Touring Laguna-seca Blau, Cabrio Jetschwarz, M3 Phönixgelb)", quantity: 1, amount_subtotal: 1690, amount_total: 1521 },
        { description: "Sticker: M3 Phönixgelb", quantity: 1, amount_subtotal: 490, amount_total: 441 },
      ] },
    });
    const f = fakes(disc);
    await handleEvent(event("checkout.session.completed", { id: "cs_test_123", payment_status: "paid" }), f.deps);
    const t = f.mails[0].text.replace(/\u00a0/g, " ");
    for (const part of ["— 16,90 €", "— 4,90 €", "Versand: kostenlos", "Rabatt/Anpassung: −2,18 €", "Gesamt: 19,62 € (inkl. 19 % MwSt.: 3,13 €)"]) assert.ok(t.includes(part), part);
    assert.equal(adjustmentOf({ items: [{ name: "a", quantity: 1, amount: 1690 }, { name: "b", quantity: 1, amount: 490 }], shipping: 0, total: 1962 }), -218);
    assert.equal(1690 + 490 + 0 - 218, 1962, "items + shipping + adjustment = total (cents)");
  });
});
