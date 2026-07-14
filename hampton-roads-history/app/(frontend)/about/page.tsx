import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — Hampton Roads History",
  description:
    "Who runs Hampton Roads History, our editorial standards, and how to reach us.",
};

export default function AboutPage() {
  return (
    <main className="reading py-16">
      <h1 className="font-display font-black text-3xl mb-8">About Hampton Roads History</h1>

      <section className="mb-10">
        <h2 className="font-display font-bold text-lg mb-3">What this is</h2>
        <p className="text-ink-2 leading-relaxed mb-4">
          Hampton Roads History is a local publication covering four
          centuries of life across Hampton, Newport News, Norfolk, Virginia
          Beach, Chesapeake, Portsmouth, and Suffolk. We report deeply
          researched stories about the people, places, and events that
          shaped this region — not just what happened, but why it still
          matters.
        </p>
        <p className="text-ink-2 leading-relaxed">
          We&apos;re an independent publication, owned and operated by Mid-Atlantic
          Labs. Our journalism is funded by advertising, including third-party
          ad partners — see our{" "}
          <Link href="/ad-choices" className="text-accent hover:underline">
            Ad Choices
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-accent hover:underline">
            privacy policy
          </Link>{" "}
          pages for how that works.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="font-display font-bold text-lg mb-3">Editorial standards</h2>
        <ul className="text-ink-2 leading-relaxed space-y-2 list-disc list-inside">
          <li>Every story is fact-checked against primary sources — archives, public records, and named interviews.</li>
          <li>We clearly label sponsored content and never let advertisers influence editorial coverage.</li>
          <li>When we get something wrong, we correct it publicly rather than quietly editing it away.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="font-display font-bold text-lg mb-3">Corrections</h2>
        <p className="text-ink-2 leading-relaxed">
          Found an error? We want to know. Email{" "}
          <a href="mailto:corrections@hamptonroadshistory.com" className="text-accent hover:underline">
            corrections@hamptonroadshistory.com
          </a>{" "}
          with the article title and what&apos;s wrong. We review every report
          and post corrections at the bottom of the affected story.
        </p>
      </section>

      <section>
        <h2 className="font-display font-bold text-lg mb-3">Contact</h2>
        <p className="text-ink-2 leading-relaxed">
          General inquiries:{" "}
          <a href="mailto:hello@hamptonroadshistory.com" className="text-accent hover:underline">
            hello@hamptonroadshistory.com
          </a>
          <br />
          Story tips:{" "}
          <a href="mailto:tips@hamptonroadshistory.com" className="text-accent hover:underline">
            tips@hamptonroadshistory.com
          </a>
          <br />
          Advertising:{" "}
          <Link href="/advertise" className="text-accent hover:underline">
            hamptonroadshistory.com/advertise
          </Link>
        </p>
      </section>
    </main>
  );
}
