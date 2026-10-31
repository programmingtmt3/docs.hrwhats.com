import type { IconName } from "@/lib/types";

const P: Record<IconName | "chev" | "copy" | "search", React.ReactNode> = {
  book: <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5" /></>,
  rocket: <><path d="M5 19c0-3 2-5 4-6l6-6c2-2 4-3 5-3 0 1-1 3-3 5l-6 6c-1 2-3 4-6 4z" /><path d="M5 19l-1 2 2-1" /></>,
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />,
  list: <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />,
  grid: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
  code: <path d="M8 8l-4 4 4 4M16 8l4 4-4 4" />,
  chev: <path d="M9 6l6 6-6 6" />,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h8" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
};

export type IconKey = keyof typeof P;

export function Icon({ name, size = 16, className }: { name: IconKey; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={name === "search" ? 2 : 1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {P[name]}
    </svg>
  );
}

/** سهم يتبدل اتجاهه مع RTL */
export const Chev = ({ size = 14, className = "" }: { size?: number; className?: string }) => (
  <Icon name="chev" size={size} className={`rtl:-scale-x-100 ${className}`} />
);
