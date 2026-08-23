import { beforeEach, describe, expect, it } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { makeMove, startGame } from "@/features/game";
import {
    selectAvailableMoves,
    selectCompletedBoxesByPlayer,
    selectCurrentPlayer,
    selectGameStatus,
    selectGameState,
    selectScores,
    selectWinner,
} from "@/features/game";
import { selectBoardSize } from "@/features/settings";
import rootReducer from "@/app/store/root-reducer";

const createTestStore = () =>
    configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
    });

type TestStore = ReturnType<typeof createTestStore>;

describe("game selectors", () => {
    let store: TestStore;

    beforeEach(() => {
        store = createTestStore();
    });

    it("idle defaults before any game starts", () => {
        const state = store.getState();
        expect(selectGameState(state)).toBeNull();
        expect(selectCurrentPlayer(state)).toBeNull();
        expect(selectScores(state)).toBeNull();
        expect(selectAvailableMoves(state)).toStrictEqual([]);
        expect(selectGameStatus(state)).toBe("idle");
        expect(selectWinner(state)).toBeNull();
        expect(selectCompletedBoxesByPlayer(state)).toStrictEqual({
            p1: [],
            p2: [],
        });
    });

    it("reflects a live game", () => {
        store.dispatch(
            startGame({
                dimensions: { rows: 3, cols: 3 },
                players: [
                    { id: "p1", name: "Ada", kind: "human" },
                    { id: "p2", name: "Bob", kind: "human" },
                ],
            }),
        );

        const started = store.getState();
        expect(selectCurrentPlayer(started)).toBe("p1");
        expect(selectGameStatus(started)).toBe("playing");
        expect(selectWinner(started)).toBeNull();

        const moveCount = selectAvailableMoves(started).length;
        // 3x3 board has 24 edges.
        expect(moveCount).toBe(24);

        for (const edge of ["H-0-0", "V-0-0", "H-1-0"])
            store.dispatch(makeMove(edge));
        store.dispatch(makeMove("V-0-1"));

        const after = store.getState();
        // p2 takes the 4th side (moves alternated) and scores.
        expect(selectScores(after)).toStrictEqual({ p1: 0, p2: 1 });
        expect(selectCompletedBoxesByPlayer(after)["p2"]).toContain("0-0");
        expect(selectCurrentPlayer(after)).toBe("p2");
    });

    it("are memoized (same state yields identical references)", () => {
        store.dispatch(
            startGame({
                dimensions: { rows: 3, cols: 3 },
                players: [
                    { id: "p1", name: "A", kind: "human" },
                    { id: "p2", name: "B", kind: "human" },
                ],
            }),
        );
        const state = store.getState();
        expect(selectAvailableMoves(state)).toBe(selectAvailableMoves(state));
        expect(selectCompletedBoxesByPlayer(state)).toBe(
            selectCompletedBoxesByPlayer(state),
        );
        expect(selectBoardSize(state)).toBe(6);
    });
});
