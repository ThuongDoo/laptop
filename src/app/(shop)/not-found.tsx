import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x py-16 text-center">
      <p className="text-6xl font-bold text-brand-600">404</p>
      <h1 className="mt-2 text-xl font-bold text-gray-900">Không tìm thấy trang</h1>
      <p className="mt-1 text-gray-600">Sản phẩm có thể đã bán hết hoặc đường dẫn không còn tồn tại.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="btn-primary">
          Về trang chủ
        </Link>
        <Link href="/laptop" className="btn-outline">
          Xem laptop đang bán
        </Link>
      </div>
    </div>
  );
}
