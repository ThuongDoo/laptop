# LaptopLikeNew – Website bán laptop cũ / likenew

Next.js 16 (App Router) + Prisma + Tailwind CSS 4. Gồm website bán hàng (chuẩn SEO, mobile-first) và trang quản trị `/admin`.

## Chạy thử trên máy

```bash
npm install
cp .env.example .env        # điền AUTH_SECRET, NEXT_PUBLIC_SITE_URL
npm run db:push             # tạo bảng (SQLite: prisma/dev.db)
npm run db:seed             # dữ liệu mẫu: 22 laptop, danh mục, bài viết, đơn hàng…
npm run dev                 # http://localhost:3000
```

Tài khoản quản trị mẫu (mật khẩu `admin123` – **đổi ngay khi lên production** ở mục Nhân sự):

| Email | Vai trò | Quyền |
|---|---|---|
| admin@laptoplikenew.vn | Quản trị viên | Toàn quyền |
| sales@laptoplikenew.vn | Nhân viên bán hàng | Đơn hàng, xem khách hàng |
| editor@laptoplikenew.vn | Biên tập viên | Sản phẩm, danh mục, bài viết, trang, banner, đánh giá |

Khách hàng mẫu: `khach@example.com` / `123456`. Mã giảm giá mẫu: `GIAM5`, `GIAM300K`, `FREESHIP`.

## Cấu trúc URL (SEO)

| URL | Nội dung |
|---|---|
| `/{slug}` | Sản phẩm (`/dell-xps-13-9310-i7`), danh mục nhu cầu (`/laptop-gaming`), thương hiệu (`/laptop-dell`, `/macbook`), trang tĩnh (`/chinh-sach-bao-hanh`) – slug được kiểm tra trùng giữa các loại |
| `/laptop` | Tất cả laptop + bộ lọc |
| `/tin-tuc`, `/tin-tuc/{slug}` | Blog |
| `/sitemap.xml`, `/robots.txt` | Tự sinh, tự cập nhật |

Trang đã lọc/sắp xếp/phân trang tự gắn `noindex, follow` để tránh trùng lặp nội dung. Schema có sẵn: Product (giá, biến thể, sao đánh giá, còn/hết hàng), ComputerStore (LocalBusiness), BreadcrumbList, Article, WebSite SearchAction.

## Tích hợp cần cấu hình

- **VietQR**: nhập ngân hàng/số tài khoản ở *Admin → Cài đặt*. QR tự điền số tiền + nội dung `MÃĐƠN 4-số-cuối-SĐT`.
- **VNPAY**: điền `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET` (sandbox: sandbox.vnpayment.vn). Trên cổng merchant khai báo IPN URL: `https://domain.com/api/vnpay/ipn`. Chưa cấu hình thì tùy chọn VNPAY tự ẩn ở trang thanh toán.
- **Email** đơn hàng (khách + admin): điền `SMTP_*`. Chưa cấu hình thì chỉ ghi log.
- **Google Map, Zalo, Messenger, hotline, phí ship**: *Admin → Cài đặt*.

## Lên production

1. Đổi `provider` trong `prisma/schema.prisma` sang `"postgresql"` và đặt `DATABASE_URL` (khuyến nghị cho nhiều người dùng đồng thời).
2. `npm run build && npm start` (hoặc PM2/Docker). Cần Node ≥ 20.9.
3. Ảnh upload lưu ở thư mục `UPLOAD_DIR` (mặc định `./uploads`), phục vụ qua `/uploads/...` – nhớ backup và mount volume nếu dùng Docker.
4. Đặt `NEXT_PUBLIC_SITE_URL` đúng domain (dùng cho canonical, sitemap, schema, email).

## Ghi chú kỹ thuật

- Ảnh upload tự nén, resize ≤1600px, chuyển WebP; `next/image` phục vụ AVIF/WebP theo kích thước màn hình. Alt trống tự điền theo tên sản phẩm.
- Đặt hàng tự trừ tồn kho biến thể (hết → “Hết hàng”); hủy đơn tự hoàn kho; đơn “Thành công” mới tính doanh thu & lượt bán.
- Hóa đơn: *Đơn hàng → In hóa đơn / PDF* (dùng “Lưu PDF” của trình duyệt để giữ đúng tiếng Việt). Xuất Excel theo bộ lọc hiện tại.
- Dùng font hệ thống để PageSpeed mobile ổn định > 90. Muốn dùng web font: thêm `next/font/google` trong `src/app/layout.tsx` (đánh đổi ~5–8 điểm mobile).
"# laptop" 
