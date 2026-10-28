import { OWNER } from "./legal-entity";

/**
 * BL-085/BL-090 — transactional e-mail through Brevo's API (Datenschutz § 12/§ 15), shared by the withdrawal confirmation and
 * the order confirmation: sender SHOP_MAIL_FROM (default hello@zauberlabs.de, a verified Brevo sender), a bcc copy and the
 * reply-to address are ours. Env: BREVO_API_KEY (required; never logged), BREVO_API_URL (only for local tests).
 * Returns "no-key" when the key is missing, "refused" when Brevo (or the network) did not accept the mail.
 */
export async function sendBrevoMail(mail: { to: { email: string; name?: string }; subject: string; text: string; html?: string }): Promise<"sent" | "no-key" | "refused"> {
  const key = process.env.BREVO_API_KEY;
  if (!key) return "no-key";
  const res = await fetch(process.env.BREVO_API_URL || "https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: "zauberlabs", email: process.env.SHOP_MAIL_FROM || OWNER.email },
      to: [mail.to.name ? { email: mail.to.email, name: mail.to.name } : { email: mail.to.email }],
      bcc: [{ email: OWNER.email }],
      replyTo: { email: OWNER.email },
      subject: mail.subject,
      textContent: mail.text,
      ...(mail.html ? { htmlContent: mail.html } : {}),
    }),
  }).catch(() => null);
  return res?.ok ? "sent" : "refused";
}
