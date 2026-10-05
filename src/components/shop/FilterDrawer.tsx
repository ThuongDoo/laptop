"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

/** Bộ lọc: sidebar trên desktop, ngăn kéo trên mobile. Nội dung lọc là link server-render (crawl được). */
export function FilterDrawer({ children, count }: { children: React.ReactNode; count: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost w-full lg:hidden">
        <SlidersHorizontal size={16} /> Bộ lọc {count > 0 && <span className="rounded-full bg-brand-600 px-1.5 text-xs text-white">{count}</span>}
      </button>
      <aside
        className={`${open ? "fixed inset-0 z-50 overflow-y-auto bg-white p-4" : "hidden"} lg:static lg:z-auto lg:block lg:self-start lg:overflow-visible lg:rounded-xl lg:p-4 lg:shadow-sm lg:ring-1 lg:ring-black/5`}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setOpen(false);
        }}
      >
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <span className="text-lg font-bold">Bộ lọc</span>
          <button onClick={() => setOpen(false)} aria-label="Đóng bộ lọc">
            <X />
          </button>
        </div>
        {children}
      </aside>
    </>
  );
}
