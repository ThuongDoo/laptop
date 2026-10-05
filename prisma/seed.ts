/* Dữ liệu mẫu: chạy bằng `npm run db:seed` (xóa sạch dữ liệu cũ). */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "uploads");

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/\s+/g, " ").trim();
const slugify = (s: string) => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const tr = (n: number) => Math.round(n * 1_000_000);

// ---------- Ảnh minh họa (thay bằng ảnh chụp thật trong trang quản trị) ----------

function laptopSvg(brand: string, model: string, color: string, view: number) {
  const bg = ["#f8fafc", "#f1f5f9", "#fef2f2"][view % 3];
  const label = ["Mặt trước", "Bàn phím", "Cổng kết nối"][view % 3];
  const keys = Array.from({ length: 4 }, (_, r) =>
    Array.from({ length: 12 }, (_, c) => `<rect x="${232 + c * 28}" y="${436 + r * 22}" width="22" height="16" rx="3" fill="#1f2937"/>`).join(""),
  ).join("");
  const screen =
    view === 1
      ? `<rect x="190" y="400" width="420" height="130" rx="10" fill="${color}"/>${keys}<rect x="340" y="532" width="120" height="0" />`
      : `<rect x="170" y="110" width="460" height="290" rx="14" fill="#111827"/>
         <rect x="186" y="126" width="428" height="258" rx="6" fill="url(#g)"/>
         <text x="400" y="250" text-anchor="middle" font-family="Arial" font-weight="700" font-size="42" fill="#fff">${brand}</text>
         <text x="400" y="292" text-anchor="middle" font-family="Arial" font-size="20" fill="#fee2e2">${model.slice(0, 34)}</text>
         <path d="M120 400 h560 l40 40 h-640 z" fill="${color}"/>
         <rect x="80" y="440" width="640" height="14" rx="7" fill="#9ca3af"/>`;
  const ports =
    view === 2
      ? `<rect x="120" y="520" width="560" height="40" rx="8" fill="${color}"/>
         ${["USB-C", "USB-A", "HDMI", "Audio"].map((p, i) => `<rect x="${170 + i * 125}" y="530" width="60" height="18" rx="4" fill="#111827"/><text x="${200 + i * 125}" y="584" text-anchor="middle" font-family="Arial" font-size="14" fill="#475569">${p}</text>`).join("")}`
      : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="640" viewBox="0 0 800 640">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ef4444"/><stop offset="1" stop-color="#7f1d1d"/></linearGradient></defs>
    <rect width="800" height="640" fill="${bg}"/>${screen}${ports}
    <text x="400" y="620" text-anchor="middle" font-family="Arial" font-size="16" fill="#94a3b8">Ảnh minh họa – ${label}</text>
  </svg>`;
}

function bannerSvg(title: string, from: string, to: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="450" viewBox="0 0 1200 450">
    <defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
    <rect width="1200" height="450" fill="url(#b)"/>
    <circle cx="1050" cy="80" r="220" fill="#ffffff" opacity="0.08"/><circle cx="900" cy="420" r="160" fill="#ffffff" opacity="0.06"/>
    <g transform="translate(700 90) rotate(-6)">
      <rect x="0" y="0" width="400" height="250" rx="14" fill="#111827"/><rect x="14" y="14" width="372" height="222" rx="6" fill="#fff" opacity="0.92"/>
      <text x="200" y="135" text-anchor="middle" font-family="Arial" font-weight="700" font-size="34" fill="#dc2626">${title}</text>
      <path d="M-40 250 h480 l34 34 h-548 z" fill="#d1d5db"/>
    </g></svg>`;
}

