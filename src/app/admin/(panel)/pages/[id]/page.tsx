import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActionForm, Check, ConfirmButton, Field, SeoFields, SubmitButton } from "@/components/admin/ui";
import { RichEditor } from "@/components/admin/RichEditor";
import { deletePage, savePage } from "../../../actions";

export default async function PageEdit({ params }: PageProps<"/admin/pages/[id]">) {
  await requireStaff("pages");
  const { id } = await params;
  const p = id === "new" ? null : await prisma.page.findUnique({ where: { id } });
  if (id !== "new" && !p) notFound();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/pages" className="text-sm text-gray-500 hover:text-brand-600">
          ← Trang
        </Link>
        <h1 className="text-2xl font-bold">{p?.title ?? "Thêm trang"}</h1>
      </div>
      <ActionForm action={savePage} className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <input type="hidden" name="id" value={p?.id ?? ""} />
        <section className="card min-w-0 space-y-3 p-4">
          <Field label="Tiêu đề (H1)" name="title" defaultValue={p?.title} required />
          <RichEditor name="content" defaultValue={p?.content} minHeight={400} />
        </section>
        <div className="space-y-4">
          <section className="card space-y-3 p-4">
            <Check label="Hiển thị" name="published" defaultChecked={p?.published ?? true} />
            <Check label="Hiện link ở footer" name="showInFooter" defaultChecked={p?.showInFooter ?? true} />
            <SubmitButton className="btn-primary w-full">Lưu trang</SubmitButton>
          </section>
          <SeoFields values={p ?? {}} />
        </div>
      </ActionForm>
      {p && (
        <form action={deletePage}>
          <input type="hidden" name="id" value={p.id} />
          <ConfirmButton message="Xóa trang này?">Xóa trang</ConfirmButton>
        </form>
      )}
    </div>
  );
}
