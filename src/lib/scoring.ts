export interface Standing {
  playerId: string;
  playerName: string;
  played: number;
  won: number;
  lost: number;
  gamesWon: number;
  gamesLost: number;
  points: number;
}

export function calculateStandings(
  matches: Array<{
    player1: { playerId: string; player: { name: string } } | null;
    player2: { playerId: string; player: { name: string } } | null;
    status: string;
    winnerId: string | null;
    winnerScore: number | null;
    loserScore: number | null;
  }>
): Standing[] {
  const standings: Map<string, Standing> = new Map();

  matches.forEach(match => {
    if (match.status !== "completed") return;
    if (!match.player1 || !match.player2) return;

    [match.player1, match.player2].forEach(p => {
      if (!p?.player) return;
      const id = p.playerId;
      if (!standings.has(id)) {
        standings.set(id, {
          playerId: id,
          playerName: p.player.name,
          played: 0,
          won: 0,
          lost: 0,
          gamesWon: 0,
          gamesLost: 0,
          points: 0,
        });
      }
    });

    const s1 = standings.get(match.player1.playerId)!;
    const s2 = standings.get(match.player2.playerId)!;

    s1.played++;
    s2.played++;
    s1.gamesWon += match.winnerScore ?? 0;
    s2.gamesWon += match.loserScore ?? 0;
    s1.gamesLost += match.loserScore ?? 0;
    s2.gamesLost += match.winnerScore ?? 0;

    if (match.winnerId === match.player1.playerId) {
      s1.won++;
      s2.lost++;
      s1.points += 2;
    } else {
      s2.won++;
      s1.lost++;
      s2.points += 2;
    }
  });

  return Array.from(standings.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const aDiff = a.gamesWon - a.gamesLost;
    const bDiff = b.gamesWon - b.gamesLost;
    if (bDiff !== aDiff) return bDiff - aDiff;
    return b.gamesWon - a.gamesWon;
  });
}
