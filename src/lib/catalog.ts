import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { PRICE_RANGES, SCREEN_OPTIONS } from "./constants";
import { normalizeSearch } from "./format";

export const PAGE_SIZE = 12;

export type SearchParams = Record<string, string | string[] | undefined>;

export type Filters = {
  q?: string;
  brand: string[];
  need: string[];
  price?: string;
  cpu: string[];
  ram: number[];
  ssd: number[];
  gpu?: string;
  screen: string[];
  condition: string[];
  sort: string;
  page: number;
};

const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v.join(",") : v || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export function parseFilters(sp: SearchParams): Filters {
  return {
    q: one(sp.q)?.slice(0, 100),
    brand: list(sp.hang),
    need: list(sp["nhu-cau"]),
    price: one(sp.gia),
    cpu: list(sp.cpu),
    ram: list(sp.ram).map(Number).filter(Boolean),
    ssd: list(sp["o-cung"]).map(Number).filter(Boolean),
    gpu: one(sp.vga),
    screen: list(sp["man-hinh"]),
    condition: list(sp["tinh-trang"]),
    sort: one(sp.sx) || "moi",
    page: Math.max(1, Number(one(sp.trang)) || 1),
  };
}

export function hasActiveFilters(f: Filters) {
  return !!(
    f.brand.length ||
    f.need.length ||
    f.price ||
    f.cpu.length ||
    f.ram.length ||
    f.ssd.length ||
    f.gpu ||
    f.screen.length ||
    f.condition.length
  );
}

export function buildWhere(f: Filters, base: Prisma.ProductWhereInput = {}): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [{ published: true }, base];
  if (f.q) {
    for (const word of normalizeSearch(f.q).split(" ")) and.push({ searchText: { contains: word } });
  }
  if (f.brand.length) and.push({ brand: { slug: { in: f.brand } } });
  if (f.need.length) and.push({ categories: { some: { slug: { in: f.need } } } });
  const pr = PRICE_RANGES.find((p) => p.key === f.price);
  if (pr) and.push({ minPrice: { gte: pr.min, lt: pr.max } });
  if (f.cpu.length) and.push({ cpuFamily: { in: f.cpu } });
  if (f.ram.length) and.push({ variants: { some: { ramGB: { in: f.ram } } } });
  if (f.ssd.length) and.push({ variants: { some: { storageGB: { in: f.ssd } } } });
  if (f.gpu === "roi") and.push({ gpuType: "discrete" });
  if (f.gpu === "onboard") and.push({ gpuType: "onboard" });
  const screens = SCREEN_OPTIONS.filter((s) => f.screen.includes(s.key));
  if (screens.length) and.push({ OR: screens.map((s) => ({ screenSize: { gte: s.min, lte: s.max } })) });
  if (f.condition.length) and.push({ condition: { in: f.condition } });
  return { AND: and };
}

function orderBy(sort: string): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "gia-tang":
      return [{ minPrice: "asc" }];
    case "gia-giam":
      return [{ minPrice: "desc" }];
    case "ban-chay":
      return [{ soldCount: "desc" }, { createdAt: "desc" }];
    default:
      return [{ createdAt: "desc" }];
  }
}

export const cardSelect = {
  id: true,
  name: true,
  slug: true,
  cpu: true,
  gpu: true,
  gpuType: true,
  screen: true,
  condition: true,
  soldCount: true,
  featured: true,
  gifts: true,
  images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } },
  variants: {
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, ramGB: true, storageGB: true, price: true, salePrice: true, stockStatus: true },
  },
} satisfies Prisma.ProductSelect;

export type CardProduct = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

export async function listProducts(f: Filters, base: Prisma.ProductWhereInput = {}) {
  const where = buildWhere(f, base);
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: cardSelect,
      orderBy: orderBy(f.sort),
      skip: (f.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);
  return { items, total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/** Giá hiển thị của sản phẩm = biến thể rẻ nhất còn bán. */
export function bestVariant<T extends { price: number; salePrice: number | null; stockStatus: string }>(variants: T[]) {
  const sellable = variants.filter((v) => v.stockStatus !== "OUT_OF_STOCK");
  const pool = sellable.length ? sellable : variants;
  return pool.reduce<T | undefined>(
    (best, v) => (!best || (v.salePrice ?? v.price) < (best.salePrice ?? best.price) ? v : best),
    undefined,
  );
}

export const effectivePrice = (v: { price: number; salePrice: number | null }) => v.salePrice ?? v.price;

/** Cập nhật cache minPrice + searchText sau khi sửa sản phẩm/biến thể. */
export async function refreshProductCache(productId: string) {
  const p = await prisma.product.findUnique({
    where: { id: productId },
    include: { brand: true, variants: true, categories: true },
  });
  if (!p) return;
  const best = bestVariant(p.variants);
  const searchText = normalizeSearch(
    [
      p.name,
      p.brand.name,
      p.cpu,
      p.gpu,
      p.sku,
      p.screen,
      ...p.categories.map((c) => c.name),
      ...p.variants.map((v) => `${v.ramGB}gb ${v.storageGB}gb ${v.name}`),
    ]
      .filter(Boolean)
      .join(" "),
  );
  await prisma.product.update({
    where: { id: productId },
    data: { minPrice: best ? effectivePrice(best) : 0, searchText },
  });
}
