import { createSelector } from "@reduxjs/toolkit";
import { getValidMoves } from "@/features/game/engine";
import type { RootState } from "@/app/store/root-reducer";
import type {
    Box,
    GameStatus,
    GameState,
    PlayerId,
} from "@/features/game/types/game.types";
import type { EdgeId } from "@/features/game/types/game.types";

export const selectGameState = (state: RootState): GameState | null =>
    state.game.current;

export const selectCurrentPlayer = createSelector(
    selectGameState,
    (game): PlayerId | null => game?.currentPlayer ?? null,
);

export const selectScores = createSelector(
    selectGameState,
    (game): Record<PlayerId, number> | null =>
        game === null ? null : { ...game.scores },
);

export const selectAvailableMoves = createSelector(
    selectGameState,
    (game): EdgeId[] => (game === null ? [] : getValidMoves(game)),
);

export const selectGameStatus = createSelector(
    selectGameState,
    (game): GameStatus => game?.status ?? "idle",
);

export const selectWinner = createSelector(
    selectGameState,
    (game): PlayerId | "draw" | null => game?.winner ?? null,
);

const PLAYER_IDS: [PlayerId, PlayerId] = ["p1", "p2"];

export const selectCompletedBoxesByPlayer = createSelector(
    selectGameState,
    (game): Record<PlayerId, string[]> => {
        const result: Record<PlayerId, string[]> = { p1: [], p2: [] };
        if (game === null) return result;
        for (const key of Object.keys(game.boxes)) {
            const box: Box | undefined = game.boxes[key];
            if (box === undefined || box.owner === null) continue;
            result[box.owner]?.push(key);
        }
        for (const id of PLAYER_IDS) {
            result[id]?.sort();
        }
        return result;
    },
);
