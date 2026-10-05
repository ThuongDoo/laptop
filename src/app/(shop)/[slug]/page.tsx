import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveSlug } from "@/lib/routing";
import { pageMetadata } from "@/lib/seo";
import { parseFilters, hasActiveFilters } from "@/lib/catalog";
import { stripHtml, truncate } from "@/lib/format";
import { ProductDetail } from "@/components/product/ProductDetail";
import { CatalogPage } from "@/components/shop/CatalogPage";
import { StaticPage } from "@/components/shop/StaticPage";

export async function generateMetadata({ params, searchParams }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const r = await resolveSlug(slug);
  if (!r) return {};
  switch (r.kind) {
    case "product": {
      const p = r.product;
      return pageMetadata({
        title: p.metaTitle || p.name,
        description: p.metaDescription || p.shortDesc || truncate(stripHtml(p.description || ""), 160),
        path: `/${p.slug}`,
        canonical: p.canonical,
        image: p.images[0]?.url,
      });
    }
    case "category":
    case "brand": {
      const c = r.kind === "category" ? r.category : r.brand;
      const f = parseFilters(await searchParams);
      const meta = pageMetadata({
        title: c.metaTitle || c.name,
        description: c.metaDescription || ("shortDesc" in c ? c.shortDesc : c.description),
        path: `/${c.slug}`,
        canonical: "canonical" in c ? c.canonical : null,
      });
      // Trang đã lọc: không index để tránh trùng lặp nội dung, vẫn cho bot đi theo link.
      if (hasActiveFilters(f) || f.sort !== "moi" || f.page > 1) meta.robots = { index: false, follow: true };
      return meta;
    }
    case "page":
      return pageMetadata({
        title: r.page.metaTitle || r.page.title,
        description: r.page.metaDescription || truncate(stripHtml(r.page.content), 160),
        path: `/${r.page.slug}`,
        canonical: r.page.canonical,
      });
  }
}

export default async function SlugPage({ params, searchParams }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const r = await resolveSlug(slug);
  if (!r) notFound();
  switch (r.kind) {
    case "product":
      return <ProductDetail product={r.product} />;
    case "category":
      return (
        <CatalogPage
          path={`/${r.category.slug}`}
          title={r.category.name}
          intro={r.category.shortDesc}
          content={r.category.content}
          searchParams={await searchParams}
          base={{ categories: { some: { id: r.category.id } } }}
          hide={["need"]}
        />
      );
    case "brand":
      return (
        <CatalogPage
          path={`/${r.brand.slug}`}
          title={r.brand.name === "MacBook" ? "MacBook cũ" : `Laptop ${r.brand.name} cũ`}
          intro={r.brand.description}
          searchParams={await searchParams}
          base={{ brandId: r.brand.id }}
          hide={["brand"]}
        />
      );
    case "page":
      return <StaticPage page={r.page} />;
  }
}
