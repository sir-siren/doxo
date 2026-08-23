import { boxEdges } from "@/features/game/engine/board-factory";
import type { EdgeId, GameState } from "@/features/game/types/game.types";

export type Rng = () => number;

export const pickRandom = <T>(items: T[], rng: Rng): T | null => {
    if (items.length === 0) return null;
    const index = Math.floor(rng() * items.length);
    return items[Math.min(Math.max(index, 0), items.length - 1)] ?? null;
};

const neighborBoxes = (
    state: GameState,
    edgeId: EdgeId,
): Array<{ row: number; col: number }> => {
    const edge = state.edges[edgeId];
    if (!edge) return [];
    return edge.orientation === "horizontal"
        ? [
              { row: edge.row - 1, col: edge.col },
              { row: edge.row, col: edge.col },
          ]
        : [
              { row: edge.row, col: edge.col - 1 },
              { row: edge.row, col: edge.col },
          ];
};

/** True when claiming `edgeId` would hand some adjacent box its third side. */
export const givesAwayBox = (state: GameState, edgeId: EdgeId): boolean =>
    neighborBoxes(state, edgeId).some((box) => {
        const known = state.boxes[`${box.row}-${box.col}`];
        if (!known) return false;
        const claimedSides = boxEdges(known).filter(
            (id) => id !== edgeId && state.edges[id]?.owner !== null,
        ).length;
        return claimedSides === 2;
    });

/** Boxes the opponent could greedily take after this move is played. */
export const boxesGivenAwayAfter = (
    state: GameState,
    edgeId: EdgeId,
): number => {
    const edges = {
        ...state.edges,
        [edgeId]: { ...state.edges[edgeId], owner: "p1" as const },
    };
    let taken = 0;
    let changed = true;
    const takenKeys = new Set<string>();
    while (changed) {
        changed = false;
        for (const [key, box] of Object.entries(state.boxes)) {
            if (box.owner !== null || takenKeys.has(key)) continue;
            const sides = boxEdges(box);
            if (sides.every((id) => edges[id]?.owner !== null)) {
                taken += 1;
                takenKeys.add(key);
                changed = true;
            } else if (
                sides.filter((id) => edges[id]?.owner !== null).length === 3
            ) {
                const missing = sides.find((id) => edges[id]?.owner === null);
                if (missing !== undefined) {
                    edges[missing] = { ...edges[missing], owner: "p1" };
                    changed = true;
                }
            }
        }
    }
    return taken;
};
