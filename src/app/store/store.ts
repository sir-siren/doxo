import { configureStore } from "@reduxjs/toolkit";
import { rootReducer } from "./root-reducer";
import {
    loadPersistedState,
    savePersistedState,
    SCHEMA_VERSION,
} from "@/shared/lib/persistence/storage";

const persisted = loadPersistedState();

export const store = configureStore({
    reducer: rootReducer,
    preloadedState: persisted
        ? {
              settings: persisted.settings,
              statistics: persisted.statistics,
          }
        : undefined,
    devTools: import.meta.env.DEV,
});

store.subscribe(() => {
    const state = store.getState();
    savePersistedState({
        schemaVersion: SCHEMA_VERSION,
        settings: state.settings,
        statistics: state.statistics,
    });
});

export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
