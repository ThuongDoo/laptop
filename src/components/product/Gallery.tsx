"use client";

import { useState } from "react";
import Image from "next/image";
import { PlayCircle } from "lucide-react";

type Img = { url: string; alt: string };

function youtubeId(url: string) {
  return url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/)?.[1];
}

export function Gallery({ images, videoUrl, badge }: { images: Img[]; videoUrl?: string | null; badge?: string }) {
  const vid = videoUrl ? youtubeId(videoUrl) : undefined;
  const total = images.length + (vid ? 1 : 0);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const isVideo = vid && active === images.length;

  return (
    <div>
      <div className="relative aspect-[5/4] overflow-hidden rounded-xl bg-gray-50">
        {isVideo ? (
          playing ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube.com/embed/${vid}?autoplay=1`}
              title="Video sản phẩm"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button onClick={() => setPlaying(true)} className="absolute inset-0" aria-label="Phát video">
              <Image src={`https://i.ytimg.com/vi/${vid}/hqdefault.jpg`} alt="Video review" fill className="object-cover" unoptimized />
              <PlayCircle size={64} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-lg" />
            </button>
          )
        ) : (
          images[active] && (
            <Image
              src={images[active].url}
              alt={images[active].alt}
              fill
              loading={active === 0 ? "eager" : "lazy"}
              fetchPriority={active === 0 ? "high" : "auto"}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain"
            />
          )
        )}
        {badge && !isVideo && (
          <span className="absolute top-3 left-3 rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">{badge}</span>
        )}
        <span className="absolute right-3 bottom-3 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
          {active + 1}/{total}
        </span>
      </div>
      {total > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setActive(i)}
              aria-label={`Xem ảnh ${i + 1}`}
              className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-50 ring-2 ${active === i ? "ring-brand-600" : "ring-transparent"}`}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-contain" />
            </button>
          ))}
          {vid && (
            <button
              onClick={() => setActive(images.length)}
              aria-label="Xem video"
              className={`flex h-16 w-20 shrink-0 flex-col items-center justify-center rounded-lg bg-gray-900 text-xs text-white ring-2 ${isVideo ? "ring-brand-600" : "ring-transparent"}`}
            >
              <PlayCircle size={22} /> Video
            </button>
          )}
        </div>
      )}
    </div>
  );
}
