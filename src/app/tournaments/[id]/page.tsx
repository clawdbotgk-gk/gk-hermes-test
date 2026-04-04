"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface Player { id: string; name: string; email?: string; seed?: number; }
interface Match {
  id: string; round: number; matchNumber: number; stage: string; status: string;
  player1Id: string | null; player2Id: string | null;
  player1: { player: { name: string } } | null;
  player2: { player: { name: string } } | null;
  winnerScore: number | null; loserScore: number | null;
}
interface Tournament {
  id: string; name: string; description: string | null; type: string;
  status: string; maxPlayers: number | null;
  players: Player[]; matches: Match[];
}

export default function TournamentDetailPage() {
  const params = useParams<{ id: string }>();
  const tournamentId = params?.id;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [playerName, setPlayerName] = useState("");

  useEffect(() => {
    if (!tournamentId) return;
    fetch(`/api/tournaments/${tournamentId}`)
      .then(r => r.json())
      .then(data => { setTournament(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tournamentId]);

  async function addPlayer() {
    if (!playerName.trim() || !tournament) return;
    await fetch(`/api/tournaments/${tournament.id}/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: playerName.trim() }),
    });
    setPlayerName("");
    refreshTournament();
  }

  async function generateDrawAction() {
    if (!tournament) return;
    await fetch(`/api/tournaments/${tournament.id}/draw`, { method: "POST" });
    refreshTournament();
  }
  async function refreshTournament() {
    const data = await fetch(`/api/tournaments/${tournamentId}`).then(r => r.json());
    setTournament(data);
  }

  if (loading) return <PageContainer><p>Loading...</p></PageContainer>;
  if (!tournament) return <PageContainer><p>Tournament not found</p></PageContainer>;

  const rounds = Array.from(new Set(tournament.matches.map(m => m.round))).sort((a, b) => a - b);

  return (
    <PageContainer title={tournament.name} description={tournament.description || undefined}>
      <div className="flex items-center gap-3 mb-6">
        <Badge variant="secondary" className="text-sm">{tournament.status}</Badge>
        <Badge variant="outline" className="text-sm">{tournament.type}</Badge>
        <span className="text-sm text-muted-foreground">{tournament.players.length} players</span>
        <Link href={`/tournaments/${tournamentId}/public`}>
          <Button variant="outline" size="sm">Public View</Button>
        </Link>
      </div>

      {tournament.status === "draft" && (
        <div className="mb-6 p-4 border rounded-lg space-y-3">
          <h3 className="font-semibold">Add Players</h3>
          <div className="flex gap-2">
            <Input placeholder="Player name" value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addPlayer()} />
            <Button onClick={addPlayer}>Add</Button>
          </div>
          <Button onClick={generateDrawAction} disabled={tournament.players.length < 2} variant="default">
            Generate Draw and Start Tournament
          </Button>
        </div>
      )}

      {tournament.players.length > 0 && (
        <Tabs defaultValue="bracket" className="mt-6">
          <TabsList>
            <TabsTrigger value="bracket">Bracket</TabsTrigger>
            <TabsTrigger value="players">Players ({tournament.players.length})</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="bracket" className="mt-4">
            {tournament.matches.length === 0 ? (
              <p className="text-muted-foreground">No matches yet. Generate a draw to get started.</p>
            ) : (
              <div className="overflow-x-auto">
                <div className="flex gap-4 min-w-max">
                  {rounds.map(round => (
                    <div key={round} className="flex flex-col gap-2">
                      <h3 className="text-sm font-semibold text-center mb-2">
                        {round <= 4 ? ["Round of " + (16 / Math.pow(2, round - 1)), "Quarter-finals", "Semi-finals", "Final"][Math.min(round - 1, 3)] : `Round ${round}`}
                      </h3>
                      {tournament.matches.filter(m => m.round === round).map(match => (
                        <Card key={match.id} className="w-64 p-3">
                          <div className="space-y-2">
                            <div className={`flex justify-between items-center py-1 ${match.winnerScore !== null && match.player1?.player?.name ? "font-semibold text-green-700" : ""}`}>
                              <span>{match.player1?.player?.name || "TBD"}</span>
                            </div>
                            <div className="h-px bg-border" />
                            <div className={`flex justify-between items-center py-1 ${match.winnerScore !== null && match.player2?.player?.name ? "font-semibold text-green-700" : ""}`}>
                              <span>{match.player2?.player?.name || "TBD"}</span>
                            </div>
                          </div>
                          {match.status === "completed" && match.winnerScore != null && (
                            <div className="text-center text-xs text-muted-foreground mt-2">
                              {match.winnerScore} - {match.loserScore}
                            </div>
                          )}
                          {match.player1 && match.player2 && match.status !== "completed" && (
                            <Link href={`/tournaments/${tournamentId}/matches/${match.id}`} className="block mt-2">
                              <Button size="sm" className="w-full" variant="outline">Enter Score</Button>
                            </Link>
                          )}
                        </Card>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="players" className="mt-4">
            <div className="space-y-2">
              {tournament.players.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground w-6 text-right">{p.seed || i + 1}</span>
                    <span className="font-medium">{p.name}</span>
                  </div>
                  {p.email && <span className="text-sm text-muted-foreground">{p.email}</span>}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="mt-4">
            {tournament.matches.length > 0 ? (
              <div className="space-y-2">
                {tournament.matches.filter(m => m.player1 && m.player2).map(match => (
                  <div key={match.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">{match.player1?.player?.name}</span>
                      <span className="text-muted-foreground mx-2">vs</span>
                      <span className="font-medium">{match.player2?.player?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={match.status === "completed" ? "default" : "secondary"}>{match.status}</Badge>
                      {match.table && <span className="text-sm">Table {match.table}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No matches scheduled yet.</p>
            )}
          </TabsContent>
        </Tabs>
      )}

      {tournament.players.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-4">No players added yet</p>
          <p>Add players above to get started</p>
        </div>
      )}
    </PageContainer>
  );
}
