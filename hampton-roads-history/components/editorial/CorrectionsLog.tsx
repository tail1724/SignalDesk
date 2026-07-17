import { Corrections } from "@/components/Corrections";

// Thin naming wrapper so the component inventory matches
// design-blueprint.html §04 (CorrectionsLog) — the fetch/render logic stays
// in the existing Corrections component.
export function CorrectionsLog({ articleId }: { articleId: string }) {
  return <Corrections articleId={articleId} />;
}
