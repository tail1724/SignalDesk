"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { City } from "@/lib/supabase/types";
import { OmniSearch } from "@/components/OmniSearch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdChoices } from "@/components/ads/AdChoices";

// VaporNet publication header — DOM mirrors redesign/vapornet/index.html
// (.news-header > .civic-strip + .masthead-row + .section-nav). The home
// route gets the full chrome; every other route uses the prototype's
// .compact-header treatment, exactly like the mockups.
//
// Campaign tagline: rendered per the approved reference screenshots
// (docs/vapornet-pixel-perfect-plan.md §5.1). If legal changes the
// wordmark, update the prototype and this component together.

type Weather = { tempF: number };

export function GlobalNav({ cities }: { cities: City[] }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [wx, setWx] = useState<Weather | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!isHome) return;
    fetch("/api/weather")
      .then((r) => r.json())
      .then(setWx)
      .catch(() => setWx(null));
  }, [isHome]);

  useEffect(() => {
    const el = drawerRef.current;
    if (!el) return;
    if (drawerOpen && !el.open) el.showModal();
    if (!drawerOpen && el.open) el.close();
  }, [drawerOpen]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const sections = [
    { label: "Today", href: "/" },
    ...cities.map((c) => ({ label: c.name, href: `/${c.slug}` })),
    { label: "Watch", href: "/watch" },
  ];

  return (
    <header className={isHome ? "news-header" : "news-header compact-header"}>
      {isHome && (
        <div className="civic-strip">
          <span>
            <i className="live-dot" aria-hidden /> Live desk
          </span>
          <span>{today}</span>
          <span>Hampton Roads{wx ? ` · ${wx.tempF}°` : ""}</span>
          <AdChoices label="Privacy & ad choices" />
        </div>
      )}
      <div className="masthead-row">
        <button
          className="menu-button"
          type="button"
          aria-label="Open sections menu"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
        >
          <span />
          <span />
        </button>
        <Link className="wordmark" href="/" aria-label="Hampton Roads home">
          <span>Hampton</span>
          <span>Roads</span>
          <small>America begins at the water</small>
        </Link>
        <div className="masthead-actions">
          <OmniSearch />
          <Link href="/account" className="text-button">
            Sign in
          </Link>
          <Link href="/account?join=1" className="primary-button small">
            Join free
          </Link>
        </div>
      </div>
      <nav className="section-nav" aria-label="Publication sections">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className={pathname === s.href ? "active" : undefined}>
            {s.label}
          </Link>
        ))}
      </nav>

      {/* Sections drawer — behavior only; not part of the reference shots. */}
      <dialog
        ref={drawerRef}
        onClose={() => setDrawerOpen(false)}
        onClick={(e) => {
          if (e.target === drawerRef.current) setDrawerOpen(false);
        }}
        className="m-0 h-full max-h-full w-72 max-w-[85vw] border-r border-line bg-surface-1 p-6 backdrop:bg-black/40"
        aria-label="Sections menu"
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[.14em] text-ink-3">Sections</span>
          <ThemeToggle />
        </div>
        <nav className="mt-4 flex flex-col gap-1" aria-label="All sections">
          {sections.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              onClick={() => setDrawerOpen(false)}
              className="rounded px-2 py-2 font-display text-[17px] font-bold text-ink hover:bg-surface-2"
            >
              {s.label}
            </Link>
          ))}
          <Link
            href="/search"
            onClick={() => setDrawerOpen(false)}
            className="rounded px-2 py-2 text-[13px] text-ink-2 hover:bg-surface-2"
          >
            Search the archive
          </Link>
          <Link
            href="/newsletter"
            onClick={() => setDrawerOpen(false)}
            className="rounded px-2 py-2 text-[13px] text-ink-2 hover:bg-surface-2"
          >
            Newsletter
          </Link>
        </nav>
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="mt-6 w-full rounded-full border border-line py-2 text-[12px] font-semibold text-ink-2"
        >
          Close
        </button>
      </dialog>
    </header>
  );
}
