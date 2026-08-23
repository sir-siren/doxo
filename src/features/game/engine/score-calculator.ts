import type { GameState, PlayerId } from "@/features/game/types/game.types";

export type ScoreMap = Record<PlayerId, number>;

export const calculateScores = (state: GameState): ScoreMap => {
    const scores: Record<PlayerId, number> = { p1: 0, p2: 0 };
    for (const box of Object.values(state.boxes)) {
        if (box.owner !== null) scores[box.owner] += 1;
    }
    return scores;
};
