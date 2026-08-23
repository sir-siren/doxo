import type { AiStrategy, Difficulty, Rng } from "@/features/ai/ai.types";
import { createRandomStrategy } from "@/features/ai/strategies/random-strategy";
import { createSafeMoveStrategy } from "@/features/ai/strategies/safe-move-strategy";
import { createStrategicStrategy } from "@/features/ai/strategies/strategic-strategy";

/** Builds the AI strategy matching a difficulty level. */
export function createAiStrategy(
    difficulty: Difficulty,
    rng?: Rng,
): AiStrategy {
    const injectRng = rng ?? Math.random;
    switch (difficulty) {
        case "easy":
            return createRandomStrategy(injectRng);
        case "medium":
            return createSafeMoveStrategy(injectRng);
        case "hard":
            return createStrategicStrategy(injectRng);
        default: {
            const unhandled: never = difficulty;
            throw new Error(`Unhandled difficulty: ${String(unhandled)}`);
        }
    }
}

export type { AiStrategy, Difficulty, Rng } from "@/features/ai/ai.types";
export { createRandomStrategy } from "@/features/ai/strategies/random-strategy";
export { createSafeMoveStrategy } from "@/features/ai/strategies/safe-move-strategy";
export { createStrategicStrategy } from "@/features/ai/strategies/strategic-strategy";
