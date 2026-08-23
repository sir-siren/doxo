import { describe, expect, it } from "vitest";

import { applyMove, createGame } from "@/features/game/engine/game-engine";
import { isMoveValid } from "@/features/game/engine/move-validator";
import type { GameState, Player } from "@/features/game/types/game.types";

const players: [Player, Player] = [
    { id: "p1", name: "One", kind: "human" },
    { id: "p2", name: "Two", kind: "ai" },
];

describe("isMoveValid", () => {
    const state: GameState = createGame({ rows: 2, cols: 2 }, players);

    it("accepts an unclaimed edge", () => {
        expect(isMoveValid(state, "H-0-0")).toBe(true);
        expect(isMoveValid(state, "V-1-2")).toBe(true);
    });

    it("rejects an already claimed edge", () => {
        const result = applyMove(state, { edgeId: "H-0-0", player: "p1" });
        expect(isMoveValid(result.state, "H-0-0")).toBe(false);
        expect(isMoveValid(result.state, "H-0-1")).toBe(true);
    });

    it("rejects an unknown edge id", () => {
        expect(isMoveValid(state, "X-9-9")).toBe(false);
        expect(isMoveValid(state, "H-99-99")).toBe(false);
    });
});
