import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActionForm, Check, ConfirmButton, Field, SeoFields, Select, SubmitButton } from "@/components/admin/ui";
import { RichEditor } from "@/components/admin/RichEditor";
import { deleteBrand, deleteCategory, saveBrand, saveCategory } from "../../../../actions";

export default async function CatalogEdit({ params }: PageProps<"/admin/catalog/[type]/[id]">) {
  await requireStaff("catalog");
  const { type, id } = await params;
  if (type !== "category" && type !== "brand") notFound();
  const isNew = id === "new";

  if (type === "category") {
    const c = isNew ? null : await prisma.category.findUnique({ where: { id } });
    if (!isNew && !c) notFound();
    return (
      <div className="space-y-4">
        <Header title={c?.name ?? "Thêm danh mục"} />
        <ActionForm action={saveCategory} className="grid gap-4 xl:grid-cols-[1fr_380px]">
          <input type="hidden" name="id" value={c?.id ?? ""} />
          <div className="space-y-4">
            <section className="card grid gap-3 p-4 md:grid-cols-2">
              <Field label="Tên danh mục" name="name" defaultValue={c?.name} required />
              <Select
                label="Biểu tượng"
                name="icon"
                defaultValue={c?.icon}
                options={{ briefcase: "Văn phòng", gamepad: "Gaming", palette: "Đồ họa", feather: "Mỏng nhẹ", code: "Lập trình", laptop: "Laptop" }}
              />
              <Field label="Mô tả ngắn (dưới tiêu đề H1)" name="shortDesc" defaultValue={c?.shortDesc} className="md:col-span-2" />
              <Field label="Thứ tự" name="sortOrder" type="number" defaultValue={c?.sortOrder ?? 0} />
              <div className="flex items-end pb-2">
                <Check label="Hiện ở trang chủ" name="showOnHome" defaultChecked={c?.showOnHome ?? true} />
              </div>
            </section>
            <section className="card space-y-2 p-4">
              <h2 className="font-semibold">Nội dung SEO cuối trang danh mục</h2>
              <RichEditor name="content" defaultValue={c?.content} minHeight={220} />
            </section>
          </div>
          <div className="space-y-4">
            <SeoFields values={c ?? {}} />
            <SubmitButton className="btn-primary w-full">Lưu danh mục</SubmitButton>
          </div>
        </ActionForm>
        {c && (
          <form action={deleteCategory}>
            <input type="hidden" name="id" value={c.id} />
            <ConfirmButton message="Xóa danh mục này? Sản phẩm sẽ không bị xóa.">Xóa danh mục</ConfirmButton>
          </form>
        )}
      </div>
    );
  }

  const b = isNew ? null : await prisma.brand.findUnique({ where: { id } });
  if (!isNew && !b) notFound();
  return (
    <div className="space-y-4">
      <Header title={b?.name ?? "Thêm thương hiệu"} />
      <ActionForm action={saveBrand} className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <input type="hidden" name="id" value={b?.id ?? ""} />
        <section className="card grid h-fit gap-3 p-4 md:grid-cols-2">
          <Field label="Tên thương hiệu" name="name" defaultValue={b?.name} required />
          <Field label="Thứ tự" name="sortOrder" type="number" defaultValue={b?.sortOrder ?? 0} />
          <Field label="Mô tả (dưới tiêu đề trang)" name="description" defaultValue={b?.description} textarea className="md:col-span-2" />
        </section>
        <div className="space-y-4">
          <SeoFields values={b ?? {}} hideCanonical />
          <SubmitButton className="btn-primary w-full">Lưu thương hiệu</SubmitButton>
        </div>
      </ActionForm>
      {b && (
        <form action={deleteBrand}>
          <input type="hidden" name="id" value={b.id} />
          <ConfirmButton message="Xóa thương hiệu này?">Xóa thương hiệu</ConfirmButton>
        </form>
      )}
    </div>
  );
}

function Header({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <Link href="/admin/catalog" className="text-sm text-gray-500 hover:text-brand-600">
        ← Danh mục
      </Link>
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
  );
}
