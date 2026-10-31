import { getSettings } from "@/lib/db";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "الإعدادات" };

export default async function Settings({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [s, sp] = [await getSettings(), await searchParams];
  return (
    <>
      <h1 className="mb-5 text-2xl font-bold">إعدادات الموقع</h1>
      {sp.saved && <p className="mb-4 rounded-lg bg-soft px-4 py-2.5 text-sm text-brand">تم الحفظ.</p>}
      <SettingsForm s={s} />
    </>
  );
}
