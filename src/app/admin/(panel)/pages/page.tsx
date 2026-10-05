import Link from "next/link";
import { Plus } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export default async function PagesAdmin() {
  await requireStaff("pages");
  const pages = await prisma.page.findMany({ orderBy: { title: "asc" } });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trang thông tin</h1>
        <Link href="/admin/pages/new" className="btn-primary">
          <Plus size={16} /> Thêm trang
        </Link>
      </div>
      <div className="card divide-y divide-gray-100">
        {pages.map((p) => (
          <Link key={p.id} href={`/admin/pages/${p.id}`} className="flex items-center gap-3 p-3 text-sm hover:bg-gray-50">
            <span className="flex-1 font-medium">{p.title}</span>
            <span className="text-gray-500">/{p.slug}</span>
            <span className="text-xs text-gray-400">{formatDate(p.updatedAt)}</span>
            {!p.published && <span className="text-xs text-gray-400">Ẩn</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
