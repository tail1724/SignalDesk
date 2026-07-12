import type { Metadata } from "next";
import { Archivo, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { GlobalNav } from "@/components/GlobalNav";
import { BreakingBanner } from "@/components/BreakingBanner";
import { Footer } from "@/components/Footer";
import { getCategories } from "@/lib/data";

const archivo = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// The root layout fetches hr_categories on every render, so the whole app
// must be dynamic rather than prerendered (see note in app/page.tsx about
// this sandbox's Supabase egress restriction).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hampton Roads History — Seven Cities, Four Centuries",
  description:
    "Warm, deeply reported local history for Hampton, Newport News, Norfolk, Virginia Beach, Chesapeake, Portsmouth, and Suffolk.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cities = await getCategories();

  return (
    <html
      lang="en"
      className={`${archivo.variable} ${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-base text-ink">
        <BreakingBanner />
        <GlobalNav cities={cities} />
        <div className="flex-1">{children}</div>
        <Footer cities={cities} />
      </body>
    </html>
  );
}
