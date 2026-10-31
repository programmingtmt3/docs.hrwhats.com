import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // يسمح برفع صور حتى 5MB عبر الأكشن (الحد الافتراضي 1MB)
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
};

export default config;
