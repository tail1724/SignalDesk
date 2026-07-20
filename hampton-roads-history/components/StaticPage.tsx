import type { ReactNode } from "react";

// Shared shell for editorial/company pages (about, standards, advertise,
// corrections, privacy, terms, ad choices). Gives every one of them the
// same treatment as the rest of the site: mono kicker, big serif title,
// generous breathing room against the header and footer, and the
// .prose-hr reading typography.
export function StaticPage({
  kicker,
  title,
  lede,
  updated,
  children,
}: {
  kicker: string;
  title: string;
  lede?: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <main className="static-page">
      <header className="static-hero">
        <span className="section-kicker">{kicker}</span>
        <h1>{title}</h1>
        {lede && <p className="static-lede">{lede}</p>}
        {updated && <p className="static-updated">Last updated: {updated}</p>}
      </header>
      <div className="static-body prose-hr">{children}</div>
    </main>
  );
}
