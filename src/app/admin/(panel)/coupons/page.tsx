import Link from "next/link";
import { Plus } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatVND } from "@/lib/format";
import { COUPON_TYPES } from "@/lib/constants";
import { ConfirmButton } from "@/components/admin/ui";
import { deleteCoupon } from "../../actions";

export default async function CouponsAdmin() {
  await requireStaff("coupons");
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  const now = new Date();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mã giảm giá</h1>
        <Link href="/admin/coupons/new" className="btn-primary">
          <Plus size={16} /> Tạo mã
        </Link>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
            <tr>
              <th className="p-3">Mã</th>
              <th>Loại</th>
              <th>Giá trị</th>
              <th>Đơn tối thiểu</th>
              <th>Đã dùng</th>
              <th>Hạn</th>
              <th>Trạng thái</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {coupons.map((c) => {
              const expired = c.expiresAt && c.expiresAt < now;
              return (
                <tr key={c.id}>
                  <td className="p-3">
                    <Link href={`/admin/coupons/${c.id}`} className="font-mono font-semibold text-brand-600 hover:underline">
                      {c.code}
                    </Link>
                    <span className="block text-xs text-gray-500">{c.description}</span>
                  </td>
                  <td>{COUPON_TYPES[c.type]}</td>
                  <td>
                    {c.type === "PERCENT" ? `${c.value}%${c.maxDiscount ? ` (tối đa ${formatVND(c.maxDiscount)})` : ""}` : c.type === "FIXED" ? formatVND(c.value) : "Phí ship"}
                  </td>
                  <td>{formatVND(c.minOrder)}</td>
                  <td>
                    {c.usedCount}
                    {c.usageLimit != null && ` / ${c.usageLimit}`}
                  </td>
                  <td>{c.expiresAt ? formatDate(c.expiresAt) : "Không giới hạn"}</td>
                  <td>
                    {!c.active ? <span className="text-gray-400">Tắt</span> : expired ? <span className="text-amber-600">Hết hạn</span> : <span className="text-emerald-600">Đang chạy</span>}
                  </td>
                  <td className="pr-3">
                    <form action={deleteCoupon}>
                      <input type="hidden" name="id" value={c.id} />
                      <ConfirmButton message={`Xóa mã ${c.code}?`}>Xóa</ConfirmButton>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
