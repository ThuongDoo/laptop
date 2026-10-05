import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { X } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { hasActiveFilters, listProducts, type Filters, type SearchParams } from "@/lib/catalog";
import { CONDITIONS, CPU_FAMILIES, PRICE_RANGES, RAM_OPTIONS, SCREEN_OPTIONS, SORTS, STORAGE_OPTIONS } from "@/lib/constants";
import { ProductGrid } from "./ProductCard";
import { FilterDrawer } from "./FilterDrawer";

type Props = {
  path: string;
  filters: Filters;
  searchParams: SearchParams;
  base?: Prisma.ProductWhereInput;
  hide?: ("brand" | "need")[];
};

/** Tạo URL bật/tắt một giá trị lọc, giữ nguyên các tham số khác và reset trang. */
function toggleHref(path: string, sp: SearchParams, key: string, value: string, multi: boolean) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (v != null && k !== "trang") q.set(k, Array.isArray(v) ? v.join(",") : v);
  const current = (q.get(key) || "").split(",").filter(Boolean);
  let next: string[];
  if (multi) next = current.includes(value) ? current.filter((x) => x !== value) : [...current, value];
  else next = current.includes(value) ? [] : [value];
  if (next.length) q.set(key, next.join(","));
  else q.delete(key);
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}

function pageHref(path: string, sp: SearchParams, page: number) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (v != null && k !== "trang") q.set(k, Array.isArray(v) ? v.join(",") : v);
  if (page > 1) q.set("trang", String(page));
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}

export async function Listing({ path, filters: f, searchParams: sp, base, hide = [] }: Props) {
  const [{ items, total, pages }, brands, needs] = await Promise.all([
    listProducts(f, base),
    hide.includes("brand") ? [] : prisma.brand.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true, slug: true } }),
    hide.includes("need") ? [] : prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true, slug: true } }),
  ]);

  const groups: { title: string; key: string; multi: boolean; options: { value: string; label: string }[]; active: string[] }[] = [
    { title: "Thương hiệu", key: "hang", multi: true, options: brands.map((b) => ({ value: b.slug, label: b.name })), active: f.brand },
    { title: "Mức giá", key: "gia", multi: false, options: PRICE_RANGES.map((p) => ({ value: p.key, label: p.label })), active: f.price ? [f.price] : [] },
    { title: "Nhu cầu sử dụng", key: "nhu-cau", multi: true, options: needs.map((n) => ({ value: n.slug, label: n.name.replace("Laptop ", "") })), active: f.need },
    { title: "CPU", key: "cpu", multi: true, options: Object.entries(CPU_FAMILIES).filter(([k]) => k !== "other").map(([value, label]) => ({ value, label })), active: f.cpu },
    { title: "RAM", key: "ram", multi: true, options: RAM_OPTIONS.map((r) => ({ value: String(r), label: `${r}GB` })), active: f.ram.map(String) },
    { title: "Ổ cứng SSD", key: "o-cung", multi: true, options: STORAGE_OPTIONS.map((s) => ({ value: String(s), label: s >= 1024 ? `${s / 1024}TB` : `${s}GB` })), active: f.ssd.map(String) },
    { title: "Card màn hình", key: "vga", multi: false, options: [{ value: "roi", label: "Card rời" }, { value: "onboard", label: "Onboard" }], active: f.gpu ? [f.gpu] : [] },
    { title: "Kích thước màn hình", key: "man-hinh", multi: true, options: SCREEN_OPTIONS.map((s) => ({ value: s.key, label: s.label })), active: f.screen },
    { title: "Tình trạng máy", key: "tinh-trang", multi: true, options: Object.entries(CONDITIONS).map(([value, label]) => ({ value, label })), active: f.condition },
  ].filter((g) => g.options.length);

  const activeChips = groups.flatMap((g) =>
    g.active.map((a) => ({ label: g.options.find((o) => o.value === a)?.label ?? a, href: toggleHref(path, sp, g.key, a, g.multi) })),
  );
  const sortHref = (s: string) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (v != null && k !== "trang" && k !== "sx") q.set(k, Array.isArray(v) ? v.join(",") : v);
    if (s !== "moi") q.set("sx", s);
    const str = q.toString();
    return str ? `${path}?${str}` : path;
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <FilterDrawer count={activeChips.length}>
        <div className="space-y-5">
          {groups.map((g) => (
            <section key={g.key}>
              <h2 className="mb-2 text-sm font-semibold text-gray-900">{g.title}</h2>
              <div className="flex flex-wrap gap-2">
                {g.options.map((o) => {
                  const on = g.active.includes(o.value);
                  return (
                    <Link
                      key={o.value}
                      href={toggleHref(path, sp, g.key, o.value, g.multi)}
                      rel="nofollow"
                      scroll={false}
                      className={`chip text-xs ${on ? "chip-active" : ""}`}
                      aria-pressed={on}
                    >
                      {o.label}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </FilterDrawer>

      <div className="min-w-0">
        <div className="card mb-4 flex flex-wrap items-center gap-2 p-3">
          <span className="text-sm text-gray-600">
            <b className="text-gray-900">{total}</b> sản phẩm
          </span>
          <div className="no-scrollbar ml-auto flex gap-2 overflow-x-auto">
            {Object.entries(SORTS).map(([k, label]) => (
              <Link key={k} href={sortHref(k)} rel="nofollow" scroll={false} className={`chip shrink-0 text-xs ${f.sort === k ? "chip-active" : ""}`}>
                {label}
              </Link>
            ))}
          </div>
          {hasActiveFilters(f) && (
            <div className="flex w-full flex-wrap items-center gap-2 border-t border-gray-100 pt-2">
              <span className="text-xs text-gray-500">Đang lọc:</span>
              {activeChips.map((c) => (
                <Link key={c.href + c.label} href={c.href} scroll={false} className="chip chip-active gap-1 text-xs">
                  {c.label} <X size={12} />
                </Link>
              ))}
              <Link href={f.q ? `${path}?q=${encodeURIComponent(f.q)}` : path} className="text-xs text-brand-600 underline">
                Xóa tất cả
              </Link>
            </div>
          )}
        </div>

        {items.length ? (
          <ProductGrid items={items} priorityCount={4} />
        ) : (
          <div className="card p-10 text-center text-gray-600">
            <p className="font-semibold">Không tìm thấy sản phẩm phù hợp.</p>
            <p className="mt-1 text-sm">Thử bỏ bớt bộ lọc hoặc gọi hotline để được tư vấn máy đang về.</p>
          </div>
        )}

        {pages > 1 && (
          <nav aria-label="Phân trang" className="mt-6 flex justify-center gap-1.5">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={pageHref(path, sp, n)}
                aria-current={n === f.page ? "page" : undefined}
                className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium ${
                  n === f.page ? "bg-brand-600 text-white" : "bg-white text-gray-700 ring-1 ring-gray-200 hover:ring-brand-500"
                }`}
              >
                {n}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
