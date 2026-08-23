import { createBoard } from "@/features/game/engine/board-factory";
import { detectCompletedBoxes } from "@/features/game/engine/box-detector";
import { getWinner } from "@/features/game/engine/game-winner";
import { isMoveValid } from "@/features/game/engine/move-validator";
import { calculateScores } from "@/features/game/engine/score-calculator";
import type {
    ApplyMoveResult,
    BoardDimensions,
    Box,
    Edge,
    EdgeId,
    GameState,
    Move,
    Player,
} from "@/features/game/types/game.types";

const otherPlayer = (id: string): "p1" | "p2" => (id === "p1" ? "p2" : "p1");

export function createGame(
    dimensions: BoardDimensions,
    players: [Player, Player],
): GameState {
    const board = createBoard(dimensions);
    return {
        dimensions,
        edges: board.edges,
        boxes: board.boxes,
        players: [players[0], players[1]],
        currentPlayer: players[0].id,
        scores: { p1: 0, p2: 0 },
        moveHistory: [],
        status: "playing",
        winner: null,
    };
}

export { getValidMoves } from "@/features/game/engine/move-validator";

export function applyMove(state: GameState, move: Move): ApplyMoveResult {
    if (!isMoveValid(state, move.edgeId)) {
        throw new Error(`Invalid move: edge "${move.edgeId}" is not claimable`);
    }
    if (state.status !== "playing") {
        throw new Error("Game is not in progress");
    }
    const current: Edge | undefined = state.edges[move.edgeId];
    if (current === undefined) {
        throw new Error(`Unknown edge "${move.edgeId}"`);
    }
    const edges: Record<EdgeId, Edge> = { ...state.edges };
    edges[move.edgeId] = { ...current, owner: move.player };

    const completedKeys = detectCompletedBoxes(
        { edges, boxes: state.boxes },
        move.edgeId,
    );
    const boxes: Record<string, Box> = { ...state.boxes };
    for (const key of completedKeys) {
        const box: Box | undefined = boxes[key];
        if (box !== undefined) {
            boxes[key] = { ...box, owner: move.player };
        }
    }

    const scored = completedKeys.length > 0;
    const isFinished = Object.values(edges).every(
        (edge) => edge.owner !== null,
    );
    const interim: GameState = { ...state, edges, boxes };
    const scores = calculateScores(interim);
    const nextState: GameState = {
        ...interim,
        currentPlayer: scored ? move.player : otherPlayer(move.player),
        scores,
        moveHistory: [...state.moveHistory, move],
        status: isFinished ? "finished" : "playing",
        winner: isFinished
            ? getWinner({ ...state, status: "finished", scores })
            : null,
    };
    return { state: nextState, completedBoxes: completedKeys, scored };
}
