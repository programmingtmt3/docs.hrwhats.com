"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveArticle } from "@/lib/actions";
import type { Article, Category } from "@/lib/types";
import { BodyEditor } from "./BodyEditor";
import { SubmitButton } from "./SubmitButton";

export function ArticleForm({ article, categories }: { article?: Article; categories: Category[] }) {
  const [state, action] = useActionState(saveArticle, undefined);
  const [tab, setTab] = useState<"ar" | "en">("ar");
  const lab = "mb-1 block text-sm font-semibold";

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="original" value={article?.id ?? ""} />
      {state?.error && <p className="rounded-lg border border-red-400/60 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">{state.error}</p>}

      <div className="grid gap-4 rounded-[14px] border border-line bg-card p-5 md:grid-cols-4">
        <div className="md:col-span-2">
          <label className={lab}>القسم</label>
          <select name="categoryId" defaultValue={article?.categoryId} required className="field">
            {categories.map((c) => <option key={c.id} value={c.id}>{c.title.ar}</option>)}
          </select>
        </div>
        <div>
          <label className={lab}>الرابط (slug)</label>
          <input name="id" defaultValue={article?.id} required dir="ltr" placeholder="api-send" className="field" />
        </div>
        <div>
          <label className={lab}>الترتيب</label>
          <input name="order" type="number" min={1} defaultValue={article?.order ?? 1} className="field" />
        </div>
        <label className="flex items-center gap-2 text-sm md:col-span-4">
          <input type="checkbox" name="published" defaultChecked={article?.published ?? true} className="size-4 accent-[var(--brand)]" />
          منشور (يظهر في الموقع)
        </label>
      </div>

      <div className="rounded-[14px] border border-line bg-card p-5">
        <div className="mb-4 flex gap-2">
          {(["ar", "en"] as const).map((l) => (
            <button key={l} type="button" onClick={() => setTab(l)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${tab === l ? "bg-brand text-on" : "border border-line"}`}>
              {l === "ar" ? "العربية" : "English"}
            </button>
          ))}
        </div>
        {/* كلا اللغتين تبقيان في النموذج؛ نخفي غير النشطة فقط */}
        <div className={tab === "ar" ? "" : "hidden"}>
          <label className={lab}>العنوان بالعربية *</label>
          <input name="titleAr" defaultValue={article?.title.ar} className="field mb-4" />
          <label className={lab}>المحتوى بالعربية (HTML)</label>
          <BodyEditor name="bodyAr" defaultValue={article?.body.ar ?? ""} dir="rtl" />
        </div>
        <div className={tab === "en" ? "" : "hidden"}>
          <label className={lab}>Title (English)</label>
          <input name="titleEn" defaultValue={article?.title.en} dir="ltr" className="field mb-4" />
          <label className={lab}>Content (HTML)</label>
          <BodyEditor name="bodyEn" defaultValue={article?.body.en ?? ""} dir="ltr" />
          <p className="mt-2 text-sm text-muted">إن تُرك فارغًا يعرض الموقع النص العربي للزوار بالإنجليزية.</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton>حفظ المقال</SubmitButton>
        <Link href="/admin" className="btn-ghost">إلغاء</Link>
      </div>
    </form>
  );
}
