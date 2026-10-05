import { formatVND } from "@/lib/format";

/**
 * Biểu đồ cột 1 chuỗi (doanh thu). Một tông màu thương hiệu, cột mảnh bo 4px phía trên,
 * khe 2px giữa các cột, lưới mờ, tooltip khi hover (vùng hover cao hết chiều biểu đồ).
 */
export function BarChart({ data, label }: { data: { key: string; label: string; value: number; count: number }[]; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step).reverse();
  const every = Math.ceil(data.length / 10);

  return (
    <figure>
      <figcaption className="sr-only">{label}</figcaption>
      <div className="flex h-56 gap-2">
        <div className="flex flex-col justify-between pb-5 text-right text-[10px] text-gray-400">
          {ticks.map((t) => (
            <span key={t} className="-translate-y-1/2 leading-none">
              {short(t)}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-x-0 top-0 bottom-5 flex flex-col justify-between">
            {ticks.map((t) => (
              <span key={t} className="border-t border-gray-100" />
            ))}
          </div>
          <div className="absolute inset-x-0 top-0 bottom-5 flex items-end gap-[2px]">
            {data.map((d) => (
              <div key={d.key} className="group relative flex h-full flex-1 items-end justify-center hover:bg-gray-50">
                <div
                  className="w-full max-w-6 rounded-t-[4px] bg-brand-600 group-hover:bg-brand-700"
                  style={{ height: `${(d.value / top) * 100}%`, minHeight: d.value ? 2 : 0 }}
                />
                <div className="pointer-events-none absolute bottom-full z-10 mb-1 hidden rounded-md bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white shadow group-hover:block">
                  <b>{d.label}</b>
                  <br />
                  {formatVND(d.value)} · {d.count} đơn
                </div>
              </div>
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 flex h-4 gap-[2px] text-[10px] text-gray-400">
            {data.map((d, i) => (
              <span key={d.key} className="flex-1 text-center">
                {i % every === 0 ? d.label : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
      <details className="mt-2 text-xs text-gray-500">
        <summary className="cursor-pointer">Xem dạng bảng</summary>
        <table className="mt-2 w-full">
          <tbody>
            {data.map((d) => (
              <tr key={d.key} className="border-t border-gray-100">
                <td className="py-1">{d.label}</td>
                <td className="text-right">{d.count} đơn</td>
                <td className="text-right">{formatVND(d.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

function niceStep(max: number) {
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw)!;
}

function short(n: number) {
  if (n >= 1e9) return `${+(n / 1e9).toFixed(1)} tỷ`;
  if (n >= 1e6) return `${+(n / 1e6).toFixed(1)}tr`;
  if (n >= 1e3) return `${+(n / 1e3).toFixed(0)}k`;
  return String(n);
}
