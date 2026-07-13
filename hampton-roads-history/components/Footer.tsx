import Link from "next/link";
import type { City } from "@/lib/supabase/types";

export function Footer({ cities }: { cities: City[] }) {
  return (
    <footer className="border-t border-line mt-16 py-14 text-ink-3 text-sm">
      <div className="wrap grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2">
          <div className="font-display font-extrabold text-base text-ink mb-3">
            Hampton Roads <span className="text-accent">History</span>
          </div>
          <p className="max-w-[36ch]">
            A warm, deeply reported look at four centuries of life across
            Hampton, Newport News, Norfolk, Virginia Beach, Chesapeake,
            Portsmouth, and Suffolk.
          </p>
        </div>
        <div>
          <h5 className="text-ink-2 font-semibold mb-3 text-xs uppercase tracking-wide">Cities</h5>
          <div className="flex flex-col gap-2">
            {cities.map((c) => (
              <Link key={c.id} href={`/${c.slug}`} className="hover:text-ink">
                {c.name}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h5 className="text-ink-2 font-semibold mb-3 text-xs uppercase tracking-wide">More</h5>
          <div className="flex flex-col gap-2">
            <Link href="/advertise" className="hover:text-ink">Advertise</Link>
            <Link href="/account" className="hover:text-ink">My account</Link>
            <Link href="/watch" className="hover:text-ink">Saved stories</Link>
            <Link href="/rss.xml" className="hover:text-ink">RSS</Link>
          </div>
        </div>
        <div>
          <h5 className="text-ink-2 font-semibold mb-3 text-xs uppercase tracking-wide">About</h5>
          <div className="flex flex-col gap-2">
            <Link href="/about" className="hover:text-ink">About &amp; masthead</Link>
            <Link href="/terms" className="hover:text-ink">Terms</Link>
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            <Link href="/ad-choices" className="hover:text-ink">Ad choices</Link>
          </div>
        </div>
      </div>
      <div className="wrap mt-10 pt-6 border-t border-line text-xs">
        © {new Date().getFullYear()} Hampton Roads History · A Mid-Atlantic Labs property
      </div>
    </footer>
  );
}
