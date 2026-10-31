import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { Article, Category, DB, Lang, Bi } from "./types";

// التخزين في ملف JSON. لتغيير القاعدة لاحقًا (Postgres/SQLite) عدّل هذا الملف فقط.
const DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const FILE = path.join(DIR, "content.json");

let queue: Promise<unknown> = Promise.resolve();

export async function readDB(): Promise<DB> {
  return JSON.parse(await fs.readFile(FILE, "utf8")) as DB;
}

/** تعديل آمن: يُنفَّذ بالتسلسل ويُكتب الملف بشكل ذري. */
export function mutate(fn: (db: DB) => void): Promise<void> {
  const run = queue.then(async () => {
    const db = await readDB();
    fn(db);
    const tmp = FILE + ".tmp";
    await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
    await fs.rename(tmp, FILE);
  });
  queue = run.catch(() => undefined);
  return run;
}

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;

export async function getCategories(): Promise<Category[]> {
  return (await readDB()).categories.sort(byOrder);
}

export async function getCategory(id: string) {
  return (await getCategories()).find((c) => c.id === id) ?? null;
}

export async function getArticles(opts: { categoryId?: string; all?: boolean } = {}): Promise<Article[]> {
  const { articles } = await readDB();
  return articles
    .filter((a) => (opts.all || a.published) && (!opts.categoryId || a.categoryId === opts.categoryId))
    .sort(byOrder);
}

export async function getArticle(id: string, all = false) {
  return (await getArticles({ all })).find((a) => a.id === id) ?? null;
}

export async function getSettings() {
  return (await readDB()).settings;
}

/** يرجع نص اللغة المطلوبة، وإن كان فارغًا يرجع اللغة الأخرى. */
export function pick(b: Bi, lang: Lang): string {
  return b[lang]?.trim() ? b[lang] : b[lang === "ar" ? "en" : "ar"];
}
