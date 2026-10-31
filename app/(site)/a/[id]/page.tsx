import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/ArticleBody";
import { Feedback } from "@/components/Feedback";
import { Chev } from "@/components/Icon";
import { Top } from "@/components/Top";
import { enhanceHtml } from "@/lib/html";
import { getArticle, getArticles, getCategory, pick } from "@/lib/db";
import { getLang, U } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const a = await getArticle((await params).id);
  return { title: a ? pick(a.title, await getLang()) : undefined };
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();
  const lang = await getLang();
  const u = U[lang];
  const cat = (await getCategory(article.categoryId))!;
  const siblings = await getArticles({ categoryId: cat.id });
  const i = siblings.findIndex((a) => a.id === id);
  const prev = siblings[i - 1], next = siblings[i + 1];
  const pn = "max-w-[48%] rounded-[10px] border border-line bg-card px-[15px] py-[9px] text-sm text-ink no-underline hover:border-brand";

  return (
    <>
      <Top />
      <div className="mx-auto max-w-site px-3.5 pb-[50px] md:px-6 md:pb-[60px]">
        <nav className="flex flex-wrap items-center gap-1.5 pb-2 pt-[22px] text-sm text-muted">
          <Link href="/" className="text-muted no-underline hover:text-brand">{u.home}</Link><Chev className="opacity-60" />
          <Link href={`/c/${cat.id}`} className="text-muted no-underline hover:text-brand">{pick(cat.title, lang)}</Link><Chev className="opacity-60" />
          <span>{pick(article.title, lang)}</span>
        </nav>
        <div className="lg:grid lg:grid-cols-[270px_minmax(0,1fr)] lg:items-start lg:gap-9">
          <aside className="sticky top-5 hidden pt-1.5 lg:block">
            <h4 className="mb-2 text-[15px] font-bold">{pick(cat.title, lang)}</h4>
            {siblings.map((a) => (
              <Link key={a.id} href={`/a/${a.id}`}
                className={`block border-s-2 px-3 py-[7px] text-[14.5px] no-underline rounded-lg ${a.id === id ? "border-brand bg-soft font-semibold text-brand" : "border-transparent text-muted hover:text-ink"}`}>
                {pick(a.title, lang)}
              </Link>
            ))}
          </aside>
          <div>
            <article className="rounded-[14px] border border-line bg-card px-[18px] py-[22px] md:px-10 md:py-[34px]">
              <h1 className="mb-3.5 text-[32px] font-bold leading-[1.35]">{pick(article.title, lang)}</h1>
              <ArticleBody html={enhanceHtml(pick(article.body, lang))} />
              <Feedback question={u.fq} thanks={u.ty} />
            </article>
            <div className="mt-[22px] flex justify-between gap-3">
              {prev ? <Link href={`/a/${prev.id}`} className={pn}>{u.pv}: {pick(prev.title, lang)}</Link> : <span />}
              {next ? <Link href={`/a/${next.id}`} className={pn}>{u.nx}: {pick(next.title, lang)}</Link> : <span />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
