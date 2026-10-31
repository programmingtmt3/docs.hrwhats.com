/** يغلّف كتل <pre> بشريط عنوان وزر نسخ (يعمل في الخادم والمتصفح). */
const COPY_ICON =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/></svg>';

export function enhanceHtml(html: string): string {
  return html.replace(
    /<pre(?:\s+data-lang="([^"]*)")?\s*>([\s\S]*?)<\/pre>/g,
    (_m, lang: string | undefined, code: string) =>
      `<div class="code"><div class="code-h"><span>${lang || "CODE"}</span><button type="button" data-copy title="Copy">${COPY_ICON}</button></div><pre>${code}</pre></div>`,
  );
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&lt;/g, "<").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

export const COPY_ICON_SVG = COPY_ICON;
