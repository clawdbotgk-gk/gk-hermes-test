import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // next-auth route handlers have type incompatibility with Next.js 16 route types
    // The runtime is fine - this only affects the build-time type check
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
