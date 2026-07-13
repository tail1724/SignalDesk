import { getCorrectionsForArticle } from "@/lib/data";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function Corrections({ articleId }: { articleId: string }) {
  const corrections = await getCorrectionsForArticle(articleId);
  if (corrections.length === 0) return null;

  return (
    <section className="mt-10 border-t border-line pt-6">
      <h2 className="font-mono text-[11px] tracking-wide uppercase text-ink-3 mb-3">
        Corrections
      </h2>
      <ul className="flex flex-col gap-3">
        {corrections.map((c) => (
          <li key={c.id} className="text-[13.5px] text-ink-2 leading-relaxed">
            <span className="font-mono text-[11px] text-ink-3">{formatDate(c.corrected_at)}:</span>{" "}
            {c.description}
          </li>
        ))}
      </ul>
    </section>
  );
}
