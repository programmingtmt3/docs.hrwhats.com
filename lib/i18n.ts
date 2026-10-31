import "server-only";
import { cookies } from "next/headers";
import type { Lang } from "./types";

export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get("lang")?.value;
  return v === "en" ? "en" : "ar";
}

export const U = {
  ar: {
    sr: "ابحث عن مقال...", home: "الرئيسية", toggle: "English",
    hq: "لم تجد ما تبحث عنه؟", hd: "فريق الدعم متاح على مدار الساعة عبر واتساب.", hb: "تواصل معنا",
    pv: "السابق", nx: "التالي", fq: "هل أجاب هذا المقال عن سؤالك؟", ty: "شكرًا لتقييمك!",
    pp: "سياسة الخصوصية", ob: "الموقع الرسمي", nf: "لا نتائج", copy: "نسخ",
    empty: "لا توجد مقالات بعد.", nf404: "الصفحة غير موجودة", back: "العودة للرئيسية",
    n: (k: number) => k + (k > 2 && k < 11 ? " مقالات" : " مقالة"),
  },
  en: {
    sr: "Search for articles...", home: "Home", toggle: "العربية",
    hq: "Can’t find what you need?", hd: "Our support team is available 24/7 on WhatsApp.", hb: "Contact us",
    pv: "Previous", nx: "Next", fq: "Did this answer your question?", ty: "Thanks for your feedback!",
    pp: "Privacy policy", ob: "Website", nf: "No results", copy: "Copy",
    empty: "No articles yet.", nf404: "Page not found", back: "Back to home",
    n: (k: number) => k + (k === 1 ? " article" : " articles"),
  },
} as const;
