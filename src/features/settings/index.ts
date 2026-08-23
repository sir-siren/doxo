export {
    setBoardSize,
    setMode,
    setDifficulty,
    setPlayerName,
    setSoundEnabled,
    setHapticsEnabled,
    setReducedMotionOverride,
    BOARD_SIZE_MIN,
    BOARD_SIZE_MAX,
} from "./state/settings.slice";
export {
    selectSettings,
    selectBoardSize,
    selectGameMode,
} from "./state/settings.selectors";
export type {
    GameMode,
    PlayerNames,
    ReducedMotionOverride,
    SettingsState,
} from "./state/settings.types";
