import Link from "next/link";
import Image from "next/image";
import type { Prisma } from "@prisma/client";
import { BadgeCheck, BatteryCharging, Gift, Package, ShieldCheck, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { bestVariant, cardSelect, effectivePrice } from "@/lib/catalog";
import { CONDITIONS, STOCK_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { getSettings, siteUrl } from "@/lib/settings";
import { JsonLd, absolute } from "@/lib/seo";
import type { productInclude } from "@/lib/routing";
import { Breadcrumbs } from "@/components/shop/Breadcrumbs";
import { ProductGrid } from "@/components/shop/ProductCard";
import { Policies } from "@/components/shop/Policies";
import { Stars } from "@/components/shop/Stars";
import { Gallery } from "./Gallery";
import { BuyBox } from "./BuyBox";
import { ReviewForm } from "./ReviewForm";

type Product = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export async function ProductDetail({ product: p }: { product: Product }) {
  const best = bestVariant(p.variants);
  const price = best ? effectivePrice(best) : 0;
  const [s, reviews, related] = await Promise.all([
    getSettings(),
    prisma.review.findMany({ where: { productId: p.id, approved: true }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.product.findMany({
      where: {
        published: true,
        id: { not: p.id },
        OR: [
          { categories: { some: { id: { in: p.categories.map((c) => c.id) } } } },
          { minPrice: { gte: Math.round(price * 0.8), lte: Math.round(price * 1.2) } },
        ],
      },
      select: cardSelect,
      orderBy: { soldCount: "desc" },
      take: 8,
    }),
  ]);

  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, count: reviews.filter((r) => r.rating === n).length }));
  // Tự điền alt theo tên sản phẩm nếu bỏ trống
  const images = p.images.map((img, i) => ({ url: img.url, alt: img.alt || `${p.name} - ảnh thực tế ${i + 1}` }));
  const mainCat = p.categories[0];
  const extraSpecs: { label: string; value: string }[] = (() => {
    try {
      return p.specs ? JSON.parse(p.specs) : [];
    } catch {
      return [];
    }
  })();
  const ramOptions = [...new Set(p.variants.map((v) => `${v.ramGB}GB`))].join(" / ");
  const ssdOptions = [...new Set(p.variants.map((v) => (v.storageGB >= 1024 ? `${v.storageGB / 1024}TB` : `${v.storageGB}GB`) + ` ${v.storageType}`))].join(" / ");
  const specs: [string, string | null | undefined][] = [
    ["Thương hiệu", p.brand.name],
    ["CPU", p.cpu],
    ["RAM", ramOptions],
    ["Ổ cứng", ssdOptions],
    ["Card đồ họa", p.gpu],
    ["Màn hình", p.screen],
    ["Cổng kết nối", p.ports],
    ["Pin", p.battery],
    ["Trọng lượng", p.weight],
    ["Hệ điều hành", p.os],
    ...extraSpecs.map((x) => [x.label, x.value] as [string, string]),
  ];
  const conditionLabel = CONDITIONS[p.condition] ?? p.condition;
  const url = siteUrl(`/${p.slug}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.sku || p.id,
    image: images.map((i) => absolute(i.url)),
    description: p.metaDescription || p.shortDesc || p.name,
    brand: { "@type": "Brand", name: p.brand.name },
    itemCondition: p.condition === "new" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
    offers: p.variants.map((v) => ({
      "@type": "Offer",
      name: v.name,
      url,
      priceCurrency: "VND",
      price: effectivePrice(v),
      itemCondition: p.condition === "new" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
      availability:
        v.stockStatus === "IN_STOCK"
          ? "https://schema.org/InStock"
          : v.stockStatus === "INCOMING"
            ? "https://schema.org/PreOrder"
            : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: s.shopName },
    })),
    ...(reviews.length
      ? {
          aggregateRating: { "@type": "AggregateRating", ratingValue: avg.toFixed(1), reviewCount: reviews.length, bestRating: 5, worstRating: 1 },
          review: reviews.slice(0, 5).map((r) => ({
            "@type": "Review",
            author: { "@type": "Person", name: r.name },
            datePublished: r.createdAt.toISOString().slice(0, 10),
            reviewBody: r.content,
            reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
          })),
        }
      : {}),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[...(mainCat ? [{ name: mainCat.name, path: `/${mainCat.slug}` }] : []), { name: p.name, path: `/${p.slug}` }]} />

      <div className="container-x">
        <div className="card grid gap-6 p-4 md:p-6 lg:grid-cols-2">
          <Gallery images={images} videoUrl={p.videoUrl} badge={conditionLabel} />

          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{p.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                {reviews.length > 0 && (
                  <a href="#danh-gia" className="flex items-center gap-1">
                    <Stars value={avg} size={14} /> <span>({reviews.length} đánh giá)</span>
                  </a>
                )}
                <span>Đã bán {p.soldCount}</span>
                {p.sku && <span>Mã: {p.sku}</span>}
                <span className={best?.stockStatus === "IN_STOCK" ? "font-medium text-emerald-600" : "font-medium text-amber-600"}>
                  {STOCK_STATUS[best?.stockStatus ?? "OUT_OF_STOCK"]}
                </span>
              </div>
              {p.shortDesc && <p className="mt-2 text-sm text-gray-600">{p.shortDesc}</p>}
            </div>

            <BuyBox
              product={{ id: p.id, slug: p.slug, name: p.name, image: images[0]?.url }}
              variants={p.variants.map((v) => ({ id: v.id, name: v.name, price: v.price, salePrice: v.salePrice, stockStatus: v.stockStatus }))}
              initialId={best?.id}
              hotline={s.hotline}
            />

            {p.gifts && (
              <div className="overflow-hidden rounded-xl ring-1 ring-brand-200">
                <p className="flex items-center gap-2 bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
                  <Gift size={16} /> Khuyến mãi & ưu đãi đi kèm
                </p>
                <ul className="space-y-1.5 p-4 text-sm">
                  {p.gifts
                    .split("\n")
                    .filter(Boolean)
                    .map((g) => (
                      <li key={g} className="flex gap-2">
                        <BadgeCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" /> {g}
                      </li>
                    ))}
                </ul>
              </div>
            )}

            <div className="rounded-xl bg-gray-50 p-4">
              <h2 className="mb-2 text-sm font-semibold text-gray-900 uppercase">Tình trạng máy thực tế</h2>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-2">
                  <Sparkles size={16} className="mt-0.5 shrink-0 text-brand-600" />
                  <span>
                    <b>Ngoại hình:</b> {conditionLabel}
                    {p.appearance && ` – ${p.appearance}`}
                  </span>
                </li>
                {p.batteryHealth && (
                  <li className="flex gap-2">
                    <BatteryCharging size={16} className="mt-0.5 shrink-0 text-brand-600" />
                    <span>
                      <b>Pin:</b> {p.batteryHealth}
                    </span>
                  </li>
                )}
                {p.accessories && (
                  <li className="flex gap-2">
                    <Package size={16} className="mt-0.5 shrink-0 text-brand-600" />
                    <span>
                      <b>Phụ kiện:</b> {p.accessories}
                    </span>
                  </li>
                )}
                <li className="flex gap-2">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0 text-brand-600" />
                  <span>
                    <b>Bảo hành:</b> {p.warrantyMonths} tháng phần cứng, 1 đổi 1 trong 15 ngày
                  </span>
                </li>
              </ul>
            </div>
            <Policies compact />
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          <section className="card min-w-0 p-4 md:p-6">
            <h2 className="mb-2 text-xl font-bold text-gray-900">Đặc điểm nổi bật</h2>
            {p.description ? (
              <div className="prose-content" dangerouslySetInnerHTML={{ __html: p.description }} />
            ) : (
              <p className="text-sm text-gray-500">Đang cập nhật.</p>
            )}
          </section>
          <section className="card self-start p-4 md:p-6 lg:sticky lg:top-36">
            <h2 className="mb-3 text-xl font-bold text-gray-900">Thông số kỹ thuật</h2>
            <table className="w-full text-sm">
              <tbody>
                {specs
                  .filter(([, v]) => v)
                  .map(([k, v], i) => (
                    <tr key={k} className={i % 2 ? "" : "bg-gray-50"}>
                      <th scope="row" className="w-32 px-3 py-2 text-left align-top font-medium text-gray-500">
                        {k}
                      </th>
                      <td className="px-3 py-2 text-gray-900">{v}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </section>
        </div>

        <section id="danh-gia" className="card mt-6 scroll-mt-36 p-4 md:p-6">
          <h2 className="text-xl font-bold text-gray-900">Đánh giá & nhận xét {p.name}</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-[240px_1fr]">
            <div className="text-center md:border-r md:border-gray-100 md:pr-6">
              <p className="text-4xl font-bold text-gray-900">{avg ? avg.toFixed(1) : "–"}/5</p>
              <Stars value={avg} size={20} />
              <p className="mt-1 text-sm text-gray-500">{reviews.length} đánh giá</p>
              <ul className="mt-3 space-y-1">
                {dist.map((d) => (
                  <li key={d.n} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-6">{d.n}★</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <span
                        className="block h-full rounded-full bg-amber-400"
                        style={{ width: `${reviews.length ? (d.count / reviews.length) * 100 : 0}%` }}
                      />
                    </span>
                    <span className="w-6 text-right">{d.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-gray-900">Gửi đánh giá của bạn</h3>
              <ReviewForm productId={p.id} />
            </div>
          </div>

          <ul className="mt-6 divide-y divide-gray-100">
            {reviews.map((r) => {
              const imgs: string[] = r.images ? JSON.parse(r.images) : [];
              return (
                <li key={r.id} className="py-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                      {r.name.trim().split(" ").pop()?.[0]}
                    </span>
                    <span className="text-sm font-semibold">{r.name}</span>
                    <span className="flex items-center gap-1 text-xs text-emerald-600">
                      <BadgeCheck size={14} /> Đã mua hàng
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Stars value={r.rating} size={13} />
                    <time className="text-xs text-gray-400">{formatDate(r.createdAt)}</time>
                  </div>
                  <p className="mt-1 text-sm text-gray-700">{r.content}</p>
                  {imgs.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {imgs.map((src) => (
                        <a key={src} href={src} target="_blank" className="relative block h-16 w-16 overflow-hidden rounded-lg">
                          <Image src={src} alt={`Ảnh đánh giá của ${r.name}`} fill sizes="64px" className="object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                  {r.reply && (
                    <p className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                      <b className="text-brand-600">{s.shopName}:</b> {r.reply}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {related.length > 0 && (
          <section className="mt-8">
            <div className="mb-4 flex items-end justify-between">
              <h2 className="text-xl font-bold text-gray-900">Sản phẩm liên quan, cùng phân khúc giá</h2>
              {mainCat && (
                <Link href={`/${mainCat.slug}`} className="text-sm text-brand-600 hover:underline">
                  Xem thêm
                </Link>
              )}
            </div>
            <ProductGrid items={related} />
          </section>
        )}
      </div>
    </>
  );
}
