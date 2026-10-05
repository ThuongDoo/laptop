export type Role = "ADMIN" | "SALES" | "EDITOR";
export type Area =
  | "dashboard"
  | "products"
  | "catalog"
  | "orders"
  | "customers"
  | "coupons"
  | "posts"
  | "pages"
  | "reviews"
  | "banners"
  | "users"
  | "settings";

// Nhân viên bán hàng: chỉ quản lý đơn (+ xem khách hàng để xử lý đơn).
// Biên tập viên: chỉ viết bài / nhập máy.
const MATRIX: Record<Role, Area[] | "*"> = {
  ADMIN: "*",
  SALES: ["dashboard", "orders", "customers"],
  EDITOR: ["dashboard", "products", "catalog", "posts", "pages", "reviews", "banners"],
};

export function can(role: string | undefined, area: Area) {
  const allowed = MATRIX[role as Role];
  if (!allowed) return false;
  return allowed === "*" || allowed.includes(area);
}
