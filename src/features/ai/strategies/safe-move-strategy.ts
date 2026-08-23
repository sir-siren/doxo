import type { AiStrategy, EdgeId, GameState } from "@/features/ai/ai.types";
import {
    givesAwayBox,
    pickRandom,
    type Rng,
} from "@/features/ai/strategy-helpers";
import { detectCompletedBoxes } from "@/features/game/engine/box-detector";

const completesBoxes = (state: GameState, edgeId: EdgeId): boolean =>
    detectCompletedBoxes(state, edgeId).length > 0;

/**
 * Takes any immediately completable box, otherwise avoids handing the
 * opponent a third box edge when a safe move exists; otherwise plays any
 * valid move.
 */
export function createSafeMoveStrategy(rng: Rng = Math.random): AiStrategy {
    return {
        name: "safe-move",
        selectMove(state: GameState, validMoves: EdgeId[]): EdgeId | null {
            const scoring = validMoves.filter((id) =>
                completesBoxes(state, id),
            );
            if (scoring.length > 0) return pickRandom(scoring, rng);

            const safe = validMoves.filter((id) => !givesAwayBox(state, id));
            return pickRandom(safe.length > 0 ? safe : validMoves, rng);
        },
    };
}
