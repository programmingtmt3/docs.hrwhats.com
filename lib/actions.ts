"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkCredentials, createSession, destroySession, requireAdmin } from "./auth";
import { removeArticle, removeCategory, updateSettings, upsertArticle, upsertCategory } from "./db";
import { saveImage } from "./uploads";
import { ICONS, type IconName } from "./types";

export type FormState = { error?: string } | undefined;

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const refresh = () => revalidatePath("/", "layout");

/* ---------- اللغة (الموقع العام) ---------- */
export async function setLang(lang: "ar" | "en") {
  (await cookies()).set("lang", lang === "en" ? "en" : "ar", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  refresh();
}

/* ---------- تسجيل الدخول ---------- */
const attempts = new Map<string, { n: number; until: number }>();

export async function login(_: FormState, f: FormData): Promise<FormState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const rec = attempts.get(ip);
  if (rec && rec.n >= 5 && rec.until > Date.now()) return { error: "محاولات كثيرة، حاول بعد 15 دقيقة." };

  if (!checkCredentials(str(f, "username"), String(f.get("password") ?? ""))) {
    const n = (rec && rec.until > Date.now() ? rec.n : 0) + 1;
    attempts.set(ip, { n, until: Date.now() + 15 * 60 * 1000 });
    await new Promise((r) => setTimeout(r, 600));
    return { error: "اسم المستخدم أو كلمة المرور غير صحيحة." };
  }
  attempts.delete(ip);
  await createSession();
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

/* ---------- المقالات ---------- */
export async function saveArticle(_: FormState, f: FormData): Promise<FormState> {
  await requireAdmin();
  const original = str(f, "original"); // فارغ = مقال جديد
  const id = str(f, "id").toLowerCase();
  const categoryId = str(f, "categoryId");
  const titleAr = str(f, "titleAr");

  if (!SLUG.test(id)) return { error: "الرابط (slug) يقبل أحرفًا إنجليزية صغيرة وأرقامًا وشرطات فقط." };
  if (!titleAr) return { error: "العنوان بالعربية مطلوب." };
  if (!categoryId) return { error: "اختر القسم." };

  const error = await upsertArticle(original, {
    id,
    categoryId,
    order: Number(f.get("order")) || 1,
    published: f.get("published") === "on",
    updatedAt: new Date().toISOString(),
    title: { ar: titleAr, en: str(f, "titleEn") },
    body: { ar: String(f.get("bodyAr") ?? ""), en: String(f.get("bodyEn") ?? "") },
  });
  if (error) return { error };
  refresh();
  redirect("/admin?saved=1");
}

export async function deleteArticle(id: string) {
  await requireAdmin();
  await removeArticle(id);
  refresh();
  redirect("/admin?deleted=1");
}

/* ---------- الأقسام ---------- */
export async function saveCategory(_: FormState, f: FormData): Promise<FormState> {
  await requireAdmin();
  const original = str(f, "original");
  const id = str(f, "id").toLowerCase();
  const icon = str(f, "icon") as IconName;
  if (!SLUG.test(id)) return { error: "الرابط (slug) يقبل أحرفًا إنجليزية صغيرة وأرقامًا وشرطات فقط." };
  if (!str(f, "titleAr")) return { error: "اسم القسم بالعربية مطلوب." };
  if (!ICONS.includes(icon)) return { error: "أيقونة غير صالحة." };

  const error = await upsertCategory(original, {
    id,
    icon,
    order: Number(f.get("order")) || 1,
    nav: f.get("nav") === "on",
    title: { ar: str(f, "titleAr"), en: str(f, "titleEn") },
    description: { ar: str(f, "descAr"), en: str(f, "descEn") },
  });
  if (error) return { error };
  refresh();
  redirect("/admin/categories?saved=1");
}

export async function deleteCategory(id: string): Promise<FormState> {
  await requireAdmin();
  const error = await removeCategory(id);
  if (error) return { error };
  refresh();
  redirect("/admin/categories?deleted=1");
}

/* ---------- الإعدادات ---------- */
export async function saveSettings(_: FormState, f: FormData): Promise<FormState> {
  await requireAdmin();
  await updateSettings({
    siteName: str(f, "siteName") || "Help Center",
    heroTitle: { ar: str(f, "heroAr"), en: str(f, "heroEn") },
    footerText: { ar: str(f, "footerAr"), en: str(f, "footerEn") },
    whatsappUrl: str(f, "whatsappUrl"),
    websiteUrl: str(f, "websiteUrl"),
    privacyUrl: str(f, "privacyUrl"),
  });
  refresh();
  redirect("/admin/settings?saved=1");
}

/* ---------- رفع الصور ---------- */
export async function uploadImage(f: FormData): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  const file = f.get("file");
  if (!(file instanceof File)) return { error: "لم يتم اختيار صورة." };
  return saveImage(file);
}
