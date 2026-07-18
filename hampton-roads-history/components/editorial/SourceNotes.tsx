import { ReportCorrection } from "@/components/ReportCorrection";

// "Sources & methodology" — DOM mirrors redesign/vapornet/index.html's
// .source-notes block. Per-article structured source citation isn't modeled
// in the CMS yet (a content-model change outside this pass), so this renders
// the standing editorial-standards statement plus the live correction-report
// affordance for this specific article.
export function SourceNotes({
  articleId,
  bullets,
}: {
  articleId: string;
  bullets?: string[];
}) {
  const items = bullets ?? [
    "Public records, official statements and named on-the-record sources",
    "Independent verification of claims before publication",
    "Every correction is logged and appears with the article",
  ];
  return (
    <section className="source-notes" aria-label="Sources & methodology">
      <span className="section-kicker">Sources &amp; methodology</span>
      <h2>How we reported this</h2>
      <ul>
        {items.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      <p>
        <strong>Correction?</strong> <ReportCorrection articleId={articleId} />
      </p>
    </section>
  );
}
