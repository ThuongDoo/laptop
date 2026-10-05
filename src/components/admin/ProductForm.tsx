"use client";

import { useState } from "react";
import Image from "next/image";
import type { Brand, Category, Product, ProductImage, ProductVariant } from "@prisma/client";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { CONDITIONS, CPU_FAMILIES, STOCK_STATUS } from "@/lib/constants";
import { saveProduct } from "@/app/admin/actions";
import { ActionForm, Check, Field, SeoFields, Select, SubmitButton } from "./ui";
import { RichEditor } from "./RichEditor";

type Full = Product & { categories: Category[]; images: ProductImage[]; variants: ProductVariant[] };
type V = { id?: string; name: string; ramGB: number; storageGB: number; storageType: string; price: number; salePrice: number | null; stockStatus: string; stock: number };

const emptyVariant = (): V => ({ name: "", ramGB: 16, storageGB: 512, storageType: "SSD", price: 0, salePrice: null, stockStatus: "IN_STOCK", stock: 1 });

type Props = { product: Full | null; brands: Brand[]; categories: Category[] };

export function ProductForm(props: Props) {
  // Chỉ phần state remount sau mỗi lần lưu (đồng bộ ảnh/biến thể mới từ server); form & thông báo giữ nguyên
  return (
    <ActionForm action={saveProduct} className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <ProductFields key={props.product?.updatedAt.toISOString() ?? "new"} {...props} />
    </ActionForm>
  );
}

