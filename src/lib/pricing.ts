import type { Coupon } from "@prisma/client";
import { formatVND } from "./format";

export function shippingFeeFor(subtotal: number, fee: number, freeThreshold: number) {
  if (subtotal <= 0) return 0;
  if (freeThreshold > 0 && subtotal >= freeThreshold) return 0;
  return fee;
}

export type CouponResult = { ok: true; discount: number; freeShip: boolean; label: string } | { ok: false; error: string };

export function applyCoupon(c: Coupon | null, subtotal: number, shippingFee: number, now = new Date()): CouponResult {
  if (!c || !c.active) return { ok: false, error: "Mã giảm giá không tồn tại" };
  if (c.startsAt && c.startsAt > now) return { ok: false, error: "Mã giảm giá chưa đến thời gian áp dụng" };
  if (c.expiresAt && c.expiresAt < now) return { ok: false, error: "Mã giảm giá đã hết hạn" };
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) return { ok: false, error: "Mã giảm giá đã hết lượt sử dụng" };
  if (subtotal < c.minOrder) return { ok: false, error: `Đơn tối thiểu ${formatVND(c.minOrder)} để dùng mã này` };

  if (c.type === "FREESHIP") return { ok: true, discount: shippingFee, freeShip: true, label: "Miễn phí vận chuyển" };
  let discount = c.type === "PERCENT" ? Math.floor((subtotal * c.value) / 100) : c.value;
  if (c.type === "PERCENT" && c.maxDiscount) discount = Math.min(discount, c.maxDiscount);
  discount = Math.min(discount, subtotal);
  const label = c.type === "PERCENT" ? `Giảm ${c.value}%` : `Giảm ${formatVND(c.value)}`;
  return { ok: true, discount, freeShip: false, label };
}
