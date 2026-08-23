import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store/root-reducer";
import type { SettingsState } from "./settings.types";

export const selectSettings = (state: RootState): SettingsState =>
    state.settings;

export const selectBoardSize = createSelector(
    selectSettings,
    (settings): number => settings.boardSize,
);

export const selectGameMode = createSelector(
    selectSettings,
    (settings): SettingsState["mode"] => settings.mode,
);
