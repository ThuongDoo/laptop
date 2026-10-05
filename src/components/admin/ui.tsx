"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { ActionState } from "@/app/admin/actions";

export function SubmitButton({ children, className = "btn-primary" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending}>
      {pending && <Loader2 size={16} className="animate-spin" />} {children}
    </button>
  );
}

/** Form gọi server action, hiển thị thông báo thành công/lỗi. */
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (s: ActionState, fd: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(async (prev: (ActionState & { at: number }) | null, fd: FormData) => {
    const r = await action(prev, fd);
    return r && { ...r, at: Date.now() };
  }, null);
  return (
    <form action={formAction} className={className}>
      {children}
      {state && <Toast key={state.at} ok={state.ok} message={state.message} />}
    </form>
  );
}

export function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  placeholder,
  hint,
  textarea,
  rows = 3,
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  textarea?: boolean;
  rows?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {textarea ? (
        <textarea id={name} name={name} defaultValue={defaultValue ?? ""} rows={rows} required={required} placeholder={placeholder} className="input" />
      ) : (
        <input id={name} name={name} type={type} defaultValue={defaultValue ?? ""} required={required} placeholder={placeholder} className="input" />
      )}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export function Select({
  label,
  name,
  defaultValue,
  options,
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  options: Record<string, string> | [string, string][];
  className?: string;
}) {
  const entries = Array.isArray(options) ? options : Object.entries(options);
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <select id={name} name={name} defaultValue={defaultValue ?? undefined} className="input">
        {entries.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Check({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-brand-600" /> {label}
    </label>
  );
}

/** Khối SEO: meta title/description (có đếm ký tự), slug, canonical. */
export function SeoFields({
  values,
  slugPrefix = "/",
  hideSlug,
  hideCanonical,
}: {
  values: { slug?: string | null; metaTitle?: string | null; metaDescription?: string | null; canonical?: string | null };
  slugPrefix?: string;
  hideSlug?: boolean;
  hideCanonical?: boolean;
}) {
  const [title, setTitle] = useState(values.metaTitle ?? "");
  const [desc, setDesc] = useState(values.metaDescription ?? "");
  const color = (n: number, max: number) => (n === 0 ? "text-gray-400" : n > max ? "text-red-600" : "text-emerald-600");
  return (
    <fieldset className="card space-y-3 p-4">
      <legend className="sr-only">SEO</legend>
      <h2 className="font-semibold text-gray-900">SEO</h2>
      {!hideSlug && (
        <div>
          <label className="label" htmlFor="slug">
            Đường dẫn (URL slug)
          </label>
          <div className="flex items-center overflow-hidden rounded-lg border border-gray-300 focus-within:border-brand-500">
            <span className="bg-gray-50 px-2 py-2 text-sm text-gray-500">{slugPrefix}</span>
            <input id="slug" name="slug" defaultValue={values.slug ?? ""} className="w-full px-2 py-2 text-sm outline-none" placeholder="tự tạo từ tên nếu bỏ trống" />
          </div>
        </div>
      )}
      <div>
        <label className="label" htmlFor="metaTitle">
          Meta Title <span className={`text-xs ${color(title.length, 60)}`}>({title.length}/60)</span>
        </label>
        <input id="metaTitle" name="metaTitle" value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="Mặc định dùng tên" />
      </div>
      <div>
        <label className="label" htmlFor="metaDescription">
          Meta Description <span className={`text-xs ${color(desc.length, 160)}`}>({desc.length}/160)</span>
        </label>
        <textarea id="metaDescription" name="metaDescription" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className="input" />
      </div>
      {!hideCanonical && (
        <Field label="Canonical URL" name="canonical" defaultValue={values.canonical} placeholder="Để trống = chính URL của trang" hint="Chỉ điền khi muốn trỏ trang này về một URL gốc khác." />
      )}
      <div className="rounded-lg bg-gray-50 p-3">
        <p className="text-xs text-gray-500">Xem trước trên Google</p>
        <p className="truncate text-base text-[#1a0dab]">{title || "(Tiêu đề trang)"}</p>
        <p className="line-clamp-2 text-xs text-gray-600">{desc || "(Mô tả trang)"}</p>
      </div>
    </fieldset>
  );
}

/** Nút submit có hộp thoại xác nhận (dùng cho thao tác xóa). */
export function ConfirmButton({ message, children, className = "text-sm text-red-600 hover:underline" }: { message: string; children: React.ReactNode; className?: string }) {
  return (
    <button className={className} onClick={(e) => !confirm(message) && e.preventDefault()}>
      {children}
    </button>
  );
}

function Toast({ ok, message }: { ok: boolean; message: string }) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 4000);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div role="status" className={`fixed right-4 bottom-4 z-50 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${ok ? "bg-emerald-600" : "bg-red-600"}`}>
      {message}
    </div>
  );
}
