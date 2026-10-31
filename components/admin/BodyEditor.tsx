"use client";

import { useRef, useState } from "react";
import { enhanceHtml } from "@/lib/html";
import { uploadImage } from "@/lib/actions";

const SNIPPETS: { label: string; html: string }[] = [
  { label: "عنوان فرعي", html: "<h3>العنوان</h3>\n" },
  { label: "فقرة", html: "<p>النص هنا</p>\n" },
  { label: "قائمة مرقمة", html: "<ol>\n  <li>الخطوة الأولى</li>\n  <li>الخطوة الثانية</li>\n</ol>\n" },
  { label: "قائمة نقطية", html: "<ul>\n  <li>عنصر</li>\n  <li>عنصر</li>\n</ul>\n" },
  { label: "رابط", html: '<a href="https://">نص الرابط</a>' },
  { label: "كود مضمّن", html: "<code>value</code>" },
  { label: "نصيحة", html: '<div class="tip">نص النصيحة</div>\n' },
  { label: "ملاحظة", html: '<div class="note">نص الملاحظة</div>\n' },
  { label: "Endpoint", html: '<div class="ep"><i>POST</i>/path</div>\n' },
  { label: "كتلة كود", html: '<pre data-lang="JSON">{\n  "key": "value"\n}</pre>\n' },
  { label: "جدول", html: "<table>\n  <tr><th>العمود 1</th><th>العمود 2</th></tr>\n  <tr><td>قيمة</td><td>قيمة</td></tr>\n</table>\n" },
];

export function BodyEditor({ name, defaultValue, dir }: { name: string; defaultValue: string; dir: "rtl" | "ltr" }) {
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const insert = (html: string) => {
    const el = ta.current;
    if (!el) return setValue((v) => v + html);
    const { selectionStart: s, selectionEnd: e } = el;
    const next = value.slice(0, s) + html + value.slice(e);
    setValue(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + html.length, s + html.length); });
  };

  // رفع من الجهاز (زر، لصق، أو سحب وإفلات) ثم إدراج وسم الصورة مكان المؤشر
  const upload = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;
    setUploading(true);
    let html = "";
    for (const file of images) {
      const fd = new FormData();
      fd.append("file", file);
      const res: { url?: string; error?: string } = await uploadImage(fd).catch(() => ({ error: "تعذّر رفع الصورة." }));
      if (res.url) html += `<img src="${res.url}" alt="">\n`;
      else alert(`${file.name}: ${res.error}`);
    }
    setUploading(false);
    if (html) insert(html);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-card">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-soft/60 p-2">
        {SNIPPETS.map((s) => (
          <button key={s.label} type="button" onClick={() => insert(s.html)} disabled={preview}
            className="rounded-md border border-line bg-card px-2.5 py-1 text-[13px] hover:border-brand disabled:opacity-40">{s.label}</button>
        ))}
        <button type="button" onClick={() => fileInput.current?.click()} disabled={preview || uploading}
          className="rounded-md border border-brand bg-card px-2.5 py-1 text-[13px] font-semibold text-brand disabled:opacity-40">
          {uploading ? "جارٍ الرفع…" : "رفع صورة"}
        </button>
        <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden
          onChange={(e) => { upload(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
        <button type="button" onClick={() => setPreview((p) => !p)} className="ms-auto rounded-md bg-brand px-3 py-1 text-[13px] font-semibold text-on">
          {preview ? "تحرير" : "معاينة"}
        </button>
      </div>
      {/* يبقى الحقل في الـ DOM حتى يُرسل مع النموذج أثناء المعاينة */}
      <textarea ref={ta} name={name} value={value} onChange={(e) => setValue(e.target.value)} dir={dir} spellCheck={false}
        onPaste={(e) => { const f = Array.from(e.clipboardData.files); if (f.length) { e.preventDefault(); upload(f); } }}
        onDrop={(e) => { const f = Array.from(e.dataTransfer.files); if (f.length) { e.preventDefault(); upload(f); } }}
        className={`block min-h-[360px] w-full resize-y bg-transparent p-3 font-mono text-[13.5px] leading-[1.7] outline-none ${preview ? "hidden" : ""}`} />
      {preview && (
        <div dir={dir} className="prose-doc min-h-[360px] p-4" dangerouslySetInnerHTML={{ __html: enhanceHtml(value) }} />
      )}
    </div>
  );
}
