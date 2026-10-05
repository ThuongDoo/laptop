import Link from "next/link";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { Settings } from "@/lib/settings";
import { Logo } from "./Logo";

const PAYMENTS = ["COD", "VietQR", "VNPAY", "Visa", "MasterCard", "JCB", "Trả góp 0%"];

export async function Footer({ s }: { s: Settings }) {
  const [pages, categories] = await Promise.all([
    prisma.page.findMany({ where: { published: true, showInFooter: true }, select: { title: true, slug: true } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true, slug: true } }),
  ]);
  const tel = s.hotline.replace(/\s/g, "");
  return (
    <footer className="mt-12 bg-white text-sm text-gray-600 ring-1 ring-black/5">
      <div className="container-x grid gap-8 py-10 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo name={s.shopName} dark />
          <p>{s.slogan}</p>
          <p className="text-xs">{s.companyInfo}</p>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-brand-600" /> {s.address}
            </li>
            <li className="flex gap-2">
              <Phone size={16} className="mt-0.5 shrink-0 text-brand-600" />
              <a href={`tel:${tel}`} className="font-semibold text-brand-600">
                {s.hotline}
              </a>
            </li>
            <li className="flex gap-2">
              <Mail size={16} className="mt-0.5 shrink-0 text-brand-600" /> {s.email}
            </li>
            <li className="flex gap-2">
              <Clock size={16} className="mt-0.5 shrink-0 text-brand-600" /> {s.openingHours}
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 font-semibold text-gray-900 uppercase">Chính sách & Hỗ trợ</h2>
          <ul className="space-y-2">
            {pages.map((p) => (
              <li key={p.slug}>
                <Link href={`/${p.slug}`} className="hover:text-brand-600">
                  {p.title}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/tra-cuu-don-hang" className="hover:text-brand-600">
                Tra cứu đơn hàng
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 font-semibold text-gray-900 uppercase">Danh mục</h2>
          <ul className="space-y-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/${c.slug}`} className="hover:text-brand-600">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/tin-tuc" className="hover:text-brand-600">
                Tin tức – Kinh nghiệm chọn laptop
              </Link>
            </li>
          </ul>
          <h2 className="mt-5 mb-3 font-semibold text-gray-900 uppercase">Kết nối</h2>
          <div className="flex gap-2">
            {[
              ["Facebook", s.facebook],
              ["YouTube", s.youtube],
              ["TikTok", s.tiktok],
              ["Zalo", `https://zalo.me/${s.zalo}`],
            ].map(([n, url]) => (
              <a key={n} href={url} target="_blank" rel="noopener nofollow" className="chip text-xs">
                {n}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 font-semibold text-gray-900 uppercase">Bản đồ cửa hàng</h2>
          <iframe
            title={`Bản đồ ${s.shopName}`}
            src={s.mapEmbed}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-44 w-full rounded-lg border-0"
          />
          <h2 className="mt-5 mb-2 font-semibold text-gray-900 uppercase">Thanh toán</h2>
          <div className="flex flex-wrap gap-1.5">
            {PAYMENTS.map((p) => (
              <span key={p} className="rounded border border-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} {s.shopName}. Bảo lưu mọi quyền.
      </div>
    </footer>
  );
}
