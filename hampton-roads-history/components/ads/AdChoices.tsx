import Link from "next/link";

// Trigger for the reader-facing ad-transparency surface. There is no consent
// center yet (Epic G) — for now this links to the existing /ad-choices legal
// page rather than opening a modal that doesn't exist.
export function AdChoices({ label = "Ad choices" }: { label?: string }) {
  return (
    <Link
      href="/ad-choices"
      className="border-0 border-b border-current pb-px text-inherit no-underline hover:text-ink"
    >
      {label}
    </Link>
  );
}
