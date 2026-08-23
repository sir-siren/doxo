export {
    startGame,
    makeMove,
    undo,
    redo,
    pauseGame,
    resumeGame,
    MAX_UNDO_HISTORY,
} from "./state/game.slice";
export type { GameSliceState, StartGameConfig } from "./state/game.slice";
export {
    selectGameState,
    selectCurrentPlayer,
    selectScores,
    selectAvailableMoves,
    selectGameStatus,
    selectWinner,
    selectCompletedBoxesByPlayer,
} from "./state/game.selectors";
export type { PlayerId } from "./types/game.types";
