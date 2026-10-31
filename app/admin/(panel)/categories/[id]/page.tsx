import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { getCategory } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditCategory({ params }: { params: Promise<{ id: string }> }) {
  const cat = await getCategory((await params).id);
  if (!cat) notFound();
  return (<><h1 className="mb-5 text-2xl font-bold">تعديل القسم</h1><CategoryForm category={cat} /></>);
}
