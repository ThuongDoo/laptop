import Link from "next/link";
import Image from "next/image";
import { Cpu, MonitorSmartphone, MemoryStick, Gift } from "lucide-react";
import { bestVariant, type CardProduct } from "@/lib/catalog";
import { CONDITIONS, STOCK_STATUS } from "@/lib/constants";
import { discountPercent, formatVND } from "@/lib/format";

export function ProductCard({ p, priority = false }: { p: CardProduct; priority?: boolean }) {
  const v = bestVariant(p.variants);
  const price = v ? (v.salePrice ?? v.price) : 0;
  const pct = v ? discountPercent(v.price, v.salePrice) : 0;
  const img = p.images[0];
  const allOut = p.variants.every((x) => x.stockStatus === "OUT_OF_STOCK");
  const incoming = !allOut && p.variants.every((x) => x.stockStatus !== "IN_STOCK");

  return (
    <article className="group card relative flex flex-col overflow-hidden transition hover:shadow-md hover:ring-brand-200">
      <Link href={`/${p.slug}`} className="relative block aspect-[5/4] bg-gray-50">
        {img && (
          <Image
            src={img.url}
            alt={img.alt || p.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-2 transition group-hover:scale-105"
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
          />
        )}
        {pct > 0 && (
          <span className="absolute top-2 left-2 rounded-md bg-brand-600 px-1.5 py-0.5 text-xs font-bold text-white">-{pct}%</span>
        )}
        <span className="absolute top-2 right-2 rounded-md bg-emerald-600/90 px-1.5 py-0.5 text-[11px] font-semibold text-white">
          {CONDITIONS[p.condition]?.replace(/ \(.*\)/, "")}
        </span>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold text-gray-900">
          <Link href={`/${p.slug}`} className="hover:text-brand-600">
            {p.name}
          </Link>
        </h3>
        <ul className="space-y-1 text-xs text-gray-600">
          <li className="flex items-center gap-1.5">
            <Cpu size={13} className="shrink-0 text-gray-400" />
            <span className="line-clamp-1">{p.cpu.split(" (")[0]}</span>
          </li>
          {v && (
            <li className="flex items-center gap-1.5">
              <MemoryStick size={13} className="shrink-0 text-gray-400" />
              {p.variants.length > 1 ? `${p.variants.length} phiên bản RAM/SSD` : v.name}
            </li>
          )}
          <li className="flex items-center gap-1.5">
            <MonitorSmartphone size={13} className="shrink-0 text-gray-400" />
            <span className="line-clamp-1">{p.gpuType === "discrete" ? p.gpu : p.screen.split(",")[0]}</span>
          </li>
        </ul>
        <div className="mt-auto">
          {pct > 0 && <p className="text-xs text-gray-500 line-through">{formatVND(v!.price)}</p>}
          <p className="text-lg font-bold text-brand-600">{price ? formatVND(price) : "Liên hệ"}</p>
          {allOut ? (
            <p className="text-xs font-medium text-gray-500">{STOCK_STATUS.OUT_OF_STOCK}</p>
          ) : incoming ? (
            <p className="text-xs font-medium text-amber-600">{STOCK_STATUS.INCOMING}</p>
          ) : (
            p.gifts && (
              <p className="flex items-center gap-1 text-xs text-gray-600">
                <Gift size={13} className="text-brand-600" /> <span className="line-clamp-1">{p.gifts.split("\n")[0]}</span>
              </p>
            )
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ items, priorityCount = 0 }: { items: CardProduct[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 md:gap-4">
      {items.map((p, i) => (
        <ProductCard key={p.id} p={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
