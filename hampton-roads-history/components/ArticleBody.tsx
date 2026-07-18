import { RichText } from "@payloadcms/richtext-lexical/react";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";

export function ArticleBody({ body, title }: { body: unknown; title: string }) {
  const root =
    body && typeof body === "object" && "root" in (body as Record<string, unknown>)
      ? (body as { root?: { children?: unknown[] } }).root
      : undefined;
  const hasContent = Array.isArray(root?.children) && root.children.length > 0;

  if (!hasContent) {
    return (
      <p className="text-ink-2">
        This story is still being written up in full — the editorial team is
        finishing the deep-dive draft. Check back soon for the complete
        account of {title.toLowerCase()}.
      </p>
    );
  }

  // .article-flow: the rendered lexical children pick up the prototype's
  // .article-body typography + dropcap via the additive twins in
  // vapornet.css (RichText wraps output in one div, so the prototype's
  // direct-child selectors can't reach the paragraphs without it).
  return <RichText data={body as SerializedEditorState} className="article-flow prose-hr max-w-none" />;
}
