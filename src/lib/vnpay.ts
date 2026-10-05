import "server-only";
import crypto from "node:crypto";

// Tích hợp VNPAY Payment Gateway v2.1.0 (sandbox mặc định).
const cfg = () => ({
  tmnCode: process.env.VNPAY_TMN_CODE || "",
  hashSecret: process.env.VNPAY_HASH_SECRET || "",
  url: process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
});

export const vnpayEnabled = () => !!(cfg().tmnCode && cfg().hashSecret);

function encodeSorted(params: Record<string, string>) {
  return Object.keys(params)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k]).replace(/%20/g, "+")}`)
    .join("&");
}

function hmac(data: string) {
  return crypto.createHmac("sha512", cfg().hashSecret).update(Buffer.from(data, "utf-8")).digest("hex");
}

function vnDate(d: Date) {
  const t = new Date(d.getTime() + 7 * 3600 * 1000); // GMT+7
  const p = (n: number) => String(n).padStart(2, "0");
  return `${t.getUTCFullYear()}${p(t.getUTCMonth() + 1)}${p(t.getUTCDate())}${p(t.getUTCHours())}${p(t.getUTCMinutes())}${p(t.getUTCSeconds())}`;
}

export function createPaymentUrl(opts: { orderCode: string; amount: number; ip: string; returnUrl: string }) {
  const now = new Date();
  const params: Record<string, string> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: cfg().tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: opts.orderCode,
    vnp_OrderInfo: `Thanh toan don hang ${opts.orderCode}`,
    vnp_OrderType: "other",
    vnp_Amount: String(opts.amount * 100),
    vnp_ReturnUrl: opts.returnUrl,
    vnp_IpAddr: opts.ip || "127.0.0.1",
    vnp_CreateDate: vnDate(now),
    vnp_ExpireDate: vnDate(new Date(now.getTime() + 15 * 60 * 1000)),
  };
  const signData = encodeSorted(params);
  return `${cfg().url}?${signData}&vnp_SecureHash=${hmac(signData)}`;
}

/** Xác thực chữ ký trả về từ VNPAY (return URL và IPN). */
export function verifyReturn(query: URLSearchParams) {
  const params: Record<string, string> = {};
  query.forEach((v, k) => {
    if (k.startsWith("vnp_") && k !== "vnp_SecureHash" && k !== "vnp_SecureHashType") params[k] = v;
  });
  const valid = vnpayEnabled() && hmac(encodeSorted(params)) === query.get("vnp_SecureHash");
  return {
    valid,
    success: valid && params.vnp_ResponseCode === "00" && params.vnp_TransactionStatus === "00",
    orderCode: params.vnp_TxnRef,
    amount: Number(params.vnp_Amount || 0) / 100,
  };
}
