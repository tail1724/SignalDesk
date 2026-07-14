import { AuthForm } from "@/components/auth/AuthForm";
import { UserWatchlist } from "@/components/auth/UserWatchlist";
import { UserMenu } from "@/components/auth/UserMenu";
import { ThemeControls } from "@/components/ThemeControls";

export default function AccountPage() {
  return (
    <main className="reading py-14">
      <div className="mb-10">
        <UserMenu />
      </div>

      <div className="grid gap-12 md:grid-cols-2">
        <section>
          <h2 className="font-display font-black text-2xl mb-4">Sign in or join</h2>
          <p className="text-ink-2 mb-6">
            Free accounts let you save stories and follow the cities you care about most.
          </p>
          <AuthForm />
        </section>

        <section>
          <h2 className="font-display font-black text-2xl mb-4">Your reading list</h2>
          <UserWatchlist />
        </section>
      </div>

      <section className="mt-14 border-t border-line pt-10">
        <h2 className="font-display font-black text-2xl mb-6">Settings</h2>
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-[420px]">
            <h3 className="font-semibold text-base mb-1">Appearance</h3>
            <p className="text-ink-2 text-[14px]">
              Choose how Hampton Roads History looks. &ldquo;System&rdquo; follows your
              device setting. Saved to this browser (and to your account when
              you&rsquo;re signed in).
            </p>
          </div>
          <ThemeControls />
        </div>
      </section>
    </main>
  );
}
