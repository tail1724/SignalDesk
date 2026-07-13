import { WatchlistWidget } from "@/components/rail/WatchlistWidget";

export default function WatchPage() {
  return (
    <main className="wrap py-16 max-w-md">
      <h1 className="font-display font-black text-2xl mb-6">Your saved stories</h1>
      <WatchlistWidget />
    </main>
  );
}
