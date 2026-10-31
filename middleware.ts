import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// طبقة حماية أولى؛ كل صفحة وأكشن إداري يتحقق من الجلسة أيضًا عبر requireAdmin().
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const token = req.cookies.get("admin_session")?.value;
  try {
    if (!token || !process.env.AUTH_SECRET) throw new Error("no session");
    await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
}

export const config = { matcher: ["/admin/:path*"] };
