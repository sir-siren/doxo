import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { applyMove, createGame, isMoveValid } from "@/features/game/engine";
import type {
    BoardDimensions,
    EdgeId,
    GameState,
    Player,
} from "@/features/game/types/game.types";

export const MAX_UNDO_HISTORY = 120;

export interface StartGameConfig {
    dimensions: BoardDimensions;
    players: [Player, Player];
}

export interface GameSliceState {
    current: GameState | null;
    past: GameState[];
    future: GameState[];
    paused: boolean;
}

export const initialGameState: GameSliceState = {
    current: null,
    past: [],
    future: [],
    paused: false,
};

const isAiGame = (game: GameState): boolean =>
    game.players.some((player) => player.kind === "ai");

const pushBounded = (history: GameState[], entry: GameState): GameState[] => {
    const next = [...history, entry];
    return next.length > MAX_UNDO_HISTORY ? next.slice(1) : next;
};

const undoRestoreIndex = (current: GameState, past: GameState[]): number => {
    let index = past.length - 1;
    if (!isAiGame(current)) return index;

    const humanIds = new Set(
        current.players.filter((p) => p.kind === "human").map((p) => p.id),
    );
    // Walk back until the restored position has a human player to move.
    while (index > 0) {
        const candidate = past[index];
        if (candidate !== undefined && humanIds.has(candidate.currentPlayer))
            break;
        index -= 1;
    }
    return index;
};

const gameSlice = createSlice({
    name: "game",
    initialState: initialGameState,
    reducers: {
        startGame(
            _state,
            action: PayloadAction<StartGameConfig>,
        ): GameSliceState {
            const { dimensions, players } = action.payload;
            return {
                current: createGame(dimensions, players),
                past: [],
                future: [],
                paused: false,
            };
        },
        makeMove(state, action: PayloadAction<EdgeId>): GameSliceState {
            const game = state.current;
            if (
                game === null ||
                state.paused ||
                game.status !== "playing" ||
                !isMoveValid(game, action.payload)
            ) {
                return state;
            }
            const result = applyMove(game, {
                edgeId: action.payload,
                player: game.currentPlayer,
            });
            return {
                ...state,
                past: pushBounded(state.past, game),
                future: [],
                current: result.state,
            };
        },
        undo(state): GameSliceState {
            const game = state.current;
            if (game === null || state.past.length === 0) return state;

            const index = undoRestoreIndex(game, state.past);
            const restored = state.past[index];
            if (restored === undefined) return state;

            const dropped = [...state.past.slice(index + 1), game];
            return {
                ...state,
                future: [...dropped.toReversed(), ...state.future],
                past: state.past.slice(0, index),
                current: restored,
                paused: false,
            };
        },
        redo(state): GameSliceState {
            const next = state.future[0];
            if (state.current === null || next === undefined) return state;
            return {
                ...state,
                past: pushBounded(state.past, state.current),
                future: state.future.slice(1),
                current: next,
            };
        },
        pauseGame(state): GameSliceState {
            if (state.current?.status !== "playing") return state;
            return { ...state, paused: true };
        },
        resumeGame(state): GameSliceState {
            return { ...state, paused: false };
        },
    },
});

export const { startGame, makeMove, undo, redo, pauseGame, resumeGame } =
    gameSlice.actions;

export default gameSlice.reducer;
