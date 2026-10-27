/**
 * The site owner's legal details (Impressum § 5 DDG). Moved here from app/[lang]/impressum/page.tsx (BL-084) so the shop's
 * GPSR block (lib/shop-products.ts) names the same manufacturer/seller without a second copy.
 */
export const OWNER = {
  name: "Alvaro Hernandez", // or company name incl. legal form, e.g. "Zauberlabs UG (haftungsbeschränkt)"
  street: "Anton-Wilhelm-Amo-Straße 50",
  city: "10117 Berlin",
  country: "Deutschland",
  email: "hello@zauberlabs.de",
  phone: "+49 151 67067 413", // § 5 DDG: a second fast contact channel besides email
  vatId: "DE452363836", // optional: "DE123456789" — leave empty if you have none
  register: "", // optional, only for registered companies: "Amtsgericht [ORT], HRB [NUMMER]"
  representative: "", // optional, only for companies: "Geschäftsführer: [NAME]"
};
