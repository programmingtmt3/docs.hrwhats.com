import { Footer } from "@/components/Footer";
import { MetaPixel } from "@/components/MetaPixel";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (<><MetaPixel />{children}<Footer /></>);
}
