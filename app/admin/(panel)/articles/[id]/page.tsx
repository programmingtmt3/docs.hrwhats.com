import { notFound } from "next/navigation";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { getArticle, getCategories } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditArticle({ params }: { params: Promise<{ id: string }> }) {
  const article = await getArticle((await params).id, true);
  if (!article) notFound();
  return (<><h1 className="mb-5 text-2xl font-bold">تعديل المقال</h1><ArticleForm article={article} categories={await getCategories()} /></>);
}
