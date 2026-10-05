"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Banner = { id: string; title: string; subtitle: string | null; image: string; link: string | null };

export function BannerSlider({ banners }: { banners: Banner[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const paused = useRef(false);

  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    const n = (i + banners.length) % banners.length;
    el.scrollTo({ left: n * el.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => {
      if (!paused.current) goTo(index + 1);
    }, 5000);
    return () => clearInterval(t);
  });

  if (!banners.length) return null;

  return (
    <div
      className="group relative overflow-hidden rounded-xl"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      <div
        ref={track}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
      >
        {banners.map((b, i) => {
          const inner = (
            <>
              <Image
                src={b.image}
                alt={b.title}
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                className="object-cover"
              />
              <div className="absolute inset-0 flex flex-col justify-center gap-2 bg-gradient-to-r from-black/45 to-transparent p-5 text-white md:p-10">
                <p className="max-w-[65%] text-lg leading-tight font-bold md:text-3xl">{b.title}</p>
                {b.subtitle && <p className="max-w-[60%] text-xs md:text-base">{b.subtitle}</p>}
                {b.link && <span className="mt-2 w-fit rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-brand-600 md:text-sm">Xem ngay</span>}
              </div>
            </>
          );
          return (
            <div key={b.id} className="relative aspect-[8/3] w-full shrink-0 snap-start">
              {b.link ? (
                <Link href={b.link}>
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </div>
          );
        })}
      </div>
      {banners.length > 1 && (
        <>
          <button
            aria-label="Banner trước"
            onClick={() => goTo(index - 1)}
            className="absolute top-1/2 left-2 hidden -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-gray-800 shadow group-hover:block"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            aria-label="Banner sau"
            onClick={() => goTo(index + 1)}
            className="absolute top-1/2 right-2 hidden -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-gray-800 shadow group-hover:block"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute inset-x-0 bottom-0 flex justify-center">
            {banners.map((b, i) => (
              <button key={b.id} aria-label={`Banner ${i + 1}`} onClick={() => goTo(i)} className="flex h-6 min-w-6 items-center justify-center">
                <span className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-1.5 bg-white/60"}`} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
