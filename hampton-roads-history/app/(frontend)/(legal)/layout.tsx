export default function LegalLayout({ children }: { children: React.ReactNode }) {
  // Each legal page renders the shared <StaticPage> shell itself.
  return <>{children}</>;
}
