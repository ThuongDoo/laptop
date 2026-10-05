import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActionForm, Check, ConfirmButton, Field, SeoFields, SubmitButton } from "@/components/admin/ui";
import { RichEditor } from "@/components/admin/RichEditor";
import { deletePost, savePost } from "../../../actions";

export default async function PostEdit({ params }: PageProps<"/admin/posts/[id]">) {
  await requireStaff("posts");
  const { id } = await params;
  const p = id === "new" ? null : await prisma.post.findUnique({ where: { id } });
  if (id !== "new" && !p) notFound();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/posts" className="text-sm text-gray-500 hover:text-brand-600">
          ← Bài viết
        </Link>
        <h1 className="text-2xl font-bold">{p ? "Sửa bài viết" : "Viết bài mới"}</h1>
        {p && (
          <Link href={`/tin-tuc/${p.slug}`} target="_blank" className="text-sm text-brand-600">
            Xem bài ↗
          </Link>
        )}
      </div>
      <ActionForm action={savePost} className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <input type="hidden" name="id" value={p?.id ?? ""} />
        <input type="hidden" name="currentCover" value={p?.cover ?? ""} />
        <div className="min-w-0 space-y-4">
          <section className="card space-y-3 p-4">
            <Field label="Tiêu đề (H1)" name="title" defaultValue={p?.title} required />
            <Field label="Tóm tắt" name="excerpt" defaultValue={p?.excerpt} textarea rows={2} />
          </section>
          <section className="card space-y-2 p-4">
            <p className="text-xs text-gray-500">Dùng H2/H3 cho các mục trong bài để chuẩn cấu trúc heading.</p>
            <RichEditor name="content" defaultValue={p?.content} minHeight={420} />
          </section>
        </div>
        <div className="space-y-4">
          <section className="card space-y-3 p-4">
            <Check label="Đăng bài (bỏ chọn = lưu nháp)" name="published" defaultChecked={p?.published ?? true} />
            <div>
              <p className="label">Ảnh đại diện</p>
              {p?.cover && (
                <div className="relative mb-2 aspect-[16/9] overflow-hidden rounded-lg">
                  <Image src={p.cover} alt="" fill sizes="380px" className="object-cover" />
                </div>
              )}
              <input type="file" name="cover" accept="image/*" className="text-sm" />
            </div>
            <SubmitButton className="btn-primary w-full">Lưu bài viết</SubmitButton>
          </section>
          <SeoFields values={p ?? {}} slugPrefix="/tin-tuc/" />
        </div>
      </ActionForm>
      {p && (
        <form action={deletePost}>
          <input type="hidden" name="id" value={p.id} />
          <ConfirmButton message="Xóa bài viết này?">Xóa bài viết</ConfirmButton>
        </form>
      )}
    </div>
  );
}
