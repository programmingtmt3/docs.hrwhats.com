import Link from "next/link";
import { logout } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { ThemeToggle } from "@/components/ThemeToggle";

const links = [
  { href: "/admin", label: "المقالات" },
  { href: "/admin/categories", label: "الأقسام" },
  { href: "/admin/settings", label: "الإعدادات" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div dir="rtl" className="min-h-screen">
      <header className="bg-gradient-to-br from-hero to-hero2 pt-[env(safe-area-inset-top,0px)] text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
          <b className="text-lg">لوحة التحكم</b>
          <nav className="flex flex-1 gap-1">
            {links.map((l) => <Link key={l.href} href={l.href} className="rounded-lg px-3 py-1.5 text-[14.5px] text-white/85 no-underline hover:bg-white/10 hover:text-white">{l.label}</Link>)}
          </nav>
          <Link href="/" target="_blank" className="text-[14px] text-white/85 no-underline hover:text-white">عرض الموقع ↗</Link>
          <ThemeToggle />
          <form action={logout}><button className="rounded-lg bg-white/10 px-3 py-1.5 text-[13.5px] hover:bg-white/20">خروج</button></form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-7">{children}</main>
    </div>
  );
}
