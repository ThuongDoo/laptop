export const CONDITIONS: Record<string, string> = {
  new: "Mới 100% (Nguyên seal)",
  "99": "Likenew 99%",
  "98": "Likenew 98%",
  "95": "Đẹp 95%",
  "90": "Trầy xước nhẹ 90%",
};

export const CPU_FAMILIES: Record<string, string> = {
  i3: "Core i3",
  i5: "Core i5",
  i7: "Core i7",
  i9: "Core i9",
  r5: "Ryzen 5",
  r7: "Ryzen 7",
  r9: "Ryzen 9",
  m1: "Apple M1",
  m2: "Apple M2",
  m3: "Apple M3",
  other: "Khác",
};

export const PRICE_RANGES = [
  { key: "duoi-10", label: "Dưới 10 triệu", min: 0, max: 10_000_000 },
  { key: "10-15", label: "10 - 15 triệu", min: 10_000_000, max: 15_000_000 },
  { key: "15-20", label: "15 - 20 triệu", min: 15_000_000, max: 20_000_000 },
  { key: "tren-20", label: "Trên 20 triệu", min: 20_000_000, max: Number.MAX_SAFE_INTEGER },
];

export const RAM_OPTIONS = [8, 16, 32];
export const STORAGE_OPTIONS = [256, 512, 1024];
export const SCREEN_OPTIONS = [
  { key: "13", label: '13 - 13.6"', min: 13, max: 13.9 },
  { key: "14", label: '14 - 14.5"', min: 14, max: 14.9 },
  { key: "15", label: '15.6 - 16"', min: 15, max: 16.5 },
  { key: "17", label: '17" trở lên', min: 17, max: 20 },
];

export const SORTS: Record<string, string> = {
  moi: "Mới nhất",
  "ban-chay": "Bán chạy",
  "gia-tang": "Giá tăng dần",
  "gia-giam": "Giá giảm dần",
};

export const STOCK_STATUS: Record<string, string> = {
  IN_STOCK: "Còn hàng",
  OUT_OF_STOCK: "Hết hàng",
  INCOMING: "Đang về",
};

export const ORDER_STATUS: Record<string, string> = {
  NEW: "Mới",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  COMPLETED: "Thành công",
  CANCELLED: "Đã hủy",
};

export const PAYMENT_METHODS: Record<string, string> = {
  COD: "Thanh toán khi nhận hàng (COD)",
  BANK: "Chuyển khoản ngân hàng (VietQR)",
  VNPAY: "VNPAY (ATM / Visa / QR ví điện tử)",
  INSTALLMENT: "Mua trả góp 0%",
};

export const PAYMENT_STATUS: Record<string, string> = {
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
};

export const COUPON_TYPES: Record<string, string> = {
  PERCENT: "Giảm theo %",
  FIXED: "Giảm số tiền",
  FREESHIP: "Miễn phí vận chuyển",
};

export const ROLES: Record<string, string> = {
  ADMIN: "Quản trị viên",
  SALES: "Nhân viên bán hàng",
  EDITOR: "Biên tập viên",
};
