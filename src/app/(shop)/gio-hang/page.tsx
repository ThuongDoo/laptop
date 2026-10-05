import type { Metadata } from "next";
import { CartView } from "./CartView";

export const metadata: Metadata = { title: "Giỏ hàng", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-x py-6">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Giỏ hàng của bạn</h1>
      <CartView />
    </div>
  );
}
