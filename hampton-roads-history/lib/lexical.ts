// Minimal word-count walk over a Payload Lexical rich-text tree, used only
// to gate inline-ad density (design-blueprint.html §05: no inline unit
// under 600 words). Not a full Lexical text extractor — it only needs an
// approximate count.
type LexicalNode = { text?: string; children?: LexicalNode[] };

export function lexicalWordCount(body: unknown): number {
  const root =
    body && typeof body === "object" && "root" in (body as Record<string, unknown>)
      ? (body as { root?: LexicalNode }).root
      : undefined;
  if (!root) return 0;

  let words = 0;
  function walk(node: LexicalNode) {
    if (typeof node.text === "string" && node.text.trim()) {
      words += node.text.trim().split(/\s+/).length;
    }
    node.children?.forEach(walk);
  }
  walk(root);
  return words;
}
