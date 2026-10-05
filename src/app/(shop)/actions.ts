"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { saveImages } from "@/lib/upload";
import { effectivePrice } from "@/lib/catalog";
import { applyCoupon, shippingFeeFor } from "@/lib/pricing";
import { getSettings, siteUrl } from "@/lib/settings";
import { sendOrderCreatedEmails } from "@/lib/email";
import { createPaymentUrl, vnpayEnabled } from "@/lib/vnpay";
import { orderToken } from "@/lib/order-token";
import { refreshProducts, reserveStock } from "@/lib/inventory";
import { getCustomer, hashPassword, loginCustomer, logoutCustomer, verifyPassword } from "@/lib/auth";

type FormState = { ok: boolean; message: string } | null;

// ---------- Đánh giá ----------

export async function submitReview(_: FormState, fd: FormData): Promise<FormState> {
  if (fd.get("website")) return { ok: true, message: "Cảm ơn bạn!" };
  const parsed = z
    .object({
      productId: z.string().min(1),
      name: z.string().trim().min(2, "Vui lòng nhập họ tên").max(60),
      phone: z.string().trim().max(15).optional(),
      rating: z.coerce.number().int().min(1).max(5),
      content: z.string().trim().min(10, "Nội dung tối thiểu 10 ký tự").max(2000),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId }, select: { id: true } });
  if (!product) return { ok: false, message: "Sản phẩm không tồn tại" };

  let images: string[] = [];
  try {
    images = await saveImages((fd.getAll("images") as File[]).slice(0, 4), { maxWidth: 1200 });
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
  const customer = await getCustomer();
  await prisma.review.create({
    data: {
      ...parsed.data,
      phone: parsed.data.phone || null,
      customerId: customer?.id,
      images: images.length ? JSON.stringify(images) : null,
    },
  });
  return { ok: true, message: "Cảm ơn bạn đã đánh giá! Đánh giá sẽ hiển thị sau khi được kiểm duyệt." };
}

// ---------- Giỏ hàng ----------

export async function getCartLines(variantIds: string[]) {
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds.slice(0, 50) }, product: { published: true } },
    include: { product: { select: { name: true } } },
  });
  return variants.map((v) => ({
    variantId: v.id,
    name: v.product.name,
    variantName: v.name,
    price: effectivePrice(v),
    available: v.stockStatus === "IN_STOCK",
  }));
}

export async function quote(lines: { variantId: string; qty: number }[], couponCode?: string) {
  const s = await getSettings();
  const variants = await prisma.productVariant.findMany({ where: { id: { in: lines.map((l) => l.variantId) } } });
  const subtotal = lines.reduce((sum, l) => {
    const v = variants.find((x) => x.id === l.variantId);
    return v ? sum + effectivePrice(v) * l.qty : sum;
  }, 0);
  let shippingFee = shippingFeeFor(subtotal, Number(s.shippingFee), Number(s.freeShipThreshold));
  let discount = 0;
  let couponError: string | undefined;
  let couponLabel: string | undefined;
  if (couponCode?.trim()) {
    const c = await prisma.coupon.findUnique({ where: { code: couponCode.trim().toUpperCase() } });
    const r = applyCoupon(c, subtotal, shippingFee);
    if (r.ok) {
      couponLabel = r.label;
      if (r.freeShip) shippingFee = 0;
      else discount = r.discount;
    } else couponError = r.error;
  }
  return { subtotal, shippingFee, discount, total: subtotal + shippingFee - discount, couponError, couponLabel };
}

// ---------- Đặt hàng ----------

const orderSchema = z.object({
  name: z.string().trim().min(2, "Vui lòng nhập họ tên").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^(0|\+84)\d{9,10}$/, "Số điện thoại không hợp lệ"),
  email: z.union([z.literal(""), z.string().trim().email("Email không hợp lệ")]).optional(),
  address: z.string().trim().min(5, "Vui lòng nhập địa chỉ nhận hàng").max(300),
  note: z.string().trim().max(500).optional(),
  paymentMethod: z.enum(["COD", "BANK", "VNPAY", "INSTALLMENT"]),
  installmentNote: z.string().trim().max(200).optional(),
  coupon: z.string().trim().max(30).optional(),
  items: z
    .array(z.object({ variantId: z.string(), qty: z.number().int().min(1).max(5) }))
    .min(1, "Giỏ hàng trống")
    .max(20),
});

