import { NextResponse } from "next/server";
import { handleVnpayResult } from "@/lib/payments";

const MESSAGES = {
  "00": "Confirm Success",
  "01": "Order not found",
  "02": "Order already confirmed",
  "04": "Invalid amount",
  "97": "Invalid signature",
} as const;

// VNPAY gọi server-to-server để xác nhận giao dịch (cấu hình IPN URL trên merchant portal)
export async function GET(req: Request) {
  const { code } = await handleVnpayResult(new URL(req.url).searchParams);
  return NextResponse.json({ RspCode: code, Message: MESSAGES[code] });
}
