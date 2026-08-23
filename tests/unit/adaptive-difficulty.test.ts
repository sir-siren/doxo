import { describe, expect, it } from "vitest";
import { resolveAdaptiveDifficulty } from "@/features/ai/adaptive-difficulty";

describe("adaptive difficulty", () => {
    it("starts at medium when fewer than 3 games have been played", () => {
        expect(
            resolveAdaptiveDifficulty({
                gamesPlayed: 0,
                wins: 0,
                losses: 0,
                draws: 0,
            }),
        ).toBe("medium");
        expect(
            resolveAdaptiveDifficulty({
                gamesPlayed: 1,
                wins: 1,
                losses: 0,
                draws: 0,
            }),
        ).toBe("medium");
        expect(
            resolveAdaptiveDifficulty({
                gamesPlayed: 2,
                wins: 2,
                losses: 0,
                draws: 0,
            }),
        ).toBe("medium");
    });

    it("scales up to insane for win rate >= 75% on small boards", () => {
        expect(
            resolveAdaptiveDifficulty(
                { gamesPlayed: 4, wins: 3, losses: 1, draws: 0 },
                { boardSize: 3 },
            ),
        ).toBe("insane");
        expect(
            resolveAdaptiveDifficulty(
                { gamesPlayed: 10, wins: 8, losses: 2, draws: 0 },
                { boardSize: 4 },
            ),
        ).toBe("insane");
    });

    it("caps insane difficulty to hard on large boards (> 4) to protect performance", () => {
        expect(
            resolveAdaptiveDifficulty(
                { gamesPlayed: 10, wins: 9, losses: 1, draws: 0 },
                { boardSize: 6 },
            ),
        ).toBe("hard");
    });

    it("scales to hard for win rate between 50% and 74%", () => {
        expect(
            resolveAdaptiveDifficulty({
                gamesPlayed: 10,
                wins: 6,
                losses: 4,
                draws: 0,
            }),
        ).toBe("hard");
        expect(
            resolveAdaptiveDifficulty({
                gamesPlayed: 4,
                wins: 2,
                losses: 2,
                draws: 0,
            }),
        ).toBe("hard");
    });

    it("scales to medium for win rate between 30% and 49%", () => {
        expect(
            resolveAdaptiveDifficulty({
                gamesPlayed: 10,
                wins: 4,
                losses: 6,
                draws: 0,
            }),
        ).toBe("medium");
        expect(
            resolveAdaptiveDifficulty({
                gamesPlayed: 10,
                wins: 3,
                losses: 7,
                draws: 0,
            }),
        ).toBe("medium");
    });

    it("scales down to easy for win rate < 30%", () => {
        expect(
            resolveAdaptiveDifficulty({
                gamesPlayed: 10,
                wins: 2,
                losses: 8,
                draws: 0,
            }),
        ).toBe("easy");
        expect(
            resolveAdaptiveDifficulty({
                gamesPlayed: 5,
                wins: 1,
                losses: 4,
                draws: 0,
            }),
        ).toBe("easy");
    });
});
