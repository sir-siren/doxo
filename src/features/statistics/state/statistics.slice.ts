import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Difficulty } from "@/features/game/types/game.types";
import type {
    DifficultyTally,
    GameResult,
    LocalStats,
    MatchRecord,
    PlayerProfileStats,
    RecordGamePayload,
    StatisticsState,
    StatisticsSummary,
    VsAiStats,
} from "./statistics.types";

const ALL_DIFFICULTIES: readonly Difficulty[] = [
    "easy",
    "medium",
    "hard",
    "insane",
    "adaptive",
] as const;

export const emptyDifficultyTally: DifficultyTally = {
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    humanBoxes: 0,
    aiBoxes: 0,
    winRate: 0,
};

export const emptyTallies = (): Record<Difficulty, DifficultyTally> => ({
    easy: { ...emptyDifficultyTally },
    medium: { ...emptyDifficultyTally },
    hard: { ...emptyDifficultyTally },
    insane: { ...emptyDifficultyTally },
    adaptive: { ...emptyDifficultyTally },
});

export const emptyVsAiStats = (): VsAiStats => ({
    gamesPlayed: 0,
    humanWins: 0,
    aiWins: 0,
    draws: 0,
    humanWinRate: 0,
    aiWinRate: 0,
    humanBoxesClaimed: 0,
    aiBoxesClaimed: 0,
    humanAvgScore: 0,
    aiAvgScore: 0,
    humanHighScore: 0,
    aiHighScore: 0,
    currentStreak: 0,
    longestStreak: 0,
    byDifficulty: emptyTallies(),
});

export const emptyLocalStats = (): LocalStats => ({
    gamesPlayed: 0,
    p1Wins: 0,
    p2Wins: 0,
    draws: 0,
    p1WinRate: 0,
    p2WinRate: 0,
    p1TotalBoxes: 0,
    p2TotalBoxes: 0,
    p1AvgScore: 0,
    p2AvgScore: 0,
    p1HighScore: 0,
    p2HighScore: 0,
    avgMargin: 0,
});

export const emptyProfileStats = (name: string): PlayerProfileStats => ({
    name,
    totalMatches: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0,
    totalBoxes: 0,
    avgScore: 0,
    highScore: 0,
    currentStreak: 0,
    longestStreak: 0,
    dominanceDiff: 0,
});

export const initialStatisticsSummary: StatisticsSummary = {
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0,
    totalBoxesClaimed: 0,
    currentStreak: 0,
    longestStreak: 0,
    vsAi: emptyVsAiStats(),
    local: emptyLocalStats(),
    byDifficulty: emptyTallies(),
    profiles: {
        playerOne: emptyProfileStats("Player 1"),
        playerTwo: emptyProfileStats("Player 2"),
        ai: emptyProfileStats("Computer AI"),
    },
};

export const initialStatisticsState: StatisticsState = {
    ...initialStatisticsSummary,
    recentMatches: [],
};

/**
 * Calculates current and longest winning streaks from a list of matches ordered newest to oldest.
 */
export function calculateStreaks(
    matchesNewestFirst: MatchRecord[],
    isWin: (m: MatchRecord) => boolean,
    isBreak: (m: MatchRecord) => boolean,
): { current: number; longest: number } {
    let current = 0;
    for (const m of matchesNewestFirst) {
        if (isWin(m)) {
            current += 1;
        } else if (isBreak(m)) {
            break;
        }
    }

    let longest = 0;
    let running = 0;
    // Walk from oldest (last index) to newest (index 0)
    for (let i = matchesNewestFirst.length - 1; i >= 0; i -= 1) {
        const m = matchesNewestFirst[i];
        if (m && isWin(m)) {
            running += 1;
            if (running > longest) longest = running;
        } else if (m && isBreak(m)) {
            running = 0;
        }
    }

    return { current, longest };
}

/**
 * Pure Single-Source-of-Truth derivation: computes all statistics, tallies,
 * averages, rates, streaks, and profile records directly from match history.
 */
