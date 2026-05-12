import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      // Cloudflare R2 CDN (set your actual R2_PUBLIC_URL domain here)
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      // Local dev fallback (backend serves static files)
      { protocol: "http", hostname: "localhost", port: "8005" },
      { protocol: "http", hostname: "127.0.0.1", port: "8005" },
    ],
  },
};

export default nextConfig;
