"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkCredentials, createSession, destroySession, requireAdmin } from "./auth";
import { mutate } from "./db";
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

  let error: string | undefined;
  await mutate((db) => {
    if (!db.categories.some((c) => c.id === categoryId)) return void (error = "القسم غير موجود.");
    if (id !== original && db.articles.some((a) => a.id === id)) return void (error = "هذا الرابط مستخدم لمقال آخر.");
    const next = {
      id,
      categoryId,
      order: Number(f.get("order")) || 1,
      published: f.get("published") === "on",
      updatedAt: new Date().toISOString(),
      title: { ar: titleAr, en: str(f, "titleEn") },
      body: { ar: String(f.get("bodyAr") ?? ""), en: String(f.get("bodyEn") ?? "") },
    };
    const i = db.articles.findIndex((a) => a.id === original);
    if (i >= 0) db.articles[i] = next;
    else db.articles.push(next);
  });
  if (error) return { error };
  refresh();
  redirect("/admin?saved=1");
}

export async function deleteArticle(id: string) {
  await requireAdmin();
  await mutate((db) => void (db.articles = db.articles.filter((a) => a.id !== id)));
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

  let error: string | undefined;
  await mutate((db) => {
    if (id !== original && db.categories.some((c) => c.id === id)) return void (error = "هذا الرابط مستخدم لقسم آخر.");
    const next = {
      id,
      icon,
      order: Number(f.get("order")) || 1,
      nav: f.get("nav") === "on",
      title: { ar: str(f, "titleAr"), en: str(f, "titleEn") },
      description: { ar: str(f, "descAr"), en: str(f, "descEn") },
    };
    const i = db.categories.findIndex((c) => c.id === original);
    if (i >= 0) {
      db.categories[i] = next;
      if (id !== original) db.articles.forEach((a) => a.categoryId === original && (a.categoryId = id));
    } else db.categories.push(next);
  });
  if (error) return { error };
  refresh();
  redirect("/admin/categories?saved=1");
}

export async function deleteCategory(id: string): Promise<FormState> {
  await requireAdmin();
  let error: string | undefined;
  await mutate((db) => {
    if (db.articles.some((a) => a.categoryId === id)) return void (error = "انقل مقالات القسم أو احذفها أولًا.");
    db.categories = db.categories.filter((c) => c.id !== id);
  });
  if (error) return { error };
  refresh();
  redirect("/admin/categories?deleted=1");
}

/* ---------- الإعدادات ---------- */
export async function saveSettings(_: FormState, f: FormData): Promise<FormState> {
  await requireAdmin();
  await mutate((db) => {
    db.settings = {
      siteName: str(f, "siteName") || "Help Center",
      heroTitle: { ar: str(f, "heroAr"), en: str(f, "heroEn") },
      footerText: { ar: str(f, "footerAr"), en: str(f, "footerEn") },
      whatsappUrl: str(f, "whatsappUrl"),
      websiteUrl: str(f, "websiteUrl"),
      privacyUrl: str(f, "privacyUrl"),
    };
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
