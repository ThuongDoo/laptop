import type { Metadata } from "next";
import { CatalogPage } from "@/components/shop/CatalogPage";
import { parseFilters } from "@/lib/catalog";

export async function generateMetadata({ searchParams }: PageProps<"/tim-kiem">): Promise<Metadata> {
  const { q } = parseFilters(await searchParams);
  return { title: q ? `Kết quả tìm kiếm “${q}”` : "Tìm kiếm", robots: { index: false, follow: true } };
}

export default async function SearchPage({ searchParams }: PageProps<"/tim-kiem">) {
  const sp = await searchParams;
  const { q } = parseFilters(sp);
  return <CatalogPage path="/tim-kiem" title={q ? `Kết quả tìm kiếm cho “${q}”` : "Tìm kiếm sản phẩm"} searchParams={sp} />;
}
