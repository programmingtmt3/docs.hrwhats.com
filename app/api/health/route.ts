import { NextResponse } from "next/server";
import { getCategories } from "@/lib/db";

export const dynamic = "force-dynamic";

// فحص سريع لاتصال قاعدة البيانات بعد النشر. لا يعرض أي بيانات اتصال، فقط رمز الخطأ.
export async function GET() {
  if (!process.env.DATABASE_URL) return NextResponse.json({ ok: false, error: "DATABASE_URL_MISSING" }, { status: 500 });
  try {
    const cats = await getCategories();
    return NextResponse.json({ ok: true, categories: cats.length });
  } catch (e) {
    const err = e as { code?: string };
    console.error("Health check database error:", e);
    return NextResponse.json({ ok: false, error: err.code ?? "UNKNOWN" }, { status: 500 });
  }
}
