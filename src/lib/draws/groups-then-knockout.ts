import type { DrawPlayer, GeneratedDraw } from "./types";
import { generateRoundRobinDraw } from "./round-robin";
import { generateKnockoutDraw } from "./knockout";

export function generateGroupsThenKnockoutDraw(
  players: DrawPlayer[],
  options: { numGroups?: number; advancePerGroup?: number } = {}
): GeneratedDraw {
  const numGroups = options.numGroups || Math.max(2, Math.ceil(players.length / 4));
  const advancePerGroup = options.advancePerGroup || 2;

  const groups: { name: string; players: DrawPlayer[] }[] = [];
  const groupNames = ["A", "B", "C", "D", "E", "F", "G", "H"];
  
  const sorted = [...players].sort((a, b) => (a.seed ?? 0) - (b.seed ?? 0));
  
  for (let i = 0; i < numGroups; i++) {
    groups.push({ name: `Group ${groupNames[i]}`, players: [] });
  }

  sorted.forEach((player, index) => {
    const groupIndex = index % numGroups;
    const targetGroup = groupIndex % 2 === 0 ? groupIndex : numGroups - 1 - groupIndex;
    groups[targetGroup].players.push(player);
  });

  const matches: GeneratedDraw["matches"] = [];

  groups.forEach(group => {
    if (group.players.length < 2) return;
    const groupDraw = generateRoundRobinDraw(group.players);
    groupDraw.matches.forEach(m => {
      matches.push({
        ...m,
        id: `${group.name}-${m.id}`,
        stage: group.name,
      });
    });
  });

  const knockoutPlayers = numGroups * advancePerGroup;
  if (knockoutPlayers >= 2) {
    const knockoutDraw = generateKnockoutDraw(
      Array(knockoutPlayers).fill(null).map((_, i) => ({
        id: `ko-slot-${i}`,
        name: `TBD`,
      }))
    );
    knockoutDraw.matches.forEach(m => {
      matches.push({
        ...m,
        id: `ko-${m.id}`,
        stage: "knockout",
      });
    });
  }

  return { matches, rounds: 0 };
}
