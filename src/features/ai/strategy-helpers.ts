import { boxEdges } from "@/features/game/engine/board-factory";
import type { EdgeId, GameState } from "@/features/game/types/game.types";

export type Rng = () => number;

export const pickRandom = <T>(items: T[], rng: Rng): T | null => {
    if (items.length === 0) return null;
    const index = Math.floor(rng() * items.length);
    return items[Math.min(Math.max(index, 0), items.length - 1)] ?? null;
};

/** True when claiming `edgeId` would hand some adjacent box its penultimate side (leaving 1 side remaining). */
export const givesAwayBox = (state: GameState, edgeId: EdgeId): boolean => {
    for (const box of Object.values(state.boxes)) {
        if (box.owner !== null) continue;
        const sides = boxEdges(box);
        if (!sides.includes(edgeId)) continue;
        const claimedSides = sides.filter(
            (id) => id !== edgeId && state.edges[id]?.owner !== null,
        ).length;
        if (claimedSides === sides.length - 2) {
            return true;
        }
    }
    return false;
};

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
                sides.filter((id) => edges[id]?.owner !== null).length ===
                sides.length - 1
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
