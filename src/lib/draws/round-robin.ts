import type { DrawPlayer, GeneratedDraw } from "./types";

export function generateRoundRobinDraw(players: DrawPlayer[]): GeneratedDraw {
  const n = players.length;
  if (n < 2) throw new Error("Need at least 2 players");

  const isOdd = n % 2 !== 0;
  const playerList = isOdd ? [...players, { id: "BYE", name: "BYE" }] : [...players];
  const size = playerList.length;
  const rounds = size - 1;
  const matchesPerRound = size / 2;

  const matches: GeneratedDraw["matches"] = [];
  const rotating = playerList.slice(1);

  for (let round = 0; round < rounds; round++) {
    const list = [playerList[0], ...rotating];

    for (let match = 0; match < matchesPerRound; match++) {
      const p1 = list[match];
      const p2 = list[size - 1 - match];
      if (p1.id === "BYE" || p2.id === "BYE") continue;

      matches.push({
        id: `r${round + 1}-m${match + 1}`,
        round: round + 1,
        matchNumber: match + 1,
        player1: { id: p1.id, name: p1.name },
        player2: { id: p2.id, name: p2.name },
        stage: "main",
      });
    }

    rotating.push(rotating.shift()!);
  }

  return { matches, rounds };
}
