import type { Metadata } from "next";
import { CatalogPage } from "@/components/shop/CatalogPage";
import { hasActiveFilters, parseFilters } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ searchParams }: PageProps<"/laptop">): Promise<Metadata> {
  const f = parseFilters(await searchParams);
  const meta = pageMetadata({
    title: "Laptop cũ giá rẻ, Likenew 99% – Đầy đủ thương hiệu",
    description: "Tổng hợp laptop cũ likenew Dell, ThinkPad, HP, MacBook, Asus, Lenovo. Lọc theo giá, cấu hình, nhu cầu. Bảo hành dài, trả góp 0%.",
    path: "/laptop",
  });
  if (hasActiveFilters(f) || f.sort !== "moi" || f.page > 1) meta.robots = { index: false, follow: true };
  return meta;
}

export default async function AllLaptops({ searchParams }: PageProps<"/laptop">) {
  return <CatalogPage path="/laptop" title="Tất cả laptop" intro="Laptop cũ – Likenew được kiểm định 30 bước, bảo hành dài." searchParams={await searchParams} />;
}
