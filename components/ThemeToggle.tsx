"use client";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const toggle = () => {
    const r = document.documentElement;
    const next = r.getAttribute("data-theme") === "dark" ? "light" : "dark";
    r.setAttribute("data-theme", next);
    try { localStorage.setItem("ht", next); } catch {}
  };
  return (
    <button type="button" aria-label="theme" onClick={toggle}
      className={className || "flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-[13.5px] text-white hover:bg-white/20"}>
      ◐
    </button>
  );
}
