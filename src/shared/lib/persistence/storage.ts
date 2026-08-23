import type { SettingsState } from "@/features/settings/state/settings.types";
import { initialSettingsState } from "@/features/settings/state/settings.slice";
import type { StatisticsState } from "@/features/statistics/state/statistics.types";
import { initialStatisticsState } from "@/features/statistics/state/statistics.slice";
import type { Difficulty } from "@/features/game/types/game.types";
import type { DifficultyTally } from "@/features/statistics/state/statistics.types";

export const STORAGE_KEY = "doxo:app-state";

export const SCHEMA_VERSION = 1;

export interface PersistedState {
    schemaVersion: number;
    settings: SettingsState;
    statistics: StatisticsState;
}

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const isBoolean = (value: unknown): value is boolean =>
    typeof value === "boolean";

const isFiniteNumber = (value: unknown): value is number =>
    typeof value === "number" && Number.isFinite(value);

const isDifficulty = (value: unknown): value is Difficulty =>
    DIFFICULTIES.includes(value as Difficulty);

const pickBoolean = (
    source: Record<string, unknown>,
    key: string,
    fallback: boolean,
): boolean => (isBoolean(source[key]) ? (source[key] as boolean) : fallback);

const isDifficultyTally = (value: unknown): value is DifficultyTally =>
    isRecord(value) &&
    isFiniteNumber(value["gamesPlayed"]) &&
    isFiniteNumber(value["wins"]) &&
    isFiniteNumber(value["losses"]) &&
    isFiniteNumber(value["draws"]);

const parseSettings = (raw: unknown): SettingsState => {
    if (!isRecord(raw)) return initialSettingsState;
    const names = isRecord(raw["playerNames"]) ? raw["playerNames"] : {};
    const boardSize = raw["boardSize"];
    const mode = raw["mode"];
    const override = raw["reducedMotionOverride"];
    return {
        boardSize:
            isFiniteNumber(boardSize) && boardSize >= 3 && boardSize <= 8
                ? Math.trunc(boardSize)
                : initialSettingsState.boardSize,
        mode: mode === "ai" ? "ai" : "local",
        difficulty: isDifficulty(raw["difficulty"])
            ? raw["difficulty"]
            : initialSettingsState.difficulty,
        playerNames: {
            p1: typeof names["p1"] === "string" ? names["p1"] : "Player 1",
            p2: typeof names["p2"] === "string" ? names["p2"] : "Player 2",
        },
        playerKinds:
            mode === "ai"
                ? (["human", "ai"] as const)
                : (["human", "human"] as const),
        soundEnabled: pickBoolean(raw, "soundEnabled", true),
        hapticsEnabled: pickBoolean(raw, "hapticsEnabled", true),
        reducedMotionOverride:
            override === "on" || override === "off" ? override : "system",
    };
};

const parseStatistics = (raw: unknown): StatisticsState => {
    if (!isRecord(raw)) return initialStatisticsState;
    const byDifficulty = isRecord(raw["byDifficulty"])
        ? raw["byDifficulty"]
        : {};
    const tallyFor = (difficulty: Difficulty): DifficultyTally => {
        const tally = byDifficulty[difficulty];
        return isDifficultyTally(tally)
            ? tally
            : { ...initialStatisticsState.byDifficulty[difficulty] };
    };
    const intOr = (value: unknown): number =>
        isFiniteNumber(value) ? Math.max(0, Math.trunc(value)) : 0;
    return {
        gamesPlayed: intOr(raw["gamesPlayed"]),
        wins: intOr(raw["wins"]),
        losses: intOr(raw["losses"]),
        draws: intOr(raw["draws"]),
        totalBoxesClaimed: intOr(raw["totalBoxesClaimed"]),
        currentStreak: intOr(raw["currentStreak"]),
        longestStreak: intOr(raw["longestStreak"]),
        byDifficulty: {
            easy: tallyFor("easy"),
            medium: tallyFor("medium"),
            hard: tallyFor("hard"),
        },
    };
};

/**
 * Migration hook: bump SCHEMA_VERSION and add a case per legacy version.
 * Unknown/future versions reset to defaults rather than crashing.
 */
const migrate = (raw: Record<string, unknown>): PersistedState => {
    const version = isFiniteNumber(raw["schemaVersion"])
        ? Math.trunc(raw["schemaVersion"])
        : -1;

    switch (version) {
        case SCHEMA_VERSION:
            return {
                schemaVersion: SCHEMA_VERSION,
                settings: parseSettings(raw["settings"]),
                statistics: parseStatistics(raw["statistics"]),
            };
        default:
            // Unknown or missing version, reset to defaults
            return {
                schemaVersion: SCHEMA_VERSION,
                settings: initialSettingsState,
                statistics: initialStatisticsState,
            };
    }
};

export const loadPersistedState = (): PersistedState | null => {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw === null) return null;
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== "object" || parsed === null) return null;
        return migrate(parsed as Record<string, unknown>);
    } catch {
        return null;
    }
};

export const savePersistedState = (state: PersistedState): void => {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // Storage unavailable or full
    }
};

export const clearPersistedState = (): void => {
    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch {
        // Ignore if storage is unavailable
    }
};
