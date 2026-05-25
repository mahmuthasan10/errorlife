import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@errorlife/shared"],
  outputFileTracingRoot: path.join(__dirname, "../"),
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
