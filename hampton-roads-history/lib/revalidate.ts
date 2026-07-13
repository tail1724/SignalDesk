import { revalidatePath } from "next/cache";

// Revalidation paths for ISR cache invalidation
// Called via webhook after content mutations

export async function revalidateArticle(articleId: string, shortId: string) {
  revalidatePath("/");
  revalidatePath("/[city]", "layout");
  revalidatePath("/[city]/[idSlug]", "page");
}

export async function revalidateCategory(slug: string) {
  revalidatePath("/");
  revalidatePath(`/${slug}`, "layout");
}

export async function revalidateFeed() {
  revalidatePath("/");
  revalidatePath("/[city]", "layout");
}

export async function revalidateTrending() {
  revalidatePath("/");
  revalidatePath("/[city]", "layout");
}

export async function revalidateBreaking() {
  revalidatePath("/");
}
