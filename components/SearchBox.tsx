"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

type Hit = { id: string; title: string; category: string };

export function SearchBox({ placeholder, empty, small = false }: { placeholder: string; empty: string; small?: boolean }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const v = q.trim();
    if (!v) return setHits(null);
    const t = setTimeout(async () => {
      const r = await fetch(`/api/search?q=${encodeURIComponent(v)}`);
      if (r.ok) setHits(await r.json());
    }, 150);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const click = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setHits(null);
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); input.current?.focus(); }
    };
    document.addEventListener("click", click);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("click", click); document.removeEventListener("keydown", key); };
  }, []);

  return (
    <div ref={ref} className={`relative w-full ${small ? "" : "mx-auto max-w-[640px]"}`}>
      <Icon name="search" size={18} className={`pointer-events-none absolute top-1/2 -mt-[9px] text-muted ${small ? "start-[13px]" : "start-4"}`} />
      <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} autoComplete="off"
        className={`w-full rounded-xl border-2 border-transparent bg-card text-ink outline-none focus:border-brand ${small ? "rounded-[10px] px-10 py-[9px] text-sm" : "px-12 py-3.5 text-base shadow-[0_8px_30px_#0003]"}`} />
      {hits && (
        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-xl border border-line bg-card text-start text-ink shadow-[0_14px_40px_#0004]">
          {hits.length ? hits.map((h) => (
            <Link key={h.id} href={`/a/${h.id}`} onClick={() => setHits(null)} className="block border-b border-line px-4 py-2.5 text-[14.5px] last:border-0 hover:bg-soft">
              {h.title}<span className="block text-[12.5px] text-muted">{h.category}</span>
            </Link>
          )) : <div className="px-4 py-2.5 text-[14.5px] text-muted">{empty}</div>}
        </div>
      )}
    </div>
  );
}
