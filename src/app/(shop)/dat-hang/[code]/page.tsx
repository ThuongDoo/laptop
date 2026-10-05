import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { verifyOrderToken } from "@/lib/order-token";
import { getSettings } from "@/lib/settings";
import { OrderSummary } from "@/components/shop/OrderSummary";

export const metadata: Metadata = { title: "Đặt hàng thành công", robots: { index: false } };

export default async function OrderDonePage({ params, searchParams }: PageProps<"/dat-hang/[code]">) {
  const { code } = await params;
  const sp = await searchParams;
  if (!verifyOrderToken(code, typeof sp.t === "string" ? sp.t : undefined)) notFound();
  const [order, s] = await Promise.all([prisma.order.findUnique({ where: { code }, include: { items: true } }), getSettings()]);
  if (!order) notFound();
  const vnpFailed = sp.vnp === "fail";

  return (
    <div className="container-x py-6">
      <div className={`card mb-4 flex items-start gap-3 p-4 md:p-6 ${vnpFailed ? "ring-amber-200" : "ring-emerald-200"}`}>
        {vnpFailed ? <XCircle className="shrink-0 text-amber-600" size={32} /> : <CheckCircle2 className="shrink-0 text-emerald-600" size={32} />}
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {vnpFailed ? "Thanh toán VNPAY chưa thành công" : sp.vnp === "success" ? "Thanh toán thành công!" : "Đặt hàng thành công!"}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {vnpFailed
              ? `Đơn hàng #${order.code} đã được ghi nhận nhưng chưa thanh toán. Nhân viên sẽ liên hệ để hỗ trợ, hoặc gọi ${s.hotline}.`
              : `Cảm ơn ${order.name}! Nhân viên ${s.shopName} sẽ gọi xác nhận đơn #${order.code} trong ít phút.`}
          </p>
          <p className="mt-2 text-xs text-gray-500">Lưu lại đường dẫn trang này hoặc dùng mục “Tra cứu đơn hàng” với mã đơn & số điện thoại.</p>
        </div>
      </div>
      <OrderSummary order={order} />
      <div className="mt-6 text-center">
        <Link href="/laptop" className="btn-outline">
          Tiếp tục mua sắm
        </Link>
      </div>
    </div>
  );
}
