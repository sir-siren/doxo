import { describe, expect, it } from "vitest";
import {
    deriveStatisticsFromMatches,
    calculateStreaks,
} from "@/features/statistics/state/statistics.slice";
import type { MatchRecord } from "@/features/statistics/state/statistics.types";

describe("Single Source of Truth Statistics Derivation", () => {
    it("derives zeroed statistics when match history is empty", () => {
        const stats = deriveStatisticsFromMatches([]);
        expect(stats.gamesPlayed).toBe(0);
        expect(stats.wins).toBe(0);
        expect(stats.losses).toBe(0);
        expect(stats.draws).toBe(0);
        expect(stats.winRate).toBe(0);
        expect(stats.totalBoxesClaimed).toBe(0);
        expect(stats.currentStreak).toBe(0);
        expect(stats.longestStreak).toBe(0);
        expect(stats.vsAi.gamesPlayed).toBe(0);
        expect(stats.local.gamesPlayed).toBe(0);
    });

    describe("AI Mode: Win, Loss, and Draw walkthrough", () => {
        it("Scenario 1 (Win): P1 wins vs AI increments wins, maintains streak, updates AI tallies", () => {
            const matches: MatchRecord[] = [
                {
                    id: "m-1",
                    timestamp: 1700000001000,
                    mode: "ai",
                    difficulty: "hard",
                    shape: "rectangle",
                    boardSize: 4,
                    playerOne: { id: "p1", name: "Alice", score: 7, kind: "human" },
                    playerTwo: { id: "p2", name: "Computer", score: 2, kind: "ai" },
                    winner: "p1",
                    winnerName: "Alice",
                },
            ];

            const stats = deriveStatisticsFromMatches(matches);

            expect(stats.gamesPlayed).toBe(1);
            expect(stats.wins).toBe(1);
            expect(stats.losses).toBe(0);
            expect(stats.draws).toBe(0);
            expect(stats.winRate).toBe(1.0);
            expect(stats.currentStreak).toBe(1);
            expect(stats.longestStreak).toBe(1);
            expect(stats.totalBoxesClaimed).toBe(9);

            expect(stats.vsAi.gamesPlayed).toBe(1);
            expect(stats.vsAi.humanWins).toBe(1);
            expect(stats.vsAi.aiWins).toBe(0);
            expect(stats.vsAi.draws).toBe(0);
            expect(stats.vsAi.humanBoxesClaimed).toBe(7);
            expect(stats.vsAi.aiBoxesClaimed).toBe(2);
            expect(stats.vsAi.humanWinRate).toBe(1.0);
            expect(stats.vsAi.aiWinRate).toBe(0);
            expect(stats.byDifficulty.hard.wins).toBe(1);
            expect(stats.byDifficulty.hard.losses).toBe(0);
            expect(stats.byDifficulty.hard.winRate).toBe(1.0);

            // Profiles
            expect(stats.profiles?.playerOne.wins).toBe(1);
            expect(stats.profiles?.playerOne.losses).toBe(0);
            expect(stats.profiles?.ai.wins).toBe(0);
            expect(stats.profiles?.ai.losses).toBe(1);
        });

        it("Scenario 2 (Loss): AI wins vs P1 increments losses, resets streak, increments AI wins", () => {
            const matches: MatchRecord[] = [
                // Newest match: AI wins
                {
                    id: "m-2",
                    timestamp: 1700000002000,
                    mode: "ai",
                    difficulty: "insane",
                    shape: "rectangle",
                    boardSize: 4,
                    playerOne: { id: "p1", name: "Alice", score: 3, kind: "human" },
                    playerTwo: { id: "p2", name: "Computer", score: 6, kind: "ai" },
                    winner: "p2",
                    winnerName: "Computer",
                },
                // Prior match: Human won
                {
                    id: "m-1",
                    timestamp: 1700000001000,
                    mode: "ai",
                    difficulty: "hard",
                    shape: "rectangle",
                    boardSize: 4,
                    playerOne: { id: "p1", name: "Alice", score: 7, kind: "human" },
                    playerTwo: { id: "p2", name: "Computer", score: 2, kind: "ai" },
                    winner: "p1",
                    winnerName: "Alice",
                },
            ];

            const stats = deriveStatisticsFromMatches(matches);

            expect(stats.gamesPlayed).toBe(2);
            expect(stats.wins).toBe(1);
            expect(stats.losses).toBe(1);
            expect(stats.draws).toBe(0);
            expect(stats.winRate).toBe(0.5);
            expect(stats.currentStreak).toBe(0); // Reset by loss at index 0
            expect(stats.longestStreak).toBe(1);

            expect(stats.vsAi.gamesPlayed).toBe(2);
            expect(stats.vsAi.humanWins).toBe(1);
            expect(stats.vsAi.aiWins).toBe(1);
            expect(stats.vsAi.humanWinRate).toBe(0.5);
            expect(stats.vsAi.aiWinRate).toBe(0.5);
            expect(stats.byDifficulty.insane.wins).toBe(0);
            expect(stats.byDifficulty.insane.losses).toBe(1);
            expect(stats.byDifficulty.insane.winRate).toBe(0);

            // Profiles
            expect(stats.profiles?.playerOne.wins).toBe(1);
            expect(stats.profiles?.playerOne.losses).toBe(1);
            expect(stats.profiles?.ai.wins).toBe(1);
            expect(stats.profiles?.ai.losses).toBe(1);
            expect(stats.profiles?.ai.dominanceDiff).toBe(0);
        });

        it("Scenario 3 (Draw): Tie match increments draws, leaves wins/losses untouched, resets streak", () => {
            const matches: MatchRecord[] = [
                {
                    id: "m-3",
                    timestamp: 1700000003000,
                    mode: "ai",
                    difficulty: "medium",
                    shape: "rectangle",
                    boardSize: 4,
                    playerOne: { id: "p1", name: "Alice", score: 4, kind: "human" },
                    playerTwo: { id: "p2", name: "Computer", score: 4, kind: "ai" },
                    winner: "draw",
                    winnerName: "Draw",
                },
            ];

            const stats = deriveStatisticsFromMatches(matches);

            expect(stats.gamesPlayed).toBe(1);
            expect(stats.wins).toBe(0);
            expect(stats.losses).toBe(0);
            expect(stats.draws).toBe(1);
            expect(stats.winRate).toBe(0);
            expect(stats.currentStreak).toBe(0);
            expect(stats.longestStreak).toBe(0);

            expect(stats.vsAi.draws).toBe(1);
            expect(stats.byDifficulty.medium.draws).toBe(1);
            expect(stats.profiles?.playerOne.draws).toBe(1);
            expect(stats.profiles?.ai.draws).toBe(1);
        });
    });

    describe("Local Multiplayer Mode: P1 and P2 breakdown", () => {
        it("separately tracks P1 and P2 victories, scores, margins, and profiles", () => {
            const matches: MatchRecord[] = [
                // Match 3 (Newest): P2 wins 6 - 2
                {
                    id: "lm-3",
                    timestamp: 1700000003000,
                    mode: "local",
                    difficulty: "medium",
                    shape: "rectangle",
                    boardSize: 4,
                    playerOne: { id: "p1", name: "Alice", score: 2, kind: "human" },
                    playerTwo: { id: "p2", name: "Bob", score: 6, kind: "human" },
                    winner: "p2",
                    winnerName: "Bob",
                },
                // Match 2: P1 wins 5 - 1
                {
                    id: "lm-2",
                    timestamp: 1700000002000,
                    mode: "local",
                    difficulty: "medium",
                    shape: "rectangle",
                    boardSize: 4,
                    playerOne: { id: "p1", name: "Alice", score: 5, kind: "human" },
                    playerTwo: { id: "p2", name: "Bob", score: 1, kind: "human" },
                    winner: "p1",
                    winnerName: "Alice",
                },
                // Match 1 (Oldest): Draw 4 - 4
                {
                    id: "lm-1",
                    timestamp: 1700000001000,
                    mode: "local",
                    difficulty: "medium",
                    shape: "rectangle",
                    boardSize: 4,
                    playerOne: { id: "p1", name: "Alice", score: 4, kind: "human" },
                    playerTwo: { id: "p2", name: "Bob", score: 4, kind: "human" },
                    winner: "draw",
                    winnerName: "Draw",
                },
            ];

            const stats = deriveStatisticsFromMatches(matches);

            expect(stats.gamesPlayed).toBe(3);
            expect(stats.local.gamesPlayed).toBe(3);
            expect(stats.local.p1Wins).toBe(1);
            expect(stats.local.p2Wins).toBe(1);
            expect(stats.local.draws).toBe(1);
            expect(stats.local.p1TotalBoxes).toBe(11);
            expect(stats.local.p2TotalBoxes).toBe(11);
            expect(stats.local.p1HighScore).toBe(5);
            expect(stats.local.p2HighScore).toBe(6);
            // Average margin of decisive matches: (|6-2| + |5-1|) / 2 = (4 + 4) / 2 = 4.0
            expect(stats.local.avgMargin).toBe(4.0);

            // Overall perspective from Primary Player (Alice)
            expect(stats.wins).toBe(1);
            expect(stats.losses).toBe(1);
            expect(stats.draws).toBe(1);

            // Profiles
            expect(stats.profiles?.playerOne.name).toBe("Alice");
            expect(stats.profiles?.playerTwo.name).toBe("Bob");
            expect(stats.profiles?.playerTwo.wins).toBe(1);
            expect(stats.profiles?.playerTwo.losses).toBe(1);
            expect(stats.profiles?.playerTwo.dominanceDiff).toBe(0);
        });
    });

    describe("Streak Calculation across Interleaved Sequences", () => {
        it("evaluates current and longest streaks chronologically", () => {
            // Sequence from newest (index 0) to oldest (index 6):
            // [Win, Win, Draw, Win, Win, Win, Loss]
            const outcomes: ("p1" | "p2" | "draw")[] = [
                "p1", "p1", "draw", "p1", "p1", "p1", "p2"
            ];

            const matches: MatchRecord[] = outcomes.map((outcome, i) => ({
                id: `seq-${i}`,
                timestamp: 1700000000000 - i * 1000,
                mode: "ai",
                difficulty: "hard",
                shape: "rectangle",
                boardSize: 4,
                playerOne: { id: "p1", name: "Alice", score: outcome === "p1" ? 5 : 2, kind: "human" },
                playerTwo: { id: "p2", name: "Computer", score: outcome === "p2" ? 5 : 2, kind: "ai" },
                winner: outcome,
                winnerName: outcome === "p1" ? "Alice" : outcome === "p2" ? "Computer" : "Draw",
            }));

            const streaks = calculateStreaks(
                matches,
                (m) => m.winner === "p1",
                (m) => m.winner === "p2" || m.winner === "draw",
            );

            // Current streak (from index 0 until non-win): 2 (index 0, index 1)
            expect(streaks.current).toBe(2);
            // Longest streak: 3 (indices 3, 4, 5)
            expect(streaks.longest).toBe(3);
        });
    });
});
