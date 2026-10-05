import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";
import { ActionForm, Check, Field, Select, SubmitButton } from "@/components/admin/ui";
import { saveUser } from "../../actions";

const ROLE_DESC: Record<string, string> = {
  ADMIN: "Toàn quyền",
  SALES: "Chỉ quản lý đơn hàng & xem khách hàng",
  EDITOR: "Chỉ viết bài, nhập máy, quản lý danh mục, banner, đánh giá",
};

export default async function UsersAdmin() {
  await requireStaff("users");
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Nhân sự & phân quyền</h1>
      <ul className="grid gap-2 text-sm md:grid-cols-3">
        {Object.entries(ROLE_DESC).map(([k, d]) => (
          <li key={k} className="card p-3">
            <b>{ROLES[k]}</b>
            <p className="text-gray-500">{d}</p>
          </li>
        ))}
      </ul>
      {[...users, null].map((u) => (
        <ActionForm key={u?.id ?? "new"} action={saveUser} className="card grid items-end gap-3 p-4 md:grid-cols-6">
          <input type="hidden" name="id" value={u?.id ?? ""} />
          <Field label="Họ tên" name="name" defaultValue={u?.name} className="md:col-span-1" />
          <Field label="Email" name="email" type="email" defaultValue={u?.email} required className="md:col-span-2" />
          <Select label="Vai trò" name="role" defaultValue={u?.role ?? "SALES"} options={ROLES} />
          <Field label={u ? "Mật khẩu mới" : "Mật khẩu"} name="password" type="password" placeholder={u ? "Để trống = giữ nguyên" : "Tối thiểu 8 ký tự"} />
          <div className="flex items-center justify-between gap-2 pb-1">
            <Check label="Hoạt động" name="active" defaultChecked={u?.active ?? true} />
            <SubmitButton className="btn-primary py-2">{u ? "Lưu" : "Thêm"}</SubmitButton>
          </div>
        </ActionForm>
      ))}
    </div>
  );
}
