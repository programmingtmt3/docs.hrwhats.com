import Link from "next/link";
import { Top } from "@/components/Top";
import { getLang, U } from "@/lib/i18n";

export default async function NotFound() {
  const u = U[await getLang()];
  return (
    <>
      <Top />
      <div className="mx-auto max-w-site px-6 py-24 text-center">
        <h1 className="mb-4 text-3xl font-bold">{u.nf404}</h1>
        <Link href="/" className="btn">{u.back}</Link>
      </div>
    </>
  );
}
