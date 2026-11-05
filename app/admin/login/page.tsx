import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { isAdmin } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "تسجيل الدخول" };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-gradient-to-br from-hero to-hero2 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-card p-7 shadow-2xl">
        <div className="mb-6 text-center">
          <Logo size={72} className="mx-auto mb-3" />
          <h1 className="text-xl font-bold">لوحة التحكم</h1>
          <p className="text-sm text-muted">سجّل دخولك لإدارة المحتوى</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
