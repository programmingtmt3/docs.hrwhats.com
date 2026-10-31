import Link from "next/link";
import { getCategories, getSettings, pick } from "@/lib/db";
import { getLang, U } from "@/lib/i18n";
import { LangToggle } from "./LangToggle";
import { SearchBox } from "./SearchBox";
import { ThemeToggle } from "./ThemeToggle";

/** الشريط العلوي بالتدرج الأخضر. في الصفحة الرئيسية يحتوي أيضًا على عنوان وبحث كبير. */
export async function Top({ home = false }: { home?: boolean }) {
  const [lang, settings, cats] = [await getLang(), await getSettings(), await getCategories()];
  const u = U[lang];
  const nav = cats.filter((c) => c.nav);

  return (
    <header className="bg-gradient-to-br from-hero to-hero2 pt-[env(safe-area-inset-top,0px)] text-white">
      <div className="mx-auto flex min-h-[66px] max-w-site flex-wrap items-center gap-4 px-3.5 py-2.5 md:flex-nowrap md:px-6 md:py-3.5">
        <Link href="/" className="flex items-center gap-2.5 text-xl font-bold text-white no-underline">
          <svg width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="#1fbf74" /><text x="16" y="21" textAnchor="middle" fontSize="13" fontWeight="800" fill="#04170d" fontFamily="Arial,sans-serif">HR</text></svg>
          {settings.siteName} <small className="text-[13px] font-normal opacity-70">Help Center</small>
        </Link>
        <span className="flex-1" />
        {!home && <div className="order-5 min-w-full flex-1 md:order-none md:min-w-0 md:max-w-[380px]"><SearchBox small placeholder={u.sr} empty={u.nf} /></div>}
        {!home && <span className="hidden flex-1 md:block" />}
        {nav.map((c) => (
          <Link key={c.id} href={`/c/${c.id}`} className="hidden px-1.5 py-1 text-[14.5px] text-white/85 no-underline hover:text-white md:block">{pick(c.title, lang)}</Link>
        ))}
        {settings.websiteUrl && <a href={settings.websiteUrl} className="hidden px-1.5 py-1 text-[14.5px] text-white/85 no-underline hover:text-white md:block">{u.ob}</a>}
        <LangToggle lang={lang} label={u.toggle} />
        <ThemeToggle />
      </div>
      {home && (
        <div className="mx-auto max-w-site px-4 pb-20 pt-8 text-center md:px-6 md:pb-24 md:pt-12">
          <h1 className="mb-6 text-3xl font-bold leading-[1.35] md:text-[40px]">{pick(settings.heroTitle, lang)}</h1>
          <SearchBox placeholder={u.sr} empty={u.nf} />
        </div>
      )}
    </header>
  );
}
