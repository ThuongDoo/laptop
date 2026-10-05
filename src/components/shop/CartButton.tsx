"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { cartCount, useCart } from "@/components/cart/cart-store";

export function CartButton() {
  const count = cartCount(useCart());
  return (
    <Link href="/gio-hang" className="relative flex items-center gap-1.5 text-sm" aria-label={`Giỏ hàng (${count} sản phẩm)`}>
      <ShoppingCart size={24} />
      <span className="hidden xl:inline">Giỏ hàng</span>
      {count > 0 && (
        <span className="absolute -top-2 left-4 min-w-5 rounded-full bg-yellow-400 px-1 text-center text-xs font-bold text-gray-900">
          {count}
        </span>
      )}
    </Link>
  );
}
