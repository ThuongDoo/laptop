export function formatVND(n: number | null | undefined) {
  return (n ?? 0).toLocaleString("vi-VN") + "₫";
}

export function removeDiacritics(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export function normalizeSearch(s: string) {
  return removeDiacritics(s).toLowerCase().replace(/\s+/g, " ").trim();
}

export function slugify(s: string) {
  return normalizeSearch(s)
    .replace(/["']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function discountPercent(price: number, sale?: number | null) {
  if (!sale || sale >= price) return 0;
  return Math.round(((price - sale) / price) * 100);
}

export function formatDate(d: Date | string, withTime = false) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}
