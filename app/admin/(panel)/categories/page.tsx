import Link from "next/link";
import { deleteCategory } from "@/lib/actions";
import { getArticles, getCategories } from "@/lib/db";
import { DeleteButton } from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "الأقسام" };

export default async function Categories({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  const sp = await searchParams;
  const [cats, articles] = [await getCategories(), await getArticles({ all: true })];
  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">الأقسام</h1>
        <Link href="/admin/categories/new" className="btn">+ قسم جديد</Link>
      </div>
      {(sp.saved || sp.deleted) && <p className="mb-4 rounded-lg bg-soft px-4 py-2.5 text-sm text-brand">{sp.saved ? "تم الحفظ." : "تم الحذف."}</p>}
      <div className="overflow-hidden rounded-[14px] border border-line bg-card">
        {cats.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 last:border-0">
            <div className="min-w-0 flex-1">
              <b>{c.title.ar}</b>
              <div className="text-sm text-muted">{c.description.ar}</div>
            </div>
            <span className="text-sm text-muted">{articles.filter((a) => a.categoryId === c.id).length} مقال</span>
            <Link href={`/admin/categories/${c.id}`} className="btn-ghost !py-1.5">تعديل</Link>
            <DeleteButton action={deleteCategory.bind(null, c.id)} confirmText={`حذف قسم «${c.title.ar}»؟`} />
          </div>
        ))}
      </div>
    </>
  );
}
