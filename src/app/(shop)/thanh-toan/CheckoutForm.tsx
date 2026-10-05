"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Tag, Loader2 } from "lucide-react";
import { cart, cartTotal, useCart } from "@/components/cart/cart-store";
import { formatVND } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/constants";
import { placeOrder, quote } from "../actions";

type Customer = { name: string; phone: string; email: string | null; address: string | null } | null;
type Quote = Awaited<ReturnType<typeof quote>>;

const PAYMENT_DESC: Record<string, string> = {
  COD: "Kiểm tra máy rồi mới thanh toán cho nhân viên giao hàng.",
  BANK: "Quét mã VietQR – tự điền số tiền & nội dung chuyển khoản.",
  VNPAY: "Thẻ ATM nội địa, Visa/Master/JCB, ví điện tử & QR ngân hàng qua cổng VNPAY.",
  INSTALLMENT: "Lãi suất 0% qua thẻ tín dụng hoặc công ty tài chính. Nhân viên gọi lại để hoàn tất hồ sơ.",
};

export function CheckoutForm({
  customer,
  installment,
  vnpay,
  shipping,
}: {
  customer: Customer;
  installment: boolean;
  vnpay: boolean;
  shipping: { fee: number; freeThreshold: number };
}) {
  const router = useRouter();
  const items = useCart();
  const [method, setMethod] = useState(installment ? "INSTALLMENT" : "COD");
  const [plan, setPlan] = useState("Thẻ tín dụng – 12 tháng");
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<string | undefined>();
  const [q, setQ] = useState<Quote | null>(null);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const [quoting, startQuote] = useTransition();

  const lines = items.map((i) => ({ variantId: i.variantId, qty: i.qty }));
  const key = JSON.stringify(lines);

  useEffect(() => {
    if (!items.length) return;
    startQuote(async () => setQ(await quote(JSON.parse(key), applied)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, applied]);

  if (!items.length && !pending) {
    return (
      <div className="card p-10 text-center">
        <p className="text-gray-600">Giỏ hàng trống.</p>
        <Link href="/laptop" className="btn-primary mt-3">
          Chọn laptop
        </Link>
      </div>
    );
  }

  const subtotal = q?.subtotal ?? cartTotal(items);
  const fee = q?.shippingFee ?? (shipping.freeThreshold && subtotal >= shipping.freeThreshold ? 0 : shipping.fee);

  const submit = (fd: FormData) => {
    setError(undefined);
    start(async () => {
      const res = await placeOrder({
        name: String(fd.get("name")),
        phone: String(fd.get("phone")),
        email: String(fd.get("email") || ""),
        address: String(fd.get("address")),
        note: String(fd.get("note") || ""),
        paymentMethod: method as "COD",
        installmentNote: method === "INSTALLMENT" ? plan : undefined,
        coupon: applied,
        items: lines,
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      cart.clear();
      if (res.redirect.startsWith("http")) window.location.href = res.redirect;
      else router.replace(res.redirect);
    });
  };

  return (
    <form action={submit} className="grid gap-4 lg:grid-cols-[1fr_400px]">
      <div className="space-y-4">
        <section className="card space-y-3 p-4 md:p-6">
          <h2 className="font-bold text-gray-900">1. Thông tin người nhận</h2>
          {!customer && (
            <p className="text-sm text-gray-500">
              Không cần đăng ký tài khoản.{" "}
              <Link href="/tai-khoan?next=/thanh-toan" className="text-brand-600 underline">
                Đăng nhập
              </Link>{" "}
              để theo dõi đơn dễ hơn.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">
                Họ và tên *
              </label>
              <input id="name" name="name" required defaultValue={customer?.name} className="input" autoComplete="name" />
            </div>
            <div>
              <label className="label" htmlFor="phone">
                Số điện thoại *
              </label>
              <input id="phone" name="phone" required defaultValue={customer?.phone} className="input" inputMode="tel" autoComplete="tel" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="email">
              Email (nhận xác nhận đơn hàng)
            </label>
            <input id="email" name="email" type="email" defaultValue={customer?.email ?? ""} className="input" autoComplete="email" />
          </div>
          <div>
            <label className="label" htmlFor="address">
              Địa chỉ nhận hàng *
            </label>
            <input
              id="address"
              name="address"
              required
              defaultValue={customer?.address ?? ""}
              className="input"
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
              autoComplete="street-address"
            />
          </div>
          <div>
            <label className="label" htmlFor="note">
              Ghi chú
            </label>
            <textarea id="note" name="note" rows={2} className="input" placeholder="VD: giao giờ hành chính, cài thêm phần mềm..." />
          </div>
        </section>

        <section className="card space-y-3 p-4 md:p-6">
          <h2 className="font-bold text-gray-900">2. Hình thức thanh toán</h2>
          {Object.entries(PAYMENT_METHODS)
            .filter(([k]) => k !== "VNPAY" || vnpay)
            .map(([k, label]) => (
              <label
                key={k}
                className={`flex cursor-pointer gap-3 rounded-lg p-3 ring-1 ${method === k ? "bg-brand-50 ring-brand-500" : "ring-gray-200"}`}
              >
                <input type="radio" name="pm" value={k} checked={method === k} onChange={() => setMethod(k)} className="mt-1 accent-brand-600" />
                <span>
                  <span className="block text-sm font-semibold text-gray-900">{label}</span>
                  <span className="block text-xs text-gray-500">{PAYMENT_DESC[k]}</span>
                  {k === "INSTALLMENT" && method === k && (
                    <select value={plan} onChange={(e) => setPlan(e.target.value)} className="input mt-2">
                      {["Thẻ tín dụng – 6 tháng", "Thẻ tín dụng – 12 tháng", "HD Saison – 6 tháng", "HD Saison – 12 tháng", "Home Credit – 12 tháng"].map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  )}
                </span>
              </label>
            ))}
        </section>
      </div>

      <aside className="card h-fit space-y-4 p-4 md:p-6 lg:sticky lg:top-36">
        <h2 className="font-bold text-gray-900">Đơn hàng ({items.length} sản phẩm)</h2>
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.variantId} className="flex gap-3">
              <span className="relative h-14 w-16 shrink-0 overflow-hidden rounded bg-gray-50">
                {i.image && <Image src={i.image} alt="" fill sizes="64px" className="object-contain" />}
              </span>
              <span className="min-w-0 flex-1 text-sm">
                <span className="line-clamp-1 font-medium">{i.name}</span>
                <span className="block text-xs text-gray-500">
                  {i.variantName} × {i.qty}
                </span>
              </span>
              <span className="text-sm font-semibold">{formatVND(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>

        <div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag size={16} className="absolute top-2.5 left-3 text-gray-400" />
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                placeholder="Mã giảm giá"
                className="input pl-9"
                aria-label="Mã giảm giá"
              />
            </div>
            <button type="button" className="btn-ghost" onClick={() => setApplied(coupon.trim() || undefined)}>
              Áp dụng
            </button>
          </div>
          {applied && q?.couponError && <p className="mt-1 text-xs text-red-600">{q.couponError}</p>}
          {applied && q?.couponLabel && (
            <p className="mt-1 text-xs text-emerald-700">
              Đã áp dụng mã <b>{applied}</b>: {q.couponLabel}{" "}
              <button type="button" className="underline" onClick={() => (setApplied(undefined), setCoupon(""))}>
                Bỏ mã
              </button>
            </p>
          )}
        </div>

        <dl className="space-y-1.5 border-t border-gray-100 pt-3 text-sm">
          <div className="flex justify-between">
            <dt>Tạm tính</dt>
            <dd>{formatVND(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Phí vận chuyển</dt>
            <dd>{fee ? formatVND(fee) : "Miễn phí"}</dd>
          </div>
          {!!q?.discount && (
            <div className="flex justify-between text-emerald-700">
              <dt>Giảm giá</dt>
              <dd>-{formatVND(q.discount)}</dd>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-base font-bold">
            <dt>Tổng thanh toán</dt>
            <dd className="flex items-center gap-1 text-brand-600">
              {quoting && <Loader2 size={14} className="animate-spin" />}
              {formatVND(q?.total ?? subtotal + fee)}
            </dd>
          </div>
        </dl>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button className="btn-primary w-full py-3 text-base" disabled={pending}>
          {pending ? "Đang xử lý..." : method === "VNPAY" ? "Thanh toán qua VNPAY" : "Xác nhận đặt hàng"}
        </button>
        <p className="text-center text-xs text-gray-500">
          Bằng việc đặt hàng, bạn đồng ý với{" "}
          <Link href="/chinh-sach-bao-hanh" className="underline">
            chính sách bảo hành & đổi trả
          </Link>
          .
        </p>
      </aside>
    </form>
  );
}
