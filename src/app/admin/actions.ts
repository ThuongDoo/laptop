"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, loginStaff, logoutStaff, requireStaff, verifyPassword } from "@/lib/auth";
import { refreshProductCache } from "@/lib/catalog";
import { slugify } from "@/lib/format";
import { cleanHtml } from "@/lib/html";
import { slugTaken } from "@/lib/routing";
import { saveImages } from "@/lib/upload";
import { sendOrderStatusEmail } from "@/lib/email";
import { refreshProducts, releaseStock, reserveStock } from "@/lib/inventory";
import { DEFAULT_SETTINGS } from "@/lib/settings";

export type ActionState = { ok: boolean; message: string } | null;

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const opt = (fd: FormData, k: string) => str(fd, k) || null;
const num = (fd: FormData, k: string) => (str(fd, k) === "" ? null : Number(str(fd, k).replace(/[.,\s]/g, "")));
const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";
const fail = (message: string): ActionState => ({ ok: false, message });

function revalidateShop() {
  revalidatePath("/", "layout");
}

// ---------- Đăng nhập ----------

export async function staffLogin(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await prisma.user.findUnique({ where: { email: str(fd, "email").toLowerCase() } });
  if (!user || !user.active || !(await verifyPassword(str(fd, "password"), user.passwordHash))) return fail("Email hoặc mật khẩu không đúng");
  await loginStaff(user.id);
  redirect("/admin");
}

export async function staffLogout() {
  await logoutStaff();
  redirect("/admin/login");
}

// ---------- Sản phẩm ----------

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Tên biến thể không được trống"),
  ramGB: z.coerce.number().int().min(1),
  storageGB: z.coerce.number().int().min(1),
  storageType: z.string().default("SSD"),
  price: z.coerce.number().int().min(0),
  salePrice: z.coerce.number().int().min(0).nullable().optional(),
  stockStatus: z.enum(["IN_STOCK", "OUT_OF_STOCK", "INCOMING"]),
  stock: z.coerce.number().int().min(0),
});

export async function saveProduct(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("products");
  const id = str(fd, "id") || null;
  const name = str(fd, "name");
  if (!name) return fail("Vui lòng nhập tên sản phẩm");
  const slug = slugify(str(fd, "slug") || name);
  if (await slugTaken(slug, id ? { table: "product", id } : undefined)) return fail(`Đường dẫn “${slug}” đã được dùng, hãy chọn slug khác`);
  if (!str(fd, "brandId")) return fail("Vui lòng chọn thương hiệu");
  if (!str(fd, "cpu")) return fail("Vui lòng nhập CPU");

  let variants: z.infer<typeof variantSchema>[];
  let images: { id?: string; url: string; alt: string }[];
  let specs: { label: string; value: string }[];
  try {
    variants = z.array(variantSchema).min(1, "Cần ít nhất 1 biến thể (cấu hình/giá)").parse(JSON.parse(str(fd, "variants") || "[]"));
    images = JSON.parse(str(fd, "images") || "[]");
    specs = (JSON.parse(str(fd, "specs") || "[]") as { label: string; value: string }[]).filter((s) => s.label && s.value);
  } catch (e) {
    return fail(e instanceof z.ZodError ? e.issues[0].message : "Dữ liệu biến thể không hợp lệ");
  }
  for (const v of variants) if (v.salePrice && v.salePrice >= v.price) return fail(`Giá KM của “${v.name}” phải nhỏ hơn giá niêm yết`);

  let uploaded: string[] = [];
  try {
    uploaded = await saveImages(fd.getAll("newImages") as File[]);
  } catch (e) {
    return fail((e as Error).message);
  }
  const allImages: { id?: string; url: string; alt: string }[] = [...images, ...uploaded.map((url) => ({ url, alt: "" }))];

  const data = {
    name,
    slug,
    sku: opt(fd, "sku"),
    brandId: str(fd, "brandId"),
    shortDesc: opt(fd, "shortDesc"),
    description: cleanHtml(str(fd, "description")),
    cpu: str(fd, "cpu"),
    cpuFamily: str(fd, "cpuFamily") || "other",
    gpu: str(fd, "gpu"),
    gpuType: str(fd, "gpuType") || "onboard",
    screenSize: Number(str(fd, "screenSize")) || 14,
    screen: str(fd, "screen"),
    weight: opt(fd, "weight"),
    battery: opt(fd, "battery"),
    ports: opt(fd, "ports"),
    os: opt(fd, "os"),
    specs: JSON.stringify(specs),
    condition: str(fd, "condition") || "99",
    appearance: opt(fd, "appearance"),
    batteryHealth: opt(fd, "batteryHealth"),
    accessories: opt(fd, "accessories"),
    warrantyMonths: num(fd, "warrantyMonths") ?? 6,
    gifts: opt(fd, "gifts"),
    featured: bool(fd, "featured"),
    published: bool(fd, "published"),
    videoUrl: opt(fd, "videoUrl"),
    metaTitle: opt(fd, "metaTitle"),
    metaDescription: opt(fd, "metaDescription"),
    canonical: opt(fd, "canonical"),
  };
  const categoryIds = fd.getAll("categoryIds").map(String);

  const productId = await prisma.$transaction(async (tx) => {
    const p = id
      ? await tx.product.update({ where: { id }, data: { ...data, categories: { set: categoryIds.map((c) => ({ id: c })) } } })
      : await tx.product.create({ data: { ...data, categories: { connect: categoryIds.map((c) => ({ id: c })) } } });

    // Ảnh: xóa ảnh bị gỡ, cập nhật thứ tự & alt
    await tx.productImage.deleteMany({ where: { productId: p.id, id: { notIn: allImages.map((i) => i.id).filter(Boolean) as string[] } } });
    for (const [i, img] of allImages.entries()) {
      if (img.id) await tx.productImage.update({ where: { id: img.id }, data: { alt: img.alt || null, sortOrder: i } });
      else await tx.productImage.create({ data: { productId: p.id, url: img.url, alt: img.alt || null, sortOrder: i } });
    }

    // Biến thể: giữ id cũ để không mất liên kết với đơn hàng
    const keep = variants.map((v) => v.id).filter(Boolean) as string[];
    await tx.productVariant.deleteMany({ where: { productId: p.id, id: { notIn: keep } } });
    for (const [i, v] of variants.entries()) {
      const vd = { ...v, id: undefined, salePrice: v.salePrice || null, sortOrder: i };
      if (v.id) await tx.productVariant.update({ where: { id: v.id }, data: vd });
      else await tx.productVariant.create({ data: { ...vd, productId: p.id } });
    }
    return p.id;
  });
  await refreshProductCache(productId);
  revalidateShop();
  if (!id) redirect(`/admin/products/${productId}?saved=1`);
  return { ok: true, message: "Đã lưu sản phẩm" };
}

