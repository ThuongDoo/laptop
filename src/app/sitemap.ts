import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/settings";
import { absolute } from "@/lib/seo";

// Sitemap tự cập nhật: render lại tối đa mỗi giờ
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, brands, posts, pages] = await Promise.all([
    prisma.product.findMany({
      where: { published: true, canonical: null },
      select: { slug: true, updatedAt: true, images: { orderBy: { sortOrder: "asc" }, take: 3, select: { url: true } } },
    }),
    prisma.category.findMany({ select: { slug: true } }),
    prisma.brand.findMany({ select: { slug: true } }),
    prisma.post.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    prisma.page.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
  ]);
  const now = new Date();
  return [
    { url: siteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: siteUrl("/laptop"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((c) => ({ url: siteUrl(`/${c.slug}`), lastModified: now, changeFrequency: "daily" as const, priority: 0.9 })),
    ...brands.map((b) => ({ url: siteUrl(`/${b.slug}`), lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
    ...products.map((p) => ({
      url: siteUrl(`/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: p.images.map((i) => absolute(i.url)),
    })),
    { url: siteUrl("/tin-tuc"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    ...posts.map((p) => ({ url: siteUrl(`/tin-tuc/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...pages.map((p) => ({ url: siteUrl(`/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "yearly" as const, priority: 0.4 })),
  ];
}
