import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Quote } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cardSelect } from "@/lib/catalog";
import { getSettings, siteUrl } from "@/lib/settings";
import { JsonLd, localBusinessJsonLd } from "@/lib/seo";
import { PRICE_RANGES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { BannerSlider } from "@/components/shop/BannerSlider";
import { ProductGrid } from "@/components/shop/ProductCard";
import { Policies } from "@/components/shop/Policies";
import { CategoryIcon } from "@/components/shop/Icons";
import { Stars } from "@/components/shop/Stars";

export const revalidate = 300;

export async function generateMetadata() {
  const s = await getSettings();
  return { title: { absolute: s.homeTitle }, description: s.homeDescription, alternates: { canonical: siteUrl("/") } };
}

function SectionTitle({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="text-xl font-bold text-gray-900 md:text-2xl">{title}</h2>
      {href && (
        <Link href={href} className="flex shrink-0 items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
          Xem tất cả <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const [s, banners, categories, featured, bestSellers, brands, reviews, posts] = await Promise.all([
    getSettings(),
    prisma.banner.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.category.findMany({ where: { showOnHome: true }, orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({ where: { published: true, featured: true }, select: cardSelect, orderBy: { updatedAt: "desc" }, take: 8 }),
    prisma.product.findMany({ where: { published: true }, select: cardSelect, orderBy: { soldCount: "desc" }, take: 8 }),
    prisma.brand.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.review.findMany({
      where: { approved: true, rating: 5 },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { product: { select: { name: true, slug: true } } },
    }),
    prisma.post.findMany({ where: { published: true }, orderBy: { createdAt: "desc" }, take: 4 }),
  ]);

  return (
    <>
      <JsonLd
        data={[
          localBusinessJsonLd(s),
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            url: siteUrl("/"),
            name: s.shopName,
            potentialAction: {
              "@type": "SearchAction",
              target: siteUrl("/tim-kiem?q={search_term_string}"),
              "query-input": "required name=search_term_string",
            },
          },
        ]}
      />

      <section className="container-x mt-4 grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BannerSlider banners={banners} />
        </div>
        <div className="hidden grid-rows-2 gap-3 lg:grid">
          <Link href="/huong-dan-mua-tra-gop" className="flex flex-col justify-center rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 p-5 text-white">
            <span className="text-xs tracking-wide text-brand-200 uppercase">Ưu đãi</span>
            <span className="text-xl font-bold">Trả góp 0% lãi suất</span>
            <span className="text-sm opacity-80">Duyệt hồ sơ 15 phút, chỉ cần CCCD</span>
          </Link>
          <Link href="/laptop?gia=duoi-10" className="flex flex-col justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 p-5 text-white">
            <span className="text-xs tracking-wide text-brand-100 uppercase">Sinh viên</span>
            <span className="text-xl font-bold">Laptop dưới 10 triệu</span>
            <span className="text-sm opacity-80">Tặng balo + chuột, bảo hành 6 tháng</span>
          </Link>
        </div>
      </section>

      <section className="container-x mt-6">
        <h1 className="mb-4 text-xl font-bold text-gray-900 md:text-2xl">Laptop cũ Likenew chính hãng – Chọn nhanh theo nhu cầu</h1>
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-5">
          {categories.map((c) => (
            <Link key={c.id} href={`/${c.slug}`} className="card group flex w-32 shrink-0 flex-col items-center gap-2 p-4 text-center hover:ring-brand-300 sm:w-auto">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                <CategoryIcon icon={c.icon} size={24} />
              </span>
              <span className="text-sm font-semibold text-gray-900">{c.name.replace("Laptop ", "")}</span>
              <span className="line-clamp-2 hidden text-xs text-gray-500 sm:block">{c.shortDesc}</span>
            </Link>
          ))}
        </div>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {PRICE_RANGES.map((p) => (
            <Link key={p.key} href={`/laptop?gia=${p.key}`} className="chip shrink-0">
              {p.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="container-x mt-6">
        <Policies />
      </section>

      <section className="container-x mt-8">
        <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-800 p-3 md:p-5">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xl font-bold text-white md:text-2xl">🔥 Laptop nổi bật – Giá sốc</h2>
            <Link href="/laptop" className="text-sm font-medium text-white hover:underline">
              Xem tất cả →
            </Link>
          </div>
          <ProductGrid items={featured} />
        </div>
      </section>

      <section className="container-x mt-10">
        <SectionTitle title="Laptop bán chạy nhất" href="/laptop?sx=ban-chay" />
        <ProductGrid items={bestSellers} />
      </section>

      <section className="container-x mt-10">
        <SectionTitle title="Thương hiệu nổi bật" />
        <div className="grid grid-cols-4 gap-3 md:grid-cols-8">
          {brands.map((b) => (
            <Link key={b.id} href={`/${b.slug}`} className="card flex h-14 items-center justify-center text-sm font-bold text-gray-700 hover:text-brand-600">
              {b.name}
            </Link>
          ))}
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="container-x mt-10">
          <SectionTitle title="Khách hàng nói gì về chúng tôi" />
          <div className="grid gap-4 md:grid-cols-3">
            {reviews.map((r) => (
              <figure key={r.id} className="card flex flex-col gap-3 p-5">
                <Quote className="text-brand-200" size={28} />
                <blockquote className="flex-1 text-sm text-gray-700">{r.content}</blockquote>
                <figcaption className="flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
                  <span>
                    <span className="block text-sm font-semibold">{r.name}</span>
                    <Link href={`/${r.product.slug}`} className="text-xs text-gray-500 hover:text-brand-600">
                      Đã mua {r.product.name}
                    </Link>
                  </span>
                  <Stars value={r.rating} size={14} />
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="container-x mt-10">
          <SectionTitle title="Tin tức & Kinh nghiệm chọn laptop" href="/tin-tuc" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {posts.map((p) => (
              <article key={p.id} className="card overflow-hidden">
                <Link href={`/tin-tuc/${p.slug}`} className="relative block aspect-[16/9] bg-gray-100">
                  {p.cover && <Image src={p.cover} alt={p.title} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover" />}
                </Link>
                <div className="p-4">
                  <time className="text-xs text-gray-500">{formatDate(p.createdAt)}</time>
                  <h3 className="mt-1 line-clamp-2 font-semibold text-gray-900">
                    <Link href={`/tin-tuc/${p.slug}`} className="hover:text-brand-600">
                      {p.title}
                    </Link>
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">{p.excerpt}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="container-x mt-10">
        <div className="card prose-content p-6 text-sm">
          <h2>{s.shopName} – Địa chỉ mua laptop cũ uy tín</h2>
          <p>
            {s.shopName} chuyên cung cấp laptop cũ, laptop likenew 99% các thương hiệu Dell, ThinkPad, HP, MacBook, Asus, Lenovo với giá tốt nhất thị
            trường. Mỗi chiếc máy đều được kiểm tra 30 bước, vệ sinh và tra keo tản nhiệt trước khi giao tới khách hàng.
          </p>
          <p>
            Dù bạn là học sinh – sinh viên cần{" "}
            <Link href="/laptop-hoc-tap-van-phong">laptop học tập, văn phòng</Link>, lập trình viên cần{" "}
            <Link href="/laptop-lap-trinh">laptop lập trình</Link> hay game thủ tìm <Link href="/laptop-gaming">laptop gaming giá rẻ</Link>, chúng tôi
            đều có lựa chọn phù hợp, kèm bảo hành dài và trả góp 0%.
          </p>
        </div>
      </section>
    </>
  );
}