function ProductFields({ product: p, brands, categories }: Props) {
  const [variants, setVariants] = useState<V[]>(p?.variants.map((v) => ({ ...v })) ?? [emptyVariant()]);
  const [images, setImages] = useState(p?.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt ?? "" })) ?? []);
  const [previews, setPreviews] = useState<string[]>([]);
  const [specs, setSpecs] = useState<{ label: string; value: string }[]>(() => {
    try {
      return p?.specs ? JSON.parse(p.specs) : [];
    } catch {
      return [];
    }
  });

  const setV = (i: number, patch: Partial<V>) => setVariants((vs) => vs.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  const move = (i: number, d: number) =>
    setImages((arr) => {
      const next = [...arr];
      const [x] = next.splice(i, 1);
      next.splice(Math.max(0, Math.min(arr.length - 1, i + d)), 0, x);
      return next;
    });

  return (
    <>
      <input type="hidden" name="id" value={p?.id ?? ""} />
      <input type="hidden" name="variants" value={JSON.stringify(variants)} />
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input type="hidden" name="specs" value={JSON.stringify(specs)} />

      <div className="min-w-0 space-y-4">
        <section className="card grid gap-3 p-4 md:grid-cols-2">
          <h2 className="font-semibold md:col-span-2">Thông tin chung</h2>
          <Field label="Tên sản phẩm" name="name" defaultValue={p?.name} required className="md:col-span-2" placeholder="VD: Dell XPS 13 9310" />
          <Field label="Mã SKU" name="sku" defaultValue={p?.sku} />
          <Select label="Thương hiệu" name="brandId" defaultValue={p?.brandId} options={brands.map((b) => [b.id, b.name] as [string, string])} />
          <Field label="Mô tả ngắn" name="shortDesc" defaultValue={p?.shortDesc} textarea rows={2} className="md:col-span-2" />
          <div className="md:col-span-2">
            <p className="label">Danh mục nhu cầu</p>
            <div className="flex flex-wrap gap-3">
              {categories.map((c) => (
                <label key={c.id} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" name="categoryIds" value={c.id} defaultChecked={p?.categories.some((x) => x.id === c.id)} className="accent-brand-600" />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="card space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Biến thể cấu hình & giá</h2>
            <button type="button" className="btn-ghost py-1.5" onClick={() => setVariants([...variants, emptyVariant()])}>
              <Plus size={14} /> Thêm biến thể
            </button>
          </div>
          <p className="text-xs text-gray-500">Cùng 1 model nhưng khác RAM/SSD và giá (VD: 8GB/256GB và 16GB/512GB). Tên biến thể để trống sẽ tự tạo.</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="text-left text-xs text-gray-500">
                <tr>
                  <th className="pb-1">Tên hiển thị</th>
                  <th>RAM (GB)</th>
                  <th>SSD (GB)</th>
                  <th>Giá niêm yết</th>
                  <th>Giá KM</th>
                  <th>Tồn kho</th>
                  <th>SL</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {variants.map((v, i) => (
                  <tr key={v.id ?? i}>
                    <td className="pr-1 pb-2">
                      <input
                        value={v.name}
                        placeholder={`${v.ramGB}GB RAM / ${v.storageGB}GB SSD`}
                        onChange={(e) => setV(i, { name: e.target.value })}
                        onBlur={() => !v.name && setV(i, { name: `${v.ramGB}GB RAM / ${v.storageGB >= 1024 ? v.storageGB / 1024 + "TB" : v.storageGB + "GB"} SSD` })}
                        className="input"
                      />
                    </td>
                    <td className="pr-1 pb-2">
                      <input type="number" min={1} value={v.ramGB} onChange={(e) => setV(i, { ramGB: +e.target.value })} className="input w-20" />
                    </td>
                    <td className="pr-1 pb-2">
                      <input type="number" min={1} value={v.storageGB} onChange={(e) => setV(i, { storageGB: +e.target.value })} className="input w-24" />
                    </td>
                    <td className="pr-1 pb-2">
                      <input type="number" min={0} step={10000} value={v.price} onChange={(e) => setV(i, { price: +e.target.value })} className="input w-32" />
                    </td>
                    <td className="pr-1 pb-2">
                      <input
                        type="number"
                        min={0}
                        step={10000}
                        value={v.salePrice ?? ""}
                        onChange={(e) => setV(i, { salePrice: e.target.value ? +e.target.value : null })}
                        className="input w-32"
                      />
                    </td>
                    <td className="pr-1 pb-2">
                      <select value={v.stockStatus} onChange={(e) => setV(i, { stockStatus: e.target.value })} className="input">
                        {Object.entries(STOCK_STATUS).map(([k, l]) => (
                          <option key={k} value={k}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="pr-1 pb-2">
                      <input type="number" min={0} value={v.stock} onChange={(e) => setV(i, { stock: +e.target.value })} className="input w-16" />
                    </td>
                    <td className="pb-2">
                      <button
                        type="button"
                        aria-label="Xóa biến thể"
                        disabled={variants.length === 1}
                        onClick={() => setVariants(variants.filter((_, j) => j !== i))}
                        className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-30"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card space-y-3 p-4">
          <h2 className="font-semibold">Ảnh thực tế sản phẩm</h2>
          <p className="text-xs text-gray-500">
            Ảnh đầu tiên là ảnh đại diện. Ảnh tự động nén & chuyển WebP khi lưu. Alt để trống sẽ tự điền theo tên sản phẩm.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((img, i) => (
              <div key={img.id ?? img.url} className="space-y-1 rounded-lg p-2 ring-1 ring-gray-200">
                <div className="relative aspect-[5/4] overflow-hidden rounded bg-gray-50">
                  <Image src={img.url} alt={img.alt} fill sizes="200px" className="object-contain" />
                  {i === 0 && <span className="absolute top-1 left-1 rounded bg-brand-600 px-1.5 text-[10px] text-white">Đại diện</span>}
                </div>
                <input
                  value={img.alt}
                  onChange={(e) => setImages(images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
                  placeholder="Thẻ alt"
                  className="input py-1 text-xs"
                />
                <div className="flex justify-between text-gray-500">
                  <span className="flex gap-1">
                    <button type="button" onClick={() => move(i, -1)} aria-label="Lên">
                      <ArrowUp size={14} />
                    </button>
                    <button type="button" onClick={() => move(i, 1)} aria-label="Xuống">
                      <ArrowDown size={14} />
                    </button>
                  </span>
                  <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))} className="hover:text-red-600" aria-label="Gỡ ảnh">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
            {previews.map((src) => (
              <div key={src} className="relative aspect-[5/4] overflow-hidden rounded-lg bg-gray-50 ring-2 ring-dashed ring-brand-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-contain" />
                <span className="absolute bottom-1 left-1 rounded bg-white/90 px-1 text-[10px]">Chờ lưu</span>
              </div>
            ))}
          </div>
          <input
            type="file"
            name="newImages"
            multiple
            accept="image/*"
            onChange={(e) => setPreviews(Array.from(e.target.files ?? []).map((f) => URL.createObjectURL(f)))}
            className="text-sm"
          />
          <Field label="Video review (YouTube)" name="videoUrl" defaultValue={p?.videoUrl} placeholder="https://www.youtube.com/watch?v=..." />
        </section>

        <section className="card grid gap-3 p-4 md:grid-cols-2">
          <h2 className="font-semibold md:col-span-2">Thông số kỹ thuật</h2>
          <Field label="CPU" name="cpu" defaultValue={p?.cpu} required placeholder="Intel Core i7-1185G7" />
          <Select label="Dòng CPU (dùng cho bộ lọc)" name="cpuFamily" defaultValue={p?.cpuFamily ?? "i5"} options={CPU_FAMILIES} />
          <Field label="Card đồ họa" name="gpu" defaultValue={p?.gpu} placeholder="Intel Iris Xe / RTX 3050 4GB" />
          <Select label="Loại card" name="gpuType" defaultValue={p?.gpuType} options={{ onboard: "Onboard", discrete: "Card rời" }} />
          <Field label="Màn hình" name="screen" defaultValue={p?.screen} placeholder='14" FHD IPS 1920x1080' />
          <Field label='Kích thước (inch, dùng cho bộ lọc)' name="screenSize" type="number" defaultValue={p?.screenSize ?? 14} />
          <Field label="Cổng kết nối" name="ports" defaultValue={p?.ports} />
          <Field label="Pin" name="battery" defaultValue={p?.battery} />
          <Field label="Trọng lượng" name="weight" defaultValue={p?.weight} />
          <Field label="Hệ điều hành" name="os" defaultValue={p?.os} />
          <div className="space-y-2 md:col-span-2">
            <p className="label">Thông số bổ sung</p>
            {specs.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input value={s.label} placeholder="Tên" onChange={(e) => setSpecs(specs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className="input w-48" />
                <input value={s.value} placeholder="Giá trị" onChange={(e) => setSpecs(specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} className="input" />
                <button type="button" onClick={() => setSpecs(specs.filter((_, j) => j !== i))} className="px-2 text-gray-400 hover:text-red-600" aria-label="Xóa">
                  <X size={16} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setSpecs([...specs, { label: "", value: "" }])} className="text-sm text-brand-600">
              + Thêm dòng
            </button>
          </div>
        </section>

        <section className="card space-y-2 p-4">
          <h2 className="font-semibold">Bài viết mô tả / đánh giá chi tiết</h2>
          <RichEditor name="description" defaultValue={p?.description} />
        </section>
      </div>

      <div className="space-y-4">
        <section className="card space-y-3 p-4">
          <h2 className="font-semibold">Xuất bản</h2>
          <Check label="Hiển thị trên website" name="published" defaultChecked={p?.published ?? true} />
          <Check label="Sản phẩm nổi bật (trang chủ)" name="featured" defaultChecked={p?.featured} />
          <SubmitButton className="btn-primary w-full">Lưu sản phẩm</SubmitButton>
        </section>
        <section className="card space-y-3 p-4">
          <h2 className="font-semibold">Tình trạng máy thực tế</h2>
          <Select label="Ngoại hình" name="condition" defaultValue={p?.condition ?? "99"} options={CONDITIONS} />
          <Field label="Mô tả ngoại hình" name="appearance" defaultValue={p?.appearance} textarea rows={2} />
          <Field label="Tình trạng pin" name="batteryHealth" defaultValue={p?.batteryHealth} placeholder="Pin 92%, dùng 5-6 tiếng" />
          <Field label="Phụ kiện đi kèm" name="accessories" defaultValue={p?.accessories} placeholder="Sạc zin, tặng balo" />
          <Field label="Bảo hành (tháng)" name="warrantyMonths" type="number" defaultValue={p?.warrantyMonths ?? 6} />
        </section>
        <section className="card space-y-2 p-4">
          <h2 className="font-semibold">Khuyến mãi & quà tặng</h2>
          <Field label="Mỗi dòng một ưu đãi" name="gifts" defaultValue={p?.gifts} textarea rows={5} />
        </section>
        <SeoFields values={p ?? {}} />
      </div>
    </>
  );
}
