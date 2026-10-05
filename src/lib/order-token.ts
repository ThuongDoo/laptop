import "server-only";
import crypto from "node:crypto";

/** Token ký HMAC để xem trang đơn hàng mà không lộ dữ liệu khi đoán mã đơn. */
export function orderToken(code: string) {
  return crypto
    .createHmac("sha256", process.env.AUTH_SECRET || "dev-secret-change-me")
    .update(`order:${code}`)
    .digest("base64url")
    .slice(0, 22);
}

export function verifyOrderToken(code: string, token: string | undefined) {
  if (!token) return false;
  const expected = orderToken(code);
  return token.length === expected.length && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
