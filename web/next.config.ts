import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@errorlife/shared"],
  typescript: {
    ignoreBuildErrors: true, // Buna Mimari Tavsiyeler kısmında değineceğim!
  },
  productionBrowserSourceMaps: false,
  // Tıkanmayı çözen kritik satır: Next.js'e monorepo root'unu gösteriyoruz
  outputFileTracingRoot: path.join(__dirname, "../"), 
};

export default nextConfig;
