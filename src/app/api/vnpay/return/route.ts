import { NextResponse } from "next/server";
import { handleVnpayResult } from "@/lib/payments";
import { orderToken } from "@/lib/order-token";
import { siteUrl } from "@/lib/settings";

// Khách hàng được VNPAY chuyển về đây sau khi thanh toán
export async function GET(req: Request) {
  const query = new URL(req.url).searchParams;
  const { r, order } = await handleVnpayResult(query);
  if (!order) return NextResponse.redirect(siteUrl("/"));
  const status = r.success ? "success" : "fail";
  return NextResponse.redirect(siteUrl(`/dat-hang/${order.code}?t=${orderToken(order.code)}&vnp=${status}`));
}
