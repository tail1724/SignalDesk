import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const declaration = process.env.SELLERS_JSON_CONTENT?.trim();
  if (!declaration) {
    return NextResponse.json(
      { error: "sellers.json is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const parsed: unknown = JSON.parse(declaration);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Declaration must be a JSON object");
    }
    return NextResponse.json(parsed, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "sellers.json is invalid" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
