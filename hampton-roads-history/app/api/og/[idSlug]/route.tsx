import { ImageResponse } from "next/og";
import { getArticleByShortId } from "@/lib/data";
import { parseShortId } from "@/lib/format";

export const runtime = "edge";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ idSlug: string }> }
) {
  const { idSlug } = await params;
  const shortId = parseShortId(idSlug);
  const article = shortId ? await getArticleByShortId(shortId) : null;

  const title = article?.title ?? "Hampton Roads History";
  const kicker = article?.hr_categories?.name ?? "Seven Cities, Four Centuries";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          backgroundColor: "#12140f",
          backgroundImage:
            "linear-gradient(135deg, #1a1d15 0%, #12140f 60%, #0d0f0a 100%)",
          padding: "72px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "#d1543b",
            marginBottom: 24,
          }}
        >
          {kicker}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 56,
            fontWeight: 900,
            lineHeight: 1.1,
            color: "#f5f2ea",
            maxWidth: 950,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 24,
            fontWeight: 700,
            color: "#6b9dab",
            marginTop: 48,
          }}
        >
          Hampton Roads History
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
