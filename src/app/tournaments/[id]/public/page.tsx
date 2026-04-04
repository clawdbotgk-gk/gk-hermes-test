"use client";

import { useEffect, useState } from "react";

interface Match {
  id: string; round: number; matchNumber: number; stage: string; status: string;
  player1: { player: { name: string } } | null;
  player2: { player: { name: string } } | null;
  winnerScore: number | null; loserScore: number | null;
}

export default function PublicView({ params }: { params: { id: string } }) {
  const [tournament, setTournament] = useState<any>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tournaments/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setTournament(data);
        setMatches(data.matches || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/tournaments/${params.id}`)
        .then(r => r.json())
        .then(data => { if (data.matches) setMatches(data.matches); });
    }, 5000);
    return () => clearInterval(interval);
  }, [params.id]);

  if (loading || !tournament) return <div className="p-8 text-center">Loading...</div>;

  const live = matches.filter(m => m.status === "in-progress" || m.status === "scheduled");
  const completed = matches.filter(m => m.status === "completed");

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">{tournament.name}</h1>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-muted-foreground">Live Results</span>
        </div>
      </div>

      {live.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Live / Upcoming</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {live.map(m => (
              <div key={m.id} className="p-4 border rounded-lg bg-white shadow-sm">
                <div className="flex justify-between items-center font-medium">
                  <span>{m.player1?.player?.name || "TBD"}</span>
                  <span className="text-muted-foreground text-sm">vs</span>
                  <span>{m.player2?.player?.name || "TBD"}</span>
                </div>
                {m.stage !== "main" && <Badge variant="outline" className="mt-2 text-xs">{m.stage}</Badge>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-4">Results</h2>
        <div className="space-y-2">
          {completed.map(m => (
            <div key={m.id} className="flex justify-between items-center p-3 bg-white border rounded-lg">
              <span className="text-sm text-muted-foreground">R{m.round} M{m.matchNumber}{m.stage !== "main" ? ` (${m.stage})` : ""}</span>
              <div className="flex items-center gap-4">
                <span className={m.player1?.player?.name ? (m.winnerScore !== null && m.winnerScore > (m.loserScore ?? 0) ? "font-semibold" : "") : ""}>
                  {m.player1?.player?.name || "TBD"}
                </span>
                <span className="font-bold text-lg">
                  {m.winnerScore ?? "-"} - {m.loserScore ?? "-"}
                </span>
                <span className={m.player2?.player?.name ? "font-semibold" : ""}>
                  {m.player2?.player?.name || "TBD"}
                </span>
              </div>
            </div>
          ))}
          {completed.length === 0 && <p className="text-muted-foreground">No results yet</p>}
        </div>
      </section>
    </div>
  );
}

function Badge({ children, variant }: { children: React.ReactNode; variant?: string }) {
  return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100">{children}</span>;
}
