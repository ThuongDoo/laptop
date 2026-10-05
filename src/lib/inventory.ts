import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { refreshProductCache } from "./catalog";

type Line = { variantId: string | null; productId: string | null; quantity: number };

/** Trừ tồn kho khi tạo đơn; hết máy thì tự chuyển "Hết hàng". */
export async function reserveStock(tx: Prisma.TransactionClient, lines: Line[]) {
  for (const l of lines) {
    if (!l.variantId) continue;
    const v = await tx.productVariant.update({ where: { id: l.variantId }, data: { stock: { decrement: l.quantity } } });
    if (v.stock <= 0) await tx.productVariant.update({ where: { id: v.id }, data: { stock: 0, stockStatus: "OUT_OF_STOCK" } });
  }
}

/** Hoàn tồn kho khi hủy đơn. */
export async function releaseStock(lines: Line[]) {
  for (const l of lines) {
    if (!l.variantId) continue;
    const v = await prisma.productVariant.findUnique({ where: { id: l.variantId } });
    if (!v) continue;
    await prisma.productVariant.update({
      where: { id: v.id },
      data: { stock: v.stock + l.quantity, stockStatus: v.stockStatus === "OUT_OF_STOCK" ? "IN_STOCK" : v.stockStatus },
    });
  }
  await refreshProducts(lines);
}

export async function refreshProducts(lines: Line[]) {
  const ids = [...new Set(lines.map((l) => l.productId).filter(Boolean))] as string[];
  for (const id of ids) await refreshProductCache(id);
}
