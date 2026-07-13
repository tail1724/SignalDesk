import { NextRequest, NextResponse } from "next/server";
import {
  revalidateArticle,
  revalidateCategory,
  revalidateFeed,
  revalidateTrending,
  revalidateBreaking,
} from "@/lib/revalidate";
import { verifyWebhookSignature } from "@/lib/webhook";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Primary enforcement is Traefik (coolify/traefik-middleware.yml, 10/min);
  // this is a defense-in-depth fallback for single-instance deployments.
  const clientIp = getClientIp(request.headers);
  if (!checkRateLimit(`revalidate:${clientIp}`, 10)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    // Verify webhook signature
    const signature = request.headers.get("x-webhook-signature");
    const body = await request.text();

    if (!signature || !verifyWebhookSignature(body, signature)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);
    const { type, data } = event;

    // Route to appropriate revalidation handler
    switch (type) {
      case "article.published":
      case "article.updated":
        if (data.id && data.short_id) {
          await revalidateArticle(data.id, data.short_id);
        }
        break;

      case "article.deleted":
        // Cascade invalidation
        await revalidateFeed();
        break;

      case "category.updated":
      case "category.created":
        if (data.slug) {
          await revalidateCategory(data.slug);
        }
        break;

      case "trending.updated":
        await revalidateTrending();
        break;

      case "breaking.updated":
        await revalidateBreaking();
        break;

      case "feed.rebuild":
        await revalidateFeed();
        break;

      default:
        return NextResponse.json(
          { error: "Unknown event type" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      revalidated: true,
      type,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Revalidation error:", err);
    return NextResponse.json(
      { error: "Revalidation failed" },
      { status: 500 }
    );
  }
}
