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
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
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

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const syncHeader = () => {
      const height = Math.ceil(header.getBoundingClientRect().height);
      document.documentElement.style.setProperty("--sticky-header-height", `${height}px`);
      setScrolled(window.scrollY > 24);
    };

    syncHeader();
    const resizeObserver = new ResizeObserver(syncHeader);
    resizeObserver.observe(header);
    window.addEventListener("scroll", syncHeader, { passive: true });
    window.addEventListener("resize", syncHeader);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", syncHeader);
      window.removeEventListener("resize", syncHeader);
      document.documentElement.style.removeProperty("--sticky-header-height");
    };
  }, []);

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
    <header
      ref={headerRef}
      className={`${isHome ? "news-header" : "news-header compact-header"}${scrolled ? " is-stuck" : ""}`}
    >
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

      {/* Sections drawer — VaporNet-styled panel (see .sections-drawer in globals.css). */}
      <dialog
        ref={drawerRef}
        onClose={() => setDrawerOpen(false)}
        onClick={(e) => {
          if (e.target === drawerRef.current) setDrawerOpen(false);
        }}
        className="sections-drawer"
        aria-label="Sections menu"
      >
        <div className="drawer-inner">
          <div className="drawer-top">
            <span className="drawer-kicker">Sections</span>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                className="drawer-close"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close sections menu"
              >
                ×
              </button>
            </div>
          </div>
          <nav className="drawer-nav" aria-label="All sections">
            {sections.map((s, i) => (
              <Link
                key={s.href}
                href={s.href}
                onClick={() => setDrawerOpen(false)}
                aria-current={pathname === s.href ? "page" : undefined}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                {s.label}
              </Link>
            ))}
          </nav>
          <nav className="drawer-utility" aria-label="More from Hampton Roads">
            <Link href="/search" onClick={() => setDrawerOpen(false)}>
              Search the archive
            </Link>
            <Link href="/newsletter" onClick={() => setDrawerOpen(false)}>
              The Morning Tide newsletter
            </Link>
            <Link href="/about" onClick={() => setDrawerOpen(false)}>
              About the publication
            </Link>
            <Link href="/editorial-standards" onClick={() => setDrawerOpen(false)}>
              Editorial standards
            </Link>
          </nav>
          <div className="drawer-foot">
            <span>Hampton Roads</span>
            <span>America begins at the water</span>
          </div>
        </div>
      </dialog>
    </header>
  );
}
