import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "odogjtrpcpqicgqaraih.supabase.co",
        pathname: "/storage/v1/object/public/hr-images/**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Security headers
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Cache headers for static assets
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
            source: "/_next/static/:path*",
          },
          // Cache ISR pages
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=3600",
            source: "/([a-z0-9-]*)/([a-z0-9]*)-:slug*",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
