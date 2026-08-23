import type { Difficulty } from "@/features/game/types/game.types";
import type { StatisticsState } from "@/features/statistics/state/statistics.types";

export interface AdaptiveDifficultyOptions {
    boardSize?: number;
}

/**
 * Resolves an effective AI difficulty based on the player's historical win rate and performance.
 *
 * Thresholds:
 * - < 3 games played: starts at "medium"
 * - Win rate >= 75%: "insane" (capped to "hard" if boardSize > 4)
 * - Win rate >= 50%: "hard"
 * - Win rate >= 30%: "medium"
 * - Win rate < 30%: "easy"
 */
export function resolveAdaptiveDifficulty(
    statistics: Pick<StatisticsState, "gamesPlayed" | "wins" | "losses" | "draws">,
    options?: AdaptiveDifficultyOptions,
): Difficulty {
    const { gamesPlayed, wins } = statistics;

    if (gamesPlayed < 3) {
        return "medium";
    }

    const winRate = wins / gamesPlayed;

    let targetDifficulty: Difficulty;
    if (winRate >= 0.75) {
        targetDifficulty = "insane";
    } else if (winRate >= 0.5) {
        targetDifficulty = "hard";
    } else if (winRate >= 0.3) {
        targetDifficulty = "medium";
    } else {
        targetDifficulty = "easy";
    }

    // Performance safeguard for large boards on Insane minimax
    if (targetDifficulty === "insane" && options?.boardSize !== undefined && options.boardSize > 4) {
        return "hard";
    }

    return targetDifficulty;
}
