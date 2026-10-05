import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { Shell } from "@/components/admin/Shell";

export const metadata: Metadata = { title: "Quản trị", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireStaff();
  const [newOrders, pendingReviews] = await Promise.all([
    can(user.role, "orders") ? prisma.order.count({ where: { status: "NEW" } }) : 0,
    can(user.role, "reviews") ? prisma.review.count({ where: { approved: false } }) : 0,
  ]);
  return (
    <Shell user={user} badges={{ "/admin/orders": newOrders, "/admin/reviews": pendingReviews }}>
      {children}
    </Shell>
  );
}
