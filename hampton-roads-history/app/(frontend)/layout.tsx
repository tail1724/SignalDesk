import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";
import "../globals.css";
import { GlobalNav } from "@/components/GlobalNav";
import { LiveRibbon } from "@/components/editorial/LiveRibbon";
import { Footer } from "@/components/Footer";
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
  const cities = await getCategories();
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
      <body className="min-h-full flex flex-col bg-base text-ink">
        <LiveRibbon />
        <GlobalNav cities={cities} />
        <div className="flex-1">{children}</div>
        <Footer cities={cities} />
      </body>
    </html>
  );
}
