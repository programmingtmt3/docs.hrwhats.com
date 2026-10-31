import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { timingSafeEqual, createHash } from "crypto";

export const COOKIE = "admin_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 أيام

const key = () => {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET غير مضبوط أو قصير جدًا (استخدم 32 حرفًا على الأقل).");
  return new TextEncoder().encode(s);
};

const digest = (s: string) => createHash("sha256").update(s).digest();

export function checkCredentials(user: string, pass: string): boolean {
  const u = process.env.ADMIN_USERNAME ?? "";
  const p = process.env.ADMIN_PASSWORD ?? "";
  if (!u || !p) return false;
  // مقارنة بزمن ثابت
  const okU = timingSafeEqual(digest(user), digest(u));
  const okP = timingSafeEqual(digest(pass), digest(p));
  return okU && okP;
}

export async function createSession() {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return false;
  try {
    await jwtVerify(t, key());
    return true;
  } catch {
    return false;
  }
}

/** يُستدعى في كل صفحة/أكشن إداري (لا نعتمد على الـ middleware وحده). */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