export async function deleteProduct(fd: FormData) {
  await requireStaff("products");
  const id = str(fd, "id");
  const hasOrders = await prisma.orderItem.count({ where: { productId: id } });
  // Sản phẩm đã có đơn: ẩn thay vì xóa để giữ lịch sử
  if (hasOrders) await prisma.product.update({ where: { id }, data: { published: false } });
  else await prisma.product.delete({ where: { id } });
  revalidateShop();
  redirect("/admin/products");
}

export async function setVariantStock(fd: FormData) {
  await requireStaff("products");
  const v = await prisma.productVariant.update({ where: { id: str(fd, "id") }, data: { stockStatus: str(fd, "stockStatus") } });
  await refreshProductCache(v.productId);
  revalidateShop();
}

// ---------- Danh mục & thương hiệu ----------

export async function saveCategory(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("catalog");
  const id = str(fd, "id") || null;
  const name = str(fd, "name");
  if (!name) return fail("Vui lòng nhập tên");
  const slug = slugify(str(fd, "slug") || name);
  if (await slugTaken(slug, id ? { table: "category", id } : undefined)) return fail(`Slug “${slug}” đã được dùng`);
  const data = {
    name,
    slug,
    icon: opt(fd, "icon"),
    shortDesc: opt(fd, "shortDesc"),
    content: cleanHtml(str(fd, "content")),
    sortOrder: num(fd, "sortOrder") ?? 0,
    showOnHome: bool(fd, "showOnHome"),
    metaTitle: opt(fd, "metaTitle"),
    metaDescription: opt(fd, "metaDescription"),
    canonical: opt(fd, "canonical"),
  };
  if (id) await prisma.category.update({ where: { id }, data });
  else await prisma.category.create({ data });
  revalidateShop();
  redirect("/admin/catalog");
}

export async function saveBrand(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("catalog");
  const id = str(fd, "id") || null;
  const name = str(fd, "name");
  if (!name) return fail("Vui lòng nhập tên");
  const slug = slugify(str(fd, "slug") || `laptop ${name}`);
  if (await slugTaken(slug, id ? { table: "brand", id } : undefined)) return fail(`Slug “${slug}” đã được dùng`);
  const data = {
    name,
    slug,
    description: opt(fd, "description"),
    sortOrder: num(fd, "sortOrder") ?? 0,
    metaTitle: opt(fd, "metaTitle"),
    metaDescription: opt(fd, "metaDescription"),
  };
  if (id) await prisma.brand.update({ where: { id }, data });
  else await prisma.brand.create({ data });
  revalidateShop();
  redirect("/admin/catalog");
}

