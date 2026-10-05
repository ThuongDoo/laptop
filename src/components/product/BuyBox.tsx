"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CreditCard, ShoppingCart } from "lucide-react";
import { cart } from "@/components/cart/cart-store";
import { discountPercent, formatVND } from "@/lib/format";

type Variant = {
  id: string;
  name: string;
  price: number;
  salePrice: number | null;
  stockStatus: string;
};

export function BuyBox({
  product,
  variants,
  initialId,
  hotline,
}: {
  product: { id: string; slug: string; name: string; image?: string };
  variants: Variant[];
  initialId?: string;
  hotline: string;
}) {
  const router = useRouter();
  const [id, setId] = useState(initialId ?? variants[0]?.id);
  const [added, setAdded] = useState(false);
  const v = variants.find((x) => x.id === id) ?? variants[0];
  if (!v) return null;
  const price = v.salePrice ?? v.price;
  const pct = discountPercent(v.price, v.salePrice);
  const sellable = v.stockStatus === "IN_STOCK";

  const add = () =>
    cart.add({ variantId: v.id, productId: product.id, slug: product.slug, name: product.name, variantName: v.name, image: product.image, price });

  return (
    <div className="space-y-4">
      {variants.length > 1 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-gray-900">Chọn cấu hình:</p>
          <div className="grid grid-cols-2 gap-2">
            {variants.map((x) => {
              const on = x.id === v.id;
              return (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => setId(x.id)}
                  aria-pressed={on}
                  className={`relative rounded-lg border p-2.5 text-left text-sm transition ${
                    on ? "border-brand-600 bg-brand-50" : "border-gray-200 bg-white hover:border-brand-300"
                  } ${x.stockStatus === "OUT_OF_STOCK" ? "opacity-50" : ""}`}
                >
                  <span className="block font-semibold text-gray-900">{x.name}</span>
                  <span className="block text-brand-600">{formatVND(x.salePrice ?? x.price)}</span>
                  {x.stockStatus !== "IN_STOCK" && (
                    <span className="text-xs text-gray-500">{x.stockStatus === "INCOMING" ? "Đang về" : "Hết hàng"}</span>
                  )}
                  {on && <Check size={16} className="absolute top-2 right-2 text-brand-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-gradient-to-r from-brand-50 to-white p-4 ring-1 ring-brand-100">
        <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
          <span className="text-3xl font-bold text-brand-600">{formatVND(price)}</span>
          {pct > 0 && (
            <>
              <span className="text-gray-500 line-through">{formatVND(v.price)}</span>
              <span className="rounded bg-brand-600 px-1.5 py-0.5 text-xs font-bold text-white">-{pct}%</span>
            </>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Giá đã bao gồm VAT. Trả góp chỉ từ <b>{formatVND(Math.ceil(price / 12 / 1000) * 1000)}</b>/tháng (12 tháng).
        </p>
      </div>

      {sellable ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              add();
              router.push("/thanh-toan");
            }}
            className="btn-primary col-span-2 flex-col py-3"
          >
            <span className="text-base uppercase">Đặt mua ngay</span>
            <span className="text-xs font-normal opacity-90">Giao tận nơi hoặc nhận tại cửa hàng</span>
          </button>
          <button
            onClick={() => {
              add();
              setAdded(true);
              setTimeout(() => setAdded(false), 2500);
            }}
            className="btn-outline py-3"
          >
            {added ? <Check size={18} /> : <ShoppingCart size={18} />} {added ? "Đã thêm" : "Thêm vào giỏ"}
          </button>
          <button
            onClick={() => {
              add();
              router.push("/thanh-toan?tra-gop=1");
            }}
            className="btn flex-col bg-sky-600 py-2 text-white hover:bg-sky-700"
          >
            <span className="flex items-center gap-1.5">
              <CreditCard size={16} /> Mua trả góp 0%
            </span>
            <span className="text-[11px] font-normal opacity-90">Thẻ tín dụng / CTTC</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            Phiên bản này {v.stockStatus === "INCOMING" ? "đang về hàng" : "tạm hết hàng"}. Gọi <b>{hotline}</b> để đặt trước hoặc được tư vấn
            máy tương đương.
          </p>
          <a href={`tel:${hotline.replace(/\s/g, "")}`} className="btn-primary w-full py-3">
            Gọi đặt trước {hotline}
          </a>
        </div>
      )}
      {added && (
        <p role="status" className="text-center text-sm text-emerald-700">
          Đã thêm vào giỏ hàng.{" "}
          <Link href="/gio-hang" className="underline">Xem giỏ hàng</Link>
        </p>
      )}
    </div>
  );
}
