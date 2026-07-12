import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";
import {
  revalidateArticle,
  revalidateCategory,
  revalidateFeed,
  revalidateTrending,
  revalidateBreaking,
} from "@/lib/revalidate";

// HMAC verification for webhook security
function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const secret = process.env.WEBHOOK_SECRET || "dev-only-placeholder";
  const hash = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64");
  return hash === signature;
}

export async function POST(request: NextRequest) {
  // Rate limit: 10 reqs/min (enforced at CDN edge, this is fallback)
  const clientIp = request.headers.get("x-forwarded-for") || "unknown";

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
