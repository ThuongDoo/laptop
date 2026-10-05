import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatVND } from "@/lib/format";

// Khách hàng = tài khoản đã đăng ký + khách mua không cần tài khoản (gom theo SĐT)
export default async function CustomersAdmin({ searchParams }: PageProps<"/admin/customers">) {
  await requireStaff("customers");
  const q = String((await searchParams).q ?? "").trim();
  const groups = await prisma.order.groupBy({
    by: ["phone"],
    where: { status: { not: "CANCELLED" }, ...(q ? { OR: [{ phone: { contains: q } }, { name: { contains: q } }] } : {}) },
    _sum: { total: true },
    _count: true,
    _max: { createdAt: true },
    orderBy: { _sum: { total: "desc" } },
    take: 200,
  });
  const phones = groups.map((g) => g.phone);
  const [accounts, latest] = await Promise.all([
    prisma.customer.findMany({ where: { phone: { in: phones }, passwordHash: { not: null } }, select: { phone: true, email: true } }),
    prisma.order.findMany({ where: { phone: { in: phones } }, orderBy: { createdAt: "desc" }, distinct: ["phone"], select: { phone: true, name: true, email: true } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Khách hàng ({groups.length})</h1>
      <form className="card flex gap-2 p-3">
        <input name="q" defaultValue={q} placeholder="Tìm theo tên hoặc SĐT" className="input max-w-xs" />
        <button className="btn-ghost">Tìm</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
            <tr>
              <th className="p-3">Khách hàng</th>
              <th>Email</th>
              <th className="text-right">Số đơn</th>
              <th className="text-right">Tổng chi tiêu</th>
              <th className="pr-3 text-right">Đơn gần nhất</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {groups.map((g) => {
              const info = latest.find((l) => l.phone === g.phone);
              const acc = accounts.find((a) => a.phone === g.phone);
              return (
                <tr key={g.phone}>
                  <td className="p-3">
                    <Link href={`/admin/orders?q=${g.phone}`} className="font-medium hover:text-brand-600">
                      {info?.name}
                    </Link>
                    <span className="block text-xs text-gray-500">
                      {g.phone} {acc && <span className="text-emerald-600">· có tài khoản</span>}
                    </span>
                  </td>
                  <td>{acc?.email || info?.email || "—"}</td>
                  <td className="text-right">{g._count}</td>
                  <td className="text-right font-semibold">{formatVND(g._sum.total)}</td>
                  <td className="pr-3 text-right text-gray-500">{g._max.createdAt && formatDate(g._max.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
