"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions";
import { SubmitButton } from "@/components/admin/SubmitButton";

export function LoginForm() {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      {state?.error && <p className="rounded-lg border border-red-400/60 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">{state.error}</p>}
      <div>
        <label className="mb-1 block text-sm font-semibold" htmlFor="u">اسم المستخدم</label>
        <input id="u" name="username" autoComplete="username" required dir="ltr" className="field" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold" htmlFor="p">كلمة المرور</label>
        <input id="p" name="password" type="password" autoComplete="current-password" required dir="ltr" className="field" />
      </div>
      <div className="[&>button]:w-full"><SubmitButton>دخول</SubmitButton></div>
    </form>
  );
}
