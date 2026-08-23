import type { EdgeId, GameState } from "@/features/game/types/game.types";

export const isMoveValid = (state: GameState, edgeId: string): boolean =>
    state.edges[edgeId]?.owner === null;

export const getValidMoves = (state: GameState): EdgeId[] =>
    Object.values(state.edges)
        .filter((edge) => edge.owner === null)
        .map((edge) => edge.id);
