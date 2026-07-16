import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

// Derive the Supabase host from the env instead of hardcoding a project ref,
// so staging/prod point at their own project automatically. Falls back to the
// current prod ref if the env is unset at build time.
const supabaseHost = (() => {
  try {
    return (
      new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname ||
      "odogjtrpcpqicgqaraih.supabase.co"
    );
  } catch {
    return "odogjtrpcpqicgqaraih.supabase.co";
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        // Any public Storage bucket (hr-media, content-images, etc.). The old
        // value pinned a non-existent "hr-images" bucket — hero images live in
        // "hr-media".
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  async headers() {
    return [
      {
        // `source` belongs at this top level, one entry per path pattern —
        // it is NOT a property of individual objects inside `headers`.
        source: "/:path*",
        headers: [
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
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        // Next.js already sets an immutable Cache-Control on hashed
        // /_next/static assets automatically and doesn't allow overriding
        // it — no entry needed here.
        source: "/:city([a-z-]+)/:idSlug([a-z0-9-]+)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=3600",
          },
        ],
      },
    ];
  },
};

export default withPayload(nextConfig);
