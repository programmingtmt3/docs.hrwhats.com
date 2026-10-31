import Link from "next/link";
import { deleteArticle } from "@/lib/actions";
import { getArticles, getCategories } from "@/lib/db";
import { DeleteButton } from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "المقالات" };

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  const sp = await searchParams;
  const [articles, cats] = [await getArticles({ all: true }), await getCategories()];

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">المقالات <span className="text-base font-normal text-muted">({articles.length})</span></h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/categories" className="btn-ghost">إدارة الأقسام</Link>
          <Link href="/admin/categories/new" className="btn-ghost">+ قسم جديد</Link>
          <Link href="/admin/articles/new" className="btn">+ مقال جديد</Link>
        </div>
      </div>
      {(sp.saved || sp.deleted) && <p className="mb-4 rounded-lg bg-soft px-4 py-2.5 text-sm text-brand">{sp.saved ? "تم الحفظ." : "تم الحذف."}</p>}

      {cats.map((c) => {
        const list = articles.filter((a) => a.categoryId === c.id);
        return (
          <section key={c.id} className="mb-6">
            <div className="mb-2 flex items-center gap-3">
              <h2 className="text-[15px] font-bold text-muted">{c.title.ar}</h2>
              <Link href={`/admin/categories/${c.id}`} className="text-[13px] text-muted no-underline hover:text-brand">تعديل القسم</Link>
            </div>
            <div className="overflow-hidden rounded-[14px] border border-line bg-card">
              {list.length === 0 && <p className="p-4 text-sm text-muted">لا توجد مقالات في هذا القسم.</p>}
              {list.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 last:border-0">
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/articles/${a.id}`} className="font-semibold text-ink no-underline hover:text-brand">{a.title.ar}</Link>
                    <div className="text-xs text-muted" dir="ltr" style={{ textAlign: "start" }}>/{a.id}</div>
                  </div>
                  {!a.published && <span className="rounded-md bg-warn px-2 py-0.5 text-xs text-warni">مسودة</span>}
                  <Link href={`/a/${a.id}`} target="_blank" className="text-sm text-muted no-underline hover:text-brand">عرض</Link>
                  <Link href={`/admin/articles/${a.id}`} className="btn-ghost !py-1.5">تعديل</Link>
                  <DeleteButton action={deleteArticle.bind(null, a.id)} confirmText={`حذف «${a.title.ar}» نهائيًا؟`} />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
