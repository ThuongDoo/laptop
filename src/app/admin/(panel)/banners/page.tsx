import Image from "next/image";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActionForm, Check, ConfirmButton, Field, SubmitButton } from "@/components/admin/ui";
import { deleteBanner, saveBanner } from "../../actions";

export default async function BannersAdmin() {
  await requireStaff("banners");
  const banners = await prisma.banner.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Banner trang chủ</h1>
      <p className="text-sm text-gray-500">Tỉ lệ ảnh 8:3 (khuyến nghị 1600×600). Tiêu đề hiển thị dạng chữ trên ảnh để tốt cho SEO & tốc độ tải.</p>
      {[...banners, null].map((b) => (
        <div key={b?.id ?? "new"} className="card p-4">
          <ActionForm action={saveBanner} className="grid gap-3 md:grid-cols-[280px_1fr]">
            <input type="hidden" name="id" value={b?.id ?? ""} />
            <input type="hidden" name="currentImage" value={b?.image ?? ""} />
            <div>
              {b ? (
                <div className="relative aspect-[8/3] overflow-hidden rounded-lg">
                  <Image src={b.image} alt={b.title} fill sizes="280px" className="object-cover" />
                </div>
              ) : (
                <p className="font-semibold">+ Thêm banner mới</p>
              )}
              <input type="file" name="image" accept="image/*" className="mt-2 text-xs" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Tiêu đề" name="title" defaultValue={b?.title} required />
              <Field label="Mô tả phụ" name="subtitle" defaultValue={b?.subtitle} />
              <Field label="Liên kết" name="link" defaultValue={b?.link} placeholder="/laptop-gaming" />
              <Field label="Thứ tự" name="sortOrder" type="number" defaultValue={b?.sortOrder ?? banners.length} />
              <Check label="Hiển thị" name="active" defaultChecked={b?.active ?? true} />
              <div className="flex justify-end">
                <SubmitButton>{b ? "Lưu" : "Thêm banner"}</SubmitButton>
              </div>
            </div>
          </ActionForm>
          {b && (
            <form action={deleteBanner} className="mt-2">
              <input type="hidden" name="id" value={b.id} />
              <ConfirmButton message="Xóa banner này?">Xóa</ConfirmButton>
            </form>
          )}
        </div>
      ))}
    </div>
  );
}
