import { NextResponse } from "next/server";
import { getArticles, getCategories, pick } from "@/lib/db";
import { getLang } from "@/lib/i18n";
import { stripHtml } from "@/lib/html";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().toLowerCase();
  if (!q) return NextResponse.json([]);
  const lang = await getLang();
  const cats = await getCategories();
  const hits = (await getArticles())
    .filter((a) => `${pick(a.title, lang)} ${stripHtml(pick(a.body, lang))}`.toLowerCase().includes(q))
    .slice(0, 7)
    .map((a) => {
      const c = cats.find((c) => c.id === a.categoryId);
      return { id: a.id, title: pick(a.title, lang), category: c ? pick(c.title, lang) : "" };
    });
  return NextResponse.json(hits);
}
