import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import WithdrawalForm from "@/components/shop/WithdrawalForm";
import { OWNER } from "@/lib/legal-entity";
import { requireShopOpen } from "@/lib/shop-gate";

export const metadata = { title: "Vertrag widerrufen — zauberlabs", robots: { index: false } };

/**
 * BL-084/BL-085 — „Vertrag widerrufen" (§ 356a BGB, required for online shops since 19 June 2026): a clearly labelled page
 * with the form; app/api/withdrawal sends the confirmation of receipt by e-mail at once (Brevo). The form is in German, like
 * the binding withdrawal notice. Hidden until launch.
 */
export default async function VertragWiderrufen({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  await requireShopOpen();
  return (
    <LegalPage lang={lang} title="Vertrag widerrufen">
      {lang === "en" && (
        <p className="italic">
          Withdraw from a purchase in our shop. The form is in German; enter your name, e-mail, the order or receipt number and, if you like, the order date and
          items, then press „Widerruf bestätigen“ (confirm withdrawal). You get a confirmation of receipt by e-mail at once.
        </p>
      )}
      <p>
        Hier kannst du einen Kaufvertrag aus unserem Shop widerrufen. Gib an, welche Bestellung du widerrufst, und bestätige mit „Widerruf bestätigen“. Du erhältst
        sofort eine Eingangsbestätigung per E-Mail mit dem Inhalt deiner Erklärung sowie Datum und Uhrzeit des Eingangs. Die Einzelheiten stehen in der{" "}
        <Link href={`/${lang}/widerrufsbelehrung`} className="underline">Widerrufsbelehrung</Link>.
      </p>
      <WithdrawalForm contact={OWNER.email} lang={lang} />
    </LegalPage>
  );
}
