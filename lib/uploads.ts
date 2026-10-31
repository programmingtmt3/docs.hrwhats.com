import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";

// الصور تُحفظ بجانب ملف المحتوى: <DATA_DIR>/uploads
export const UPLOAD_DIR = path.join(process.env.DATA_DIR || path.join(process.cwd(), "data"), "uploads");
export const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

/** يحدد النوع من محتوى الملف نفسه (لا نثق بالاسم أو بنوع المتصفح). SVG مرفوض لأنه قد يحتوي سكربت. */
function sniff(b: Buffer): string | null {
  if (b.length < 12) return null;
  if (b[0] === 0x89 && b.toString("ascii", 1, 4) === "PNG") return "png";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (b.toString("ascii", 0, 4) === "GIF8") return "gif";
  return null;
}

export async function saveImage(file: File): Promise<{ url: string } | { error: string }> {
  if (file.size === 0) return { error: "الملف فارغ." };
  if (file.size > MAX_SIZE) return { error: "حجم الصورة أكبر من 5MB." };
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniff(buf);
  if (!ext) return { error: "الصيغ المسموحة: PNG أو JPG أو WebP أو GIF." };
  const name = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.${ext}`;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), buf);
  return { url: `/uploads/${name}` };
}
