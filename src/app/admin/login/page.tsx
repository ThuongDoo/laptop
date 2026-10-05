import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getStaff } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Đăng nhập quản trị", robots: { index: false } };

export default async function LoginPage() {
  if (await getStaff()) redirect("/admin");
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <LoginForm />
    </div>
  );
}
