import { beforeEach, describe, expect, it } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import {
    MAX_UNDO_HISTORY,
    makeMove,
    pauseGame,
    redo,
    resumeGame,
    startGame,
    undo,
} from "@/features/game";
import rootReducer from "@/app/store/root-reducer";
import type {
    BoardDimensions,
    GameState,
    Player,
} from "@/features/game/types/game.types";

const DIMENSIONS: BoardDimensions = { rows: 3, cols: 3 };

const PLAYERS: [Player, Player] = [
    { id: "p1", name: "Ada", kind: "human" },
    { id: "p2", name: "Bob", kind: "human" },
];

const AI_PLAYERS: [Player, Player] = [
    { id: "p1", name: "Ada", kind: "human" },
    { id: "p2", name: "Bot", kind: "ai", difficulty: "easy" },
];

const createTestStore = () =>
    configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: false,
                immutableCheck: false,
            }),
    });

const allEdgeIds = ({ rows, cols }: BoardDimensions): string[] => {
    const ids: string[] = [];
    for (let r = 0; r <= rows; r += 1) {
        for (let c = 0; c < cols; c += 1) ids.push(`H-${r}-${c}`);
    }
    for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c <= cols; c += 1) ids.push(`V-${r}-${c}`);
    }
    return ids;
};

describe("game slice", () => {
    let store: ReturnType<typeof createTestStore>;

    beforeEach(() => {
        store = createTestStore();
        store.dispatch(startGame({ dimensions: DIMENSIONS, players: PLAYERS }));
    });

    it("startGame creates a playing state with no history", () => {
        const state = store.getState().game;
        expect(state.current?.status).toBe("playing");
        expect(state.current?.currentPlayer).toBe("p1");
        expect(state.past).toHaveLength(0);
        expect(state.future).toHaveLength(0);
        expect(state.paused).toBe(false);
    });

    it("makeMove applies engine rules and records history", () => {
        const before: GameState | null = store.getState().game.current;
        store.dispatch(makeMove("H-0-0"));

        const state = store.getState().game;
        expect(state.current?.edges["H-0-0"]?.owner).toBe("p1");
        expect(state.current?.moveHistory).toHaveLength(1);
        expect(state.current?.currentPlayer).toBe("p2");
        expect(state.past).toHaveLength(1);
        expect(state.past[0]).toStrictEqual(before);
    });

    it("an invalid move is ignored entirely", () => {
        const before = store.getState().game;
        store.dispatch(makeMove("H-0-0"));
        // Same edge again: already claimed.
        store.dispatch(makeMove("H-0-0"));

        const after = store.getState().game;
        expect(after.current?.moveHistory).toHaveLength(1);
        expect(after.past).toHaveLength(1);
        expect(after).not.toBe(before);
    });

    it("completing a box keeps the turn with the scoring player", () => {
        // On a 3x3 board the box at (0,0) is closed by H-0-0, V-0-0, H-1-0, V-0-1.
        for (const edge of ["H-0-0", "V-0-0", "H-1-0"])
            store.dispatch(makeMove(edge));
        store.dispatch(makeMove("V-0-1"));

        const state = store.getState().game.current;
        // Moves alternate (no earlier scores), so p2 claims the 4th side,
        // scores the box, and keeps the turn.
        expect(state?.boxes["0-0"]?.owner).toBe("p2");
        expect(state?.scores["p2"]).toBe(1);
        expect(state?.currentPlayer).toBe("p2");
    });

    it("undo restores the exact prior state and redo replays it", () => {
        const initial = store.getState().game.current;
        store.dispatch(makeMove("H-0-0"));
        const afterMove = store.getState().game.current;

        store.dispatch(undo());
        const undone = store.getState().game;
        expect(undone.current).toStrictEqual(initial);
        expect(undone.future).toHaveLength(1);

        store.dispatch(redo());
        const redone = store.getState().game;
        expect(redone.current).toStrictEqual(afterMove);
        expect(redone.future).toHaveLength(0);
    });

    it("undo history is bounded", () => {
        const big: BoardDimensions = { rows: 8, cols: 8 };
        store.dispatch(startGame({ dimensions: big, players: PLAYERS }));
        for (const edge of allEdgeIds(big).slice(0, MAX_UNDO_HISTORY + 10)) {
            store.dispatch(makeMove(edge));
        }
        const state = store.getState().game;
        expect(state.past.length).toBeLessThanOrEqual(MAX_UNDO_HISTORY);
        expect(state.past.length).toBe(MAX_UNDO_HISTORY);
    });

    it("AI-mode undo steps back to the human player's previous turn", () => {
        store.dispatch(
            startGame({ dimensions: DIMENSIONS, players: AI_PLAYERS }),
        );
        for (const edge of ["H-0-0", "H-0-1", "H-1-0"])
            store.dispatch(makeMove(edge));

        // After three alternating moves it is p1's turn again; undo must restore
        // a position where the human (p1) is to move.
        store.dispatch(undo());
        const current = store.getState().game.current;
        expect(current?.currentPlayer).toBe("p1");
        expect((current?.moveHistory.length ?? 0) % 2).toBe(0);
    });

    it("pause/resume only toggle during an active game", () => {
        store.dispatch(pauseGame());
        expect(store.getState().game.paused).toBe(true);

        store.dispatch(makeMove("H-0-0"));
        expect(store.getState().game.current?.moveHistory).toHaveLength(0);

        store.dispatch(resumeGame());
        expect(store.getState().game.paused).toBe(false);
        store.dispatch(makeMove("H-0-0"));
        expect(store.getState().game.current?.moveHistory).toHaveLength(1);
    });
});
