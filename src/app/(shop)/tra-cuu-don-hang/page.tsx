import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { orderToken } from "@/lib/order-token";
import { Breadcrumbs } from "@/components/shop/Breadcrumbs";

export const metadata: Metadata = { title: "Tra cứu đơn hàng", alternates: { canonical: "/tra-cuu-don-hang" } };

export default async function TrackPage({ searchParams }: PageProps<"/tra-cuu-don-hang">) {
  const sp = await searchParams;
  const code = typeof sp.code === "string" ? sp.code.trim().toUpperCase() : "";
  const phone = typeof sp.phone === "string" ? sp.phone.trim() : "";
  let notFoundMsg = false;
  if (code && phone) {
    const order = await prisma.order.findFirst({ where: { code, phone }, select: { code: true } });
    if (order) redirect(`/dat-hang/${order.code}?t=${orderToken(order.code)}`);
    notFoundMsg = true;
  }
  return (
    <>
      <Breadcrumbs items={[{ name: "Tra cứu đơn hàng", path: "/tra-cuu-don-hang" }]} />
      <div className="container-x">
        <form className="card mx-auto max-w-md space-y-3 p-6">
          <h1 className="text-xl font-bold text-gray-900">Tra cứu đơn hàng</h1>
          <p className="text-sm text-gray-500">Nhập mã đơn (trong email/SMS xác nhận) và số điện thoại đặt hàng.</p>
          <input name="code" required defaultValue={code} placeholder="Mã đơn hàng, VD: LL2610051234" className="input uppercase" />
          <input name="phone" required defaultValue={phone} placeholder="Số điện thoại" inputMode="tel" className="input" />
          {notFoundMsg && <p className="text-sm text-red-600">Không tìm thấy đơn hàng khớp thông tin.</p>}
          <button className="btn-primary w-full">Tra cứu</button>
        </form>
      </div>
    </>
  );
}
