import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Difficulty } from "@/features/game/types/game.types";
import type {
    GameMode,
    ReducedMotionOverride,
    SettingsState,
    ThemeName,
} from "./settings.types";

export const BOARD_SIZE_MIN = 3;
export const BOARD_SIZE_MAX = 8;

export const DEFAULT_PLAYER_NAMES = { p1: "Player 1", p2: "Player 2" } as const;

export const initialSettingsState: SettingsState = {
    boardSize: 6,
    mode: "local",
    difficulty: "medium",
    theme: "default",
    playerNames: DEFAULT_PLAYER_NAMES,
    playerKinds: ["human", "human"],
    soundEnabled: true,
    hapticsEnabled: true,
    reducedMotionOverride: "system",
};

const clampBoardSize = (value: number): number =>
    Math.min(BOARD_SIZE_MAX, Math.max(BOARD_SIZE_MIN, Math.trunc(value)));

const settingsSlice = createSlice({
    name: "settings",
    initialState: initialSettingsState,
    reducers: {
        setBoardSize(state, action: PayloadAction<number>): void {
            state.boardSize = clampBoardSize(action.payload);
        },
        setMode(state, action: PayloadAction<GameMode>): void {
            state.mode = action.payload;
            state.playerKinds =
                action.payload === "ai" ? ["human", "ai"] : ["human", "human"];
        },
        setDifficulty(state, action: PayloadAction<Difficulty>): void {
            state.difficulty = action.payload;
        },
        setPlayerName(
            state,
            action: PayloadAction<{ player: "p1" | "p2"; name: string }>,
        ): void {
            const trimmed = action.payload.name.trim();
            state.playerNames = {
                ...state.playerNames,
                [action.payload.player]:
                    trimmed.length > 0 ? trimmed : "Player",
            };
        },
        setTheme(state, action: PayloadAction<ThemeName>): void {
            state.theme = action.payload;
        },
        setSoundEnabled(state, action: PayloadAction<boolean>): void {
            state.soundEnabled = action.payload;
        },
        setHapticsEnabled(state, action: PayloadAction<boolean>): void {
            state.hapticsEnabled = action.payload;
        },
        setReducedMotionOverride(
            state,
            action: PayloadAction<ReducedMotionOverride>,
        ): void {
            state.reducedMotionOverride = action.payload;
        },
        setSettingsState(_state, action: PayloadAction<SettingsState>): SettingsState {
            return action.payload;
        },
        resetSettings(): SettingsState {
            return initialSettingsState;
        },
    },
});

export const {
    setBoardSize,
    setMode,
    setDifficulty,
    setTheme,
    setPlayerName,
    setSoundEnabled,
    setHapticsEnabled,
    setReducedMotionOverride,
    setSettingsState,
    resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