function newOrderCode() {
  const d = new Date(Date.now() + 7 * 3600_000).toISOString();
  return `LL${d.slice(2, 4)}${d.slice(5, 7)}${d.slice(8, 10)}${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function placeOrder(input: z.input<typeof orderSchema>): Promise<{ ok: false; message: string } | { ok: true; redirect: string }> {
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.paymentMethod === "VNPAY" && !vnpayEnabled()) return { ok: false, message: "VNPAY tạm thời chưa khả dụng, vui lòng chọn hình thức khác." };

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: d.items.map((i) => i.variantId) }, product: { published: true } },
    include: { product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } } },
  });
  for (const it of d.items) {
    const v = variants.find((x) => x.id === it.variantId);
    if (!v) return { ok: false, message: "Có sản phẩm trong giỏ không còn kinh doanh, vui lòng tải lại giỏ hàng." };
    if (v.stockStatus !== "IN_STOCK") return { ok: false, message: `${v.product.name} (${v.name}) hiện đã hết hàng.` };
  }
  const q = await quote(d.items, d.coupon);
  if (d.coupon && q.couponError) return { ok: false, message: q.couponError };

  const customer = await getCustomer();
  let code = newOrderCode();
  while (await prisma.order.findUnique({ where: { code }, select: { id: true } })) code = newOrderCode();
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        code,
        customerId: customer?.id,
        name: d.name,
        phone: d.phone,
        email: d.email || null,
        address: d.address,
        note: d.note || null,
        paymentMethod: d.paymentMethod,
        installmentNote: d.paymentMethod === "INSTALLMENT" ? d.installmentNote || null : null,
        subtotal: q.subtotal,
        shippingFee: q.shippingFee,
        discount: q.discount,
        total: q.total,
        couponCode: q.couponLabel ? d.coupon!.toUpperCase() : null,
        items: {
          create: d.items.map((it) => {
            const v = variants.find((x) => x.id === it.variantId)!;
            return {
              productId: v.productId,
              variantId: v.id,
              productName: v.product.name,
              variantName: v.name,
              image: v.product.images[0]?.url,
              price: effectivePrice(v),
              quantity: it.qty,
            };
          }),
        },
      },
      include: { items: true },
    });
    if (created.couponCode) await tx.coupon.update({ where: { code: created.couponCode }, data: { usedCount: { increment: 1 } } });
    await reserveStock(tx, created.items);
    return created;
  });
  await refreshProducts(order.items);

  await sendOrderCreatedEmails(order);
  const token = orderToken(order.code);

  if (order.paymentMethod === "VNPAY") {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    return { ok: true, redirect: createPaymentUrl({ orderCode: order.code, amount: order.total, ip, returnUrl: siteUrl("/api/vnpay/return") }) };
  }
  return { ok: true, redirect: `/dat-hang/${order.code}?t=${token}` };
}

// ---------- Tài khoản khách hàng ----------

/** Chỉ cho phép chuyển hướng nội bộ (chống open redirect). */
function safeNext(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/tai-khoan";
}

export async function customerLogin(_: FormState, fd: FormData): Promise<FormState> {
  const login = String(fd.get("login") || "").trim();
  const password = String(fd.get("password") || "");
  const c = await prisma.customer.findFirst({
    where: { OR: [{ email: login.toLowerCase() }, { phone: login }], passwordHash: { not: null } },
  });
  if (!c || !(await verifyPassword(password, c.passwordHash!))) return { ok: false, message: "Sai thông tin đăng nhập" };
  await loginCustomer(c.id);
  redirect(safeNext(fd.get("next")));
}

export async function customerRegister(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Vui lòng nhập họ tên"),
      phone: z.string().trim().regex(/^(0|\+84)\d{9,10}$/, "Số điện thoại không hợp lệ"),
      email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
      password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const exists = await prisma.customer.findFirst({
    where: { OR: [{ email: parsed.data.email }, { phone: parsed.data.phone, passwordHash: { not: null } }] },
  });
  if (exists) return { ok: false, message: "Email hoặc số điện thoại đã được đăng ký" };
  const c = await prisma.customer.create({
    data: { name: parsed.data.name, phone: parsed.data.phone, email: parsed.data.email, passwordHash: await hashPassword(parsed.data.password) },
  });
  // Gắn các đơn đã mua trước đó (mua không cần tài khoản) theo số điện thoại
  await prisma.order.updateMany({ where: { phone: c.phone, customerId: null }, data: { customerId: c.id } });
  await loginCustomer(c.id);
  redirect(safeNext(fd.get("next")));
}

export async function customerLogout() {
  await logoutCustomer();
  redirect("/");
}
