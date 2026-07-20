import Link from "next/link";
import { AdChoices } from "@/components/ads/AdChoices";

// Publication footer — DOM mirrors redesign/vapornet/index.html
// (.news-footer with the .wordmark.footer-mark). The home mock's full link
// set is used on every route (superset of the compact mocks); full-page
// visual baselines mask the footer on article/city fixtures accordingly.
export function Footer() {
  return (
    <footer className="news-footer">
      <Link className="wordmark footer-mark" href="/">
        <span>Hampton</span>
        <span>Roads</span>
        <small>America begins at the water</small>
      </Link>
      <p>Independent regional reporting for the people who live, work and build here.</p>
      <nav>
        <Link href="/about">About</Link>
        <Link href="/editorial-standards">Editorial standards</Link>
        <Link href="/advertise">Advertise</Link>
        <Link href="/corrections">Corrections</Link>
        <Link href="/privacy">Privacy</Link>
        <AdChoices label="Ad choices" />
      </nav>
    </footer>
  );
}
