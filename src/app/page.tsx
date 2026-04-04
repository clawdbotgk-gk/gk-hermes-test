import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4">
      <section className="py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Table Tennis Tournament Manager
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Create, manage, and run table tennis tournaments with ease.
          Knockout, round-robin, double elimination, and group stages.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/new">
            <Button size="lg">Create Tournament</Button>
          </Link>
          <Link href="/tournaments">
            <Button size="lg" variant="outline">View Tournaments</Button>
          </Link>
        </div>
      </section>

      <section className="py-12 border-t">
        <h2 className="text-2xl font-bold text-center mb-8">Features</h2>
        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
          <div className="p-6 border rounded-lg text-center">
            <div className="text-3xl mb-2">🏓</div>
            <h3 className="font-semibold mb-1">4 Formats</h3>
            <p className="text-sm text-muted-foreground">Knockout, Round Robin, Double Knockout, Groups + Knockout</p>
          </div>
          <div className="p-6 border rounded-lg text-center">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-semibold mb-1">Live Scoring</h3>
            <p className="text-sm text-muted-foreground">Submit scores game-by-game from any device</p>
          </div>
          <div className="p-6 border rounded-lg text-center">
            <div className="text-3xl mb-2">📱</div>
            <h3 className="font-semibold mb-1">Mobile First</h3>
            <p className="text-sm text-muted-foreground">Score matches table-side from your phone</p>
          </div>
        </div>
      </section>
    </div>
  );
}
