import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp & prisma chạy native trên server
  serverExternalPackages: ["sharp", "@prisma/client"],
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75],
    localPatterns: [{ pathname: "/**" }],
    remotePatterns: [{ protocol: "https", hostname: "img.vietqr.io" }],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  experimental: {
    serverActions: { bodySizeLimit: "25mb" },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
