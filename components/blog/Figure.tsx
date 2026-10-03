/**
 * Image with caption and credit line for the article body (MDX building block).
 *
 * Plain <img>: article images have unknown dimensions. Landscape images fill the reading column; portrait
 * images are capped at 75 % of the viewport height and centred so a tall photo does not become a wall.
 * Optional width/height (intrinsic pixels) reserve the space and avoid layout shift. SVG works too
 * (e.g. /images/map-germany-eisenach.svg). Renders identically on the German fallback page: it is part of
 * the article body, which is the same component tree in both languages.
 */
export default function Figure({
  src,
  alt,
  caption,
  credit,
  width,
  height,
}: {
  src: string;
  alt: string;
  caption?: string;
  credit?: string;
  width?: number;
  height?: number;
}) {
  const portrait = width && height ? height > width : undefined;
  return (
    <figure className="not-prose my-8" data-orientation={portrait === undefined ? undefined : portrait ? "portrait" : "landscape"}>
      <div className="overflow-hidden rounded-2xl bg-ink/[0.04]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          className="mx-auto block h-auto max-h-[75vh] w-auto max-w-full"
        />
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
