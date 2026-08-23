import type { AiStrategy, EdgeId, GameState } from "@/features/ai/ai.types";
import {
    boxesGivenAwayAfter,
    givesAwayBox,
    pickRandom,
    type Rng,
} from "@/features/ai/strategy-helpers";
import { detectCompletedBoxes } from "@/features/game/engine/box-detector";

const completesBoxes = (state: GameState, edgeId: EdgeId): boolean =>
    detectCompletedBoxes(state, edgeId).length > 0;

/** Chain-aware endgame: when forced to open, open the cheapest chain. */
export function createStrategicStrategy(rng: Rng = Math.random): AiStrategy {
    return {
        name: "strategic",
        selectMove(state: GameState, validMoves: EdgeId[]): EdgeId | null {
            const scoring = validMoves.filter((id) =>
                completesBoxes(state, id),
            );
            if (scoring.length > 0) return pickRandom(scoring, rng);

            const safe = validMoves.filter((id) => !givesAwayBox(state, id));
            if (safe.length > 0) return pickRandom(safe, rng);

            let best: EdgeId | null = null;
            let bestCost = Number.POSITIVE_INFINITY;
            for (const id of validMoves) {
                const cost = boxesGivenAwayAfter(state, id);
                if (cost < bestCost) {
                    bestCost = cost;
                    best = id;
                }
            }
            return best ?? pickRandom(validMoves, rng);
        },
    };
}
