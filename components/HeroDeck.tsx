import Image from "next/image";
import { ArrowUpRight } from "@/components/Icons";

type Side = {
  num: string;
  make: string;
  model: string;
  accent: string;
  line: readonly string[];
  img: string;
  alt: string;
};

type Props = {
  href: string;
  live: string;
  soon: string;
  e46Line: readonly string[];
  e46Alt: string;
  left: Side;
  right: Side;
};

function SideCard({ side, soon, pos }: { side: Side; soon: string; pos: "left" | "right" }) {
  return (
    <div className={`deck-card deck-side deck-${pos}`} aria-hidden="true">
      <div className={`deck-studio deck-studio-${pos}`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={side.img} alt="" className="deck-car" draggable={false} />
      <div className="deck-fade" />
      <div className="deck-top">
        <span className="deck-status">
          {pos === "left" && <span className="deck-dot deck-dot-soon" />}
          {soon} · {side.num}
          {pos === "right" && <span className="deck-dot deck-dot-soon" />}
        </span>
        <span className="deck-make">{side.make}</span>
      </div>
      <div className="deck-bottom">
        <span className="deck-wm">
          {side.model}
          <span style={{ color: side.accent }}>BUILD</span>
        </span>
        <span className="deck-sub">
          {side.line[0]}
          <span className="accent-serif deck-serif">{side.line[1]}</span>
        </span>
      </div>
    </div>
  );
}

export default function HeroDeck({ href, live, soon, e46Line, e46Alt, left, right }: Props) {
  return (
    <div className="deck-wrap">
    <div className="deck">
      <SideCard side={left} soon={soon} pos="left" />
      <SideCard side={right} soon={soon} pos="right" />

      <a href={href} className="deck-card deck-center group" aria-label={`E46BUILD — ${live}`}>
        <div className="deck-photo">
          <Image
            src="/images/hero.jpg"
            alt={e46Alt}
            fill
            priority
            sizes="(min-width: 1024px) 320px, 60vw"
            className="object-cover object-[70%_50%] transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
        <div className="deck-photo-fade" />
        <div className="deck-top">
          <span className="deck-status">
            <span className="deck-dot deck-dot-live" />
            {live}
          </span>
          <span className="deck-make">BMW · 1998–2006</span>
        </div>
        <div className="deck-bottom deck-bottom-center">
          <span className="deck-wm">
            E46<span className="text-e46">BUILD</span>
          </span>
          <span className="deck-sub">
            {e46Line[0]}
            <span className="accent-serif deck-serif">{e46Line[1]}</span>
          </span>
        </div>
        <span className="deck-arrow">
          <ArrowUpRight className="size-[1.25em]" />
        </span>
      </a>
    </div>
    </div>
  );
}
