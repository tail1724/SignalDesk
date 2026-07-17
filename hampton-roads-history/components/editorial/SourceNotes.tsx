import { ReportCorrection } from "@/components/ReportCorrection";

// "Sources & methodology" — the reporting-transparency block called for in
// design-blueprint.html §04 (article template) and §01 diagnosis ("minimal
// sourcing UI"). Per-article structured source citation isn't modeled in the
// CMS yet (a content-model change outside this pass), so this renders the
// standing editorial-standards statement plus the live correction-report
// affordance for this specific article.
export function SourceNotes({ articleId }: { articleId: string }) {
  return (
    <section aria-label="Sources & methodology" className="mt-11 border border-line bg-surface-2 p-7">
      <span className="mb-2 block font-mono text-[8px] uppercase tracking-[.14em] text-accent-soft">
        Sources &amp; methodology
      </span>
      <h2 className="font-display text-[25px] font-black text-ink">How we reported this</h2>
      <ul className="mt-3 list-disc pl-[18px] text-[11px] leading-[1.8] text-ink-2">
        <li>Public records, official statements and named on-the-record sources</li>
        <li>Independent verification of claims before publication</li>
        <li>Every correction is logged and appears with the article</li>
      </ul>
      <div className="mt-3 text-[10px] leading-[1.5] text-ink-3">
        <ReportCorrection articleId={articleId} />
      </div>
    </section>
  );
}
