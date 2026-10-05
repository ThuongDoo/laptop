import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COUPON_TYPES } from "@/lib/constants";
import { ActionForm, Check, Field, Select, SubmitButton } from "@/components/admin/ui";
import { saveCoupon } from "../../../actions";

const day = (d: Date | null | undefined) => (d ? new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 10) : "");

export default async function CouponEdit({ params }: PageProps<"/admin/coupons/[id]">) {
  await requireStaff("coupons");
  const { id } = await params;
  const c = id === "new" ? null : await prisma.coupon.findUnique({ where: { id } });
  if (id !== "new" && !c) notFound();
  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/coupons" className="text-sm text-gray-500 hover:text-brand-600">
          ← Mã giảm giá
        </Link>
        <h1 className="text-2xl font-bold">{c ? c.code : "Tạo mã giảm giá"}</h1>
      </div>
      <ActionForm action={saveCoupon} className="card grid gap-3 p-4 md:grid-cols-2">
        <input type="hidden" name="id" value={c?.id ?? ""} />
        <Field label="Mã" name="code" defaultValue={c?.code} required placeholder="VD: SINHVIEN500" />
        <Select label="Loại giảm giá" name="type" defaultValue={c?.type ?? "PERCENT"} options={COUPON_TYPES} />
        <Field label="Giá trị (% hoặc số tiền)" name="value" type="number" defaultValue={c?.value ?? ""} hint="Bỏ qua với loại Miễn phí vận chuyển" />
        <Field label="Giảm tối đa (cho loại %)" name="maxDiscount" type="number" defaultValue={c?.maxDiscount} />
        <Field label="Giá trị đơn tối thiểu" name="minOrder" type="number" defaultValue={c?.minOrder ?? 0} />
        <Field label="Giới hạn lượt dùng" name="usageLimit" type="number" defaultValue={c?.usageLimit} hint="Để trống = không giới hạn" />
        <Field label="Bắt đầu" name="startsAt" type="date" defaultValue={day(c?.startsAt)} />
        <Field label="Hết hạn" name="expiresAt" type="date" defaultValue={day(c?.expiresAt)} />
        <Field label="Mô tả" name="description" defaultValue={c?.description} className="md:col-span-2" />
        <Check label="Kích hoạt" name="active" defaultChecked={c?.active ?? true} />
        <div className="md:col-span-2">
          <SubmitButton>Lưu mã</SubmitButton>
        </div>
      </ActionForm>
    </div>
  );
}
