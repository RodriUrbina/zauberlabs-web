/**
 * BL-084 — marks text that the legal-text provider (Händlerbund or IT-Recht Kanzlei, plan § 3) delivers before launch.
 * Rendered only where the shop is open (lib/shop-flag.ts); nothing with this marker may go live as it is.
 */
export default function ProviderPlaceholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-accent bg-paper p-4 text-sm text-ink">
      <p className="eyebrow mb-2 text-[11px] text-accent">Platzhalter · Text vom Rechtstexte-Anbieter folgt vor dem Start</p>
      {children}
    </div>
  );
}
