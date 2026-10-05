import "server-only";
import { prisma } from "./prisma";
import { verifyReturn } from "./vnpay";

/** Ghi nhận kết quả VNPAY (dùng chung cho return URL & IPN). Idempotent. */
export async function handleVnpayResult(query: URLSearchParams) {
  const r = verifyReturn(query);
  if (!r.valid) return { code: "97" as const, r };
  const order = await prisma.order.findUnique({ where: { code: r.orderCode } });
  if (!order) return { code: "01" as const, r };
  if (order.total !== r.amount) return { code: "04" as const, r, order };
  if (order.paymentStatus === "PAID") return { code: "02" as const, r, order };
  if (r.success) {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "PAID", status: order.status === "NEW" ? "CONFIRMED" : order.status },
    });
  }
  return { code: "00" as const, r, order };
}
