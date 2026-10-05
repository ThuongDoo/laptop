import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { formatDate, formatVND } from "@/lib/format";
import { ORDER_STATUS } from "@/lib/constants";
import { BarChart } from "@/components/admin/BarChart";

const VN = 7 * 3600_000;
const vnDay = (d: Date) => new Date(d.getTime() + VN).toISOString().slice(0, 10);

export default async function Dashboard({ searchParams }: PageProps<"/admin">) {
  const user = await requireStaff("dashboard");
  const sp = await searchParams;
  const byMonth = sp.range === "thang";
  const showSales = can(user.role, "orders");

  if (!showSales) {
    const [products, posts, reviews] = await Promise.all([
      prisma.product.count(),
      prisma.post.count(),
      prisma.review.count({ where: { approved: false } }),
    ]);
    return (
      <div className="space-y-4">
        {sp.denied && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Bạn không có quyền truy cập mục đó.</p>}
        <h1 className="text-2xl font-bold">Xin chào, {user.name}</h1>
        <div className="grid gap-4 sm:grid-cols-3">
          <Tile label="Sản phẩm" value={String(products)} href="/admin/products" />
          <Tile label="Bài viết" value={String(posts)} href="/admin/posts" />
          <Tile label="Đánh giá chờ duyệt" value={String(reviews)} href="/admin/reviews" />
        </div>
      </div>
    );
  }

  const now = new Date();
  const todayKey = vnDay(now);
  const start = byMonth ? new Date(now.getFullYear(), now.getMonth() - 11, 1) : new Date(now.getTime() - 29 * 86400_000);
  const [completed, pending, newCount, top] = await Promise.all([
    prisma.order.findMany({
      where: { status: "COMPLETED", createdAt: { gte: new Date(Math.min(start.getTime(), new Date(now.getFullYear(), now.getMonth(), 1).getTime()) - VN) } },
      select: { total: true, createdAt: true },
    }),
    prisma.order.findMany({ where: { status: { in: ["NEW", "CONFIRMED"] } }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.order.count({ where: { status: "NEW" } }),
    prisma.orderItem.groupBy({
      by: ["productId", "productName"],
      where: { order: { status: "COMPLETED", createdAt: { gte: start } } },
      _sum: { quantity: true, price: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  // Gom doanh thu theo ngày (30 ngày) hoặc theo tháng (12 tháng), theo giờ Việt Nam
  const buckets = new Map<string, { key: string; label: string; value: number; count: number }>();
  if (byMonth) {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets.set(key, { key, label: `T${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`, value: 0, count: 0 });
    }
  } else {
    for (let i = 29; i >= 0; i--) {
      const key = vnDay(new Date(now.getTime() - i * 86400_000));
      buckets.set(key, { key, label: `${key.slice(8)}/${key.slice(5, 7)}`, value: 0, count: 0 });
    }
  }
  let today = 0;
  let month = 0;
  const monthKey = todayKey.slice(0, 7);
  for (const o of completed) {
    const day = vnDay(o.createdAt);
    const b = buckets.get(byMonth ? day.slice(0, 7) : day);
    if (b) {
      b.value += o.total;
      b.count++;
    }
    if (day === todayKey) today += o.total;
    if (day.startsWith(monthKey)) month += o.total;
  }
  const series = [...buckets.values()];
  const rangeTotal = series.reduce((s, b) => s + b.value, 0);

  return (
    <div className="space-y-6">
      {sp.denied && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Bạn không có quyền truy cập mục đó.</p>}
      <h1 className="text-2xl font-bold">Tổng quan</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="Doanh thu hôm nay" value={formatVND(today)} />
        <Tile label="Doanh thu tháng này" value={formatVND(month)} />
        <Tile label={byMonth ? "Doanh thu 12 tháng" : "Doanh thu 30 ngày"} value={formatVND(rangeTotal)} />
        <Tile label="Đơn mới chờ xử lý" value={String(newCount)} href="/admin/orders?status=NEW" accent />
      </div>

      <section className="card p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Doanh thu {byMonth ? "theo tháng" : "theo ngày"} (đơn thành công)</h2>
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1 text-sm">
            <Link href="/admin" className={`rounded-md px-3 py-1 ${!byMonth ? "bg-white shadow-sm" : "text-gray-600"}`}>
              30 ngày
            </Link>
            <Link href="/admin?range=thang" className={`rounded-md px-3 py-1 ${byMonth ? "bg-white shadow-sm" : "text-gray-600"}`}>
              12 tháng
            </Link>
          </div>
        </div>
        <BarChart data={series} label={`Doanh thu ${byMonth ? "theo tháng" : "theo ngày"}`} />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-4">
          <h2 className="mb-3 font-semibold">Top sản phẩm bán chạy ({byMonth ? "12 tháng" : "30 ngày"})</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-gray-500">
              <tr>
                <th className="py-1">#</th>
                <th>Sản phẩm</th>
                <th className="text-right">Đã bán</th>
              </tr>
            </thead>
            <tbody>
              {top.map((t, i) => (
                <tr key={t.productId ?? t.productName} className="border-t border-gray-100">
                  <td className="py-2 text-gray-400">{i + 1}</td>
                  <td>{t.productId ? <Link href={`/admin/products/${t.productId}`} className="hover:text-brand-600">{t.productName}</Link> : t.productName}</td>
                  <td className="text-right font-semibold">{t._sum.quantity}</td>
                </tr>
              ))}
              {!top.length && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-gray-400">
                    Chưa có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
        <section className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Đơn hàng chờ xử lý</h2>
            <Link href="/admin/orders" className="text-sm text-brand-600">
              Tất cả →
            </Link>
          </div>
          <ul className="divide-y divide-gray-100 text-sm">
            {pending.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 py-2 hover:bg-gray-50">
                  <span className="font-medium text-brand-600">#{o.code}</span>
                  <span className="flex-1 truncate">{o.name}</span>
                  <span className="text-xs text-gray-500">{formatDate(o.createdAt, true)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${o.status === "NEW" ? "bg-brand-50 text-brand-700" : "bg-sky-50 text-sky-700"}`}>
                    {ORDER_STATUS[o.status]}
                  </span>
                </Link>
              </li>
            ))}
            {!pending.length && <li className="py-4 text-center text-gray-400">Không có đơn chờ</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Tile({ label, value, href, accent }: { label: string; value: string; href?: string; accent?: boolean }) {
  const inner = (
    <>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? "text-brand-600" : "text-gray-900"}`}>{value}</p>
    </>
  );
  return href ? (
    <Link href={href} className="card block p-4 hover:ring-brand-200">
      {inner}
    </Link>
  ) : (
    <div className="card p-4">{inner}</div>
  );
}
