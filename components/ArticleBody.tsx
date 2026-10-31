"use client";

import { COPY_ICON_SVG } from "@/lib/html";

/** يعرض HTML المقال (موثوق: يكتبه المدير) ويفعّل أزرار نسخ الأكواد. */
export function ArticleBody({ html }: { html: string }) {
  return (
    <div
      className="prose-doc"
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={(e) => {
        const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-copy]");
        if (!btn) return;
        const code = btn.closest(".code")?.querySelector("pre")?.innerText ?? "";
        navigator.clipboard?.writeText(code).then(() => {
          btn.textContent = "✓";
          setTimeout(() => (btn.innerHTML = COPY_ICON_SVG), 1400);
        });
      }}
    />
  );
}
