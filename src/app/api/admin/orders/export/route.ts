import ExcelJS from "exceljs";
import { getStaff } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { orderWhere } from "@/lib/admin-orders";
import { ORDER_STATUS, PAYMENT_METHODS, PAYMENT_STATUS } from "@/lib/constants";

// Xuất danh sách đơn hàng (theo bộ lọc hiện tại) ra file Excel
export async function GET(req: Request) {
  const user = await getStaff();
  if (!user || !can(user.role, "orders")) return new Response("Forbidden", { status: 403 });
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const orders = await prisma.order.findMany({ where: orderWhere(sp), include: { items: true }, orderBy: { createdAt: "desc" } });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Đơn hàng");
  ws.columns = [
    { header: "Mã đơn", key: "code", width: 16 },
    { header: "Ngày đặt", key: "date", width: 18 },
    { header: "Khách hàng", key: "name", width: 22 },
    { header: "SĐT", key: "phone", width: 14 },
    { header: "Email", key: "email", width: 24 },
    { header: "Địa chỉ", key: "address", width: 40 },
    { header: "Sản phẩm", key: "items", width: 50 },
    { header: "Tạm tính", key: "subtotal", width: 14 },
    { header: "Phí ship", key: "ship", width: 12 },
    { header: "Giảm giá", key: "discount", width: 12 },
    { header: "Tổng tiền", key: "total", width: 14 },
    { header: "Mã giảm giá", key: "coupon", width: 12 },
    { header: "Hình thức TT", key: "method", width: 26 },
    { header: "Thanh toán", key: "paid", width: 16 },
    { header: "Trạng thái", key: "status", width: 14 },
    { header: "Ghi chú", key: "note", width: 30 },
  ];
  for (const o of orders) {
    ws.addRow({
      code: o.code,
      date: o.createdAt,
      name: o.name,
      phone: o.phone,
      email: o.email,
      address: o.address,
      items: o.items.map((i) => `${i.productName} (${i.variantName}) x${i.quantity}`).join("; "),
      subtotal: o.subtotal,
      ship: o.shippingFee,
      discount: o.discount,
      total: o.total,
      coupon: o.couponCode,
      method: PAYMENT_METHODS[o.paymentMethod],
      paid: PAYMENT_STATUS[o.paymentStatus],
      status: ORDER_STATUS[o.status],
      note: [o.note, o.adminNote].filter(Boolean).join(" | "),
    });
  }
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDC2626" } };
  ws.getColumn("date").numFmt = "dd/mm/yyyy hh:mm";
  for (const k of ["subtotal", "ship", "discount", "total"]) ws.getColumn(k).numFmt = "#,##0";
  ws.views = [{ state: "frozen", ySplit: 1 }];

  const buf = await wb.xlsx.writeBuffer();
  const name = `don-hang-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${name}"`,
    },
  });
}
