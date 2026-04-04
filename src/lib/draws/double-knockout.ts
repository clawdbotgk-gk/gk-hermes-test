import type { DrawPlayer, GeneratedDraw } from "./types";
import { generateKnockoutDraw } from "./knockout";

export function generateDoubleKnockoutDraw(players: DrawPlayer[]): GeneratedDraw {
  const winnersBracket = generateKnockoutDraw(players);
  const matches: GeneratedDraw["matches"] = [];

  winnersBracket.matches.forEach(m => {
    matches.push({ ...m, stage: "main" });
  });

  const totalWinnersRounds = winnersBracket.rounds;
  
  for (let round = 1; round < totalWinnersRounds; round++) {
    const winnersMatches = winnersBracket.matches.filter(m => m.round === round);
    const losersMatchesCount = Math.max(1, winnersMatches.length - 1);
    
    for (let i = 0; i < losersMatchesCount; i++) {
      matches.push({
        id: `lb-r${round}-m${i + 1}`,
        round,
        matchNumber: i + 1,
        player1: null,
        player2: null,
        stage: "losers-bracket",
      });
    }
  }

  matches.push({
    id: "grand-final",
    round: totalWinnersRounds + 1,
    matchNumber: 1,
    player1: null,
    player2: null,
    stage: "playoff",
  });

  matches.push({
    id: "grand-final-2",
    round: totalWinnersRounds + 1,
    matchNumber: 2,
    player1: null,
    player2: null,
    stage: "playoff",
  });

  return { matches, rounds: totalWinnersRounds + 1 };
}
