import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeSearch } from "@/lib/format";

export async function GET(req: Request) {
  const q = normalizeSearch(new URL(req.url).searchParams.get("q") || "").slice(0, 80);
  if (q.length < 2) return NextResponse.json({ items: [] });
  const products = await prisma.product.findMany({
    where: { published: true, AND: q.split(" ").map((w) => ({ searchText: { contains: w } })) },
    select: { name: true, slug: true, minPrice: true, images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } } },
    orderBy: { soldCount: "desc" },
    take: 6,
  });
  return NextResponse.json(
    { items: products.map((p) => ({ name: p.name, slug: p.slug, price: p.minPrice, image: p.images[0]?.url })) },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } },
  );
}
