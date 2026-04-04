export interface DrawPlayer {
  id: string;
  name: string;
  seed?: number;
}

export interface DrawMatch {
  id: string;
  round: number;
  matchNumber: number;
  player1: { id: string; name: string } | null;
  player2: { id: string; name: string } | null;
  stage?: "main" | "losers-bracket" | "playoff" | string;
}

export interface GeneratedDraw {
  matches: DrawMatch[];
  rounds: number;
}