async function writeWebp(rel: string, svg: string, width: number) {
  const file = path.join(UPLOAD_DIR, rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await sharp(Buffer.from(svg)).resize({ width }).webp({ quality: 80 }).toFile(file);
  return `/uploads/${rel}`;
}

// ---------- Dữ liệu ----------

const brands = [
  ["Dell", "laptop-dell"],
  ["ThinkPad", "laptop-thinkpad"],
  ["HP", "laptop-hp"],
  ["MacBook", "macbook"],
  ["Asus", "laptop-asus"],
  ["Lenovo", "laptop-lenovo"],
  ["Acer", "laptop-acer"],
  ["MSI", "laptop-msi"],
] as const;

const categories = [
  ["Laptop Học tập - Văn phòng", "laptop-hoc-tap-van-phong", "briefcase", "Bền bỉ, pin tốt, giá mềm cho học sinh – sinh viên & dân văn phòng"],
  ["Laptop Gaming", "laptop-gaming", "gamepad", "Card rời RTX/GTX, màn tần số quét cao, tản nhiệt tốt"],
  ["Laptop Đồ họa - Kỹ thuật", "laptop-do-hoa", "palette", "Workstation, màn chuẩn màu cho designer, kỹ sư, dựng phim"],
  ["Laptop Mỏng nhẹ", "laptop-mong-nhe", "feather", "Dưới 1.4kg, sang trọng, thời lượng pin dài"],
  ["Laptop Lập trình", "laptop-lap-trinh", "code", "RAM lớn, bàn phím tốt, màn hình dọc cao cho developer"],
] as const;

type Seed = {
  name: string;
  brand: string;
  cats: string[];
  cpu: string;
  fam: string;
  gpu: string;
  gpuType?: string;
  size: number;
  screen: string;
  weight: string;
  cond: string;
  battery: string;
  variants: [number, number, number, number | null][]; // ram, ssd, giá niêm yết (tr), giá KM (tr)
  featured?: boolean;
  sold: number;
  color: string;
};

const P: Seed[] = [
  { name: "Dell Latitude 7420", brand: "Dell", cats: ["laptop-hoc-tap-van-phong", "laptop-mong-nhe", "laptop-lap-trinh"], cpu: "Intel Core i7-1185G7 (4 nhân 8 luồng, up to 4.8GHz)", fam: "i7", gpu: "Intel Iris Xe Graphics", size: 14, screen: '14" FHD IPS 1920x1080, chống chói', weight: "1.36 kg", cond: "99", battery: "Pin 63Wh, chai 8%, dùng 6-8 tiếng", variants: [[16, 256, 13.5, 11.9], [16, 512, 14.5, 12.9]], featured: true, sold: 86, color: "#475569" },
  { name: "Dell XPS 13 9310", brand: "Dell", cats: ["laptop-mong-nhe", "laptop-hoc-tap-van-phong"], cpu: "Intel Core i7-1185G7", fam: "i7", gpu: "Intel Iris Xe Graphics", size: 13.4, screen: '13.4" FHD+ 1920x1200 InfinityEdge', weight: "1.27 kg", cond: "99", battery: "Pin 52Wh, chai 6%", variants: [[16, 512, 19.9, 17.5], [32, 1024, 23.5, 20.9]], featured: true, sold: 54, color: "#cbd5e1" },
  { name: "Dell Precision 5550", brand: "Dell", cats: ["laptop-do-hoa"], cpu: "Intel Core i7-10850H (6 nhân 12 luồng)", fam: "i7", gpu: "NVIDIA Quadro T2000 4GB", gpuType: "discrete", size: 15.6, screen: '15.6" FHD+ 1920x1200, 100% sRGB', weight: "1.84 kg", cond: "98", battery: "Pin 86Wh, chai 12%", variants: [[32, 512, 24.9, 21.5]], sold: 21, color: "#334155" },
  { name: "Dell Inspiron 5410", brand: "Dell", cats: ["laptop-hoc-tap-van-phong"], cpu: "Intel Core i5-1135G7", fam: "i5", gpu: "Intel Iris Xe Graphics", size: 14, screen: '14" FHD IPS', weight: "1.44 kg", cond: "98", battery: "Pin 54Wh, chai 10%", variants: [[8, 256, 10.5, 9.2], [16, 512, 11.9, 10.4]], sold: 73, color: "#94a3b8" },
  { name: "ThinkPad X1 Carbon Gen 9", brand: "ThinkPad", cats: ["laptop-mong-nhe", "laptop-hoc-tap-van-phong", "laptop-lap-trinh"], cpu: "Intel Core i7-1165G7", fam: "i7", gpu: "Intel Iris Xe Graphics", size: 14, screen: '14" WUXGA 1920x1200 IPS 400 nits', weight: "1.13 kg", cond: "99", battery: "Pin 57Wh, chai 5%", variants: [[16, 512, 18.9, 16.9]], featured: true, sold: 64, color: "#111827" },
  { name: "ThinkPad T14 Gen 2", brand: "ThinkPad", cats: ["laptop-hoc-tap-van-phong", "laptop-lap-trinh"], cpu: "Intel Core i5-1145G7 vPro", fam: "i5", gpu: "Intel Iris Xe Graphics", size: 14, screen: '14" FHD IPS', weight: "1.5 kg", cond: "98", battery: "Pin 50Wh, chai 9%", variants: [[16, 256, 11.5, 10.5], [16, 512, 12.5, 11.2]], sold: 92, color: "#1f2937" },
  { name: "ThinkPad P53", brand: "ThinkPad", cats: ["laptop-do-hoa"], cpu: "Intel Core i7-9850H", fam: "i7", gpu: "NVIDIA Quadro T1000 4GB", gpuType: "discrete", size: 15.6, screen: '15.6" FHD IPS', weight: "2.45 kg", cond: "95", battery: "Pin 90Wh, chai 15%", variants: [[32, 512, 17.9, 15.9]], sold: 18, color: "#1f2937" },
  { name: "ThinkPad E14 Gen 2", brand: "ThinkPad", cats: ["laptop-hoc-tap-van-phong"], cpu: "AMD Ryzen 5 4500U", fam: "r5", gpu: "AMD Radeon Graphics", size: 14, screen: '14" FHD IPS', weight: "1.59 kg", cond: "95", battery: "Pin 45Wh, chai 12%", variants: [[8, 256, 8.9, 7.9]], sold: 47, color: "#111827" },
  { name: "HP EliteBook 840 G8", brand: "HP", cats: ["laptop-hoc-tap-van-phong"], cpu: "Intel Core i5-1135G7", fam: "i5", gpu: "Intel Iris Xe Graphics", size: 14, screen: '14" FHD IPS 400 nits', weight: "1.32 kg", cond: "99", battery: "Pin 53Wh, chai 7%", variants: [[16, 256, 11.2, 10.2]], sold: 39, color: "#9ca3af" },
  { name: "HP ZBook Firefly 14 G8", brand: "HP", cats: ["laptop-do-hoa", "laptop-mong-nhe"], cpu: "Intel Core i7-1165G7", fam: "i7", gpu: "NVIDIA T500 4GB", gpuType: "discrete", size: 14, screen: '14" FHD IPS 100% sRGB', weight: "1.35 kg", cond: "99", battery: "Pin 53Wh, chai 6%", variants: [[16, 512, 17.5, 15.5]], sold: 15, color: "#6b7280" },
  { name: "HP Victus 16", brand: "HP", cats: ["laptop-gaming"], cpu: "AMD Ryzen 5 5600H", fam: "r5", gpu: "NVIDIA RTX 3050 4GB", gpuType: "discrete", size: 16.1, screen: '16.1" FHD IPS 144Hz', weight: "2.46 kg", cond: "98", battery: "Pin 70Wh, chai 9%", variants: [[16, 512, 16.5, 14.9]], featured: true, sold: 33, color: "#1e293b" },
  { name: "MacBook Air M1 2020", brand: "MacBook", cats: ["laptop-mong-nhe", "laptop-hoc-tap-van-phong"], cpu: "Apple M1 (8 nhân CPU, 7 nhân GPU)", fam: "m1", gpu: "Apple GPU 7 nhân", size: 13.3, screen: '13.3" Retina 2560x1600 True Tone', weight: "1.29 kg", cond: "99", battery: "Pin 92%, sạc 120 lần", variants: [[8, 256, 15.5, 13.5], [16, 512, 19.5, 17.2]], featured: true, sold: 128, color: "#e5e7eb" },
  { name: "MacBook Pro 14 M1 Pro 2021", brand: "MacBook", cats: ["laptop-do-hoa", "laptop-lap-trinh"], cpu: "Apple M1 Pro (8 nhân CPU, 14 nhân GPU)", fam: "m1", gpu: "Apple GPU 14 nhân", size: 14.2, screen: '14.2" Liquid Retina XDR 120Hz', weight: "1.6 kg", cond: "99", battery: "Pin 95%, sạc 86 lần", variants: [[16, 512, 32.9, 29.9]], featured: true, sold: 41, color: "#6b7280" },
  { name: "MacBook Air M2 2022", brand: "MacBook", cats: ["laptop-mong-nhe", "laptop-hoc-tap-van-phong"], cpu: "Apple M2 (8 nhân CPU, 8 nhân GPU)", fam: "m2", gpu: "Apple GPU 8 nhân", size: 13.6, screen: '13.6" Liquid Retina 2560x1664', weight: "1.24 kg", cond: "99", battery: "Pin 97%, sạc 40 lần", variants: [[8, 256, 20.9, 18.9], [16, 512, 25.9, 23.5]], featured: true, sold: 57, color: "#1e3a8a" },
  { name: "Asus TUF Gaming F15 FX506HC", brand: "Asus", cats: ["laptop-gaming"], cpu: "Intel Core i5-11400H", fam: "i5", gpu: "NVIDIA RTX 3050 4GB", gpuType: "discrete", size: 15.6, screen: '15.6" FHD IPS 144Hz', weight: "2.3 kg", cond: "98", battery: "Pin 48Wh, chai 10%", variants: [[8, 512, 15.5, 13.9], [16, 512, 16.5, 14.7]], featured: true, sold: 76, color: "#374151" },
  { name: "Asus ROG Strix G15 G513RM", brand: "Asus", cats: ["laptop-gaming", "laptop-do-hoa"], cpu: "AMD Ryzen 7 6800H", fam: "r7", gpu: "NVIDIA RTX 3060 6GB", gpuType: "discrete", size: 15.6, screen: '15.6" QHD 165Hz', weight: "2.1 kg", cond: "99", battery: "Pin 90Wh, chai 5%", variants: [[16, 512, 25.5, 22.5]], featured: true, sold: 29, color: "#0f172a" },
  { name: "Asus ZenBook 14 UX425EA", brand: "Asus", cats: ["laptop-mong-nhe"], cpu: "Intel Core i5-1135G7", fam: "i5", gpu: "Intel Iris Xe Graphics", size: 14, screen: '14" FHD IPS 400 nits', weight: "1.17 kg", cond: "98", battery: "Pin 67Wh, chai 8%", variants: [[8, 512, 12.9, 11.5]], sold: 24, color: "#64748b" },
  { name: "Lenovo Legion 5 15ACH6H", brand: "Lenovo", cats: ["laptop-gaming", "laptop-do-hoa"], cpu: "AMD Ryzen 7 5800H", fam: "r7", gpu: "NVIDIA RTX 3060 6GB", gpuType: "discrete", size: 15.6, screen: '15.6" FHD IPS 165Hz', weight: "2.4 kg", cond: "98", battery: "Pin 80Wh, chai 9%", variants: [[16, 512, 24.5, 21.9], [32, 1024, 27.5, 24.5]], featured: true, sold: 48, color: "#1f2937" },
  { name: "Lenovo IdeaPad 5 14ALC05", brand: "Lenovo", cats: ["laptop-hoc-tap-van-phong"], cpu: "AMD Ryzen 5 5500U", fam: "r5", gpu: "AMD Radeon Graphics", size: 14, screen: '14" FHD IPS', weight: "1.39 kg", cond: "98", battery: "Pin 57Wh, chai 10%", variants: [[8, 512, 10.5, 9.5]], sold: 61, color: "#9ca3af" },
  { name: "Lenovo Yoga Slim 7 Pro 14IHU5", brand: "Lenovo", cats: ["laptop-mong-nhe", "laptop-lap-trinh"], cpu: "Intel Core i5-11300H", fam: "i5", gpu: "Intel Iris Xe Graphics", size: 14, screen: '14" 2.8K 2880x1800 90Hz', weight: "1.3 kg", cond: "99", battery: "Pin 61Wh, chai 6%", variants: [[16, 512, 15.2, 13.8]], sold: 19, color: "#94a3b8" },
  { name: "Acer Nitro 5 AN515-57", brand: "Acer", cats: ["laptop-gaming", "laptop-hoc-tap-van-phong"], cpu: "Intel Core i5-11400H", fam: "i5", gpu: "NVIDIA GTX 1650 4GB", gpuType: "discrete", size: 15.6, screen: '15.6" FHD IPS 144Hz', weight: "2.2 kg", cond: "95", battery: "Pin 57Wh, chai 14%", variants: [[8, 512, 13.2, 11.9]], sold: 52, color: "#111827" },
  { name: "MSI GF63 Thin 10SC", brand: "MSI", cats: ["laptop-gaming"], cpu: "Intel Core i5-10500H", fam: "i5", gpu: "NVIDIA GTX 1650 Max-Q 4GB", gpuType: "discrete", size: 15.6, screen: '15.6" FHD IPS', weight: "1.86 kg", cond: "95", battery: "Pin 51Wh, chai 15%", variants: [[8, 512, 12.2, 10.9]], sold: 35, color: "#18181b" },
];

const reviewers = ["Nguyễn Minh Tuấn", "Trần Thu Hà", "Lê Hoàng Nam", "Phạm Ngọc Anh", "Võ Đức Thịnh", "Đặng Mai Linh", "Bùi Quang Huy", "Hoàng Yến Nhi"];
const reviewTexts = [
  "Máy đẹp như mô tả, gần như mới, pin trâu. Shop tư vấn nhiệt tình, giao hàng nhanh.",
  "Mua cho con học online, chạy mượt, màn hình đẹp. Được tặng balo và chuột nữa, rất hài lòng.",
  "Mình làm lập trình, máy chạy Docker + IDE ổn định. Bàn phím gõ rất sướng.",
  "Đã test kỹ tại shop, không lỗi lầm gì. Bảo hành dài nên yên tâm.",
  "Giá tốt hơn nhiều chỗ khác, máy ngoại hình 99% thật. Sẽ giới thiệu bạn bè.",
  "Chơi game mượt, nhiệt độ ổn sau khi shop vệ sinh tra keo. 5 sao!",
];

const html = (...ps: string[]) => ps.join("\n");

async function main() {
  console.log("→ Xóa dữ liệu cũ");
  await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.review.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.productVariant.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.brand.deleteMany(),
    prisma.post.deleteMany(),
    prisma.page.deleteMany(),
    prisma.banner.deleteMany(),
    prisma.coupon.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.user.deleteMany(),
    prisma.setting.deleteMany(),
  ]);
  await fs.rm(path.join(UPLOAD_DIR, "seed"), { recursive: true, force: true });

  console.log("→ Tài khoản quản trị");
  const pw = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({ data: { email: "admin@laptoplikenew.vn", name: "Quản trị viên", passwordHash: pw, role: "ADMIN" } });
  await prisma.user.create({ data: { email: "sales@laptoplikenew.vn", name: "NV Bán hàng", passwordHash: pw, role: "SALES" } });
  await prisma.user.create({ data: { email: "editor@laptoplikenew.vn", name: "Biên tập viên", passwordHash: pw, role: "EDITOR" } });

  console.log("→ Thương hiệu & danh mục");
  const brandIds: Record<string, string> = {};
  for (const [i, [name, slug]] of brands.entries()) {
    const b = await prisma.brand.create({
      data: { name, slug, sortOrder: i, metaTitle: `${name === "MacBook" ? "MacBook cũ" : `Laptop ${name} cũ`} giá rẻ, likenew 99%` },
    });
    brandIds[name] = b.id;
  }
  const catIds: Record<string, string> = {};
  for (const [i, [name, slug, icon, shortDesc]] of categories.entries()) {
    const c = await prisma.category.create({
      data: {
        name,
        slug,
        icon,
        shortDesc,
        sortOrder: i,
        metaTitle: `${name} cũ giá rẻ, uy tín – Bảo hành dài`,
        metaDescription: `${name} cũ likenew 99%: ${shortDesc}. Bảo hành 6-12 tháng, 1 đổi 1 trong 15 ngày, trả góp 0%.`,
        content: html(
          `<h2>Kinh nghiệm chọn ${name.toLowerCase()} cũ</h2>`,
          `<p>Khi chọn ${name.toLowerCase()} cũ, bạn nên ưu tiên máy còn ngoại hình đẹp, pin chai dưới 20% và đã được kiểm tra kỹ phần cứng. Tất cả máy tại shop đều được test 30 bước, vệ sinh và tra keo tản nhiệt trước khi giao.</p>`,
          `<h3>Cấu hình khuyến nghị</h3><ul><li>CPU từ Core i5 / Ryzen 5 trở lên</li><li>RAM tối thiểu 8GB, khuyến nghị 16GB</li><li>Ổ cứng SSD để khởi động nhanh</li></ul>`,
        ),
      },
    });
    catIds[slug] = c.id;
  }

  console.log("→ Sản phẩm (sinh ảnh minh họa WebP)");
  const products: { id: string; name: string; variants: { id: string; name: string; price: number }[]; image: string }[] = [];
  for (const [idx, p] of P.entries()) {
    const slug = slugify(`${p.name} ${p.cpu.match(/(i\d|Ryzen \d|M\d Pro|M\d)/)?.[0] ?? ""}`);
    const imgs: string[] = [];
    for (let v = 0; v < 3; v++) imgs.push(await writeWebp(`seed/${slug}-${v + 1}.webp`, laptopSvg(p.brand, p.name, p.color, v), 800));
    const variants = p.variants.map(([ram, ssd, price, sale], i) => ({
      name: `${ram}GB RAM / ${ssd >= 1024 ? ssd / 1024 + "TB" : ssd + "GB"} SSD`,
      ramGB: ram,
      storageGB: ssd,
      price: tr(price),
      salePrice: sale ? tr(sale) : null,
      stockStatus: idx === 7 && i === 0 ? "INCOMING" : "IN_STOCK",
      stock: 2,
      sortOrder: i,
    }));
    const min = Math.min(...variants.map((v) => v.salePrice ?? v.price));
    const created = await prisma.product.create({
      data: {
        name: p.name,
        slug,
        sku: `LL-${String(idx + 1).padStart(4, "0")}`,
        brandId: brandIds[p.brand],
        categories: { connect: p.cats.map((c) => ({ id: catIds[c] })) },
        shortDesc: `${p.name} ${p.cpu.split(" (")[0]}, màn ${p.screen.split(" ")[0]}, nặng ${p.weight}. Ngoại hình ${p.cond}%, ${p.battery.toLowerCase()}.`,
        description: html(
          `<h2>Đánh giá nhanh ${p.name}</h2>`,
          `<p><strong>${p.name}</strong> là lựa chọn đáng giá trong phân khúc laptop cũ nhờ cấu hình <strong>${p.cpu}</strong>, card đồ họa <strong>${p.gpu}</strong> và màn hình ${p.screen}. Máy phù hợp cho ${p.cats.map((c) => categories.find((x) => x[1] === c)?.[0].replace("Laptop ", "").toLowerCase()).join(", ")}.</p>`,
          `<h3>Thiết kế & độ bền</h3><p>Trọng lượng chỉ ${p.weight}, vỏ máy chắc chắn, bản lề êm. Máy tại shop được kiểm tra kỹ từng chi tiết trước khi bán.</p>`,
          `<h3>Hiệu năng</h3><p>Đáp ứng tốt các tác vụ văn phòng, học tập, lập trình${p.gpuType === "discrete" ? ", chơi game và đồ họa nhờ card rời" : ""}. SSD NVMe cho tốc độ khởi động dưới 10 giây.</p>`,
          `<h3>Vì sao nên mua tại LaptopLikeNew?</h3><ul><li>Test 30 bước, cam kết không lỗi ẩn</li><li>1 đổi 1 trong 15 ngày nếu lỗi phần cứng</li><li>Vệ sinh, tra keo tản nhiệt miễn phí trọn đời</li></ul>`,
        ),
        cpu: p.cpu,
        cpuFamily: p.fam,
        gpu: p.gpu,
        gpuType: p.gpuType ?? "onboard",
        screenSize: p.size,
        screen: p.screen,
        weight: p.weight,
        battery: p.battery.split(",")[0],
        ports: "USB-C/Thunderbolt, USB-A, HDMI, jack 3.5mm",
        os: p.brand === "MacBook" ? "macOS" : "Windows 11 Pro bản quyền",
        specs: JSON.stringify([
          { label: "Wifi / Bluetooth", value: "Wi-Fi 6, Bluetooth 5.1" },
          { label: "Bàn phím", value: "Có đèn nền" },
        ]),
        condition: p.cond,
        appearance: p.cond === "99" ? "Ngoại hình như mới, không trầy xước, không cấn móp" : p.cond === "98" ? "Đẹp, có vài vết xước dăm rất nhỏ khó thấy" : "Có trầy xước nhẹ ở mặt A/đáy máy do sử dụng, màn hình & bàn phím đẹp",
        batteryHealth: p.battery,
        accessories: "Sạc zin theo máy, tặng balo + chuột không dây",
        warrantyMonths: p.cond === "99" ? 12 : 6,
        gifts: "Tặng balo laptop cao cấp\nTặng chuột không dây + lót chuột\nTặng túi chống sốc\nVệ sinh, tra keo tản nhiệt miễn phí trọn đời\nCài đặt phần mềm miễn phí",
        featured: !!p.featured,
        soldCount: p.sold,
        metaTitle: `${p.name} cũ ${p.cpu.match(/(i\d-\w+|Ryzen \d \w+|M\d( Pro)?)/)?.[0] ?? ""} – Giá tốt, likenew ${p.cond}%`.replace(/\s+/g, " "),
        metaDescription: `Mua ${p.name} cũ likenew ${p.cond}%, ${p.cpu.split(" (")[0]}, ${p.screen.split(",")[0]}. Bảo hành ${p.cond === "99" ? 12 : 6} tháng, 1 đổi 1 15 ngày, trả góp 0%.`,
        minPrice: min,
        searchText: norm([p.name, p.brand, p.cpu, p.gpu, p.screen, ...p.cats, ...variants.map((v) => `${v.ramGB}gb ${v.storageGB}gb`)].join(" ")),
        createdAt: new Date(Date.now() - idx * 86400000),
        images: { create: imgs.map((url, i) => ({ url, alt: i === 0 ? `${p.name} mặt trước` : "", sortOrder: i })) },
        variants: { create: variants },
      },
      include: { variants: true },
    });
    products.push({ id: created.id, name: created.name, variants: created.variants, image: imgs[0] });

    for (let r = 0; r < 2 + (idx % 3); r++) {
      await prisma.review.create({
        data: {
          productId: created.id,
          name: reviewers[(idx + r) % reviewers.length],
          rating: r === 2 ? 4 : 5,
          content: reviewTexts[(idx + r) % reviewTexts.length],
          approved: true,
          reply: r === 0 ? "Cảm ơn anh/chị đã tin tưởng ủng hộ shop ạ!" : null,
          createdAt: new Date(Date.now() - (r + 1) * 3 * 86400000),
        },
      });
    }
  }

  console.log("→ Banner");
  const bannerData = [
    ["Laptop Likenew 99% – Giảm đến 3 triệu", "Bảo hành 12 tháng, 1 đổi 1 trong 15 ngày", "/laptop?sx=ban-chay", "#dc2626", "#7f1d1d", "SALE"],
    ["MacBook M1, M2 giá chỉ từ 13.5 triệu", "Pin trên 90%, đầy đủ phụ kiện zin", "/macbook", "#b91c1c", "#1f2937", "MacBook"],
    ["Laptop Gaming RTX – Chiến mọi tựa game", "Vệ sinh tra keo miễn phí trọn đời", "/laptop-gaming", "#ef4444", "#450a0a", "GAMING"],
  ] as const;
  for (const [i, [title, subtitle, link, from, to, word]] of bannerData.entries()) {
    const image = await writeWebp(`seed/banner-${i + 1}.webp`, bannerSvg(word, from, to), 1200);
    await prisma.banner.create({ data: { title, subtitle, link, image, sortOrder: i } });
  }

  console.log("→ Trang thông tin");
  const pages = [
    ["Giới thiệu", "gioi-thieu", "<h2>Về LaptopLikeNew</h2><p>LaptopLikeNew là hệ thống chuyên laptop cũ – likenew uy tín với hơn 8 năm kinh nghiệm. Chúng tôi nhập máy trực tiếp từ Mỹ, Nhật, châu Âu, kiểm định 30 bước trước khi đến tay khách hàng.</p><h2>Cam kết của chúng tôi</h2><ul><li>Máy đúng mô tả, chụp ảnh thật 100%</li><li>Bảo hành 6–12 tháng, 1 đổi 1 trong 15 ngày</li><li>Hỗ trợ kỹ thuật, vệ sinh máy miễn phí trọn đời</li></ul>"],
    ["Chính sách bảo hành", "chinh-sach-bao-hanh", "<h2>Thời gian bảo hành</h2><ul><li>Máy Likenew 99%: bảo hành <strong>12 tháng</strong> phần cứng.</li><li>Máy 95–98%: bảo hành <strong>6 tháng</strong>.</li><li>Pin, sạc: bảo hành 3 tháng.</li></ul><h2>Điều kiện bảo hành</h2><p>Máy còn tem bảo hành của shop, không có dấu hiệu rơi vỡ, vào nước, can thiệp sửa chữa bên ngoài.</p><h2>Không áp dụng bảo hành</h2><ul><li>Hư hỏng do người dùng: rơi, va đập, vào nước, cháy nổ do nguồn điện.</li><li>Lỗi phần mềm, virus (shop hỗ trợ cài lại miễn phí).</li></ul>"],
    ["Chính sách đổi trả", "chinh-sach-doi-tra", "<h2>1 đổi 1 trong 15 ngày</h2><p>Trong 15 ngày đầu, nếu máy phát sinh lỗi phần cứng do nhà sản xuất, quý khách được đổi máy mới tương đương hoặc hoàn tiền 100%.</p><h2>Đổi máy theo nhu cầu</h2><p>Trong 7 ngày, quý khách có thể đổi sang máy khác (thu phí 5% giá trị máy) nếu không lỗi.</p>"],
    ["Chính sách giao hàng", "chinh-sach-giao-hang", "<h2>Phạm vi giao hàng</h2><p>Giao hàng toàn quốc, kiểm tra máy trước khi thanh toán. Nội thành TP.HCM giao trong 2 giờ.</p><h2>Phí vận chuyển</h2><p>Miễn phí giao hàng cho đơn từ 10 triệu. Đơn dưới 10 triệu phí đồng giá 50.000₫.</p>"],
    ["Hướng dẫn mua trả góp", "huong-dan-mua-tra-gop", "<h2>Trả góp 0% qua thẻ tín dụng</h2><p>Áp dụng thẻ Visa/Master/JCB của hơn 25 ngân hàng. Kỳ hạn 3, 6, 9, 12 tháng, lãi suất 0%, chỉ cần thẻ còn hạn mức.</p><h2>Trả góp qua công ty tài chính</h2><p>Hỗ trợ qua HD Saison, Home Credit, FE Credit. Chỉ cần CCCD gắn chíp, duyệt hồ sơ trong 15 phút, trả trước từ 0–30%.</p><h2>Các bước đăng ký</h2><ol><li>Chọn sản phẩm, bấm <strong>Mua trả góp 0%</strong>.</li><li>Điền thông tin, chọn hình thức trả góp.</li><li>Nhân viên gọi lại tư vấn & hoàn tất hồ sơ.</li></ol>"],
    ["Liên hệ", "lien-he", "<p>Quý khách vui lòng liên hệ qua hotline, Zalo hoặc ghé trực tiếp cửa hàng để được tư vấn và trải nghiệm máy.</p>"],
  ];
  for (const [title, slug, content] of pages) {
    await prisma.page.create({ data: { title, slug, content, metaTitle: `${title} – LaptopLikeNew` } });
  }

  console.log("→ Bài viết");
  const posts = [
    ["Kinh nghiệm mua laptop cũ không bị lừa: 10 bước kiểm tra", "Hướng dẫn chi tiết cách kiểm tra ngoại hình, màn hình, bàn phím, pin, ổ cứng khi mua laptop cũ."],
    ["Top 5 laptop cũ cho sinh viên dưới 10 triệu đáng mua nhất", "Danh sách laptop cũ giá rẻ, bền bỉ, pin tốt phù hợp cho học sinh – sinh viên."],
    ["Laptop Likenew là gì? Khác gì máy cũ thông thường?", "Giải thích khái niệm likenew 99%, 98%, 95% và cách phân biệt chất lượng máy."],
    ["Nên mua MacBook Air M1 hay M2 cũ trong năm 2026?", "So sánh hiệu năng, pin, màn hình và giá bán của MacBook Air M1 và M2 bản cũ."],
  ];
  for (const [i, [title, excerpt]] of posts.entries()) {
    const cover = await writeWebp(`seed/post-${i + 1}.webp`, bannerSvg(["CHECKLIST", "TOP 5", "LIKENEW?", "M1 vs M2"][i], "#dc2626", "#1f2937"), 1200);
    await prisma.post.create({
      data: {
        title,
        slug: slugify(title),
        excerpt,
        cover,
        authorId: admin.id,
        createdAt: new Date(Date.now() - i * 5 * 86400000),
        content: html(
          `<p>${excerpt}</p>`,
          `<h2>1. Kiểm tra ngoại hình</h2><p>Quan sát kỹ các góc máy, bản lề, ốc vít để phát hiện dấu hiệu rơi vỡ hoặc đã tháo mở.</p>`,
          `<h2>2. Kiểm tra màn hình</h2><p>Dùng phần mềm Dead Pixel Test để tìm điểm chết, hở sáng.</p>`,
          `<h2>3. Kiểm tra pin & sạc</h2><p>Dùng lệnh <code>powercfg /batteryreport</code> trên Windows hoặc Coconut Battery trên macOS để xem độ chai pin.</p>`,
          `<h2>Kết luận</h2><p>Mua tại cửa hàng uy tín có bảo hành dài là cách an toàn nhất. Liên hệ LaptopLikeNew để được tư vấn miễn phí.</p>`,
        ),
      },
    });
  }

  console.log("→ Mã giảm giá");
  await prisma.coupon.createMany({
    data: [
      { code: "GIAM5", description: "Giảm 5% tối đa 500K", type: "PERCENT", value: 5, maxDiscount: 500000 },
      { code: "GIAM300K", description: "Giảm 300K cho đơn từ 8 triệu", type: "FIXED", value: 300000, minOrder: 8000000 },
      { code: "FREESHIP", description: "Miễn phí vận chuyển", type: "FREESHIP", value: 0 },
    ],
  });

  console.log("→ Khách hàng & đơn hàng mẫu (cho báo cáo)");
  const cust = await prisma.customer.create({
    data: { name: "Nguyễn Văn An", phone: "0912345678", email: "khach@example.com", passwordHash: await bcrypt.hash("123456", 10), address: "45 Lê Lợi, Q.1, TP.HCM" },
  });
  const statuses = ["COMPLETED", "COMPLETED", "COMPLETED", "SHIPPING", "CONFIRMED", "NEW", "CANCELLED"];
  const methods = ["COD", "BANK", "COD", "VNPAY", "INSTALLMENT"];
  for (let i = 0; i < 45; i++) {
    const p = products[(i * 7) % products.length];
    const v = p.variants[i % p.variants.length];
    const created = new Date(Date.now() - (i % 40) * 86400000 - (i % 5) * 3600000);
    const status = i < 4 ? "NEW" : statuses[i % statuses.length];
    const ship = v.price >= 10_000_000 ? 0 : 50000;
    const prod = await prisma.productVariant.findUnique({ where: { id: v.id } });
    const price = prod!.salePrice ?? prod!.price;
    await prisma.order.create({
      data: {
        code: `LL${created.toISOString().slice(2, 10).replace(/-/g, "")}${String(1000 + i)}`,
        customerId: i % 6 === 0 ? cust.id : null,
        name: i % 6 === 0 ? cust.name : reviewers[i % reviewers.length],
        phone: `09${String(10000000 + i * 7919).slice(0, 8)}`,
        email: i % 3 === 0 ? `khach${i}@example.com` : null,
        address: `${10 + i} Đường số ${i % 20}, TP.HCM`,
        paymentMethod: methods[i % methods.length],
        paymentStatus: status === "COMPLETED" ? "PAID" : "UNPAID",
        status,
        subtotal: price,
        shippingFee: ship,
        total: price + ship,
        createdAt: created,
        items: { create: [{ productId: p.id, variantId: v.id, productName: p.name, variantName: v.name, image: p.image, price, quantity: 1 }] },
      },
    });
  }
  console.log("✓ Seed xong. Đăng nhập /admin: admin@laptoplikenew.vn / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
