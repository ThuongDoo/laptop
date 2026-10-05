"use client";

import { useActionState, useState } from "react";
import { Star, ImagePlus } from "lucide-react";
import { submitReview } from "@/app/(shop)/actions";

export function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(5);
  const [state, action, pending] = useActionState(submitReview, null);

  if (state?.ok) {
    return <p className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">{state.message}</p>;
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      {/* honeypot chống spam */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Chấm điểm:</span>
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" onClick={() => setRating(i)} aria-label={`${i} sao`}>
            <Star size={26} className={i <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"} />
          </button>
        ))}
      </div>
      <textarea name="content" required minLength={10} rows={3} className="input" placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm (tối thiểu 10 ký tự)" />
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="name" required className="input" placeholder="Họ tên *" />
        <input name="phone" className="input" placeholder="Số điện thoại (không công khai)" inputMode="tel" />
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
        <ImagePlus size={18} className="text-brand-600" />
        <span>Gửi ảnh thực tế (tối đa 4 ảnh)</span>
        <input type="file" name="images" accept="image/*" multiple className="text-xs" />
      </label>
      {state && !state.ok && <p className="text-sm text-red-600">{state.message}</p>}
      <button className="btn-primary" disabled={pending}>
        {pending ? "Đang gửi..." : "Gửi đánh giá"}
      </button>
    </form>
  );
}
