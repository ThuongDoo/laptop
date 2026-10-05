import Link from "next/link";
import { Plus } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CatalogAdmin({ searchParams }: PageProps<"/admin/catalog">) {
  await requireStaff("catalog");
  const sp = await searchParams;
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } }),
    prisma.brand.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } }),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Danh mục & Thương hiệu</h1>
      {sp.error === "brand-in-use" && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Không thể xóa thương hiệu đang có sản phẩm.</p>}
      <div className="grid gap-6 xl:grid-cols-2">
        {[
          { title: "Danh mục theo nhu cầu", type: "category", rows: categories },
          { title: "Thương hiệu", type: "brand", rows: brands },
        ].map((g) => (
          <section key={g.type} className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">{g.title}</h2>
              <Link href={`/admin/catalog/${g.type}/new`} className="btn-ghost py-1.5">
                <Plus size={14} /> Thêm
              </Link>
            </div>
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-gray-500">
                <tr>
                  <th className="py-1">Tên</th>
                  <th>URL</th>
                  <th className="text-right">Sản phẩm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {g.rows.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2">
                      <Link href={`/admin/catalog/${g.type}/${r.id}`} className="font-medium hover:text-brand-600">
                        {r.name}
                      </Link>
                    </td>
                    <td className="text-gray-500">/{r.slug}</td>
                    <td className="text-right">{r._count.products}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </div>
  );
}
