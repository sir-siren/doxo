import { describe, expect, it } from "vitest";

import {
    createGame,
    applyMove,
    getValidMoves,
} from "@/features/game/engine/game-engine";
import { getWinner } from "@/features/game/engine/game-winner";
import type { GameState, Move, Player } from "@/features/game/types/game.types";

const players: [Player, Player] = [
    { id: "p1", name: "One", kind: "human" },
    { id: "p2", name: "Two", kind: "ai" },
];

const play = (state: GameState, moves: Move[]): GameState =>
    moves.reduce((acc, move) => applyMove(acc, move).state, state);

describe("createGame", () => {
    it("creates a fresh playing state", () => {
        const state = createGame({ rows: 2, cols: 2 }, players);
        expect(state.dimensions).toEqual({ rows: 2, cols: 2 });
        expect(Object.keys(state.edges)).toHaveLength(12);
        expect(Object.keys(state.boxes)).toHaveLength(4);
        expect(state.currentPlayer).toBe("p1");
        expect(state.scores).toEqual({ p1: 0, p2: 0 });
        expect(state.moveHistory).toEqual([]);
        expect(state.status).toBe("playing");
        expect(state.winner).toBeNull();
    });
});

describe("getValidMoves", () => {
    it("lists unclaimed edges only", () => {
        const state = createGame({ rows: 1, cols: 1 }, players);
        expect(getValidMoves(state)).toHaveLength(4);
        const after = play(state, [{ edgeId: "H-0-0", player: "p1" }]);
        expect(getValidMoves(after)).not.toContain("H-0-0");
        expect(getValidMoves(after)).toHaveLength(3);
    });
});

describe("applyMove", () => {
    it("rejects an unknown edge id", () => {
        const state = createGame({ rows: 2, cols: 2 }, players);
        expect(() =>
            applyMove(state, { edgeId: "X-0-0", player: "p1" }),
        ).toThrow();
    });

    it("rejects a duplicate claim", () => {
        const state = createGame({ rows: 2, cols: 2 }, players);
        const once = applyMove(state, { edgeId: "H-0-0", player: "p1" });
        expect(() =>
            applyMove(once.state, { edgeId: "H-0-0", player: "p2" }),
        ).toThrow();
    });

    it("switches the turn when no box is scored", () => {
        const state = createGame({ rows: 2, cols: 2 }, players);
        const result = applyMove(state, { edgeId: "H-0-0", player: "p1" });
        expect(result.scored).toBe(false);
        expect(result.completedBoxes).toEqual([]);
        expect(result.state.currentPlayer).toBe("p2");
    });

    it("keeps the turn after completing one box", () => {
        const state = createGame({ rows: 1, cols: 1 }, players);
        const setup = play(state, [
            { edgeId: "H-0-0", player: "p1" },
            { edgeId: "V-0-0", player: "p2" },
            { edgeId: "H-1-0", player: "p1" },
        ]);
        const result = applyMove(setup, { edgeId: "V-0-1", player: "p2" });
        expect(result.completedBoxes).toEqual(["0-0"]);
        expect(result.scored).toBe(true);
        expect(result.state.currentPlayer).toBe("p2");
        expect(result.state.scores).toEqual({ p1: 0, p2: 1 });
        expect(result.state.boxes["0-0"]?.owner).toBe("p2");
    });

    it("completes two boxes in the same turn", () => {
        const state = createGame({ rows: 2, cols: 2 }, players);
        // Boxes (0,0) and (0,1) share V-0-1; claim everything else first.
        const setup = play(state, [
            { edgeId: "H-0-0", player: "p1" },
            { edgeId: "H-1-0", player: "p2" },
            { edgeId: "V-0-0", player: "p1" },
            { edgeId: "H-0-1", player: "p2" },
            { edgeId: "H-1-1", player: "p1" },
            { edgeId: "V-0-2", player: "p2" },
        ]);
        const result = applyMove(setup, { edgeId: "V-0-1", player: "p2" });
        expect(result.completedBoxes).toEqual(["0-0", "0-1"]);
        expect(result.state.scores.p2).toBe(2);
        expect(result.state.currentPlayer).toBe("p2");
    });

    it("finishes the game and names the winner on the final edge", () => {
        const state = createGame({ rows: 1, cols: 1 }, players);
        const setup = play(state, [
            { edgeId: "H-0-0", player: "p1" },
            { edgeId: "V-0-0", player: "p2" },
            { edgeId: "H-1-0", player: "p1" },
        ]);
        const result = applyMove(setup, { edgeId: "V-0-1", player: "p2" });
        expect(result.state.status).toBe("finished");
        expect(result.state.winner).toBe("p2");
    });

    it("does not finish before every edge is claimed", () => {
        const state = createGame({ rows: 1, cols: 1 }, players);
        const result = applyMove(state, { edgeId: "H-0-0", player: "p1" });
        expect(result.state.status).toBe("playing");
    });
});

describe("getWinner", () => {
    it("returns null while unfinished", () => {
        const state = createGame({ rows: 2, cols: 2 }, players);
        expect(getWinner(state)).toBeNull();
    });

    it("reports draw for equal scores", () => {
        const state = createGame({ rows: 1, cols: 1 }, players);
        const drawn: GameState = {
            ...state,
            scores: { p1: 0, p2: 0 },
            status: "finished",
        };
        expect(getWinner(drawn)).toBe("draw");
    });

    it("reports the higher scorer", () => {
        const state = createGame({ rows: 2, cols: 2 }, players);
        const finished = { ...state, status: "finished" } as const;
        expect(getWinner({ ...finished, scores: { p1: 3, p2: 1 } })).toBe("p1");
        expect(getWinner({ ...finished, scores: { p1: 1, p2: 3 } })).toBe("p2");
    });
});
