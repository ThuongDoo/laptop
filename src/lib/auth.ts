import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { can, type Area } from "./permissions";

const STAFF_COOKIE = "ll_staff";
const CUSTOMER_COOKIE = "ll_customer";
const MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s && process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET chưa được cấu hình");
  return new TextEncoder().encode(s || "dev-secret-change-me");
}

async function sign(payload: { sub: string; kind: "staff" | "customer" }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

async function read(name: string, kind: "staff" | "customer") {
  const token = (await cookies()).get(name)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.kind === kind ? (payload.sub as string) : null;
  } catch {
    return null;
  }
}

async function setCookie(name: string, token: string) {
  (await cookies()).set(name, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export const hashPassword = (p: string) => bcrypt.hash(p, 10);
export const verifyPassword = (p: string, h: string) => bcrypt.compare(p, h);

// ---- Nhân sự (admin panel) ----

export async function loginStaff(userId: string) {
  await setCookie(STAFF_COOKIE, await sign({ sub: userId, kind: "staff" }));
}

export async function logoutStaff() {
  (await cookies()).delete(STAFF_COOKIE);
}

export async function getStaff() {
  const id = await read(STAFF_COOKIE, "staff");
  if (!id) return null;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, active: true },
  });
  return user?.active ? user : null;
}

/** Dùng ở mọi trang/server action admin: chưa đăng nhập → login, sai quyền → về dashboard. */
export async function requireStaff(area?: Area) {
  const user = await getStaff();
  if (!user) redirect("/admin/login");
  if (area && !can(user.role, area)) redirect("/admin?denied=1");
  return user;
}

// ---- Khách hàng ----

export async function loginCustomer(customerId: string) {
  await setCookie(CUSTOMER_COOKIE, await sign({ sub: customerId, kind: "customer" }));
}

export async function logoutCustomer() {
  (await cookies()).delete(CUSTOMER_COOKIE);
}

export async function getCustomer() {
  const id = await read(CUSTOMER_COOKIE, "customer");
  if (!id) return null;
  return prisma.customer.findUnique({
    where: { id },
    select: { id: true, name: true, phone: true, email: true, address: true },
  });
}
