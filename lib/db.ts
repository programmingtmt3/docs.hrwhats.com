import "server-only";
import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";
import type { Article, Category, IconName, Lang, Bi, Settings } from "./types";

// التخزين في MySQL. هذا الملف هو نقطة الوصول الوحيدة للبيانات، والجداول في db/schema.sql.
// نحفظ الاتصال في globalThis حتى لا تُفتح اتصالات جديدة مع كل إعادة تحميل في وضع التطوير.
const g = globalThis as unknown as { mysqlPool?: Pool };

function pool(): Pool {
  if (!g.mysqlPool) {
    const uri = process.env.DATABASE_URL;
    if (!uri) throw new Error("DATABASE_URL غير معرّف في ملف البيئة.");
    g.mysqlPool = mysql.createPool({ uri, charset: "utf8mb4", timezone: "Z", connectionLimit: 10 });
  }
  return g.mysqlPool;
}

async function rows(sql: string, params: unknown[] = []) {
  const [r] = await pool().query<RowDataPacket[]>(sql, params);
  return r;
}

const errno = (e: unknown) => (e as { errno?: number })?.errno;
const DUP_ENTRY = 1062; // المفتاح مستخدم
const NO_PARENT = 1452; // القسم غير موجود
const HAS_CHILDREN = 1451; // القسم فيه مقالات

const toCategory = (r: RowDataPacket): Category => ({
  id: r.id,
  icon: r.icon as IconName,
  order: r.sort_order,
  nav: !!r.nav,
  title: { ar: r.title_ar, en: r.title_en },
  description: { ar: r.desc_ar, en: r.desc_en },
});

const toArticle = (r: RowDataPacket): Article => ({
  id: r.id,
  categoryId: r.category_id,
  order: r.sort_order,
  published: !!r.published,
  updatedAt: new Date(r.updated_at).toISOString(),
  title: { ar: r.title_ar, en: r.title_en },
  body: { ar: r.body_ar, en: r.body_en },
});

/* ---------- القراءة ---------- */
export async function getCategories(): Promise<Category[]> {
  return (await rows("SELECT * FROM categories ORDER BY sort_order, id")).map(toCategory);
}

export async function getCategory(id: string) {
  const [r] = await rows("SELECT * FROM categories WHERE id = ?", [id]);
  return r ? toCategory(r) : null;
}

export async function getArticles(opts: { categoryId?: string; all?: boolean } = {}): Promise<Article[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (!opts.all) where.push("published = 1");
  if (opts.categoryId) where.push("category_id = ?"), params.push(opts.categoryId);
  const sql = `SELECT * FROM articles ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY sort_order, id`;
  return (await rows(sql, params)).map(toArticle);
}

export async function getArticle(id: string, all = false) {
  const [r] = await rows(`SELECT * FROM articles WHERE id = ? ${all ? "" : "AND published = 1"}`, [id]);
  return r ? toArticle(r) : null;
}

export async function getSettings(): Promise<Settings> {
  const [r] = await rows("SELECT * FROM settings WHERE id = 1");
  if (!r) return { siteName: "Help Center", heroTitle: { ar: "", en: "" }, footerText: { ar: "", en: "" }, whatsappUrl: "", websiteUrl: "", privacyUrl: "" };
  return {
    siteName: r.site_name,
    heroTitle: { ar: r.hero_ar, en: r.hero_en },
    footerText: { ar: r.footer_ar, en: r.footer_en },
    whatsappUrl: r.whatsapp_url,
    websiteUrl: r.website_url,
    privacyUrl: r.privacy_url,
  };
}

/* ---------- الكتابة (ترجع رسالة خطأ أو undefined) ---------- */

/** original فارغ = مقال جديد. */
export async function upsertArticle(original: string, a: Article): Promise<string | undefined> {
  const v = [a.id, a.categoryId, a.order, a.published, new Date(a.updatedAt), a.title.ar, a.title.en, a.body.ar, a.body.en];
  try {
    if (original) {
      const [res] = await pool().query<mysql.ResultSetHeader>(
        `UPDATE articles SET id = ?, category_id = ?, sort_order = ?, published = ?, updated_at = ?,
         title_ar = ?, title_en = ?, body_ar = ?, body_en = ? WHERE id = ?`,
        [...v, original],
      );
      if (res.affectedRows) return;
    }
    await pool().query(
      `INSERT INTO articles (id, category_id, sort_order, published, updated_at, title_ar, title_en, body_ar, body_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      v,
    );
  } catch (e) {
    if (errno(e) === DUP_ENTRY) return "هذا الرابط مستخدم لمقال آخر.";
    if (errno(e) === NO_PARENT) return "القسم غير موجود.";
    throw e;
  }
}

export async function removeArticle(id: string) {
  await pool().query("DELETE FROM articles WHERE id = ?", [id]);
}

/** original فارغ = قسم جديد. تغيير الرابط ينقل المقالات معه (ON UPDATE CASCADE). */
export async function upsertCategory(original: string, c: Category): Promise<string | undefined> {
  const v = [c.id, c.icon, c.order, c.nav, c.title.ar, c.title.en, c.description.ar, c.description.en];
  try {
    if (original) {
      const [res] = await pool().query<mysql.ResultSetHeader>(
        `UPDATE categories SET id = ?, icon = ?, sort_order = ?, nav = ?,
         title_ar = ?, title_en = ?, desc_ar = ?, desc_en = ? WHERE id = ?`,
        [...v, original],
      );
      if (res.affectedRows) return;
    }
    await pool().query(
      `INSERT INTO categories (id, icon, sort_order, nav, title_ar, title_en, desc_ar, desc_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      v,
    );
  } catch (e) {
    if (errno(e) === DUP_ENTRY) return "هذا الرابط مستخدم لقسم آخر.";
    throw e;
  }
}

export async function removeCategory(id: string): Promise<string | undefined> {
  try {
    await pool().query("DELETE FROM categories WHERE id = ?", [id]);
  } catch (e) {
    if (errno(e) === HAS_CHILDREN) return "انقل مقالات القسم أو احذفها أولًا.";
    throw e;
  }
}

export async function updateSettings(s: Settings) {
  const v = [s.siteName, s.heroTitle.ar, s.heroTitle.en, s.footerText.ar, s.footerText.en, s.whatsappUrl, s.websiteUrl, s.privacyUrl];
  await pool().query(
    `INSERT INTO settings (id, site_name, hero_ar, hero_en, footer_ar, footer_en, whatsapp_url, website_url, privacy_url)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE site_name = VALUES(site_name), hero_ar = VALUES(hero_ar), hero_en = VALUES(hero_en),
       footer_ar = VALUES(footer_ar), footer_en = VALUES(footer_en), whatsapp_url = VALUES(whatsapp_url),
       website_url = VALUES(website_url), privacy_url = VALUES(privacy_url)`,
    v,
  );
}

/** يرجع نص اللغة المطلوبة، وإن كان فارغًا يرجع اللغة الأخرى. */
export function pick(b: Bi, lang: Lang): string {
  return b[lang]?.trim() ? b[lang] : b[lang === "ar" ? "en" : "ar"];
}
