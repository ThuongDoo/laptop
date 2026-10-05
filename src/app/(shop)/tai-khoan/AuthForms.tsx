"use client";

import { useActionState } from "react";
import { customerLogin, customerRegister } from "../actions";

export function AuthForms({ next }: { next?: string }) {
  const [loginState, login, loggingIn] = useActionState(customerLogin, null);
  const [regState, register, registering] = useActionState(customerRegister, null);
  return (
    <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
      <form action={login} className="card space-y-3 p-6">
        <input type="hidden" name="next" value={next ?? ""} />
        <h1 className="text-xl font-bold">Đăng nhập</h1>
        <input name="login" required placeholder="Email hoặc số điện thoại" className="input" autoComplete="username" />
        <input name="password" type="password" required placeholder="Mật khẩu" className="input" autoComplete="current-password" />
        {loginState && !loginState.ok && <p className="text-sm text-red-600">{loginState.message}</p>}
        <button className="btn-primary w-full" disabled={loggingIn}>
          Đăng nhập
        </button>
      </form>
      <form action={register} className="card space-y-3 p-6">
        <input type="hidden" name="next" value={next ?? ""} />
        <h2 className="text-xl font-bold">Đăng ký tài khoản</h2>
        <p className="text-xs text-gray-500">Theo dõi đơn hàng, lưu địa chỉ giao hàng. Các đơn cũ cùng số điện thoại sẽ tự động được gắn vào tài khoản.</p>
        <input name="name" required placeholder="Họ và tên" className="input" autoComplete="name" />
        <input name="phone" required placeholder="Số điện thoại" className="input" inputMode="tel" autoComplete="tel" />
        <input name="email" type="email" required placeholder="Email" className="input" autoComplete="email" />
        <input name="password" type="password" required minLength={6} placeholder="Mật khẩu (tối thiểu 6 ký tự)" className="input" autoComplete="new-password" />
        {regState && !regState.ok && <p className="text-sm text-red-600">{regState.message}</p>}
        <button className="btn-outline w-full" disabled={registering}>
          Tạo tài khoản
        </button>
      </form>
    </div>
  );
}