export async function deleteCategory(fd: FormData) {
  await requireStaff("catalog");
  await prisma.category.delete({ where: { id: str(fd, "id") } });
  revalidateShop();
  redirect("/admin/catalog");
}

export async function deleteBrand(fd: FormData) {
  await requireStaff("catalog");
  const id = str(fd, "id");
  if (await prisma.product.count({ where: { brandId: id } })) redirect("/admin/catalog?error=brand-in-use");
  await prisma.brand.delete({ where: { id } });
  revalidateShop();
  redirect("/admin/catalog");
}

// ---------- Đơn hàng ----------

export async function updateOrder(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("orders");
  const id = str(fd, "id");
  const status = str(fd, "status");
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return fail("Không tìm thấy đơn hàng");
  const updated = await prisma.order.update({
    where: { id },
    data: { status, paymentStatus: str(fd, "paymentStatus"), adminNote: opt(fd, "adminNote") },
    include: { items: true },
  });

  if (status !== order.status) {
    if (status === "CANCELLED") await releaseStock(order.items);
    if (order.status === "CANCELLED") {
      await prisma.$transaction((tx) => reserveStock(tx, order.items));
      await refreshProducts(order.items);
    }
    if (status === "COMPLETED") {
      for (const it of order.items)
        if (it.productId) await prisma.product.update({ where: { id: it.productId }, data: { soldCount: { increment: it.quantity } } });
    }
    if (order.status === "COMPLETED") {
      for (const it of order.items)
        if (it.productId) await prisma.product.update({ where: { id: it.productId }, data: { soldCount: { decrement: it.quantity } } });
    }
    if (bool(fd, "notify")) await sendOrderStatusEmail(updated);
    revalidateShop();
  }
  revalidatePath("/admin/orders");
  return { ok: true, message: "Đã cập nhật đơn hàng" };
}

// ---------- Coupon ----------

export async function saveCoupon(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("coupons");
  const id = str(fd, "id") || null;
  const code = str(fd, "code").toUpperCase().replace(/\s/g, "");
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return fail("Mã chỉ gồm chữ, số, - _ (3-30 ký tự)");
  const type = str(fd, "type");
  const value = num(fd, "value") ?? 0;
  if (type === "PERCENT" && (value <= 0 || value > 100)) return fail("Phần trăm giảm phải từ 1-100");
  if (type === "FIXED" && value <= 0) return fail("Số tiền giảm phải lớn hơn 0");
  const dup = await prisma.coupon.findUnique({ where: { code } });
  if (dup && dup.id !== id) return fail("Mã đã tồn tại");
  const date = (k: string) => (str(fd, k) ? new Date(str(fd, k) + "T00:00:00+07:00") : null);
  const expires = str(fd, "expiresAt") ? new Date(str(fd, "expiresAt") + "T23:59:59+07:00") : null;
  const data = {
    code,
    description: opt(fd, "description"),
    type,
    value: type === "FREESHIP" ? 0 : value,
    maxDiscount: num(fd, "maxDiscount"),
    minOrder: num(fd, "minOrder") ?? 0,
    usageLimit: num(fd, "usageLimit"),
    startsAt: date("startsAt"),
    expiresAt: expires,
    active: bool(fd, "active"),
  };
  if (id) await prisma.coupon.update({ where: { id }, data });
  else await prisma.coupon.create({ data });
  redirect("/admin/coupons");
}

export async function deleteCoupon(fd: FormData) {
  await requireStaff("coupons");
  await prisma.coupon.delete({ where: { id: str(fd, "id") } });
  revalidatePath("/admin/coupons");
}

// ---------- Bài viết & trang ----------

export async function savePost(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireStaff("posts");
  const id = str(fd, "id") || null;
  const title = str(fd, "title");
  if (!title) return fail("Vui lòng nhập tiêu đề");
  const slug = slugify(str(fd, "slug") || title);
  const dup = await prisma.post.findUnique({ where: { slug } });
  if (dup && dup.id !== id) return fail(`Slug “${slug}” đã được dùng`);
  let cover = opt(fd, "currentCover");
  try {
    const [up] = await saveImages([fd.get("cover") as File].filter(Boolean), { maxWidth: 1400 });
    if (up) cover = up;
  } catch (e) {
    return fail((e as Error).message);
  }
  const data = {
    title,
    slug,
    excerpt: opt(fd, "excerpt"),
    content: cleanHtml(str(fd, "content")),
    cover,
    published: bool(fd, "published"),
    metaTitle: opt(fd, "metaTitle"),
    metaDescription: opt(fd, "metaDescription"),
    canonical: opt(fd, "canonical"),
  };
  if (id) await prisma.post.update({ where: { id }, data });
  else await prisma.post.create({ data: { ...data, authorId: user.id } });
  revalidateShop();
  redirect("/admin/posts");
}

