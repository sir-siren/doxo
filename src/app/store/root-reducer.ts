import { combineReducers } from "@reduxjs/toolkit";
import gameReducer from "@/features/game/state/game.slice";
import settingsReducer from "@/features/settings/state/settings.slice";
import statisticsReducer from "@/features/statistics/state/statistics.slice";

export const rootReducer = combineReducers({
    game: gameReducer,
    settings: settingsReducer,
    statistics: statisticsReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
