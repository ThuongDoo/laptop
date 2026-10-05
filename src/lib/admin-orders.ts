import "server-only";
import type { Prisma } from "@prisma/client";

type SP = Record<string, string | string[] | undefined>;
const s = (v: SP[string]) => (typeof v === "string" ? v.trim() : "");

/** Bộ lọc đơn hàng dùng chung cho danh sách & xuất Excel. */
export function orderWhere(sp: SP): Prisma.OrderWhereInput {
  const q = s(sp.q);
  const from = s(sp.from);
  const to = s(sp.to);
  return {
    ...(s(sp.status) ? { status: s(sp.status) } : {}),
    ...(s(sp.payment) ? { paymentMethod: s(sp.payment) } : {}),
    ...(q ? { OR: [{ code: { contains: q.toUpperCase() } }, { phone: { contains: q } }, { name: { contains: q } }] } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from + "T00:00:00+07:00") } : {}),
            ...(to ? { lte: new Date(to + "T23:59:59+07:00") } : {}),
          },
        }
      : {}),
  };
}
