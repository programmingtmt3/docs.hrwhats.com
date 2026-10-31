import { ArticleForm } from "@/components/admin/ArticleForm";
import { getArticles, getCategories } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewArticle() {
  const [cats, all] = [await getCategories(), await getArticles({ all: true })];
  if (cats.length === 0) return <p>أضف قسمًا أولًا من صفحة الأقسام.</p>;
  const draft = { id: "", categoryId: cats[0].id, order: all.length + 1, published: true, updatedAt: "", title: { ar: "", en: "" }, body: { ar: "", en: "" } };
  return (<><h1 className="mb-5 text-2xl font-bold">مقال جديد</h1><ArticleForm article={{ ...draft, id: "" }} categories={cats} /></>);
}
