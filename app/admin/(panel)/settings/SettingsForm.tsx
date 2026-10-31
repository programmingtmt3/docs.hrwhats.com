"use client";

import { useActionState } from "react";
import { saveSettings } from "@/lib/actions";
import { SubmitButton } from "@/components/admin/SubmitButton";
import type { Settings } from "@/lib/types";

export function SettingsForm({ s }: { s: Settings }) {
  const [state, action] = useActionState(saveSettings, undefined);
  const lab = "mb-1 block text-sm font-semibold";
  return (
    <form action={action} className="space-y-4 rounded-[14px] border border-line bg-card p-5">
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2"><label className={lab}>اسم الموقع</label><input name="siteName" defaultValue={s.siteName} className="field" /></div>
        <div><label className={lab}>عنوان الصفحة الرئيسية (عربي)</label><input name="heroAr" defaultValue={s.heroTitle.ar} className="field" /></div>
        <div><label className={lab}>Home title (English)</label><input name="heroEn" dir="ltr" defaultValue={s.heroTitle.en} className="field" /></div>
        <div><label className={lab}>نص التذييل (عربي)</label><input name="footerAr" defaultValue={s.footerText.ar} className="field" /></div>
        <div><label className={lab}>Footer text (English)</label><input name="footerEn" dir="ltr" defaultValue={s.footerText.en} className="field" /></div>
        <div><label className={lab}>رابط واتساب للدعم</label><input name="whatsappUrl" dir="ltr" defaultValue={s.whatsappUrl} className="field" /></div>
        <div><label className={lab}>رابط الموقع الرسمي</label><input name="websiteUrl" dir="ltr" defaultValue={s.websiteUrl} className="field" /></div>
        <div><label className={lab}>رابط سياسة الخصوصية</label><input name="privacyUrl" dir="ltr" defaultValue={s.privacyUrl} className="field" /></div>
      </div>
      <SubmitButton>حفظ الإعدادات</SubmitButton>
    </form>
  );
}
