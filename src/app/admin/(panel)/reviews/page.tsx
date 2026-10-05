import Link from "next/link";
import Image from "next/image";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { Stars } from "@/components/shop/Stars";
import { ConfirmButton } from "@/components/admin/ui";
import { moderateReview } from "../../actions";

export default async function ReviewsAdmin({ searchParams }: PageProps<"/admin/reviews">) {
  await requireStaff("reviews");
  const tab = (await searchParams).tab === "all" ? "all" : "pending";
  const reviews = await prisma.review.findMany({
    where: tab === "pending" ? { approved: false } : {},
    include: { product: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Đánh giá & bình luận</h1>
      <nav className="flex gap-2">
        <Link href="/admin/reviews" className={`chip ${tab === "pending" ? "chip-active" : ""}`}>
          Chờ duyệt
        </Link>
        <Link href="/admin/reviews?tab=all" className={`chip ${tab === "all" ? "chip-active" : ""}`}>
          Tất cả
        </Link>
      </nav>
      <ul className="space-y-3">
        {reviews.map((r) => {
          const imgs: string[] = r.images ? JSON.parse(r.images) : [];
          return (
            <li key={r.id} className="card space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <b>{r.name}</b>
                {r.phone && <span className="text-gray-500">{r.phone}</span>}
                <Stars value={r.rating} size={14} />
                <span className="text-xs text-gray-400">{formatDate(r.createdAt, true)}</span>
                <span className={`rounded-full px-2 text-xs ${r.approved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {r.approved ? "Đã duyệt" : "Chờ duyệt"}
                </span>
                <Link href={`/${r.product.slug}#danh-gia`} target="_blank" className="ml-auto text-xs text-brand-600">
                  {r.product.name}
                </Link>
              </div>
              <p className="text-sm">{r.content}</p>
              {imgs.length > 0 && (
                <div className="flex gap-2">
                  {imgs.map((src) => (
                    <a key={src} href={src} target="_blank" className="relative h-16 w-16 overflow-hidden rounded">
                      <Image src={src} alt="" fill sizes="64px" className="object-cover" />
                    </a>
                  ))}
                </div>
              )}
              <form action={moderateReview} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={r.id} />
                <input name="reply" defaultValue={r.reply ?? ""} placeholder="Phản hồi của shop..." className="input max-w-md flex-1" />
                <button name="op" value="reply" className="btn-ghost py-1.5">
                  Trả lời & duyệt
                </button>
                {r.approved ? (
                  <button name="op" value="hide" className="btn-ghost py-1.5">
                    Ẩn
                  </button>
                ) : (
                  <button name="op" value="approve" className="btn-primary py-1.5">
                    Duyệt
                  </button>
                )}
              </form>
              <form action={moderateReview}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="op" value="delete" />
                <ConfirmButton message="Xóa đánh giá này?">Xóa</ConfirmButton>
              </form>
            </li>
          );
        })}
        {!reviews.length && <li className="card p-8 text-center text-gray-400">Không có đánh giá nào.</li>}
      </ul>
    </div>
  );
}
