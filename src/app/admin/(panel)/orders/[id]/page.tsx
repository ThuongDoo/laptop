import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Printer } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatVND } from "@/lib/format";
import { ORDER_STATUS, PAYMENT_METHODS, PAYMENT_STATUS } from "@/lib/constants";
import { ActionForm, Check, Select, SubmitButton } from "@/components/admin/ui";
import { updateOrder } from "../../../actions";

export default async function OrderDetail({ params }: PageProps<"/admin/orders/[id]">) {
  await requireStaff("orders");
  const { id } = await params;
  const o = await prisma.order.findUnique({ where: { id }, include: { items: true, customer: true } });
  if (!o) notFound();
  const tel = o.phone.replace(/\s/g, "");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/orders" className="text-sm text-gray-500 hover:text-brand-600">
          ← Đơn hàng
        </Link>
        <h1 className="text-2xl font-bold">Đơn #{o.code}</h1>
        <span className="text-sm text-gray-500">{formatDate(o.createdAt, true)}</span>
        <Link href={`/admin/orders/${o.id}/invoice`} target="_blank" className="btn-ghost ml-auto">
          <Printer size={16} /> In hóa đơn / PDF
        </Link>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <section className="card p-4">
            <h2 className="mb-2 font-semibold">Sản phẩm</h2>
            <ul className="divide-y divide-gray-100">
              {o.items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-3 text-sm">
                  <span className="relative h-12 w-14 shrink-0 overflow-hidden rounded bg-gray-50">
                    {i.image && <Image src={i.image} alt="" fill sizes="56px" className="object-contain" />}
                  </span>
                  <span className="flex-1">
                    {i.productId ? (
                      <Link href={`/admin/products/${i.productId}`} className="font-medium hover:text-brand-600">
                        {i.productName}
                      </Link>
                    ) : (
                      i.productName
                    )}
                    <span className="block text-xs text-gray-500">{i.variantName}</span>
                  </span>
                  <span>
                    {formatVND(i.price)} × {i.quantity}
                  </span>
                  <span className="w-28 text-right font-semibold">{formatVND(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="ml-auto max-w-xs space-y-1 border-t border-gray-100 pt-3 text-sm">
              <div className="flex justify-between">
                <dt>Tạm tính</dt>
                <dd>{formatVND(o.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Phí vận chuyển</dt>
                <dd>{formatVND(o.shippingFee)}</dd>
              </div>
              {o.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <dt>Giảm giá ({o.couponCode})</dt>
                  <dd>-{formatVND(o.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-base font-bold">
                <dt>Tổng cộng</dt>
                <dd className="text-brand-600">{formatVND(o.total)}</dd>
              </div>
            </dl>
          </section>
          <section className="card grid gap-3 p-4 text-sm md:grid-cols-2">
            <h2 className="font-semibold md:col-span-2">Khách hàng & giao hàng</h2>
            <p>
              <b>Họ tên:</b> {o.name} {o.customer && <span className="text-xs text-emerald-600">(có tài khoản)</span>}
            </p>
            <p>
              <b>Điện thoại:</b>{" "}
              <a href={`tel:${tel}`} className="text-brand-600">
                {o.phone}
              </a>{" "}
              ·{" "}
              <a href={`https://zalo.me/${tel}`} target="_blank" className="text-sky-600">
                Zalo
              </a>
            </p>
            <p>
              <b>Email:</b> {o.email || "—"}
            </p>
            <p>
              <b>Địa chỉ:</b> {o.address}
            </p>
            <p>
              <b>Thanh toán:</b> {PAYMENT_METHODS[o.paymentMethod]}
            </p>
            {o.installmentNote && (
              <p>
                <b>Gói trả góp:</b> {o.installmentNote}
              </p>
            )}
            {o.note && (
              <p className="rounded bg-amber-50 p-2 md:col-span-2">
                <b>Ghi chú của khách:</b> {o.note}
              </p>
            )}
          </section>
        </div>
        <ActionForm action={updateOrder} className="card h-fit space-y-3 p-4">
          <h2 className="font-semibold">Xử lý đơn</h2>
          <input type="hidden" name="id" value={o.id} />
          <Select label="Trạng thái đơn" name="status" defaultValue={o.status} options={ORDER_STATUS} />
          <Select label="Thanh toán" name="paymentStatus" defaultValue={o.paymentStatus} options={PAYMENT_STATUS} />
          <div>
            <label className="label" htmlFor="adminNote">
              Ghi chú nội bộ
            </label>
            <textarea id="adminNote" name="adminNote" rows={3} defaultValue={o.adminNote ?? ""} className="input" />
          </div>
          <Check label={`Gửi email thông báo cho khách${o.email ? "" : " (khách không có email)"}`} name="notify" defaultChecked={!!o.email} />
          <p className="text-xs text-gray-500">Hủy đơn sẽ tự hoàn lại tồn kho. Đơn “Thành công” được tính vào doanh thu & lượt bán.</p>
          <SubmitButton className="btn-primary w-full">Cập nhật</SubmitButton>
        </ActionForm>
      </div>
    </div>
  );
}
