import "server-only";
import { cache } from "react";
import { prisma } from "./prisma";

/** Các đường dẫn hệ thống – không được dùng làm slug. */
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "uploads",
  "laptop",
  "tim-kiem",
  "gio-hang",
  "thanh-toan",
  "dat-hang",
  "tra-cuu-don-hang",
  "tai-khoan",
  "tin-tuc",
  "sitemap.xml",
  "robots.txt",
  "favicon.ico",
]);

export const productInclude = {
  brand: true,
  categories: { orderBy: { sortOrder: "asc" } },
  images: { orderBy: { sortOrder: "asc" } },
  variants: { orderBy: { sortOrder: "asc" } },
} as const;

/** URL gốc /[slug] dùng chung cho sản phẩm, danh mục nhu cầu, thương hiệu và trang tĩnh. */
export const resolveSlug = cache(async (slug: string) => {
  const product = await prisma.product.findUnique({ where: { slug }, include: productInclude });
  if (product?.published) return { kind: "product" as const, product };
  const category = await prisma.category.findUnique({ where: { slug } });
  if (category) return { kind: "category" as const, category };
  const brand = await prisma.brand.findUnique({ where: { slug } });
  if (brand) return { kind: "brand" as const, brand };
  const page = await prisma.page.findUnique({ where: { slug } });
  if (page?.published) return { kind: "page" as const, page };
  return null;
});

/** Kiểm tra slug đã bị dùng ở bảng khác chưa (dùng khi lưu trong admin). */
export async function slugTaken(slug: string, self?: { table: "product" | "category" | "brand" | "page"; id: string }) {
  if (RESERVED_SLUGS.has(slug)) return true;
  const [p, c, b, pg] = await Promise.all([
    prisma.product.findUnique({ where: { slug }, select: { id: true } }),
    prisma.category.findUnique({ where: { slug }, select: { id: true } }),
    prisma.brand.findUnique({ where: { slug }, select: { id: true } }),
    prisma.page.findUnique({ where: { slug }, select: { id: true } }),
  ]);
  const hits = [
    p && { table: "product", id: p.id },
    c && { table: "category", id: c.id },
    b && { table: "brand", id: b.id },
    pg && { table: "page", id: pg.id },
  ].filter(Boolean) as { table: string; id: string }[];
  return hits.some((h) => !(self && h.table === self.table && h.id === self.id));
}
