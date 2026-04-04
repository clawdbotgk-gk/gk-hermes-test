"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Match {
  id: string; round: number; matchNumber: number; stage: string; status: string; bestOf: number;
  player1: { player: { name: string } } | null;
  player2: { player: { name: string } } | null;
  gameScores: { gameNumber: number; player1Score: number; player2Score: number }[];
}

export default function MatchScorePage({ params }: { params: { id: string; matchId: string } }) {
  const [match, setMatch] = useState<Match | null>(null);
  const [games, setGames] = useState<{ p1: string; p2: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/tournaments/${params.id}/matches/${params.matchId}`)
      .then(r => r.json())
      .then(data => setMatch(data));
  }, [params.id, params.matchId]);

  function addGame() { setGames(prev => [...prev, { p1: "", p2: "" }]); }
  function updateGame(i: number, key: "p1" | "p2", val: string) {
    const updated = [...games];
    updated[i] = { ...updated[i], [key]: val };
    setGames(updated);
  }
  function removeGame(i: number) { setGames(prev => prev.filter((_, idx) => idx !== i)); }

  async function submitScore() {
    if (!match) return;
    const parsed = games.filter(g => g.p1 !== "" && g.p2 !== "").map((g, i) => ({
      gameNumber: i + 1, player1Score: parseInt(g.p1), player2Score: parseInt(g.p2),
    }));
    if (parsed.length === 0) return;
    if (parsed.some(g => isNaN(g.player1Score) || isNaN(g.player2Score))) { alert("Enter valid scores"); return; }

    setSubmitting(true);
    await fetch(`/api/tournaments/${params.id}/matches/${params.matchId}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameScores: parsed }),
    });
    router.push(`/tournaments/${params.id}`);
  }

  if (!match) return <PageContainer><p>Loading match...</p></PageContainer>;

  return (
    <PageContainer title="Enter Match Score">
      <Card className="max-w-md p-6 mx-auto">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">Round {match.round} Match {match.matchNumber}</span>
          <Badge variant="secondary">{match.status}</Badge>
        </div>

        <div className="text-center mb-6">
          <p className="text-xl font-semibold">{match.player1?.player?.name || "TBD"}</p>
          <p className="text-sm text-muted-foreground">vs</p>
          <p className="text-xl font-semibold">{match.player2?.player?.name || "TBD"}</p>
          <p className="text-xs text-muted-foreground mt-1">Best of {match.bestOf}</p>
        </div>

        {games.map((game, i) => (
          <div key={i} className="flex items-center gap-3 mb-3">
            <span className="text-sm text-muted-foreground w-16">Game {i + 1}</span>
            <div className="flex items-center gap-1 flex-1">
              {(["p1", "p2"] as const).map(side => (
                <div key={side} className="flex items-center gap-1">
                  <button onClick={() => updateGame(i, side, String(Math.max(0, parseInt(games[i][side] || "0") - 1)))}
                    className="w-10 h-10 rounded-lg border text-lg font-bold active:scale-95 hover:bg-accent">-</button>
                  <span className="w-10 text-center text-xl font-bold">{game[side] || "0"}</span>
                  <button onClick={() => updateGame(i, side, String(parseInt(games[i][side] || "0") + 1))}
                    className="w-10 h-10 rounded-lg border text-lg font-bold active:scale-95 hover:bg-accent">+</button>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={() => removeGame(i)}>x</Button>
          </div>
        ))}

        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={addGame} className="flex-1">+ Add Game</Button>
          <Button onClick={submitScore} disabled={submitting || games.length === 0} className="flex-1">
            {submitting ? "Submitting..." : "Submit Score"}
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
}
