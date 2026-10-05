import { NextResponse } from "next/server";
import { getStaff } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { saveImage } from "@/lib/upload";

// Upload ảnh từ trình soạn thảo (bài viết, mô tả sản phẩm) – tự nén WebP
export async function POST(req: Request) {
  const user = await getStaff();
  if (!user || !(can(user.role, "posts") || can(user.role, "products") || can(user.role, "pages"))) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }
  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Thiếu file" }, { status: 400 });
  try {
    return NextResponse.json({ url: await saveImage(file, { maxWidth: 1400 }) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
