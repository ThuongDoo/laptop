import { Phone } from "lucide-react";
import type { Settings } from "@/lib/settings";

/** Nút Gọi điện / Zalo / Messenger luôn ghim góc phải màn hình (mobile & desktop). */
export function FloatingContact({ s }: { s: Settings }) {
  const tel = s.hotline.replace(/\s/g, "");
  return (
    <div className="no-print fixed right-3 bottom-4 z-40 flex flex-col items-end gap-3 md:right-5 md:bottom-6">
      <a
        href={`https://m.me/${s.messenger}`}
        target="_blank"
        rel="noopener nofollow"
        aria-label="Chat Messenger"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-fuchsia-500 text-white shadow-lg transition hover:scale-110"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17.16.14.26.35.27.57l.05 1.78c.02.57.6.94 1.12.71l1.98-.87c.17-.07.36-.09.53-.04.91.25 1.88.38 2.91.38 5.64 0 10-4.13 10-9.7S17.64 2 12 2zm6 7.46-2.94 4.66c-.47.74-1.47.93-2.17.4l-2.34-1.75a.6.6 0 0 0-.72 0l-3.16 2.4c-.42.32-.97-.18-.69-.63l2.94-4.66c.47-.74 1.47-.93 2.17-.4l2.34 1.75a.6.6 0 0 0 .72 0l3.16-2.4c.42-.32.97.18.69.63z" />
        </svg>
      </a>
      <a
        href={`https://zalo.me/${s.zalo}`}
        target="_blank"
        rel="noopener nofollow"
        aria-label="Chat Zalo"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0068ff] text-xs font-bold text-white shadow-lg transition hover:scale-110"
      >
        Zalo
      </a>
      <a
        href={`tel:${tel}`}
        aria-label={`Gọi ${s.hotline}`}
        className="flex items-center gap-2 rounded-full bg-brand-600 py-3 pr-4 pl-3 text-white shadow-lg ring-4 ring-brand-200 transition hover:bg-brand-700"
      >
        <Phone size={22} className="animate-pulse" />
        <span className="hidden text-sm font-bold sm:inline">{s.hotline}</span>
      </a>
    </div>
  );
}
