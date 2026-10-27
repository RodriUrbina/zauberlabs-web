import LegalPage from "@/components/LegalPage";
import WithdrawalForm from "@/components/shop/WithdrawalForm";
import { requireShopOpen } from "@/lib/shop-gate";

export const metadata = { title: "Vertrag widerrufen — zauberlabs", robots: { index: false } };

/**
 * BL-084 — "Vertrag widerrufen" (§ 356a BGB, required for online shops since 19 June 2026; plan § 3 #4): a clearly labelled
 * page with a form and an immediate confirmation of receipt. Hidden until launch; the e-mail confirmation is a TODO
 * (app/api/withdrawal/route.ts) and must work before SHOP_LAUNCHED is switched on.
 */
export default async function VertragWiderrufen({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  await requireShopOpen();
  return (
    <LegalPage lang={lang} title="Vertrag widerrufen">
      {lang === "en" && <p className="italic">This page is provided in German.</p>}
      <p>
        Hier kannst du einen Kaufvertrag aus unserem Shop widerrufen. Gib an, welche Bestellung du widerrufst, und bestätige mit „Widerruf
        bestätigen“. Du erhältst sofort eine Eingangsbestätigung per E-Mail.
      </p>
      <WithdrawalForm />
    </LegalPage>
  );
}
