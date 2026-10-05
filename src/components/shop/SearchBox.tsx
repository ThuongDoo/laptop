"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { formatVND } from "@/lib/format";

type Suggestion = { name: string; slug: string; image?: string; price: number };

const HOT = ["MacBook Air M1", "ThinkPad X1 Carbon", "Laptop gaming RTX 3050", "Dell Latitude", "Laptop dưới 10 triệu"];

export function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const box = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d) => setItems(d.items))
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const go = (term: string) => {
    setOpen(false);
    router.push(`/tim-kiem?q=${encodeURIComponent(term)}`);
  };
  const showSuggest = q.trim().length >= 2;

  return (
    <form
      ref={box}
      role="search"
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) go(q.trim());
      }}
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Bạn muốn tìm laptop gì? VD: ThinkPad i7 16GB"
        aria-label="Tìm kiếm sản phẩm"
        className="h-10 w-full rounded-lg border-0 bg-white pr-11 pl-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-brand-200"
      />
      <button type="submit" aria-label="Tìm kiếm" className="absolute top-0 right-0 flex h-10 w-11 items-center justify-center text-gray-500">
        <Search size={18} />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-11 z-50 overflow-hidden rounded-lg bg-white text-gray-800 shadow-xl ring-1 ring-black/10">
          {showSuggest ? (
            items.length ? (
              <ul>
                {items.map((it) => (
                  <li key={it.slug}>
                    <Link
                      href={`/${it.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50"
                    >
                      {it.image && <Image src={it.image} alt="" width={48} height={38} className="rounded object-cover" />}
                      <span className="flex-1 text-sm">{it.name}</span>
                      <span className="text-sm font-semibold text-brand-600">{formatVND(it.price)}</span>
                    </Link>
                  </li>
                ))}
                <li>
                  <button type="submit" className="w-full bg-gray-50 px-3 py-2 text-left text-sm text-brand-600 hover:underline">
                    Xem tất cả kết quả cho “{q.trim()}”
                  </button>
                </li>
              </ul>
            ) : (
              <p className="px-3 py-3 text-sm text-gray-500">Không có gợi ý – nhấn Enter để tìm “{q.trim()}”.</p>
            )
          ) : (
            <div className="p-3">
              <p className="mb-2 text-xs font-semibold text-gray-500 uppercase">Tìm kiếm phổ biến</p>
              <div className="flex flex-wrap gap-2">
                {HOT.map((h) => (
                  <button key={h} type="button" onClick={() => go(h)} className="chip text-xs">
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
