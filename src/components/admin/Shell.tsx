"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  FolderTree,
  Image as ImageIcon,
  Laptop,
  LogOut,
  Menu,
  MessageSquare,
  Newspaper,
  Settings,
  ShoppingBag,
  Ticket,
  UserCog,
  Users,
  ExternalLink,
} from "lucide-react";
import { can, type Area } from "@/lib/permissions";
import { ROLES } from "@/lib/constants";
import { staffLogout } from "@/app/admin/actions";

const NAV: { href: string; label: string; area: Area; icon: typeof Laptop }[] = [
  { href: "/admin", label: "Tổng quan", area: "dashboard", icon: BarChart3 },
  { href: "/admin/orders", label: "Đơn hàng", area: "orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Sản phẩm", area: "products", icon: Laptop },
  { href: "/admin/catalog", label: "Danh mục & Hãng", area: "catalog", icon: FolderTree },
  { href: "/admin/customers", label: "Khách hàng", area: "customers", icon: Users },
  { href: "/admin/coupons", label: "Mã giảm giá", area: "coupons", icon: Ticket },
  { href: "/admin/reviews", label: "Đánh giá", area: "reviews", icon: MessageSquare },
  { href: "/admin/posts", label: "Bài viết", area: "posts", icon: Newspaper },
  { href: "/admin/pages", label: "Trang thông tin", area: "pages", icon: FileText },
  { href: "/admin/banners", label: "Banner", area: "banners", icon: ImageIcon },
  { href: "/admin/users", label: "Nhân sự & phân quyền", area: "users", icon: UserCog },
  { href: "/admin/settings", label: "Cài đặt", area: "settings", icon: Settings },
];

export function Shell({ user, children, badges }: { user: { name: string; role: string }; children: React.ReactNode; badges: Partial<Record<string, number>> }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const nav = NAV.filter((n) => can(user.role, n.area));

  return (
    <div className="min-h-screen bg-gray-100 lg:pl-60 print:bg-white print:pl-0">
      <aside
        className={`no-print fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-gray-900 text-gray-300 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Link href="/admin" className="flex h-14 items-center gap-2 bg-brand-600 px-4 font-bold text-white">
          <Laptop size={20} /> Quản trị
        </Link>
        <nav className="flex-1 overflow-y-auto py-3">
          {nav.map((n) => {
            const active = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`mx-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${active ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-white"}`}
              >
                <n.icon size={18} /> <span className="flex-1">{n.label}</span>
                {!!badges[n.href] && <span className="rounded-full bg-brand-600 px-1.5 text-xs text-white">{badges[n.href]}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3 text-xs">
          <p className="font-semibold text-white">{user.name}</p>
          <p>{ROLES[user.role]}</p>
          <div className="mt-2 flex gap-2">
            <Link href="/" target="_blank" className="flex items-center gap-1 hover:text-white">
              <ExternalLink size={14} /> Xem web
            </Link>
            <form action={staffLogout} className="ml-auto">
              <button className="flex items-center gap-1 hover:text-white">
                <LogOut size={14} /> Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </aside>
      {open && <button aria-label="Đóng menu" className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
      <header className="no-print sticky top-0 z-20 flex h-14 items-center gap-3 bg-white px-4 shadow-sm lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Mở menu">
          <Menu />
        </button>
        <span className="font-semibold">Quản trị</span>
      </header>
      <div className="p-4 md:p-6 print:p-0">{children}</div>
    </div>
  );
}
