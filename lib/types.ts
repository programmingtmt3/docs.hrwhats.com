export type Lang = "ar" | "en";
export type Bi = { ar: string; en: string };
export const ICONS = ["book", "rocket", "chat", "list", "grid", "code"] as const;
export type IconName = (typeof ICONS)[number];

export interface Category {
  id: string;
  icon: IconName;
  order: number;
  nav: boolean; // يظهر في شريط الروابط العلوي
  title: Bi;
  description: Bi;
}

export interface Article {
  id: string;
  categoryId: string;
  order: number;
  published: boolean;
  updatedAt: string;
  title: Bi;
  body: Bi; // HTML
}

export interface Settings {
  siteName: string;
  heroTitle: Bi;
  footerText: Bi;
  whatsappUrl: string;
  websiteUrl: string;
  privacyUrl: string;
}

export interface DB {
  categories: Category[];
  articles: Article[];
  settings: Settings;
}
