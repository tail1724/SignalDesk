import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";
import "../globals.css";
// Verbatim VaporNet prototype CSS (generated — see scripts/generate-vapornet-css.mts).
// Unlayered on purpose: it must beat Tailwind v4's layered preflight/utilities.
import "./vapornet.css";
import "./sticky-feed.css";
// react-bits surface styles (LaserFlow + MagicBento) — hand-authored, themed
// from the VaporNet tokens; kept separate from the generated vapornet.css.
import "@/components/reactbits/reactbits.css";
import { GlobalNav } from "@/components/GlobalNav";
import { LiveRibbon } from "@/components/editorial/LiveRibbon";
import { CityBento } from "@/components/reactbits/CityBento";
import { Footer } from "@/components/Footer";
import { ConsentCenter } from "@/components/ConsentCenter";
import { ConsentChip } from "@/components/ConsentChip";
import { getCategories } from "@/lib/data";

// Inter carries UI/body copy; JetBrains Mono is kept for data accents
// (timestamps, the weather widget, the search hint, ad labels). Newsreader
// is the VaporNet display serif for headlines and the masthead wordmark —
// self-hosted via next/font, variable axis so `font: 900 …` in component
// CSS clamps to the font's max (800) instead of erroring.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  display: "swap",
});

// Applied before first paint so the chosen theme never flashes. Reads the
// persisted preference (or the OS setting when "system"/unset) and stamps
// data-theme on <html>. Nonce'd so it passes the strict CSP in proxy.ts.
const THEME_INIT = `(function(){try{var p=localStorage.getItem('hrh-theme')||'system';var d=p==='dark'||(p!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();`;

// The root layout fetches hr_categories on every render, so the whole app
// must be dynamic rather than prerendered (see note in app/page.tsx about
// this sandbox's Supabase egress restriction).
export const dynamic = "force-dynamic";

// Static fallback for the section nav when the categories query fails.
const FALLBACK_CITIES = [
  "Norfolk", "Virginia Beach", "Hampton", "Newport News", "Chesapeake", "Portsmouth", "Suffolk",
].map((name, i) => ({
  id: name.toLowerCase().replace(/\s+/g, "-"),
  name,
  slug: name.toLowerCase().replace(/\s+/g, "-"),
  order: i,
  accent_hex: null,
}));

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hamptonroadshistory.com";
const title = "Hampton Roads History — Seven Cities, Four Centuries";
const description =
  "Warm, deeply reported local history for Hampton, Newport News, Norfolk, Virginia Beach, Chesapeake, Portsmouth, and Suffolk.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: "%s" },
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Hampton Roads History",
    title,
    description,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The section nav must not take the whole shell down if the DB is briefly
  // unreachable. Fall back to the seven canonical Hampton Roads cities — a
  // fixed brand fact — so the header/footer always render. (This also lets
  // the design fixtures render without a live database.)
  const cities = await getCategories().catch(() => FALLBACK_CITIES);
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} ${newsreader.variable} h-full antialiased`}
    >
      <head>
        {/* suppressHydrationWarning: browsers clear the nonce attribute from
            the DOM after use, so it hydrates as empty — a benign mismatch. */}
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_INIT }}
        />
      </head>
      {/* .publication-page is the prototype's page surface (newsprint bg,
          ink, night-mode variable swap); the ribbon sits below the header
          exactly as in redesign/vapornet/index.html. */}
      <body className="publication-page relative flex min-h-full flex-col">
        <GlobalNav cities={cities} />
        <LiveRibbon />
        <div className="flex-1">{children}</div>
        {/* Global "Choose your home view" band — rendered site-wide (above the
            footer) so every page carries the seven-cities navigation, not just
            the homepage. */}
        <section className="cities-band" aria-labelledby="cities-title">
          <div>
            <span className="section-kicker">Seven cities, one region</span>
            <h2 id="cities-title">Choose your home view</h2>
          </div>
          <CityBento cities={cities} />
        </section>
        <Footer />
        <ConsentChip />
        <ConsentCenter />
      </body>
    </html>
  );
}
