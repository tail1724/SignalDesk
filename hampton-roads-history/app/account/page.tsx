import { AuthForm } from "@/components/auth/AuthForm";
import { UserWatchlist } from "@/components/auth/UserWatchlist";
import { UserMenu } from "@/components/auth/UserMenu";

export default function AccountPage() {
  return (
    <main className="wrap py-16 max-w-2xl">
      <div className="mb-12">
        <UserMenu />
      </div>

      <div className="grid gap-16 md:grid-cols-2">
        <section>
          <h2 className="font-display font-black text-2xl mb-6">Sign in or join</h2>
          <p className="text-ink-2 mb-6">
            Free accounts let you save stories and follow the cities you care about most.
          </p>
          <AuthForm />
        </section>

        <section>
          <h2 className="font-display font-black text-2xl mb-6">Your reading list</h2>
          <UserWatchlist />
        </section>
      </div>
    </main>
  );
}
