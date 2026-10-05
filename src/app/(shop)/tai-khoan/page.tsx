import type { Metadata } from "next";
import Link from "next/link";
import { getCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { orderToken } from "@/lib/order-token";
import { formatDate, formatVND } from "@/lib/format";
import { ORDER_STATUS } from "@/lib/constants";
import { customerLogout } from "../actions";
import { AuthForms } from "./AuthForms";

export const metadata: Metadata = { title: "Tài khoản", robots: { index: false } };

export default async function AccountPage({ searchParams }: PageProps<"/tai-khoan">) {
  const next = (await searchParams).next;
  const customer = await getCustomer();
  if (!customer) {
    return (
      <div className="container-x py-8">
        <AuthForms next={typeof next === "string" ? next : undefined} />
      </div>
    );
  }
  const orders = await prisma.order.findMany({ where: { customerId: customer.id }, orderBy: { createdAt: "desc" } });
  return (
    <div className="container-x py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Xin chào, {customer.name}</h1>
        <form action={customerLogout}>
          <button className="btn-ghost">Đăng xuất</button>
        </form>
      </div>
      <section className="card overflow-x-auto p-4">
        <h2 className="mb-3 font-bold">Lịch sử đơn hàng</h2>
        {orders.length ? (
          <table className="w-full min-w-[560px] text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="py-2">Mã đơn</th>
                <th>Ngày đặt</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="py-2">
                    <Link href={`/dat-hang/${o.code}?t=${orderToken(o.code)}`} className="font-medium text-brand-600 hover:underline">
                      #{o.code}
                    </Link>
                  </td>
                  <td>{formatDate(o.createdAt)}</td>
                  <td className="font-semibold">{formatVND(o.total)}</td>
                  <td>{ORDER_STATUS[o.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-500">Bạn chưa có đơn hàng nào.</p>
        )}
      </section>
    </div>
  );
}
