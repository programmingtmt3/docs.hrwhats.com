// إنشاء الجداول، ثم استيراد data/content.json إن كانت فارغة. آمن للتكرار، ويعمل تلقائيًا مع npm run build.
// التشغيل: npm run db:setup  (يقرأ DATABASE_URL من متغيرات البيئة أو ملفات .env بنفس ترتيب Next.js)
import { promises as fs } from "fs";
import path from "path";
import mysql from "mysql2/promise";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd(), false, { info() {}, error: console.error });

const fail = (msg) => {
  console.error(`✗ db:setup: ${msg}`);
  process.exit(1);
};

const uri = process.env.DATABASE_URL;
if (!uri) fail("DATABASE_URL غير معرّف. أضفه في متغيرات البيئة (أو .env.local محليًا).");

const url = new URL(uri);
const dbName = decodeURIComponent(url.pathname.slice(1));
if (!/^[A-Za-z0-9_]+$/.test(dbName)) fail("اسم قاعدة البيانات في DATABASE_URL غير صالح.");

const root = process.cwd();
const opts = { uri, charset: "utf8mb4", timezone: "Z", multipleStatements: true };
let db;
try {
  db = await mysql.createConnection(opts);
} catch (e) {
  // القاعدة غير موجودة (محليًا غالبًا): ننشئها. في الاستضافة المشتركة تكون موجودة مسبقًا.
  if (e instanceof URIError) fail("DATABASE_URL غير صالح: رموز مثل % @ # / : في كلمة المرور يجب ترميزها (مثلًا % تصبح %25 و @ تصبح %40).");
  if (e.code !== "ER_BAD_DB_ERROR") fail(`تعذّر الاتصال بقاعدة البيانات (${e.code ?? e.message}).`);
  url.pathname = "/";
  const server = await mysql.createConnection({ uri: url.toString(), charset: "utf8mb4" });
  await server.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await server.end();
  db = await mysql.createConnection(opts);
}
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
