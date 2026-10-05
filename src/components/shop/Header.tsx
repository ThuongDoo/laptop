import Link from "next/link";
import { Phone, User, Newspaper, PackageSearch } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { Logo } from "./Logo";
import { SearchBox } from "./SearchBox";
import { CartButton } from "./CartButton";
import { MobileMenu } from "./MobileMenu";

export async function Header() {
  const [s, categories, brands] = await Promise.all([
    getSettings(),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true, slug: true } }),
    prisma.brand.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true, slug: true } }),
  ]);
  const tel = s.hotline.replace(/\s/g, "");

  return (
    <header className="sticky top-0 z-40 bg-brand-600 text-white shadow">
      <div className="hidden bg-brand-800 text-xs md:block">
        <div className="container-x flex h-8 items-center justify-between">
          <p>{s.slogan}</p>
          <nav className="flex items-center gap-5">
            <Link href="/tra-cuu-don-hang" className="flex items-center gap-1 hover:underline">
              <PackageSearch size={14} /> Tra cứu đơn hàng
            </Link>
            <Link href="/tin-tuc" className="flex items-center gap-1 hover:underline">
              <Newspaper size={14} /> Tin tức
            </Link>
            <Link href="/chinh-sach-bao-hanh" className="hover:underline">
              Bảo hành
            </Link>
          </nav>
        </div>
      </div>

      <div className="container-x flex h-16 items-center gap-3 md:gap-6">
        <MobileMenu categories={categories} brands={brands} hotline={s.hotline} />
        <Link href="/" aria-label={`${s.shopName} - Trang chủ`} className="shrink-0">
          <Logo name={s.shopName} />
        </Link>
        <div className="hidden flex-1 md:block">
          <SearchBox />
        </div>
        <a href={`tel:${tel}`} className="hidden items-center gap-2 lg:flex">
          <Phone size={22} />
          <span className="leading-tight">
            <span className="block text-xs opacity-80">Hotline mua hàng</span>
            <span className="font-bold">{s.hotline}</span>
          </span>
        </a>
        <Link href="/tai-khoan" className="ml-auto hidden items-center gap-1.5 text-sm md:ml-0 md:flex" aria-label="Tài khoản">
          <User size={22} />
          <span className="hidden xl:inline">Tài khoản</span>
        </Link>
        <div className="ml-auto md:ml-0">
          <CartButton />
        </div>
      </div>

      <div className="container-x pb-3 md:hidden">
        <SearchBox />
      </div>

      <nav aria-label="Danh mục" className="hidden border-t border-white/15 bg-brand-700 md:block">
        <ul className="container-x no-scrollbar flex h-10 items-center gap-6 overflow-x-auto text-sm font-medium whitespace-nowrap">
          <li>
            <Link href="/laptop" className="hover:text-brand-100">
              Tất cả laptop
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <Link href={`/${c.slug}`} className="hover:text-brand-100">
                {c.name}
              </Link>
            </li>
          ))}
          <li className="text-white/40">|</li>
          {brands.slice(0, 6).map((b) => (
            <li key={b.slug}>
              <Link href={`/${b.slug}`} className="hover:text-brand-100">
                {b.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
