import { describe, expect, it } from "vitest";
import statisticsReducer, {
    initialStatisticsState,
    recordGameResult,
    resetStatistics,
    setStatisticsState,
} from "@/features/statistics/state/statistics.slice";
import type {
    RecordGamePayload,
    StatisticsState,
} from "@/features/statistics/state/statistics.types";

describe("statistics.slice reducer", () => {
    it("initializes with safe default state", () => {
        const state = statisticsReducer(undefined, { type: "@@INIT" });
        expect(state.gamesPlayed).toBe(0);
        expect(state.wins).toBe(0);
        expect(state.losses).toBe(0);
        expect(state.draws).toBe(0);
        expect(state.totalBoxesClaimed).toBe(0);
        expect(state.currentStreak).toBe(0);
        expect(state.longestStreak).toBe(0);
        expect(state.recentMatches).toEqual([]);
        expect(state.vsAi.gamesPlayed).toBe(0);
        expect(state.local.gamesPlayed).toBe(0);
    });

    describe("AI mode game recording", () => {
        it("records human win (p1) against AI correctly", () => {
            const payload: RecordGamePayload = {
                mode: "ai",
                difficulty: "hard",
                shape: "rectangle",
                boardSize: 4,
                players: [
                    { id: "p1", name: "Alice", kind: "human" },
                    { id: "p2", name: "Computer", kind: "ai", difficulty: "hard" },
                ],
                scores: { p1: 6, p2: 3 },
                winner: "p1",
            };

            const state = statisticsReducer(initialStatisticsState, recordGameResult(payload));

            expect(state.gamesPlayed).toBe(1);
            expect(state.wins).toBe(1);
            expect(state.losses).toBe(0);
            expect(state.draws).toBe(0);
            expect(state.totalBoxesClaimed).toBe(9);
            expect(state.currentStreak).toBe(1);
            expect(state.longestStreak).toBe(1);

            expect(state.vsAi.gamesPlayed).toBe(1);
            expect(state.vsAi.humanWins).toBe(1);
            expect(state.vsAi.aiWins).toBe(0);
            expect(state.vsAi.humanBoxesClaimed).toBe(6);
            expect(state.vsAi.aiBoxesClaimed).toBe(3);
            expect(state.vsAi.currentStreak).toBe(1);
            expect(state.vsAi.longestStreak).toBe(1);

            expect(state.byDifficulty.hard.gamesPlayed).toBe(1);
            expect(state.byDifficulty.hard.wins).toBe(1);
            expect(state.byDifficulty.hard.losses).toBe(0);
            expect(state.byDifficulty.hard.humanBoxes).toBe(6);
            expect(state.byDifficulty.hard.aiBoxes).toBe(3);

            expect(state.recentMatches).toHaveLength(1);
            const match = state.recentMatches[0]!;
            expect(match.winner).toBe("p1");
            expect(match.winnerName).toBe("Alice");
            expect(match.mode).toBe("ai");
            expect(match.difficulty).toBe("hard");
            expect(match.shape).toBe("rectangle");
            expect(match.boardSize).toBe(4);
            expect(match.playerOne.name).toBe("Alice");
            expect(match.playerOne.score).toBe(6);
            expect(match.playerTwo.name).toBe("Computer");
            expect(match.playerTwo.score).toBe(3);
        });

        it("records AI win (p2) against human correctly", () => {
            const initial: StatisticsState = {
                ...initialStatisticsState,
                recentMatches: [
                    {
                        id: "match-prev-2",
                        timestamp: Date.now() - 2000,
                        mode: "ai",
                        difficulty: "medium",
                        shape: "rectangle",
                        boardSize: 4,
                        playerOne: { id: "p1", name: "Bob", score: 6, kind: "human" },
                        playerTwo: { id: "p2", name: "Computer", score: 3, kind: "ai" },
                        winner: "p1",
                        winnerName: "Bob",
                    },
                    {
                        id: "match-prev-1",
                        timestamp: Date.now() - 4000,
                        mode: "ai",
                        difficulty: "medium",
                        shape: "rectangle",
                        boardSize: 4,
                        playerOne: { id: "p1", name: "Bob", score: 5, kind: "human" },
                        playerTwo: { id: "p2", name: "Computer", score: 4, kind: "ai" },
                        winner: "p1",
                        winnerName: "Bob",
                    },
                ],
            };

            const payload: RecordGamePayload = {
                mode: "ai",
                difficulty: "medium",
                shape: "hex",
                boardSize: 5,
                players: [
                    { id: "p1", name: "Bob", kind: "human" },
                    { id: "p2", name: "Computer", kind: "ai" },
                ],
                scores: { p1: 2, p2: 5 },
                winner: "p2",
            };

            const state = statisticsReducer(initial, recordGameResult(payload));

            expect(state.gamesPlayed).toBe(3);
            expect(state.wins).toBe(2);
            expect(state.losses).toBe(1);
            expect(state.currentStreak).toBe(0);
            expect(state.longestStreak).toBe(2);

            expect(state.vsAi.aiWins).toBe(1);
            expect(state.vsAi.humanWins).toBe(2);
            expect(state.vsAi.currentStreak).toBe(0);
            expect(state.vsAi.longestStreak).toBe(2);
            expect(state.byDifficulty.medium.losses).toBe(1);

            expect(state.recentMatches[0]!.winner).toBe("p2");
            expect(state.recentMatches[0]!.winnerName).toBe("Computer");
        });

        it("records draw against AI correctly", () => {
            const payload: RecordGamePayload = {
                mode: "ai",
                difficulty: "easy",
                shape: "rectangle",
                boardSize: 4,
                players: [
                    { id: "p1", name: "Charlie", kind: "human" },
                    { id: "p2", name: "Computer", kind: "ai" },
                ],
                scores: { p1: 4, p2: 4 },
                winner: "draw",
            };

            const state = statisticsReducer(initialStatisticsState, recordGameResult(payload));

            expect(state.draws).toBe(1);
            expect(state.vsAi.draws).toBe(1);
            expect(state.byDifficulty.easy.draws).toBe(1);
            expect(state.recentMatches[0]!.winner).toBe("draw");
            expect(state.recentMatches[0]!.winnerName).toBe("Draw");
        });
    });

    describe("Local multiplayer game recording", () => {
        it("records Player 1 win in local mode", () => {
            const payload: RecordGamePayload = {
                mode: "local",
                difficulty: "medium",
                shape: "triangle",
                boardSize: 4,
                players: [
                    { id: "p1", name: "Player 1", kind: "human" },
                    { id: "p2", name: "Player 2", kind: "human" },
                ],
                scores: { p1: 5, p2: 2 },
                winner: "p1",
            };

            const state = statisticsReducer(initialStatisticsState, recordGameResult(payload));

            expect(state.gamesPlayed).toBe(1);
            expect(state.wins).toBe(1);
            expect(state.losses).toBe(0);
            expect(state.currentStreak).toBe(1);
            expect(state.local.gamesPlayed).toBe(1);
            expect(state.local.p1Wins).toBe(1);
            expect(state.local.p2Wins).toBe(0);
            expect(state.local.p1TotalBoxes).toBe(5);
            expect(state.local.p2TotalBoxes).toBe(2);
            expect(state.recentMatches[0]!.winnerName).toBe("Player 1");
        });

        it("records Player 2 win in local mode as a loss for overall stats and increments local.p2Wins", () => {
            const initial: StatisticsState = {
                ...initialStatisticsState,
                recentMatches: [
                    {
                        id: "match-prev-3",
                        timestamp: Date.now() - 1000,
                        mode: "local",
                        difficulty: "medium",
                        shape: "rectangle",
                        boardSize: 4,
                        playerOne: { id: "p1", name: "Alice", score: 5, kind: "human" },
                        playerTwo: { id: "p2", name: "Bob", score: 2, kind: "human" },
                        winner: "p1",
                        winnerName: "Alice",
                    },
                    {
                        id: "match-prev-2",
                        timestamp: Date.now() - 2000,
                        mode: "local",
                        difficulty: "medium",
                        shape: "rectangle",
                        boardSize: 4,
                        playerOne: { id: "p1", name: "Alice", score: 6, kind: "human" },
                        playerTwo: { id: "p2", name: "Bob", score: 3, kind: "human" },
                        winner: "p1",
                        winnerName: "Alice",
                    },
                    {
                        id: "match-prev-1",
                        timestamp: Date.now() - 3000,
                        mode: "local",
                        difficulty: "medium",
                        shape: "rectangle",
                        boardSize: 4,
                        playerOne: { id: "p1", name: "Alice", score: 4, kind: "human" },
                        playerTwo: { id: "p2", name: "Bob", score: 1, kind: "human" },
                        winner: "p1",
                        winnerName: "Alice",
                    },
                ],
            };

            const payload: RecordGamePayload = {
                mode: "local",
                difficulty: "medium",
                shape: "rectangle",
                boardSize: 4,
                players: [
                    { id: "p1", name: "Alice", kind: "human" },
                    { id: "p2", name: "Bob", kind: "human" },
                ],
                scores: { p1: 1, p2: 7 },
                winner: "p2",
            };

            const state = statisticsReducer(initial, recordGameResult(payload));

            // Must NOT increment state.wins! Must increment state.losses
            expect(state.gamesPlayed).toBe(4);
            expect(state.wins).toBe(3);
            expect(state.losses).toBe(1);
            expect(state.currentStreak).toBe(0);
            expect(state.local.p1Wins).toBe(3);
            expect(state.local.p2Wins).toBe(1);
            expect(state.recentMatches[0]!.winnerName).toBe("Bob");
        });

        it("records draw in local mode", () => {
            const payload: RecordGamePayload = {
                mode: "local",
                difficulty: "medium",
                shape: "rectangle",
                boardSize: 4,
                players: [
                    { id: "p1", name: "Alice", kind: "human" },
                    { id: "p2", name: "Bob", kind: "human" },
                ],
                scores: { p1: 4, p2: 4 },
                winner: "draw",
            };

            const state = statisticsReducer(initialStatisticsState, recordGameResult(payload));

            expect(state.draws).toBe(1);
            expect(state.local.draws).toBe(1);
            expect(state.recentMatches[0]!.winnerName).toBe("Draw");
        });
    });

    describe("Legacy GameResult payload", () => {
        it("records legacy win correctly, updating vsAi and recentMatches", () => {
            const state = statisticsReducer(
                initialStatisticsState,
                recordGameResult({
                    outcome: "win",
                    difficulty: "insane",
                    boxesClaimedByHuman: 8,
                }),
            );

            expect(state.gamesPlayed).toBe(1);
            expect(state.wins).toBe(1);
            expect(state.losses).toBe(0);
            expect(state.totalBoxesClaimed).toBe(8);
            expect(state.vsAi.gamesPlayed).toBe(1);
            expect(state.vsAi.humanWins).toBe(1);
            expect(state.vsAi.humanBoxesClaimed).toBe(8);
            expect(state.byDifficulty.insane.wins).toBe(1);

            expect(state.recentMatches).toHaveLength(1);
            expect(state.recentMatches[0]!.winner).toBe("p1");
            expect(state.recentMatches[0]!.difficulty).toBe("insane");
            expect(state.recentMatches[0]!.playerOne.score).toBe(8);
        });

        it("records legacy loss correctly", () => {
            const state = statisticsReducer(
                initialStatisticsState,
                recordGameResult({
                    outcome: "loss",
                    difficulty: "adaptive",
                    boxesClaimedByHuman: 3,
                }),
            );

            expect(state.losses).toBe(1);
            expect(state.vsAi.aiWins).toBe(1);
            expect(state.byDifficulty.adaptive.losses).toBe(1);
            expect(state.recentMatches[0]!.winner).toBe("p2");
            expect(state.recentMatches[0]!.winnerName).toBe("Computer");
        });
    });

    describe("Recent matches history and capping", () => {
        it("stores up to 50 matches in LIFO order", () => {
            let state = initialStatisticsState;

            for (let i = 1; i <= 60; i++) {
                state = statisticsReducer(
                    state,
                    recordGameResult({
                        mode: "ai",
                        difficulty: "easy",
                        shape: "rectangle",
                        boardSize: 4,
                        players: [
                            { id: "p1", name: `Player ${i}`, kind: "human" },
                            { id: "p2", name: "Computer", kind: "ai" },
                        ],
                        scores: { p1: i, p2: 0 },
                        winner: "p1",
                    }),
                );
            }

            expect(state.recentMatches).toHaveLength(50);
            // Most recent is match 60
            expect(state.recentMatches[0]!.playerOne.name).toBe("Player 60");
            // Oldest retained is match 11
            expect(state.recentMatches[49]!.playerOne.name).toBe("Player 11");
        });
    });

    describe("State management actions", () => {
        it("handles setStatisticsState", () => {
            const customState: StatisticsState = {
                ...initialStatisticsState,
                gamesPlayed: 10,
                wins: 8,
            };
            const result = statisticsReducer(initialStatisticsState, setStatisticsState(customState));
            expect(result.gamesPlayed).toBe(10);
            expect(result.wins).toBe(8);
        });

        it("handles resetStatistics", () => {
            const modifiedState: StatisticsState = {
                ...initialStatisticsState,
                gamesPlayed: 10,
                wins: 8,
            };
            const result = statisticsReducer(modifiedState, resetStatistics());
            expect(result).toEqual(initialStatisticsState);
        });
    });
});

