import { describe, expect, it } from "vitest";
import { createMinimaxStrategy } from "@/features/ai/strategies/minimax-strategy";
import {
    applyMove,
    createGame,
    getValidMoves,
} from "@/features/game/engine/game-engine";
import type { Player } from "@/features/game/types/game.types";

const players: [Player, Player] = [
    { id: "p1", name: "Player 1", kind: "human" },
    { id: "p2", name: "AI", kind: "ai" },
];

describe("minimax insane strategy", () => {
    const strategy = createMinimaxStrategy();

    it("returns null when no valid moves exist", () => {
        const state = createGame({ rows: 1, cols: 1 }, players);
        expect(strategy.selectMove(state, [])).toBeNull();
    });

    it("immediately completes available boxes", () => {
        let state = createGame({ rows: 1, cols: 1 }, players);
        state = applyMove(state, { edgeId: "H-0-0", player: "p1" }).state;
        state = applyMove(state, { edgeId: "H-1-0", player: "p2" }).state;
        state = applyMove(state, { edgeId: "V-0-0", player: "p1" }).state;

        const validMoves = getValidMoves(state);
        const move = strategy.selectMove(state, validMoves);
        expect(move).toBe("V-0-1");
    });

    it("avoids giving away boxes when safe moves exist", () => {
        let state = createGame({ rows: 2, cols: 2 }, players);
        state = applyMove(state, { edgeId: "H-0-0", player: "p1" }).state;
        state = applyMove(state, { edgeId: "H-1-0", player: "p2" }).state;

        const validMoves = getValidMoves(state);
        const move = strategy.selectMove(state, validMoves);
        expect(move).not.toBe("V-0-1");
    });

    it("plays full game against itself on 2x2 board without error and completes", () => {
        let state = createGame({ rows: 2, cols: 2 }, players);
        const p1Strategy = createMinimaxStrategy();
        const p2Strategy = createMinimaxStrategy();

        let moveCount = 0;
        while (state.status === "playing" && moveCount < 50) {
            const valid = getValidMoves(state);
            const currentStrategy =
                state.currentPlayer === "p1" ? p1Strategy : p2Strategy;
            const chosen = currentStrategy.selectMove(state, valid);
            expect(chosen).not.toBeNull();
            if (!chosen) break;
            state = applyMove(state, {
                edgeId: chosen,
                player: state.currentPlayer,
            }).state;
            moveCount += 1;
        }

        expect(state.status).toBe("finished");
        expect(state.scores.p1 + state.scores.p2).toBe(4);
    });
});
