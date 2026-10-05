import type { Metadata } from "next";
import { getCustomer } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { vnpayEnabled } from "@/lib/vnpay";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = { title: "Thanh toán", robots: { index: false } };

export default async function CheckoutPage({ searchParams }: PageProps<"/thanh-toan">) {
  const [customer, s, sp] = await Promise.all([getCustomer(), getSettings(), searchParams]);
  return (
    <div className="container-x py-6">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Thông tin đặt hàng</h1>
      <CheckoutForm
        customer={customer}
        installment={sp["tra-gop"] === "1"}
        vnpay={vnpayEnabled()}
        shipping={{ fee: Number(s.shippingFee), freeThreshold: Number(s.freeShipThreshold) }}
      />
    </div>
  );
}
