import Link from "next/link";
import { ShieldCheck, RefreshCcw, Truck, CreditCard } from "lucide-react";

const ITEMS = [
  { icon: ShieldCheck, title: "Bảo hành 6–12 tháng", desc: "Lỗi phần cứng sửa miễn phí", href: "/chinh-sach-bao-hanh" },
  { icon: RefreshCcw, title: "1 đổi 1 trong 15 ngày", desc: "Hoàn tiền nếu lỗi do NSX", href: "/chinh-sach-doi-tra" },
  { icon: Truck, title: "Giao hàng toàn quốc", desc: "Kiểm tra máy rồi mới trả tiền", href: "/chinh-sach-giao-hang" },
  { icon: CreditCard, title: "Trả góp 0%", desc: "Qua thẻ tín dụng & CTTC", href: "/huong-dan-mua-tra-gop" },
];

export function Policies({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`grid gap-3 ${compact ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4"}`}>
      {ITEMS.map(({ icon: Icon, title, desc, href }) => (
        <Link key={title} href={href} className="card flex items-center gap-3 p-3 hover:ring-brand-200">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Icon size={22} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-gray-900">{title}</span>
            <span className="block text-xs text-gray-500">{desc}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
