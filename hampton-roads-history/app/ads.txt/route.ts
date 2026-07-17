import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const declaration = process.env.ADS_TXT_CONTENT?.trim();
  if (!declaration) {
    return new NextResponse("# ads.txt is not configured\n", {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  return new NextResponse(`${declaration}\n`, {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
