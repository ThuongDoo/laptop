import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatDate, formatVND } from "@/lib/format";
import { PAYMENT_METHODS, PAYMENT_STATUS } from "@/lib/constants";
import { PrintButton } from "./PrintButton";

// Hóa đơn bán hàng – dùng “In” của trình duyệt để in hoặc lưu PDF (giữ đúng font tiếng Việt).
export default async function Invoice({ params }: PageProps<"/admin/orders/[id]/invoice">) {
  await requireStaff("orders");
  const { id } = await params;
  const [o, s] = await Promise.all([prisma.order.findUnique({ where: { id }, include: { items: true } }), getSettings()]);
  if (!o) notFound();
  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-sm text-gray-900 shadow print:max-w-none print:p-0 print:shadow-none">
      <div className="no-print mb-4 flex justify-end">
        <PrintButton />
      </div>
      <header className="flex justify-between border-b-2 border-brand-600 pb-4">
        <div>
          <p className="text-xl font-bold text-brand-600">{s.shopName}</p>
          <p>{s.address}</p>
          <p>
            Hotline: {s.hotline} · {s.email}
          </p>
          <p className="text-xs text-gray-500">{s.companyInfo}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">HÓA ĐƠN BÁN HÀNG</p>
          <p>Số: {o.code}</p>
          <p>Ngày: {formatDate(o.createdAt, true)}</p>
        </div>
      </header>
      <section className="grid grid-cols-2 gap-4 py-4">
        <div>
          <p className="font-semibold">Khách hàng</p>
          <p>{o.name}</p>
          <p>{o.phone}</p>
          {o.email && <p>{o.email}</p>}
          <p>{o.address}</p>
        </div>
        <div>
          <p className="font-semibold">Thanh toán</p>
          <p>{PAYMENT_METHODS[o.paymentMethod]}</p>
          {o.installmentNote && <p>{o.installmentNote}</p>}
          <p>{PAYMENT_STATUS[o.paymentStatus]}</p>
        </div>
      </section>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="border border-gray-300 p-2">#</th>
            <th className="border border-gray-300 p-2">Sản phẩm</th>
            <th className="border border-gray-300 p-2 text-center">SL</th>
            <th className="border border-gray-300 p-2 text-right">Đơn giá</th>
            <th className="border border-gray-300 p-2 text-right">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {o.items.map((i, n) => (
            <tr key={i.id}>
              <td className="border border-gray-300 p-2">{n + 1}</td>
              <td className="border border-gray-300 p-2">
                {i.productName}
                <br />
                <span className="text-xs text-gray-600">{i.variantName}</span>
              </td>
              <td className="border border-gray-300 p-2 text-center">{i.quantity}</td>
              <td className="border border-gray-300 p-2 text-right">{formatVND(i.price)}</td>
              <td className="border border-gray-300 p-2 text-right">{formatVND(i.price * i.quantity)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} className="p-2 text-right">
              Tạm tính
            </td>
            <td className="p-2 text-right">{formatVND(o.subtotal)}</td>
          </tr>
          <tr>
            <td colSpan={4} className="p-2 text-right">
              Phí vận chuyển
            </td>
            <td className="p-2 text-right">{formatVND(o.shippingFee)}</td>
          </tr>
          {o.discount > 0 && (
            <tr>
              <td colSpan={4} className="p-2 text-right">
                Giảm giá ({o.couponCode})
              </td>
              <td className="p-2 text-right">-{formatVND(o.discount)}</td>
            </tr>
          )}
          <tr className="text-base font-bold">
            <td colSpan={4} className="p-2 text-right">
              Tổng cộng
            </td>
            <td className="p-2 text-right text-brand-600">{formatVND(o.total)}</td>
          </tr>
        </tfoot>
      </table>
      <p className="mt-4 text-xs text-gray-600">
        Bảo hành theo chính sách của {s.shopName}. Vui lòng giữ hóa đơn và tem bảo hành trên máy.
      </p>
      <div className="mt-10 grid grid-cols-2 text-center">
        <div>
          <p className="font-semibold">Khách hàng</p>
          <p className="text-xs text-gray-500">(Ký, ghi rõ họ tên)</p>
        </div>
        <div>
          <p className="font-semibold">Người bán hàng</p>
          <p className="text-xs text-gray-500">(Ký, ghi rõ họ tên)</p>
        </div>
      </div>
    </div>
  );
}
