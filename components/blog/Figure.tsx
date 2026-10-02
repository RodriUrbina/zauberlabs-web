/** Image with caption for the article body. Plain <img>: article images have unknown dimensions. */
export default function Figure({ src, alt, caption, credit }: { src: string; alt: string; caption?: string; credit?: string }) {
  return (
    <figure className="not-prose my-8">
      <div className="overflow-hidden rounded-2xl bg-ink">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" decoding="async" className="block h-auto w-full" />
      </div>
      {(caption || credit) && (
        <figcaption className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-[13px] leading-relaxed text-muted">
          {caption && <span>{caption}</span>}
          {credit && <span className="font-mono text-[11px] tracking-[0.06em]">{credit}</span>}
        </figcaption>
      )}
    </figure>
  );
}
