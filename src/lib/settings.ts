import { cache } from "react";
import { prisma } from "./prisma";

export const DEFAULT_SETTINGS = {
  shopName: "LaptopLikeNew",
  slogan: "Laptop cũ Likenew chính hãng – Bảo hành dài, giá tốt",
  hotline: "0909 123 456",
  zalo: "0909123456",
  messenger: "laptoplikenew",
  email: "hotro@laptoplikenew.vn",
  address: "123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh",
  openingHours: "8:00 - 21:00 (Tất cả các ngày)",
  mapEmbed:
    "https://maps.google.com/maps?q=123%20Nguy%E1%BB%85n%20Tr%C3%A3i%20Qu%E1%BA%ADn%201&output=embed",
  facebook: "https://facebook.com/laptoplikenew",
  youtube: "https://youtube.com/@laptoplikenew",
  tiktok: "https://tiktok.com/@laptoplikenew",
  companyInfo: "Công ty TNHH LaptopLikeNew – MST: 0123456789 do Sở KH&ĐT TP.HCM cấp",
  // Chuyển khoản VietQR
  bankBin: "970436", // Vietcombank
  bankName: "Vietcombank",
  bankAccount: "0123456789",
  bankAccountName: "CONG TY TNHH LAPTOPLIKENEW",
  // Phí vận chuyển
  shippingFee: "50000",
  freeShipThreshold: "10000000",
  // SEO mặc định
  homeTitle: "Laptop cũ Likenew giá rẻ, uy tín – Bảo hành 6-12 tháng",
  homeDescription:
    "Chuyên laptop cũ likenew 99%: Dell, ThinkPad, HP, MacBook, Asus, Lenovo. Laptop văn phòng, gaming, đồ họa giá rẻ. Bảo hành dài, 1 đổi 1 trong 15 ngày, trả góp 0%.",
  adminEmail: "admin@laptoplikenew.vn",
};

export type Settings = typeof DEFAULT_SETTINGS;
export type SettingKey = keyof Settings;

export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await prisma.setting.findMany();
  const s = { ...DEFAULT_SETTINGS };
  for (const r of rows) if (r.key in s) s[r.key as SettingKey] = r.value;
  return s;
});

export function siteUrl(path = "") {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return base + path;
}
