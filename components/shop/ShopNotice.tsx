import Link from "next/link";
import { Arrow } from "@/components/Icons";
import type { Locale } from "@/lib/i18n";

/** BL-084 — the success and cancel pages' one message and the way back to the shop. */
export default function ShopNotice({ lang, title, body, back }: { lang: Locale; title: string[]; body: string; back: string }) {
  return (
    <div className="flex max-w-[640px] flex-col gap-5">
      <h1 className="text-[40px] leading-none font-extrabold tracking-[-0.035em] md:text-[56px]">
        {title[0]}
        <span className="accent-serif text-accent">{title[1]}</span>
      </h1>
      <p className="text-lg text-body">{body}</p>
      <Link href={`/${lang}/shop`} className="flex h-12 w-fit items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-semibold text-paper hover:bg-black">
        {back} <Arrow className="size-[18px]" />
      </Link>
    </div>
  );
}
