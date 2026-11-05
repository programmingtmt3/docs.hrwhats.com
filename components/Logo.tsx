import Image from "next/image";

/** شعار HRwhats. خلفيته فاتحة ليبقى الأخضر واضحًا فوق الشريط العلوي الأخضر. */
export function Logo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return <Image src="/logo.png" alt="HRwhats" width={size} height={size} priority className={`rounded-[22%] ${className}`} />;
}
