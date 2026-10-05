"use client";

import { useActionState } from "react";
import { staffLogin } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(staffLogin, null);
  return (
    <form action={action} className="card w-full max-w-sm space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-900">Đăng nhập quản trị</h1>
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="username" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Mật khẩu
        </label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
      </div>
      {state && !state.ok && <p className="text-sm text-red-600">{state.message}</p>}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  );
}
