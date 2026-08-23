import { describe, expect, it } from "vitest";

import { createAiStrategy } from "@/features/ai";
import { createRandomStrategy } from "@/features/ai/strategies/random-strategy";
import { createSafeMoveStrategy } from "@/features/ai/strategies/safe-move-strategy";
import { createStrategicStrategy } from "@/features/ai/strategies/strategic-strategy";
import { applyMove, createGame } from "@/features/game/engine/game-engine";
import { getValidMoves } from "@/features/game/engine/game-engine";
import type {
    EdgeId,
    GameState,
    Player,
} from "@/features/game/types/game.types";

const players: [Player, Player] = [
    { id: "p1", name: "One", kind: "human" },
    { id: "p2", name: "Two", kind: "ai" },
];

/** Deterministic PRNG (mulberry32). */
const seededRng = (seed: number): (() => number) => {
    let a = seed;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

const play = (state: GameState, edges: EdgeId[]): GameState =>
    edges.reduce(
        (acc, edgeId, index) =>
            applyMove(acc, { edgeId, player: index % 2 === 0 ? "p1" : "p2" })
                .state,
        state,
    );

describe("random strategy", () => {
    const strategy = createRandomStrategy(seededRng(42));

    it("returns null when there are no valid moves", () => {
        expect(
            strategy.selectMove(createGame({ rows: 2, cols: 2 }, players), []),
        ).toBeNull();
    });

    it("always returns one of the valid moves, deterministically", () => {
        const state = play(createGame({ rows: 2, cols: 2 }, players), [
            "H-0-0",
            "H-1-1",
            "V-0-0",
        ]);
        const valid = getValidMoves(state);
        const choice = strategy.selectMove(state, valid);
        expect(choice).not.toBeNull();
        expect(valid).toContain(choice);
        const again = createRandomStrategy(seededRng(42)).selectMove(
            state,
            valid,
        );
        expect(again).toBe(choice);
    });
});

describe("safe move strategy", () => {
    it("never claims an edge that hands a box its third side when alternatives exist", () => {
        // Box (0,0) misses only V-0-1 (a completion); claiming V-0-2 would hand box (0,1) its third side.
        const state = play(createGame({ rows: 2, cols: 2 }, players), [
            "H-0-0",
            "H-1-0",
            "V-0-0",
            "H-0-1",
            "H-1-1",
        ]);
        const valid = getValidMoves(state);
        for (let seed = 1; seed <= 20; seed += 1) {
            const choice = createSafeMoveStrategy(seededRng(seed)).selectMove(
                state,
                valid,
            );
            expect(choice).not.toBe("V-0-2");
            expect(valid).toContain(choice);
        }
    });

    it("never hands over a third edge when safe moves exist", () => {
        // Every box here has at most 1 side claimed except around V-0-1:
        // claiming V-0-1 gives box (0,0) a third side.
        const state = play(createGame({ rows: 2, cols: 2 }, players), [
            "H-0-0",
            "H-1-0",
        ]);
        const valid = getValidMoves(state);
        const dangerous = new Set<EdgeId>(["V-0-1"]);
        for (let seed = 1; seed <= 20; seed += 1) {
            const choice = createSafeMoveStrategy(seededRng(seed)).selectMove(
                state,
                valid,
            );
            expect(choice).not.toBeNull();
            expect(dangerous.has(choice as EdgeId)).toBe(false);
            expect(valid).toContain(choice);
        }
    });

    it("falls back to any move when everything is unsafe", () => {
        const state = play(createGame({ rows: 1, cols: 1 }, players), [
            "H-0-0",
            "V-0-0",
        ]);
        const valid = getValidMoves(state);
        const choice = createSafeMoveStrategy(seededRng(3)).selectMove(
            state,
            valid,
        );
        expect(valid).toContain(choice);
    });
});

describe("strategic strategy", () => {
    it("takes all available boxes before anything else", () => {
        const state = play(createGame({ rows: 2, cols: 3 }, players), [
            "H-0-0",
            "H-1-0",
            "V-0-0", // box (0,0) minus V-0-1
            "H-0-1",
            "H-1-1",
            "V-0-2", // box (0,1) minus V-0-1
        ]);
        const choice = createStrategicStrategy(seededRng(9)).selectMove(
            state,
            getValidMoves(state),
        );
        expect(choice).toBe("V-0-1");
    });

    it("prefers non-giving moves over opening a box", () => {
        const state = play(createGame({ rows: 2, cols: 2 }, players), [
            "H-0-0",
            "H-1-0",
        ]);
        const choice = createStrategicStrategy(seededRng(11)).selectMove(
            state,
            getValidMoves(state),
        );
        expect(choice).not.toBe("V-0-1");
    });

    it("when forced to open, opens the shorter chain", () => {
        // A 2-box chain {(0,0),(0,1)} and a 1-box chain {(0,2)}; every remaining
        // move gives boxes away, so give away just 1 ("H-0-2" or "V-0-3").
        const state = play(createGame({ rows: 1, cols: 3 }, players), [
            "H-1-0",
            "H-1-1",
            "H-1-2", // bottoms
            "V-0-2", // separator between the two chains
            "H-0-0", // box (0,0) second side
        ]);
        const choice = createStrategicStrategy(seededRng(13)).selectMove(
            state,
            getValidMoves(state),
        );
        expect(["H-0-2", "V-0-3"]).toContain(choice);
    });
});

describe("createAiStrategy", () => {
    it("maps difficulties to named strategies", () => {
        expect(createAiStrategy("easy").name).toBe("random");
        expect(createAiStrategy("medium").name).toBe("safe-move");
        expect(createAiStrategy("hard").name).toBe("strategic");
    });

    it("returns a usable move for each difficulty", () => {
        const state = play(createGame({ rows: 2, cols: 2 }, players), [
            "H-0-0",
            "H-1-0",
            "V-0-0",
        ]);
        const valid = getValidMoves(state);
        for (const difficulty of ["easy", "medium", "hard"] as const) {
            const choice = createAiStrategy(
                difficulty,
                seededRng(5),
            ).selectMove(state, valid);
            expect(valid).toContain(choice);
        }
    });

    it("honors an injected rng", () => {
        let calls = 0;
        const countingRng = (): number => {
            calls += 1;
            return 0.5;
        };
        const strategy = createAiStrategy("easy", countingRng);
        const state = createGame({ rows: 2, cols: 2 }, players);
        strategy.selectMove(state, getValidMoves(state));
        expect(calls).toBeGreaterThan(0);
    });
});
