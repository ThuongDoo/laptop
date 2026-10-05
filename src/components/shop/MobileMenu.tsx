"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

type L = { name: string; slug: string };

export function MobileMenu({ categories, brands, hotline }: { categories: L[]; brands: L[]; hotline: string }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <button className="md:hidden" aria-label="Mở menu" aria-expanded={open} onClick={() => setOpen(true)}>
        <Menu size={26} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-black/50" aria-label="Đóng menu" onClick={close} />
          <nav className="absolute inset-y-0 left-0 w-80 max-w-[85%] overflow-y-auto bg-white text-gray-800 shadow-xl">
            <div className="flex items-center justify-between bg-brand-600 px-4 py-3 text-white">
              <span className="font-bold">Danh mục</span>
              <button onClick={close} aria-label="Đóng">
                <X />
              </button>
            </div>
            <Section title="Theo nhu cầu" items={[{ name: "Tất cả laptop", slug: "laptop" }, ...categories]} onClick={close} />
            <Section title="Thương hiệu" items={brands} onClick={close} />
            <Section
              title="Hỗ trợ"
              items={[
                { name: "Tài khoản của tôi", slug: "tai-khoan" },
                { name: "Tra cứu đơn hàng", slug: "tra-cuu-don-hang" },
                { name: "Tin tức - Kinh nghiệm", slug: "tin-tuc" },
                { name: "Chính sách bảo hành", slug: "chinh-sach-bao-hanh" },
                { name: "Hướng dẫn trả góp", slug: "huong-dan-mua-tra-gop" },
                { name: "Liên hệ", slug: "lien-he" },
              ]}
              onClick={close}
            />
            <a href={`tel:${hotline.replace(/\s/g, "")}`} className="btn-primary m-4 flex">
              Gọi {hotline}
            </a>
          </nav>
        </div>
      )}
    </>
  );
}

function Section({ title, items, onClick }: { title: string; items: L[]; onClick: () => void }) {
  return (
    <div className="border-b border-gray-100 py-2">
      <p className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase">{title}</p>
      <ul>
        {items.map((i) => (
          <li key={i.slug}>
            <Link href={`/${i.slug}`} onClick={onClick} className="block px-4 py-2 text-sm hover:bg-gray-50">
              {i.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
