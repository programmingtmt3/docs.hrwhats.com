// إنشاء قاعدة البيانات والجداول، ثم استيراد data/content.json إن كانت الجداول فارغة.
// التشغيل: npm run db:setup  (يقرأ DATABASE_URL من .env.local)
import { promises as fs } from "fs";
import path from "path";
import mysql from "mysql2/promise";

const uri = process.env.DATABASE_URL;
if (!uri) {
  console.error("DATABASE_URL غير معرّف. أضفه في .env.local");
  process.exit(1);
}

const url = new URL(uri);
const dbName = decodeURIComponent(url.pathname.slice(1));
if (!/^[A-Za-z0-9_]+$/.test(dbName)) {
  console.error("اسم قاعدة البيانات في DATABASE_URL غير صالح.");
  process.exit(1);
}

const root = process.cwd();
url.pathname = "/";
const server = await mysql.createConnection({ uri: url.toString(), charset: "utf8mb4" });
await server.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
await server.end();

const db = await mysql.createConnection({ uri, charset: "utf8mb4", timezone: "Z", multipleStatements: true });
await db.query(await fs.readFile(path.join(root, "db", "schema.sql"), "utf8"));
console.log(`✓ الجداول جاهزة في ${dbName}`);

const [[{ n }]] = await db.query("SELECT COUNT(*) AS n FROM categories");
const file = path.join(root, "data", "content.json");
const hasJson = await fs.access(file).then(() => true, () => false);

if (n > 0 || !hasJson) {
  console.log(n > 0 ? "• توجد بيانات مسبقًا، لم يتم الاستيراد." : "• لا يوجد data/content.json للاستيراد.");
} else {
  const { categories, articles, settings } = JSON.parse(await fs.readFile(file, "utf8"));
  await db.beginTransaction();
  try {
    for (const c of categories)
      await db.query(
        "INSERT INTO categories (id, icon, sort_order, nav, title_ar, title_en, desc_ar, desc_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [c.id, c.icon, c.order, c.nav, c.title.ar, c.title.en, c.description.ar, c.description.en],
      );
    for (const a of articles)
      await db.query(
        `INSERT INTO articles (id, category_id, sort_order, published, updated_at, title_ar, title_en, body_ar, body_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [a.id, a.categoryId, a.order, a.published, new Date(a.updatedAt || Date.now()), a.title.ar, a.title.en, a.body.ar, a.body.en],
      );
    if (settings)
      await db.query(
        `INSERT INTO settings (id, site_name, hero_ar, hero_en, footer_ar, footer_en, whatsapp_url, website_url, privacy_url)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [settings.siteName, settings.heroTitle.ar, settings.heroTitle.en, settings.footerText.ar, settings.footerText.en,
          settings.whatsappUrl, settings.websiteUrl, settings.privacyUrl],
      );
    await db.commit();
    console.log(`✓ تم استيراد ${categories.length} قسم و ${articles.length} مقال والإعدادات.`);
  } catch (e) {
    await db.rollback();
    throw e;
  }
}
await db.end();
