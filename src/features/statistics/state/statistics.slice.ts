import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Difficulty } from "@/features/game/types/game.types";
import type {
    DifficultyTally,
    GameResult,
    StatisticsState,
} from "./statistics.types";

export const emptyDifficultyTally: DifficultyTally = {
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
};

const emptyTallies = (): Record<Difficulty, DifficultyTally> => ({
    easy: { ...emptyDifficultyTally },
    medium: { ...emptyDifficultyTally },
    hard: { ...emptyDifficultyTally },
});

export const initialStatisticsState: StatisticsState = {
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    totalBoxesClaimed: 0,
    currentStreak: 0,
    longestStreak: 0,
    byDifficulty: emptyTallies(),
};

const statisticsSlice = createSlice({
    name: "statistics",
    initialState: initialStatisticsState,
    reducers: {
        recordGameResult(state, action: PayloadAction<GameResult>): void {
            const { outcome, difficulty, boxesClaimedByHuman } = action.payload;
            const tally =
                state.byDifficulty[difficulty] ?? emptyDifficultyTally;

            state.gamesPlayed += 1;
            state.totalBoxesClaimed += boxesClaimedByHuman;

            if (outcome === "win") {
                state.wins += 1;
                state.currentStreak += 1;
                state.longestStreak = Math.max(
                    state.longestStreak,
                    state.currentStreak,
                );
            } else if (outcome === "loss") {
                state.losses += 1;
                state.currentStreak = 0;
            } else {
                state.draws += 1;
            }

            state.byDifficulty = {
                ...state.byDifficulty,
                [difficulty]: {
                    gamesPlayed: tally.gamesPlayed + 1,
                    wins: tally.wins + (outcome === "win" ? 1 : 0),
                    losses: tally.losses + (outcome === "loss" ? 1 : 0),
                    draws: tally.draws + (outcome === "draw" ? 1 : 0),
                },
            };
        },
        resetStatistics(): StatisticsState {
            return initialStatisticsState;
        },
    },
});

export const { recordGameResult, resetStatistics } = statisticsSlice.actions;

export default statisticsSlice.reducer;
