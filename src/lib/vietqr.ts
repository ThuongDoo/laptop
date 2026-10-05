import type { Settings } from "./settings";

/** Ảnh QR VietQR tự điền số tiền & nội dung chuyển khoản (img.vietqr.io). */
export function vietQrUrl(s: Settings, amount: number, content: string) {
  const q = new URLSearchParams({ amount: String(amount), addInfo: content, accountName: s.bankAccountName });
  return `https://img.vietqr.io/image/${s.bankBin}-${s.bankAccount}-compact2.png?${q}`;
}
