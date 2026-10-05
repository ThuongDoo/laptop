import Link from "next/link";
import { Plus } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export default async function PostsAdmin() {
  await requireStaff("posts");
  const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bài viết</h1>
        <Link href="/admin/posts/new" className="btn-primary">
          <Plus size={16} /> Viết bài
        </Link>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
            <tr>
              <th className="p-3">Tiêu đề</th>
              <th>Tác giả</th>
              <th>Ngày</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {posts.map((p) => (
              <tr key={p.id}>
                <td className="p-3">
                  <Link href={`/admin/posts/${p.id}`} className="font-medium hover:text-brand-600">
                    {p.title}
                  </Link>
                  <span className="block text-xs text-gray-500">/tin-tuc/{p.slug}</span>
                </td>
                <td>{p.author?.name ?? "—"}</td>
                <td>{formatDate(p.createdAt)}</td>
                <td>{p.published ? <span className="text-emerald-600">Đã đăng</span> : <span className="text-gray-400">Nháp</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
