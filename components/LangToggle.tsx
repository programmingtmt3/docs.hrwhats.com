"use client";

import { useTransition } from "react";
import { setLang } from "@/lib/actions";

export function LangToggle({ lang, label }: { lang: "ar" | "en"; label: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} onClick={() => start(() => setLang(lang === "ar" ? "en" : "ar"))}
      className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-[13.5px] text-white hover:bg-white/20">
      {label}
    </button>
  );
}
