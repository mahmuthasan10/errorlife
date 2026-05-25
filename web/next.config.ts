import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@errorlife/shared"],
  typescript: {
    ignoreBuildErrors: true,
  },
  productionBrowserSourceMaps: false,
};

export default nextConfig;
