import { requireStaff } from "@/lib/auth";
import { getSettings, type SettingKey } from "@/lib/settings";
import { vnpayEnabled } from "@/lib/vnpay";
import { ActionForm, Field, SubmitButton } from "@/components/admin/ui";
import { saveSettings } from "../../actions";

const GROUPS: { title: string; fields: [SettingKey, string, string?][] }[] = [
  {
    title: "Thông tin cửa hàng",
    fields: [
      ["shopName", "Tên cửa hàng"],
      ["slogan", "Slogan"],
      ["hotline", "Hotline"],
      ["email", "Email liên hệ"],
      ["address", "Địa chỉ"],
      ["openingHours", "Giờ mở cửa"],
      ["companyInfo", "Thông tin doanh nghiệp (MST...)"],
      ["mapEmbed", "Link nhúng Google Map", "Google Maps → Chia sẻ → Nhúng bản đồ → copy URL trong src=\"...\""],
    ],
  },
  {
    title: "Kênh chat & mạng xã hội",
    fields: [
      ["zalo", "Số Zalo", "Dùng cho nút Zalo Chat (zalo.me/...)"],
      ["messenger", "Facebook Page username", "Dùng cho nút Messenger (m.me/...)"],
      ["facebook", "Link Facebook"],
      ["youtube", "Link YouTube"],
      ["tiktok", "Link TikTok"],
    ],
  },
  {
    title: "Chuyển khoản VietQR",
    fields: [
      ["bankBin", "Mã BIN ngân hàng", "VD: Vietcombank 970436, Techcombank 970407, MB 970422, ACB 970416"],
      ["bankName", "Tên ngân hàng"],
      ["bankAccount", "Số tài khoản"],
      ["bankAccountName", "Chủ tài khoản (không dấu)"],
    ],
  },
  {
    title: "Vận chuyển & thông báo",
    fields: [
      ["shippingFee", "Phí vận chuyển mặc định (₫)"],
      ["freeShipThreshold", "Miễn phí ship cho đơn từ (₫)", "0 = không áp dụng"],
      ["adminEmail", "Email nhận thông báo đơn mới"],
    ],
  },
  {
    title: "SEO trang chủ",
    fields: [
      ["homeTitle", "Meta Title trang chủ"],
      ["homeDescription", "Meta Description trang chủ"],
    ],
  },
];

export default async function SettingsAdmin() {
  await requireStaff("settings");
  const s = await getSettings();
  return (
    <div className="max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold">Cài đặt</h1>
      <ActionForm action={saveSettings} className="space-y-4">
        {GROUPS.map((g) => (
          <section key={g.title} className="card grid gap-3 p-4 md:grid-cols-2">
            <h2 className="font-semibold md:col-span-2">{g.title}</h2>
            {g.fields.map(([k, label, hint]) => (
              <Field key={k} name={k} label={label} hint={hint} defaultValue={s[k]} textarea={k === "homeDescription"} className={["mapEmbed", "address", "homeDescription", "homeTitle"].includes(k) ? "md:col-span-2" : ""} />
            ))}
          </section>
        ))}
        <section className="card p-4 text-sm">
          <h2 className="font-semibold">Cổng thanh toán & email (cấu hình qua biến môi trường)</h2>
          <p className="mt-1 text-gray-600">
            VNPAY: {vnpayEnabled() ? <b className="text-emerald-600">đã bật</b> : <b className="text-amber-600">chưa cấu hình</b>} (VNPAY_TMN_CODE, VNPAY_HASH_SECRET) · Email SMTP:{" "}
            {process.env.SMTP_HOST ? <b className="text-emerald-600">đã bật</b> : <b className="text-amber-600">chưa cấu hình</b>} (SMTP_HOST, SMTP_USER, SMTP_PASS)
          </p>
        </section>
        <SubmitButton>Lưu cài đặt</SubmitButton>
      </ActionForm>
    </div>
  );
}