export function deriveStatisticsFromMatches(
    matches: MatchRecord[],
): StatisticsSummary {
    const byDifficulty = emptyTallies();

    let overallWins = 0;
    let overallLosses = 0;
    let overallDraws = 0;
    let totalBoxesClaimed = 0;

    let aiGames = 0;
    let humanAiWins = 0;
    let aiWins = 0;
    let aiDraws = 0;
    let humanAiBoxes = 0;
    let aiBoxes = 0;
    let humanAiHighScore = 0;
    let aiHighScore = 0;

    let localGames = 0;
    let p1LocalWins = 0;
    let p2LocalWins = 0;
    let localDraws = 0;
    let p1LocalBoxes = 0;
    let p2LocalBoxes = 0;
    let p1LocalHighScore = 0;
    let p2LocalHighScore = 0;
    const decisiveMargins: number[] = [];

    let p1GlobalHighScore = 0;
    let latestP1Name = "Player 1";
    let latestP2Name = "Player 2";

    for (const m of matches) {
        const p1Score = Number.isFinite(m.playerOne?.score)
            ? Math.max(0, m.playerOne.score)
            : 0;
        const p2Score = Number.isFinite(m.playerTwo?.score)
            ? Math.max(0, m.playerTwo.score)
            : 0;

        totalBoxesClaimed += p1Score + p2Score;
        if (p1Score > p1GlobalHighScore) p1GlobalHighScore = p1Score;
        if (m.playerOne?.name) latestP1Name = m.playerOne.name;

        if (m.winner === "p1") {
            overallWins += 1;
        } else if (m.winner === "p2") {
            overallLosses += 1;
        } else {
            overallDraws += 1;
        }

        if (m.mode === "ai") {
            aiGames += 1;
            humanAiBoxes += p1Score;
            aiBoxes += p2Score;
            if (p1Score > humanAiHighScore) humanAiHighScore = p1Score;
            if (p2Score > aiHighScore) aiHighScore = p2Score;

            const diff: Difficulty =
                m.difficulty && ALL_DIFFICULTIES.includes(m.difficulty)
                    ? m.difficulty
                    : "medium";
            const diffTally = byDifficulty[diff];
            if (diffTally) {
                diffTally.gamesPlayed += 1;
                diffTally.humanBoxes += p1Score;
                diffTally.aiBoxes += p2Score;
                if (m.winner === "p1") {
                    humanAiWins += 1;
                    diffTally.wins += 1;
                } else if (m.winner === "p2") {
                    aiWins += 1;
                    diffTally.losses += 1;
                } else {
                    aiDraws += 1;
                    diffTally.draws += 1;
                }
            }
        } else {
            // Local 2-Player mode
            localGames += 1;
            p1LocalBoxes += p1Score;
            p2LocalBoxes += p2Score;
            if (m.playerTwo?.name) latestP2Name = m.playerTwo.name;
            if (p1Score > p1LocalHighScore) p1LocalHighScore = p1Score;
            if (p2Score > p2LocalHighScore) p2LocalHighScore = p2Score;

            if (m.winner === "p1") {
                p1LocalWins += 1;
                decisiveMargins.push(Math.abs(p1Score - p2Score));
            } else if (m.winner === "p2") {
                p2LocalWins += 1;
                decisiveMargins.push(Math.abs(p1Score - p2Score));
            } else {
                localDraws += 1;
            }
        }
    }

    // Win rates per difficulty
    for (const diff of ALL_DIFFICULTIES) {
        const dt = byDifficulty[diff];
        if (dt) {
            dt.winRate = dt.gamesPlayed > 0 ? dt.wins / dt.gamesPlayed : 0;
        }
    }

    // Streaks
    const overallStreaks = calculateStreaks(
        matches,
        (m) => m.winner === "p1",
        (m) => m.winner === "p2" || m.winner === "draw",
    );

    const aiMatches = matches.filter((m) => m.mode === "ai");
    const aiStreaks = calculateStreaks(
        aiMatches,
        (m) => m.winner === "p1",
        (m) => m.winner === "p2" || m.winner === "draw",
    );

    const totalMatches = matches.length;
    const overallWinRate = totalMatches > 0 ? overallWins / totalMatches : 0;
    const humanAiWinRate = aiGames > 0 ? humanAiWins / aiGames : 0;
    const aiWinRate = aiGames > 0 ? aiWins / aiGames : 0;
    const p1LocalWinRate = localGames > 0 ? p1LocalWins / localGames : 0;
    const p2LocalWinRate = localGames > 0 ? p2LocalWins / localGames : 0;
    const avgMargin =
        decisiveMargins.length > 0
            ? Number(
                  (
                      decisiveMargins.reduce((a, b) => a + b, 0) /
                      decisiveMargins.length
                  ).toFixed(1),
              )
            : 0;

    const p1TotalBoxes = humanAiBoxes + p1LocalBoxes;

    return {
        gamesPlayed: totalMatches,
        wins: overallWins,
        losses: overallLosses,
        draws: overallDraws,
        winRate: overallWinRate,
        totalBoxesClaimed,
        currentStreak: overallStreaks.current,
        longestStreak: overallStreaks.longest,
        vsAi: {
            gamesPlayed: aiGames,
            humanWins: humanAiWins,
            aiWins,
            draws: aiDraws,
            humanWinRate: humanAiWinRate,
            aiWinRate,
            humanBoxesClaimed: humanAiBoxes,
            aiBoxesClaimed: aiBoxes,
            humanAvgScore: aiGames > 0 ? humanAiBoxes / aiGames : 0,
            aiAvgScore: aiGames > 0 ? aiBoxes / aiGames : 0,
            humanHighScore: humanAiHighScore,
            aiHighScore,
            currentStreak: aiStreaks.current,
            longestStreak: aiStreaks.longest,
            byDifficulty,
        },
        local: {
            gamesPlayed: localGames,
            p1Wins: p1LocalWins,
            p2Wins: p2LocalWins,
            draws: localDraws,
            p1WinRate: p1LocalWinRate,
            p2WinRate: p2LocalWinRate,
            p1TotalBoxes: p1LocalBoxes,
            p2TotalBoxes: p2LocalBoxes,
            p1AvgScore: localGames > 0 ? p1LocalBoxes / localGames : 0,
            p2AvgScore: localGames > 0 ? p2LocalBoxes / localGames : 0,
            p1HighScore: p1LocalHighScore,
            p2HighScore: p2LocalHighScore,
            avgMargin,
        },
        byDifficulty,
        profiles: {
            playerOne: {
                name: latestP1Name,
                totalMatches,
                wins: overallWins,
                losses: overallLosses,
                draws: overallDraws,
                winRate: overallWinRate,
                totalBoxes: p1TotalBoxes,
                avgScore: totalMatches > 0 ? p1TotalBoxes / totalMatches : 0,
                highScore: p1GlobalHighScore,
                currentStreak: overallStreaks.current,
                longestStreak: overallStreaks.longest,
            },
            playerTwo: {
                name: latestP2Name,
                totalMatches: localGames,
                wins: p2LocalWins,
                losses: p1LocalWins,
                draws: localDraws,
                winRate: p2LocalWinRate,
                totalBoxes: p2LocalBoxes,
                avgScore: localGames > 0 ? p2LocalBoxes / localGames : 0,
                highScore: p2LocalHighScore,
                currentStreak: 0,
                longestStreak: 0,
                dominanceDiff: p2LocalWins - p1LocalWins,
            },
            ai: {
                name: "Computer AI",
                totalMatches: aiGames,
                wins: aiWins,
                losses: humanAiWins,
                draws: aiDraws,
                winRate: aiWinRate,
                totalBoxes: aiBoxes,
                avgScore: aiGames > 0 ? aiBoxes / aiGames : 0,
                highScore: aiHighScore,
                currentStreak: 0,
                longestStreak: 0,
                dominanceDiff: aiWins - humanAiWins,
            },
        },
    };
}

