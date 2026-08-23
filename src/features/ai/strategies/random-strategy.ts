import type { AiStrategy, EdgeId, GameState } from "@/features/ai/ai.types";
import { pickRandom, type Rng } from "@/features/ai/strategy-helpers";

export function createRandomStrategy(rng: Rng = Math.random): AiStrategy {
    return {
        name: "random",
        selectMove(state: GameState, validMoves: EdgeId[]): EdgeId | null {
            void state;
            return pickRandom(validMoves, rng);
        },
    };
}

