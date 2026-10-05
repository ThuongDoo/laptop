import "server-only";
import nodemailer from "nodemailer";
import { formatVND } from "./format";
import { ORDER_STATUS, PAYMENT_METHODS } from "./constants";
import { getSettings, siteUrl } from "./settings";

type OrderForMail = {
  code: string;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  paymentMethod: string;
  status: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  items: { productName: string; variantName: string; price: number; quantity: number }[];
};

function transport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

export async function sendMail(to: string, subject: string, html: string) {
  const t = transport();
  if (!t) {
    console.info(`[email] SMTP chưa cấu hình – bỏ qua gửi tới ${to}: ${subject}`);
    return;
  }
  try {
    await t.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, html });
  } catch (e) {
    console.error("[email] gửi thất bại", e);
  }
}

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ESC[c]);

function orderTable(o: OrderForMail) {
  const td = "padding:6px;border-bottom:1px solid #eee";
  const rows = o.items
    .map(
      (i) =>
        `<tr><td style="${td}">${esc(i.productName)}<br><small>${esc(i.variantName)}</small></td><td style="${td};text-align:center">${i.quantity}</td><td style="${td};text-align:right">${formatVND(i.price * i.quantity)}</td></tr>`,
    )
    .join("");
  const line = (label: string, value: string) =>
    `<tr><td colspan="2" style="padding:6px;text-align:right">${label}</td><td style="padding:6px;text-align:right">${value}</td></tr>`;
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
  ${line("Tạm tính", formatVND(o.subtotal))}
  ${line("Phí vận chuyển", formatVND(o.shippingFee))}
  ${o.discount ? line("Giảm giá", "-" + formatVND(o.discount)) : ""}
  ${line("<b>Tổng cộng</b>", `<b style="color:#dc2626">${formatVND(o.total)}</b>`)}</table>`;
}

export async function sendOrderCreatedEmails(o: OrderForMail) {
  const s = await getSettings();
  const info = `<p><b>Mã đơn:</b> ${o.code}<br><b>Khách hàng:</b> ${esc(o.name)} – ${esc(o.phone)}<br><b>Địa chỉ:</b> ${esc(o.address)}<br><b>Thanh toán:</b> ${PAYMENT_METHODS[o.paymentMethod]}</p>`;
  const track = siteUrl(`/tra-cuu-don-hang?code=${o.code}&phone=${encodeURIComponent(o.phone)}`);
  if (o.email) {
    await sendMail(
      o.email,
      `[${s.shopName}] Xác nhận đơn hàng #${o.code}`,
      `<div style="font-family:Arial,sans-serif;max-width:600px">
        <h2 style="color:#dc2626">Cảm ơn bạn đã đặt hàng tại ${esc(s.shopName)}!</h2>
        <p>Chúng tôi sẽ gọi xác nhận trong thời gian sớm nhất. Hotline: <b>${esc(s.hotline)}</b></p>
        ${info}${orderTable(o)}
        <p><a href="${track}">Theo dõi đơn hàng</a></p>
      </div>`,
    );
  }
  await sendMail(
    process.env.ADMIN_NOTIFY_EMAIL || s.adminEmail,
    `Đơn hàng mới #${o.code} – ${formatVND(o.total)}`,
    `<div style="font-family:Arial,sans-serif">${info}${orderTable(o)}<p><a href="${siteUrl("/admin/orders")}">Mở trang quản trị</a></p></div>`,
  );
}

export async function sendOrderStatusEmail(o: OrderForMail) {
  if (!o.email) return;
  const s = await getSettings();
  await sendMail(
    o.email,
    `[${s.shopName}] Đơn hàng #${o.code}: ${ORDER_STATUS[o.status]}`,
    `<div style="font-family:Arial,sans-serif;max-width:600px">
      <p>Xin chào ${esc(o.name)},</p>
      <p>Đơn hàng <b>#${o.code}</b> của bạn đã chuyển sang trạng thái: <b style="color:#dc2626">${ORDER_STATUS[o.status]}</b>.</p>
      ${orderTable(o)}
      <p>Mọi thắc mắc vui lòng gọi ${esc(s.hotline)}.</p></div>`,
  );
}
