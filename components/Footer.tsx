import { getSettings, pick } from "@/lib/db";
import { getLang, U } from "@/lib/i18n";

export async function Footer() {
  const [lang, s] = [await getLang(), await getSettings()];
  const u = U[lang];
  const a = "mx-2.5 text-muted no-underline hover:text-brand";
  return (
    <footer className="mx-auto mt-5 max-w-site border-t border-line px-6 py-7 text-center text-[13.5px] text-muted">
      <div>{pick(s.footerText, lang)}</div>
      <div className="mt-2">
        {s.websiteUrl && <a className={a} href={s.websiteUrl}>{u.ob}</a>}
        {s.privacyUrl && <a className={a} href={s.privacyUrl}>{u.pp}</a>}
      </div>
    </footer>
  );
}
