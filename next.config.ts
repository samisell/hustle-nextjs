import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-4af01455-1ef4-457f-943d-12df14895c8c.space.z.ai",
  ],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
