import Link from "next/link";
import Image from "next/image";
import type { Prisma } from "@prisma/client";
import { Plus } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatVND, normalizeSearch } from "@/lib/format";
import { CONDITIONS, STOCK_STATUS } from "@/lib/constants";
import { setVariantStock } from "../../actions";

export default async function ProductsAdmin({ searchParams }: PageProps<"/admin/products">) {
  await requireStaff("products");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const stock = typeof sp.stock === "string" ? sp.stock : "";
  const brand = typeof sp.brand === "string" ? sp.brand : "";
  const where: Prisma.ProductWhereInput = {
    AND: [
      ...normalizeSearch(q)
        .split(" ")
        .filter(Boolean)
        .map((w) => ({ searchText: { contains: w } })),
      stock ? { variants: { some: { stockStatus: stock } } } : {},
      brand ? { brandId: brand } : {},
    ],
  };
  const [products, brands] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { brand: true, images: { take: 1, orderBy: { sortOrder: "asc" } }, variants: { orderBy: { sortOrder: "asc" } } },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
    prisma.brand.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Sản phẩm ({products.length})</h1>
        <Link href="/admin/products/new" className="btn-primary">
          <Plus size={16} /> Thêm sản phẩm
        </Link>
      </div>
      <form className="card flex flex-wrap gap-2 p-3">
        <input name="q" defaultValue={q} placeholder="Tìm tên, CPU, mã..." className="input max-w-xs" />
        <select name="brand" defaultValue={brand} className="input max-w-[160px]">
          <option value="">Tất cả hãng</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select name="stock" defaultValue={stock} className="input max-w-[160px]">
          <option value="">Mọi tình trạng kho</option>
          {Object.entries(STOCK_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button className="btn-ghost">Lọc</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
            <tr>
              <th className="p-3">Sản phẩm</th>
              <th>Hãng</th>
              <th>Tình trạng</th>
              <th>Biến thể · Giá · Kho</th>
              <th>Hiển thị</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => (
              <tr key={p.id} className="align-top">
                <td className="p-3">
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 font-medium hover:text-brand-600">
                    <span className="relative h-12 w-14 shrink-0 overflow-hidden rounded bg-gray-50">
                      {p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="56px" className="object-contain" />}
                    </span>
                    <span>
                      {p.name}
                      <span className="block text-xs font-normal text-gray-500">
                        {p.sku} · /{p.slug}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="py-3">{p.brand.name}</td>
                <td className="py-3">{CONDITIONS[p.condition]}</td>
                <td className="space-y-1 py-3">
                  {p.variants.map((v) => (
                    <form key={v.id} action={setVariantStock} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={v.id} />
                      <span className="w-36 truncate">{v.name}</span>
                      <span className="w-24 text-right font-semibold">{formatVND(v.salePrice ?? v.price)}</span>
                      <select
                        name="stockStatus"
                        defaultValue={v.stockStatus}
                        className={`rounded border px-1 py-0.5 text-xs ${v.stockStatus === "IN_STOCK" ? "border-emerald-300 text-emerald-700" : v.stockStatus === "INCOMING" ? "border-amber-300 text-amber-700" : "border-gray-300 text-gray-500"}`}
                      >
                        {Object.entries(STOCK_STATUS).map(([k, l]) => (
                          <option key={k} value={k}>
                            {l}
                          </option>
                        ))}
                      </select>
                      <button className="text-xs text-brand-600 hover:underline">Lưu</button>
                    </form>
                  ))}
                </td>
                <td className="py-3">
                  {p.published ? <span className="text-emerald-600">Đang bán</span> : <span className="text-gray-400">Ẩn</span>}
                  {p.featured && <span className="ml-1 rounded bg-amber-100 px-1 text-xs text-amber-700">Nổi bật</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
