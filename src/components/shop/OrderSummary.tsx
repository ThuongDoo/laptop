import Image from "next/image";
import type { Order, OrderItem } from "@prisma/client";
import { formatDate, formatVND } from "@/lib/format";
import { ORDER_STATUS, PAYMENT_METHODS, PAYMENT_STATUS } from "@/lib/constants";
import { getSettings } from "@/lib/settings";
import { vietQrUrl } from "@/lib/vietqr";

const STEPS = ["NEW", "CONFIRMED", "SHIPPING", "COMPLETED"];

export async function OrderSummary({ order }: { order: Order & { items: OrderItem[] } }) {
  const s = await getSettings();
  const step = STEPS.indexOf(order.status);
  const showQr = order.paymentMethod === "BANK" && order.paymentStatus !== "PAID" && order.status !== "CANCELLED";
  const transferContent = `${order.code} ${order.phone.slice(-4)}`;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-4">
        <section className="card p-4 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold text-gray-900">Đơn hàng #{order.code}</h2>
            <span className="text-sm text-gray-500">{formatDate(order.createdAt, true)}</span>
          </div>
          {order.status === "CANCELLED" ? (
            <p className="mt-3 rounded-lg bg-gray-100 p-3 text-sm font-medium text-gray-700">Đơn hàng đã bị hủy.</p>
          ) : (
            <ol className="mt-4 grid grid-cols-4 gap-1 text-center text-xs">
              {STEPS.map((st, i) => (
                <li key={st} className="flex flex-col items-center gap-1">
                  <span className={`h-2 w-full rounded-full ${i <= step ? "bg-brand-600" : "bg-gray-200"}`} />
                  <span className={i <= step ? "font-semibold text-brand-700" : "text-gray-400"}>{ORDER_STATUS[st]}</span>
                </li>
              ))}
            </ol>
          )}
          <ul className="mt-4 divide-y divide-gray-100">
            {order.items.map((i) => (
              <li key={i.id} className="flex gap-3 py-3">
                <span className="relative h-14 w-16 shrink-0 overflow-hidden rounded bg-gray-50">
                  {i.image && <Image src={i.image} alt="" fill sizes="64px" className="object-contain" />}
                </span>
                <span className="flex-1 text-sm">
                  <span className="block font-medium">{i.productName}</span>
                  <span className="text-xs text-gray-500">
                    {i.variantName} × {i.quantity}
                  </span>
                </span>
                <span className="text-sm font-semibold">{formatVND(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-1 border-t border-gray-100 pt-3 text-sm">
            <div className="flex justify-between">
              <dt>Tạm tính</dt>
              <dd>{formatVND(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Phí vận chuyển</dt>
              <dd>{order.shippingFee ? formatVND(order.shippingFee) : "Miễn phí"}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <dt>Giảm giá {order.couponCode && `(${order.couponCode})`}</dt>
                <dd>-{formatVND(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between text-base font-bold">
              <dt>Tổng cộng</dt>
              <dd className="text-brand-600">{formatVND(order.total)}</dd>
            </div>
          </dl>
        </section>
        <section className="card grid grid-cols-1 gap-2 p-4 text-sm break-words md:grid-cols-2 md:p-6">
          <p>
            <b>Người nhận:</b> {order.name} – {order.phone}
          </p>
          <p>
            <b>Địa chỉ:</b> {order.address}
          </p>
          <p>
            <b>Thanh toán:</b> {PAYMENT_METHODS[order.paymentMethod]}
            {order.installmentNote && ` (${order.installmentNote})`}
          </p>
          <p>
            <b>Trạng thái thanh toán:</b>{" "}
            <span className={order.paymentStatus === "PAID" ? "text-emerald-700" : "text-amber-700"}>{PAYMENT_STATUS[order.paymentStatus]}</span>
          </p>
        </section>
      </div>

      {showQr && (
        <aside className="card h-fit p-4 text-center md:p-6">
          <h2 className="font-bold text-gray-900">Chuyển khoản qua VietQR</h2>
          <p className="mt-1 text-xs text-gray-500">Mở app ngân hàng, quét mã – số tiền & nội dung đã được điền sẵn.</p>
          <Image
            src={vietQrUrl(s, order.total, transferContent)}
            alt={`Mã VietQR thanh toán đơn ${order.code}`}
            width={300}
            height={340}
            unoptimized
            loading="eager"
            className="mx-auto mt-3 rounded-lg"
          />
          <dl className="mt-3 space-y-1 text-left text-sm">
            <div className="flex justify-between gap-2">
              <dt className="shrink-0 text-gray-500">Ngân hàng</dt>
              <dd className="font-medium">{s.bankName}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="shrink-0 text-gray-500">Số tài khoản</dt>
              <dd className="font-medium">{s.bankAccount}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="shrink-0 text-gray-500">Chủ tài khoản</dt>
              <dd className="text-right text-xs font-medium">{s.bankAccountName}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="shrink-0 text-gray-500">Số tiền</dt>
              <dd className="font-bold text-brand-600">{formatVND(order.total)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="shrink-0 text-gray-500">Nội dung</dt>
              <dd className="font-bold">{transferContent}</dd>
            </div>
          </dl>
          <p className="mt-3 rounded bg-amber-50 p-2 text-xs text-amber-800">
            Sau khi chuyển khoản, shop sẽ xác nhận trong 5–15 phút (giờ hành chính) và gọi lại cho bạn.
          </p>
        </aside>
      )}
    </div>
  );
}