const MAX_SAVED_MATCHES = 50;

const statisticsSlice = createSlice({
    name: "statistics",
    initialState: initialStatisticsState,
    reducers: {
        recordGameResult(
            state,
            action: PayloadAction<RecordGamePayload | GameResult>,
        ): void {
            if (!Array.isArray(state.recentMatches)) {
                state.recentMatches = [];
            }

            let matchRecord: MatchRecord;

            if ("players" in action.payload) {
                const payload = action.payload;
                const {
                    mode: rawMode,
                    difficulty: rawDifficulty,
                    shape: rawShape,
                    boardSize: rawBoardSize,
                    players,
                    scores,
                    winner: rawWinner,
                } = payload;

                const mode = rawMode === "ai" ? "ai" : "local";
                const difficulty: Difficulty = rawDifficulty ?? "medium";
                const shape = rawShape ?? "rectangle";
                const boardSize = Number.isFinite(rawBoardSize)
                    ? (rawBoardSize ?? 6)
                    : 6;

                const p1 = players?.[0] ?? {
                    id: "p1",
                    name: "Player 1",
                    kind: "human",
                };
                const p2 = players?.[1] ?? {
                    id: "p2",
                    name: mode === "ai" ? "Computer" : "Player 2",
                    kind: mode === "ai" ? "ai" : "human",
                };

                const p1Score = Number.isFinite(scores?.p1)
                    ? Math.max(0, scores?.p1 ?? 0)
                    : 0;
                const p2Score = Number.isFinite(scores?.p2)
                    ? Math.max(0, scores?.p2 ?? 0)
                    : 0;

                const winner =
                    rawWinner === "p1" ||
                    rawWinner === "p2" ||
                    rawWinner === "draw"
                        ? rawWinner
                        : "draw";

                const winnerName =
                    winner === "draw"
                        ? "Draw"
                        : winner === "p1"
                          ? p1.name || "Player 1"
                          : p2.name ||
                            (mode === "ai" ? "Computer" : "Player 2");

                matchRecord = {
                    id: `match-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    timestamp: Date.now(),
                    mode,
                    difficulty,
                    shape,
                    boardSize,
                    playerOne: {
                        id: "p1",
                        name: p1.name || "Player 1",
                        score: p1Score,
                        kind: p1.kind ?? "human",
                    },
                    playerTwo: {
                        id: "p2",
                        name:
                            p2.name ||
                            (mode === "ai" ? "Computer" : "Player 2"),
                        score: p2Score,
                        kind: p2.kind ?? (mode === "ai" ? "ai" : "human"),
                    },
                    winner,
                    winnerName,
                };
            } else {
                // Legacy GameResult payload
                const legacy = action.payload as GameResult;
                const { outcome, difficulty, boxesClaimedByHuman } = legacy;

                const safeOutcome =
                    outcome === "win" ||
                    outcome === "loss" ||
                    outcome === "draw"
                        ? outcome
                        : "draw";
                const safeDifficulty: Difficulty = difficulty ?? "medium";
                const safeBoxes = Number.isFinite(boxesClaimedByHuman)
                    ? Math.max(0, boxesClaimedByHuman ?? 0)
                    : 0;

                const winner =
                    safeOutcome === "win"
                        ? "p1"
                        : safeOutcome === "loss"
                          ? "p2"
                          : "draw";
                const winnerName =
                    safeOutcome === "win"
                        ? "Player 1"
                        : safeOutcome === "loss"
                          ? "Computer"
                          : "Draw";

                matchRecord = {
                    id: `match-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    timestamp: Date.now(),
                    mode: "ai",
                    difficulty: safeDifficulty,
                    shape: "rectangle",
                    boardSize: 6,
                    playerOne: {
                        id: "p1",
                        name: "Player 1",
                        score: safeBoxes,
                        kind: "human",
                    },
                    playerTwo: {
                        id: "p2",
                        name: "Computer",
                        score: 0,
                        kind: "ai",
                    },
                    winner,
                    winnerName,
                };
            }

            state.recentMatches = [
                matchRecord,
                ...state.recentMatches,
            ].slice(0, MAX_SAVED_MATCHES);

            // Re-derive entire state from match records
            const derived = deriveStatisticsFromMatches(state.recentMatches);
            Object.assign(state, derived);
        },
        setStatisticsState(
            _state,
            action: PayloadAction<StatisticsState>,
        ): StatisticsState {
            const raw = action.payload;
            if (Array.isArray(raw.recentMatches) && raw.recentMatches.length > 0) {
                const derived = deriveStatisticsFromMatches(raw.recentMatches);
                return {
                    ...derived,
                    recentMatches: raw.recentMatches.slice(0, MAX_SAVED_MATCHES),
                };
            }
            return raw;
        },
        resetStatistics(): StatisticsState {
            return {
                ...initialStatisticsState,
                recentMatches: [],
            };
        },
    },
});

export const { recordGameResult, setStatisticsState, resetStatistics } =
    statisticsSlice.actions;

export default statisticsSlice.reducer;