export async function deletePost(fd: FormData) {
  await requireStaff("posts");
  await prisma.post.delete({ where: { id: str(fd, "id") } });
  revalidateShop();
  redirect("/admin/posts");
}

export async function savePage(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("pages");
  const id = str(fd, "id") || null;
  const title = str(fd, "title");
  if (!title) return fail("Vui lòng nhập tiêu đề");
  const slug = slugify(str(fd, "slug") || title);
  if (await slugTaken(slug, id ? { table: "page", id } : undefined)) return fail(`Slug “${slug}” đã được dùng`);
  const data = {
    title,
    slug,
    content: cleanHtml(str(fd, "content")),
    published: bool(fd, "published"),
    showInFooter: bool(fd, "showInFooter"),
    metaTitle: opt(fd, "metaTitle"),
    metaDescription: opt(fd, "metaDescription"),
    canonical: opt(fd, "canonical"),
  };
  if (id) await prisma.page.update({ where: { id }, data });
  else await prisma.page.create({ data });
  revalidateShop();
  redirect("/admin/pages");
}

export async function deletePage(fd: FormData) {
  await requireStaff("pages");
  await prisma.page.delete({ where: { id: str(fd, "id") } });
  revalidateShop();
  redirect("/admin/pages");
}

// ---------- Đánh giá ----------

export async function moderateReview(fd: FormData) {
  await requireStaff("reviews");
  const id = str(fd, "id");
  const op = str(fd, "op");
  if (op === "delete") await prisma.review.delete({ where: { id } });
  else
    await prisma.review.update({
      where: { id },
      data: op === "reply" ? { reply: opt(fd, "reply"), approved: true } : { approved: op === "approve" },
    });
  revalidateShop();
  revalidatePath("/admin/reviews");
}

// ---------- Banner ----------

export async function saveBanner(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("banners");
  const id = str(fd, "id") || null;
  let image = opt(fd, "currentImage");
  try {
    const [up] = await saveImages([fd.get("image") as File].filter(Boolean), { maxWidth: 1600 });
    if (up) image = up;
  } catch (e) {
    return fail((e as Error).message);
  }
  if (!image) return fail("Vui lòng chọn ảnh banner (tỉ lệ 8:3, khuyến nghị 1600x600)");
  const data = {
    title: str(fd, "title"),
    subtitle: opt(fd, "subtitle"),
    link: opt(fd, "link"),
    sortOrder: num(fd, "sortOrder") ?? 0,
    active: bool(fd, "active"),
    image,
  };
  if (id) await prisma.banner.update({ where: { id }, data });
  else await prisma.banner.create({ data });
  revalidateShop();
  return { ok: true, message: "Đã lưu banner" };
}

export async function deleteBanner(fd: FormData) {
  await requireStaff("banners");
  await prisma.banner.delete({ where: { id: str(fd, "id") } });
  revalidateShop();
  revalidatePath("/admin/banners");
}

// ---------- Nhân sự ----------

export async function saveUser(_: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireStaff("users");
  const id = str(fd, "id") || null;
  const email = str(fd, "email").toLowerCase();
  const role = str(fd, "role");
  if (!["ADMIN", "SALES", "EDITOR"].includes(role)) return fail("Vai trò không hợp lệ");
  if (!z.string().email().safeParse(email).success) return fail("Email không hợp lệ");
  const password = str(fd, "password");
  if (!id && password.length < 8) return fail("Mật khẩu tối thiểu 8 ký tự");
  const dup = await prisma.user.findUnique({ where: { email } });
  if (dup && dup.id !== id) return fail("Email đã tồn tại");
  const active = bool(fd, "active");
  if (id === me.id && (role !== "ADMIN" || !active)) return fail("Không thể tự hạ quyền hoặc khóa chính mình");
  const data = { email, name: str(fd, "name") || email, role, active, ...(password ? { passwordHash: await hashPassword(password) } : {}) };
  if (id) await prisma.user.update({ where: { id }, data });
  else await prisma.user.create({ data: { ...data, passwordHash: await hashPassword(password) } });
  redirect("/admin/users");
}

// ---------- Cài đặt ----------

export async function saveSettings(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("settings");
  const keys = Object.keys(DEFAULT_SETTINGS);
  await prisma.$transaction(
    keys
      .filter((k) => fd.has(k))
      .map((k) => prisma.setting.upsert({ where: { key: k }, create: { key: k, value: str(fd, k) }, update: { value: str(fd, k) } })),
  );
  revalidateShop();
  return { ok: true, message: "Đã lưu cài đặt" };
}
