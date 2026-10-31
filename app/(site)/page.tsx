import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Top } from "@/components/Top";
import { getArticles, getCategories, getSettings, pick } from "@/lib/db";
import { getLang, U } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function Home() {
  const lang = await getLang();
  const u = U[lang];
  const [cats, articles, s] = [await getCategories(), await getArticles(), await getSettings()];
  const count = (id: string) => articles.filter((a) => a.categoryId === id).length;

  return (
    <>
      <Top home />
      <div className="mx-auto -mt-[52px] max-w-site px-3.5 pb-[50px] md:px-6 md:pb-[60px]">
        <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c) => (
            <Link key={c.id} href={`/c/${c.id}`} className="block rounded-[14px] border border-line bg-card p-6 text-ink no-underline transition hover:-translate-y-0.5 hover:border-brand hover:shadow-[0_10px_28px_#0000001a]">
              <div className="mb-4 flex size-[42px] items-center justify-center rounded-[11px] bg-soft text-brand"><Icon name={c.icon} size={20} /></div>
              <b className="mb-0.5 block text-lg">{pick(c.title, lang)}</b>
              <p className="mb-3 text-[14.5px] leading-[1.7] text-muted">{pick(c.description, lang)}</p>
              <em className="text-[13px] font-semibold not-italic text-brand">{u.n(count(c.id))}</em>
            </Link>
          ))}
        </div>
        {s.whatsappUrl && (
          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-[14px] border border-line bg-card px-6 py-[22px]">
            <div><b className="text-[17px]">{u.hq}</b><span className="block text-[14.5px] text-muted">{u.hd}</span></div>
            <a className="btn" href={s.whatsappUrl}>{u.hb}</a>
          </div>
        )}
      </div>
    </>
  );
}
