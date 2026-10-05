"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { cart, cartTotal, useCart } from "@/components/cart/cart-store";
import { formatVND } from "@/lib/format";
import { getCartLines } from "../actions";

export function CartView() {
  const items = useCart();
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const ids = items.map((i) => i.variantId).join(",");

  // Đồng bộ giá & tình trạng kho mới nhất từ server
  useEffect(() => {
    if (!ids) return;
    getCartLines(ids.split(",")).then((lines) => {
      const found = new Set(lines.map((l) => l.variantId));
      cart.sync(lines, ids.split(",").filter((id) => !found.has(id)));
      setUnavailable(lines.filter((l) => !l.available).map((l) => l.variantId));
    });
  }, [ids]);

  if (!items.length) {
    return (
      <div className="card flex flex-col items-center gap-3 p-10 text-center">
        <ShoppingBag size={48} className="text-gray-300" />
        <p className="text-gray-600">Giỏ hàng đang trống.</p>
        <Link href="/laptop" className="btn-primary">
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }
  const blocked = items.some((i) => unavailable.includes(i.variantId));

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <ul className="card divide-y divide-gray-100">
        {items.map((i) => (
          <li key={i.variantId} className="flex gap-3 p-4">
            <Link href={`/${i.slug}`} className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-50">
              {i.image && <Image src={i.image} alt={i.name} fill sizes="96px" className="object-contain" />}
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/${i.slug}`} className="line-clamp-2 font-semibold text-gray-900 hover:text-brand-600">
                {i.name}
              </Link>
              <p className="text-sm text-gray-500">{i.variantName}</p>
              {unavailable.includes(i.variantId) && <p className="text-sm font-medium text-red-600">Phiên bản này đã hết hàng</p>}
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center rounded-lg ring-1 ring-gray-200">
                  <button className="p-2" aria-label="Giảm" onClick={() => cart.setQty(i.variantId, i.qty - 1)}>
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm">{i.qty}</span>
                  <button className="p-2" aria-label="Tăng" onClick={() => cart.setQty(i.variantId, i.qty + 1)}>
                    <Plus size={14} />
                  </button>
                </div>
                <span className="font-bold text-brand-600">{formatVND(i.price * i.qty)}</span>
                <button onClick={() => cart.remove(i.variantId)} aria-label="Xóa" className="text-gray-400 hover:text-red-600">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <aside className="card h-fit space-y-3 p-4 lg:sticky lg:top-36">
        <div className="flex justify-between text-sm">
          <span>Tạm tính</span>
          <span className="font-semibold">{formatVND(cartTotal(items))}</span>
        </div>
        <p className="text-xs text-gray-500">Phí vận chuyển và mã giảm giá được áp dụng ở bước thanh toán.</p>
        {blocked && <p className="text-sm text-red-600">Vui lòng xóa sản phẩm đã hết hàng để tiếp tục.</p>}
        <Link href="/thanh-toan" aria-disabled={blocked} className={`btn-primary w-full py-3 ${blocked ? "pointer-events-none opacity-50" : ""}`}>
          Tiến hành đặt hàng
        </Link>
        <Link href="/laptop" className="block text-center text-sm text-brand-600 hover:underline">
          ← Chọn thêm sản phẩm khác
        </Link>
      </aside>
    </div>
  );
}
