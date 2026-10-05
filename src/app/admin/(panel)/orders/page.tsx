import Link from "next/link";
import { FileSpreadsheet } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { orderWhere } from "@/lib/admin-orders";
import { formatDate, formatVND } from "@/lib/format";
import { ORDER_STATUS, PAYMENT_METHODS, PAYMENT_STATUS } from "@/lib/constants";

const STATUS_COLOR: Record<string, string> = {
  NEW: "bg-brand-50 text-brand-700",
  CONFIRMED: "bg-sky-50 text-sky-700",
  SHIPPING: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export default async function OrdersAdmin({ searchParams }: PageProps<"/admin/orders">) {
  await requireStaff("orders");
  const sp = await searchParams;
  const where = orderWhere(sp);
  const [orders, counts] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 200, include: { _count: { select: { items: true } } } }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const status = typeof sp.status === "string" ? sp.status : "";
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]).toString();
  const tab = (st: string) => {
    const p = new URLSearchParams(qs);
    if (st) p.set("status", st);
    else p.delete("status");
    return `/admin/orders?${p}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Đơn hàng</h1>
        <a href={`/api/admin/orders/export?${qs}`} className="btn-ghost">
          <FileSpreadsheet size={16} className="text-emerald-600" /> Xuất Excel
        </a>
      </div>
      <nav className="no-scrollbar flex gap-1 overflow-x-auto">
        <Link href={tab("")} className={`chip shrink-0 ${!status ? "chip-active" : ""}`}>
          Tất cả ({counts.reduce((a, c) => a + c._count, 0)})
        </Link>
        {Object.entries(ORDER_STATUS).map(([k, l]) => (
          <Link key={k} href={tab(k)} className={`chip shrink-0 ${status === k ? "chip-active" : ""}`}>
            {l} ({counts.find((c) => c.status === k)?._count ?? 0})
          </Link>
        ))}
      </nav>
      <form className="card flex flex-wrap items-end gap-2 p-3">
        {status && <input type="hidden" name="status" value={status} />}
        <div>
          <label className="label text-xs">Tìm kiếm</label>
          <input name="q" defaultValue={typeof sp.q === "string" ? sp.q : ""} placeholder="Mã đơn, SĐT, tên" className="input" />
        </div>
        <div>
          <label className="label text-xs">Thanh toán</label>
          <select name="payment" defaultValue={typeof sp.payment === "string" ? sp.payment : ""} className="input">
            <option value="">Tất cả</option>
            {Object.entries(PAYMENT_METHODS).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label text-xs">Từ ngày</label>
          <input type="date" name="from" defaultValue={typeof sp.from === "string" ? sp.from : ""} className="input" />
        </div>
        <div>
          <label className="label text-xs">Đến ngày</label>
          <input type="date" name="to" defaultValue={typeof sp.to === "string" ? sp.to : ""} className="input" />
        </div>
        <button className="btn-ghost">Lọc</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
            <tr>
              <th className="p-3">Mã đơn</th>
              <th>Khách hàng</th>
              <th>Ngày đặt</th>
              <th className="text-right">Tổng tiền</th>
              <th>Thanh toán</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="p-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand-600 hover:underline">
                    #{o.code}
                  </Link>
                  <span className="block text-xs text-gray-500">{o._count.items} sản phẩm</span>
                </td>
                <td>
                  {o.name}
                  <span className="block text-xs text-gray-500">{o.phone}</span>
                </td>
                <td className="text-gray-600">{formatDate(o.createdAt, true)}</td>
                <td className="text-right font-semibold">{formatVND(o.total)}</td>
                <td className="text-xs">
                  {o.paymentMethod}
                  <span className={`block ${o.paymentStatus === "PAID" ? "text-emerald-600" : "text-gray-500"}`}>{PAYMENT_STATUS[o.paymentStatus]}</span>
                </td>
                <td>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[o.status]}`}>{ORDER_STATUS[o.status]}</span>
                </td>
              </tr>
            ))}
            {!orders.length && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">
                  Không có đơn hàng
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
