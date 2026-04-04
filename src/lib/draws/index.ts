import type { DrawPlayer, GeneratedDraw } from "./types";
import { generateKnockoutDraw } from "./knockout";
import { generateRoundRobinDraw } from "./round-robin";
import { generateDoubleKnockoutDraw } from "./double-knockout";
import { generateGroupsThenKnockoutDraw } from "./groups-then-knockout";

export type { DrawPlayer, GeneratedDraw };

export function generateDraw(
  type: "knockout" | "round-robin" | "double-knockout" | "groups-then-knockout",
  players: DrawPlayer[]
): GeneratedDraw {
  switch (type) {
    case "knockout":
      return generateKnockoutDraw(players);
    case "round-robin":
      return generateRoundRobinDraw(players);
    case "double-knockout":
      return generateDoubleKnockoutDraw(players);
    case "groups-then-knockout":
      return generateGroupsThenKnockoutDraw(players);
    default:
      throw new Error(`Draw generation for "${type}" not yet implemented`);
  }
}
