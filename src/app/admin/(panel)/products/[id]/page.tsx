import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";
import { ConfirmButton } from "@/components/admin/ui";
import { deleteProduct } from "../../../actions";

export default async function EditProduct({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  await requireStaff("products");
  const { id } = await params;
  const isNew = id === "new";
  const [product, brands, categories] = await Promise.all([
    isNew
      ? null
      : prisma.product.findUnique({
          where: { id },
          include: { categories: true, images: { orderBy: { sortOrder: "asc" } }, variants: { orderBy: { sortOrder: "asc" } } },
        }),
    prisma.brand.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!isNew && !product) notFound();
  const saved = (await searchParams).saved;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/products" className="text-sm text-gray-500 hover:text-brand-600">
          ← Sản phẩm
        </Link>
        <h1 className="text-2xl font-bold">{isNew ? "Thêm sản phẩm" : product!.name}</h1>
        {product && (
          <Link href={`/${product.slug}`} target="_blank" className="flex items-center gap-1 text-sm text-brand-600">
            Xem trên web <ExternalLink size={14} />
          </Link>
        )}
        {product && (
          <form action={deleteProduct} className="ml-auto">
            <input type="hidden" name="id" value={product.id} />
            <ConfirmButton message="Xóa sản phẩm này? Sản phẩm đã có đơn hàng sẽ được ẩn thay vì xóa.">Xóa sản phẩm</ConfirmButton>
          </form>
        )}
      </div>
      {saved && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Đã tạo sản phẩm.</p>}
      <ProductForm product={product} brands={brands} categories={categories} />
    </div>
  );
}
