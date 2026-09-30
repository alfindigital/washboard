import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: false },
  serverExternalPackages: [],
};

export default nextConfig;
