"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveCategory } from "@/lib/actions";
import { ICONS, type Category } from "@/lib/types";
import { SubmitButton } from "./SubmitButton";

const ICON_LABELS: Record<string, string> = { book: "كتاب", rocket: "صاروخ", chat: "محادثة", list: "قائمة", grid: "شبكة", code: "كود" };

export function CategoryForm({ category }: { category?: Category }) {
  const [state, action] = useActionState(saveCategory, undefined);
  const lab = "mb-1 block text-sm font-semibold";
  return (
    <form action={action} className="space-y-5 rounded-[14px] border border-line bg-card p-5">
      <input type="hidden" name="original" value={category?.id ?? ""} />
      {state?.error && <p className="rounded-lg border border-red-400/60 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">{state.error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <div><label className={lab}>الاسم بالعربية *</label><input name="titleAr" defaultValue={category?.title.ar} className="field" /></div>
        <div><label className={lab}>Name (English)</label><input name="titleEn" dir="ltr" defaultValue={category?.title.en} className="field" /></div>
        <div><label className={lab}>الوصف بالعربية</label><input name="descAr" defaultValue={category?.description.ar} className="field" /></div>
        <div><label className={lab}>Description (English)</label><input name="descEn" dir="ltr" defaultValue={category?.description.en} className="field" /></div>
        <div><label className={lab}>الرابط (slug)</label><input name="id" dir="ltr" required defaultValue={category?.id} placeholder="c-billing" className="field" /></div>
        <div><label className={lab}>الأيقونة</label>
          <select name="icon" defaultValue={category?.icon ?? "book"} className="field">
            {ICONS.map((i) => <option key={i} value={i}>{ICON_LABELS[i]}</option>)}
          </select></div>
        <div><label className={lab}>الترتيب</label><input name="order" type="number" min={1} defaultValue={category?.order ?? 1} className="field" /></div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" name="nav" defaultChecked={category?.nav} className="size-4 accent-[var(--brand)]" />
          إظهار القسم في الشريط العلوي
        </label>
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton>حفظ القسم</SubmitButton>
        <Link href="/admin/categories" className="btn-ghost">إلغاء</Link>
      </div>
    </form>
  );
}
