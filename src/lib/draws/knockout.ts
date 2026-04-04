import type { DrawPlayer, GeneratedDraw } from "./types";

export function generateKnockoutDraw(players: DrawPlayer[]): GeneratedDraw {
  const seeded = players.filter(p => p.seed != null).sort((a, b) => (a.seed ?? 0) - (b.seed ?? 0));
  const unseeded = players.filter(p => p.seed == null).sort(() => Math.random() - 0.5);
  const allPlayers = [...seeded, ...unseeded];

  const n = allPlayers.length;
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(n)));
  const rounds = Math.log2(bracketSize);

  const positions = generateSeededPositions(bracketSize);

  const bracket: (DrawPlayer | null)[] = new Array(bracketSize).fill(null);
  allPlayers.forEach((player, i) => {
    bracket[positions[i]] = player;
  });

  const matches: GeneratedDraw["matches"] = [];
  for (let i = 0; i < bracketSize / 2; i++) {
    const p1 = bracket[i * 2];
    const p2 = bracket[i * 2 + 1];
    matches.push({
      id: `r1-m${i + 1}`,
      round: 1,
      matchNumber: i + 1,
      player1: p1 ? { id: p1.id, name: p1.name } : null,
      player2: p2 ? { id: p2.id, name: p2.name } : null,
      stage: "main",
    });
  }

  let matchesInRound = bracketSize / 4;
  for (let round = 2; round <= rounds; round++) {
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        id: `r${round}-m${i + 1}`,
        round,
        matchNumber: i + 1,
        player1: null,
        player2: null,
        stage: "main",
      });
    }
    matchesInRound = Math.floor(matchesInRound / 2);
  }

  return { matches, rounds };
}

function generateSeededPositions(size: number): number[] {
  if (size === 2) return [0, 1];
  const half = generateSeededPositions(size / 2);
  const result: number[] = [];
  for (const pos of half) {
    result.push(pos * 2);
    result.push(size - 1 - pos * 2);
  }
  return result;
}
