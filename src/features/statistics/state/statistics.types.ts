import type { Difficulty } from "@/features/game/types/game.types";

export type GameOutcome = "win" | "loss" | "draw";

export interface DifficultyTally {
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
}

export interface StatisticsState {
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    totalBoxesClaimed: number;
    currentStreak: number;
    longestStreak: number;
    byDifficulty: Record<Difficulty, DifficultyTally>;
}

export interface GameResult {
    outcome: GameOutcome;
    difficulty: Difficulty;
    boxesClaimedByHuman: number;
}
