import { boxEdges } from "@/features/game/engine/board-factory";
import type { EdgeId, GameState } from "@/features/game/types/game.types";

type EdgesAndBoxes = Pick<GameState, "edges" | "boxes">;

const isClaimed = (edges: EdgesAndBoxes["edges"], edgeId: EdgeId): boolean =>
    edges[edgeId]?.owner !== null && edges[edgeId] !== undefined;

export const detectCompletedBoxes = (
    state: EdgesAndBoxes,
    edgeId: EdgeId,
): string[] => {
    if (!state.edges[edgeId]) return [];
    const completed: string[] = [];

    for (const [key, box] of Object.entries(state.boxes)) {
        if (box.owner !== null) continue;
        const sides = boxEdges(box);
        if (sides.includes(edgeId)) {
            const isComplete = sides.every(
                (id) => id === edgeId || isClaimed(state.edges, id),
            );
            if (isComplete) {
                completed.push(key);
            }
        }
    }

    return completed;
};
