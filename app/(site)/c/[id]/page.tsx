import Link from "next/link";
import { notFound } from "next/navigation";
import { Chev } from "@/components/Icon";
import { Top } from "@/components/Top";
import { getArticles, getCategory, pick } from "@/lib/db";
import { getLang, U } from "@/lib/i18n";
import { stripHtml } from "@/lib/html";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cat = await getCategory(id);
  if (!cat) notFound();
  const lang = await getLang();
  const u = U[lang];
  const articles = await getArticles({ categoryId: id });
  const excerpt = (html: string) => { const t = stripHtml(html); return t.length > 120 ? t.slice(0, 118) + "…" : t; };

  return (
    <>
      <Top />
      <div className="mx-auto max-w-site px-3.5 pb-[50px] md:px-6 md:pb-[60px]">
        <nav className="flex flex-wrap items-center gap-1.5 pb-2 pt-[22px] text-sm text-muted">
          <Link href="/" className="text-muted no-underline hover:text-brand">{u.home}</Link>
          <Chev className="opacity-60" /><span>{pick(cat.title, lang)}</span>
        </nav>
        <h1 className="mb-1.5 mt-1.5 text-[34px] font-bold leading-[1.35]">{pick(cat.title, lang)}</h1>
        <p className="mb-[22px] text-muted">{pick(cat.description, lang)} · {u.n(articles.length)}</p>
        <div className="overflow-hidden rounded-[14px] border border-line bg-card">
          {articles.length === 0 && <p className="p-6 text-muted">{u.empty}</p>}
          {articles.map((a) => (
            <Link key={a.id} href={`/a/${a.id}`} className="flex items-center justify-between gap-3.5 border-b border-line px-[22px] py-[17px] text-ink no-underline last:border-0 hover:bg-soft">
              <div>
                <b className="block text-[16.5px]">{pick(a.title, lang)}</b>
                <span className="mt-0.5 block text-sm leading-[1.6] text-muted">{excerpt(pick(a.body, lang))}</span>
              </div>
              <Chev size={18} className="text-muted" />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
