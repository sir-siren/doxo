import type {
    AiStrategy,
    EdgeId,
    GameState,
    PlayerId,
} from "@/features/ai/ai.types";
import { applyMove, getValidMoves } from "@/features/game/engine/game-engine";
import { detectCompletedBoxes } from "@/features/game/engine/box-detector";
import {
    givesAwayBox,
    pickRandom,
    type Rng,
} from "@/features/ai/strategy-helpers";
import { createStrategicStrategy } from "@/features/ai/strategies/strategic-strategy";

const MAX_EXACT_EDGES = 14;
const MAX_SEARCH_DEPTH_4X4 = 5;
const MAX_SEARCH_DEPTH_5X5 = 4;

function determineMaxDepth(
    state: GameState,
    remainingEdgesCount: number,
): number {
    const maxDimension = Math.max(state.dimensions.rows, state.dimensions.cols);
    if (maxDimension <= 3 || remainingEdgesCount <= MAX_EXACT_EDGES) {
        return Math.min(10, remainingEdgesCount);
    }
    if (maxDimension === 4) {
        return Math.min(MAX_SEARCH_DEPTH_4X4, remainingEdgesCount);
    }
    if (maxDimension === 5) {
        return Math.min(MAX_SEARCH_DEPTH_5X5, remainingEdgesCount);
    }
    return 0; // Fallback to strategic heuristic for > 5x5
}

function evaluateLeaf(state: GameState, maximizingPlayer: PlayerId): number {
    const minimizingPlayer: PlayerId = maximizingPlayer === "p1" ? "p2" : "p1";
    const scoreDiff =
        (state.scores[maximizingPlayer] ?? 0) -
        (state.scores[minimizingPlayer] ?? 0);

    // If game finished, return large definitive score
    if (state.status === "finished") {
        if (state.winner === maximizingPlayer) return 1000 + scoreDiff * 10;
        if (state.winner === minimizingPlayer) return -1000 + scoreDiff * 10;
        return 0;
    }

    // Heuristic: Box score difference + count of safe moves available
    let score = scoreDiff * 50;
    const validMoves = getValidMoves(state);
    for (const edgeId of validMoves) {
        if (!givesAwayBox(state, edgeId)) {
            score += 2;
        } else {
            score -= 3;
        }
    }
    return score;
}

function orderMoves(state: GameState, validMoves: EdgeId[]): EdgeId[] {
    const scoring: EdgeId[] = [];
    const safe: EdgeId[] = [];
    const risky: EdgeId[] = [];

    for (const edgeId of validMoves) {
        if (
            detectCompletedBoxes(
                { edges: state.edges, boxes: state.boxes },
                edgeId,
            ).length > 0
        ) {
            scoring.push(edgeId);
        } else if (!givesAwayBox(state, edgeId)) {
            safe.push(edgeId);
        } else {
            risky.push(edgeId);
        }
    }

    return [...scoring, ...safe, ...risky];
}

interface MinimaxResult {
    score: number;
    bestMove: EdgeId | null;
}

function alphaBeta(
    state: GameState,
    depth: number,
    alpha: number,
    beta: number,
    maximizingPlayer: PlayerId,
): MinimaxResult {
    if (depth === 0 || state.status === "finished") {
        return { score: evaluateLeaf(state, maximizingPlayer), bestMove: null };
    }

    const validMoves = getValidMoves(state);
    if (validMoves.length === 0) {
        return { score: evaluateLeaf(state, maximizingPlayer), bestMove: null };
    }

    const orderedMoves = orderMoves(state, validMoves);
    const isMaxTurn = state.currentPlayer === maximizingPlayer;

    if (isMaxTurn) {
        let maxEval = Number.NEGATIVE_INFINITY;
        let bestMove: EdgeId | null = orderedMoves[0] ?? null;
        let currentAlpha = alpha;

        for (const edgeId of orderedMoves) {
            const next = applyMove(state, {
                edgeId,
                player: state.currentPlayer,
            });
            // Extra turn bonus: if scored, same player keeps moving
            const searchDepth = next.scored ? depth : depth - 1;
            const evalResult = alphaBeta(
                next.state,
                searchDepth,
                currentAlpha,
                beta,
                maximizingPlayer,
            );

            if (evalResult.score > maxEval) {
                maxEval = evalResult.score;
                bestMove = edgeId;
            }
            currentAlpha = Math.max(currentAlpha, evalResult.score);
            if (beta <= currentAlpha) {
                break; // Alpha-beta cutoff
            }
        }
        return { score: maxEval, bestMove };
    } else {
        let minEval = Number.POSITIVE_INFINITY;
        let bestMove: EdgeId | null = orderedMoves[0] ?? null;
        let currentBeta = beta;

        for (const edgeId of orderedMoves) {
            const next = applyMove(state, {
                edgeId,
                player: state.currentPlayer,
            });
            const searchDepth = next.scored ? depth : depth - 1;
            const evalResult = alphaBeta(
                next.state,
                searchDepth,
                alpha,
                currentBeta,
                maximizingPlayer,
            );

            if (evalResult.score < minEval) {
                minEval = evalResult.score;
                bestMove = edgeId;
            }
            currentBeta = Math.min(currentBeta, evalResult.score);
            if (currentBeta <= alpha) {
                break; // Alpha-beta cutoff
            }
        }
        return { score: minEval, bestMove };
    }
}

/** Minimax AI with alpha-beta pruning and dynamic depth cutoff. */
export function createMinimaxStrategy(rng: Rng = Math.random): AiStrategy {
    const strategicFallback = createStrategicStrategy(rng);

    return {
        name: "insane",
        selectMove(state: GameState, validMoves: EdgeId[]): EdgeId | null {
            if (validMoves.length === 0) return null;

            // Immediate score: if any move takes a box, immediately take it
            const immediateScoring = validMoves.filter(
                (id) =>
                    detectCompletedBoxes(
                        { edges: state.edges, boxes: state.boxes },
                        id,
                    ).length > 0,
            );
            if (immediateScoring.length > 0) {
                return pickRandom(immediateScoring, rng);
            }

            const maxDimension = Math.max(
                state.dimensions.rows,
                state.dimensions.cols,
            );
            if (maxDimension > 5 && validMoves.length > MAX_EXACT_EDGES) {
                return strategicFallback.selectMove(state, validMoves);
            }

            const depth = determineMaxDepth(state, validMoves.length);
            if (depth <= 0) {
                return strategicFallback.selectMove(state, validMoves);
            }

            const result = alphaBeta(
                state,
                depth,
                Number.NEGATIVE_INFINITY,
                Number.POSITIVE_INFINITY,
                state.currentPlayer,
            );

            return (
                result.bestMove ??
                strategicFallback.selectMove(state, validMoves)
            );
        },
    };
}
