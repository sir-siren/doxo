export {
    horizontalEdgeId,
    verticalEdgeId,
    boxKey,
    boxEdges,
    createBoard,
} from "@/features/game/engine/board-factory";
export { isMoveValid } from "@/features/game/engine/move-validator";
export { detectCompletedBoxes } from "@/features/game/engine/box-detector";
export { calculateScores } from "@/features/game/engine/score-calculator";
export { getWinner } from "@/features/game/engine/game-winner";
export {
    applyMove,
    createGame,
    getValidMoves,
} from "@/features/game/engine/game-engine";
