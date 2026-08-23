import type {
    SettingsState,
    ThemeName,
} from "@/features/settings/state/settings.types";
import { initialSettingsState } from "@/features/settings/state/settings.slice";
import type {
    DifficultyTally,
    LocalStats,
    MatchRecord,
    StatisticsState,
    VsAiStats,
} from "@/features/statistics/state/statistics.types";
import {
    deriveStatisticsFromMatches,
    emptyDifficultyTally,
    emptyLocalStats,
    emptyVsAiStats,
    initialStatisticsState,
} from "@/features/statistics/state/statistics.slice";
import type { BoardShape, Difficulty } from "@/features/game/types/game.types";

export const STORAGE_KEY = "doxo:app-state";

export const SCHEMA_VERSION = 2;

export const MAX_PERSISTED_MATCHES = 50;

export interface PersistedState {
    schemaVersion: number;
    settings: SettingsState;
    statistics: StatisticsState;
    exportedAt?: string;
}

const DIFFICULTIES: Difficulty[] = [
    "easy",
    "medium",
    "hard",
    "insane",
    "adaptive",
];
const THEMES: ThemeName[] = ["default", "minimal", "dark", "colorblind"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const isBoolean = (value: unknown): value is boolean =>
    typeof value === "boolean";

const isFiniteNumber = (value: unknown): value is number =>
    typeof value === "number" && Number.isFinite(value);

const isDifficulty = (value: unknown): value is Difficulty =>
    DIFFICULTIES.includes(value as Difficulty);

const isTheme = (value: unknown): value is ThemeName =>
    THEMES.includes(value as ThemeName);

const pickBoolean = (
    source: Record<string, unknown>,
    key: string,
    fallback: boolean,
): boolean => (isBoolean(source[key]) ? (source[key] as boolean) : fallback);

export const isDifficultyTally = (value: unknown): value is DifficultyTally =>
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
    const theme = raw["theme"];
    return {
        boardSize:
            isFiniteNumber(boardSize) && boardSize >= 3 && boardSize <= 8
                ? Math.trunc(boardSize)
                : initialSettingsState.boardSize,
        mode: mode === "ai" ? "ai" : "local",
        difficulty: isDifficulty(raw["difficulty"])
            ? raw["difficulty"]
            : initialSettingsState.difficulty,
        theme: isTheme(theme) ? theme : initialSettingsState.theme,
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

const intOr = (value: unknown): number =>
    isFiniteNumber(value) ? Math.max(0, Math.trunc(value)) : 0;

const parseDifficultyTally = (raw: unknown): DifficultyTally => {
    if (!isRecord(raw)) return { ...emptyDifficultyTally };
    const gamesPlayed = intOr(raw["gamesPlayed"]);
    const wins = intOr(raw["wins"]);
    return {
        gamesPlayed,
        wins,
        losses: intOr(raw["losses"]),
        draws: intOr(raw["draws"]),
        humanBoxes: intOr(raw["humanBoxes"]),
        aiBoxes: intOr(raw["aiBoxes"]),
        winRate: gamesPlayed > 0 ? wins / gamesPlayed : 0,
    };
};

const parseVsAiStats = (
    raw: unknown,
    legacyByDiff?: Record<Difficulty, DifficultyTally>,
): VsAiStats => {
    const base = emptyVsAiStats();
    if (!isRecord(raw)) {
        if (legacyByDiff) {
            base.byDifficulty = legacyByDiff;
        }
        return base;
    }
    const byDifficultyRaw = isRecord(raw["byDifficulty"])
        ? (raw["byDifficulty"] as Record<string, unknown>)
        : (legacyByDiff ?? {});
    const byDifficulty: Record<Difficulty, DifficultyTally> = {
        easy: parseDifficultyTally(byDifficultyRaw["easy"]),
        medium: parseDifficultyTally(byDifficultyRaw["medium"]),
        hard: parseDifficultyTally(byDifficultyRaw["hard"]),
        insane: parseDifficultyTally(byDifficultyRaw["insane"]),
        adaptive: parseDifficultyTally(byDifficultyRaw["adaptive"]),
    };

    const gamesPlayed = intOr(raw["gamesPlayed"]);
    const humanWins = intOr(raw["humanWins"]);
    const aiWins = intOr(raw["aiWins"]);
    const humanBoxesClaimed = intOr(raw["humanBoxesClaimed"]);
    const aiBoxesClaimed = intOr(raw["aiBoxesClaimed"]);

    return {
        gamesPlayed,
        humanWins,
        aiWins,
        draws: intOr(raw["draws"]),
        humanWinRate: gamesPlayed > 0 ? humanWins / gamesPlayed : 0,
        aiWinRate: gamesPlayed > 0 ? aiWins / gamesPlayed : 0,
        humanBoxesClaimed,
        aiBoxesClaimed,
        humanAvgScore: gamesPlayed > 0 ? humanBoxesClaimed / gamesPlayed : 0,
        aiAvgScore: gamesPlayed > 0 ? aiBoxesClaimed / gamesPlayed : 0,
        humanHighScore: intOr(raw["humanHighScore"]),
        aiHighScore: intOr(raw["aiHighScore"]),
        currentStreak: intOr(raw["currentStreak"]),
        longestStreak: intOr(raw["longestStreak"]),
        byDifficulty,
    };
};

const parseLocalStats = (raw: unknown): LocalStats => {
    if (!isRecord(raw)) return emptyLocalStats();
    const gamesPlayed = intOr(raw["gamesPlayed"]);
    const p1Wins = intOr(raw["p1Wins"]);
    const p2Wins = intOr(raw["p2Wins"]);
    const p1TotalBoxes = intOr(raw["p1TotalBoxes"]);
    const p2TotalBoxes = intOr(raw["p2TotalBoxes"]);

    return {
        gamesPlayed,
        p1Wins,
        p2Wins,
        draws: intOr(raw["draws"]),
        p1WinRate: gamesPlayed > 0 ? p1Wins / gamesPlayed : 0,
        p2WinRate: gamesPlayed > 0 ? p2Wins / gamesPlayed : 0,
        p1TotalBoxes,
        p2TotalBoxes,
        p1AvgScore: gamesPlayed > 0 ? p1TotalBoxes / gamesPlayed : 0,
        p2AvgScore: gamesPlayed > 0 ? p2TotalBoxes / gamesPlayed : 0,
        p1HighScore: intOr(raw["p1HighScore"]),
        p2HighScore: intOr(raw["p2HighScore"]),
        avgMargin: isFiniteNumber(raw["avgMargin"]) ? Number(raw["avgMargin"]) : 0,
    };
};

export const parseMatchRecord = (raw: unknown): MatchRecord | null => {
    if (!isRecord(raw)) return null;
    if (typeof raw["id"] !== "string" || !isFiniteNumber(raw["timestamp"]))
        return null;
    const mode = raw["mode"] === "ai" ? "ai" : "local";
    const difficulty = isDifficulty(raw["difficulty"])
        ? raw["difficulty"]
        : "medium";
    const shape: BoardShape =
        raw["shape"] === "triangle" ||
        raw["shape"] === "l-shape" ||
        raw["shape"] === "hex"
            ? raw["shape"]
            : "rectangle";
    const boardSize = isFiniteNumber(raw["boardSize"])
        ? Math.trunc(raw["boardSize"])
        : 6;
    const p1Raw = isRecord(raw["playerOne"]) ? raw["playerOne"] : {};
    const p2Raw = isRecord(raw["playerTwo"]) ? raw["playerTwo"] : {};
    const winnerRaw = raw["winner"];
    const winner: "p1" | "p2" | "draw" =
        winnerRaw === "p1" || winnerRaw === "p2" || winnerRaw === "draw"
            ? winnerRaw
            : "draw";

    const p1Name =
        typeof p1Raw["name"] === "string" ? p1Raw["name"] : "Player 1";
    const p2Name =
        typeof p2Raw["name"] === "string"
            ? p2Raw["name"]
            : mode === "ai"
              ? "Computer"
              : "Player 2";

    const winnerName =
        typeof raw["winnerName"] === "string"
            ? raw["winnerName"]
            : winner === "draw"
              ? "Draw"
              : winner === "p1"
                ? p1Name
                : p2Name;

    return {
        id: raw["id"],
        timestamp: raw["timestamp"],
        mode,
        difficulty,
        shape,
        boardSize,
        playerOne: {
            id: "p1",
            name: p1Name,
            score: intOr(p1Raw["score"]),
            kind: p1Raw["kind"] === "ai" ? "ai" : "human",
        },
        playerTwo: {
            id: "p2",
            name: p2Name,
            score: intOr(p2Raw["score"]),
            kind: p2Raw["kind"] === "ai" ? "ai" : "human",
        },
        winner,
        winnerName,
    };
};

export const parseStatistics = (raw: unknown): StatisticsState => {
    if (!isRecord(raw)) return initialStatisticsState;

    const recentMatchesRaw = Array.isArray(raw["recentMatches"])
        ? raw["recentMatches"]
        : Array.isArray(raw["matches"])
          ? raw["matches"]
          : [];

    const recentMatches: MatchRecord[] = [];
    for (const item of recentMatchesRaw) {
        const parsed = parseMatchRecord(item);
        if (parsed) recentMatches.push(parsed);
    }

    if (recentMatches.length > 0) {
        const derived = deriveStatisticsFromMatches(recentMatches);
        return {
            ...derived,
            recentMatches: recentMatches.slice(0, MAX_PERSISTED_MATCHES),
        };
    }

    // Fallback for legacy state without match logs
    const byDifficultyRaw = isRecord(raw["byDifficulty"])
        ? (raw["byDifficulty"] as Record<string, unknown>)
        : {};
    const byDifficulty: Record<Difficulty, DifficultyTally> = {
        easy: parseDifficultyTally(byDifficultyRaw["easy"]),
        medium: parseDifficultyTally(byDifficultyRaw["medium"]),
        hard: parseDifficultyTally(byDifficultyRaw["hard"]),
        insane: parseDifficultyTally(byDifficultyRaw["insane"]),
        adaptive: parseDifficultyTally(byDifficultyRaw["adaptive"]),
    };

    const vsAi = parseVsAiStats(raw["vsAi"], byDifficulty);
    const local = parseLocalStats(raw["local"]);

    const gamesPlayed = intOr(raw["gamesPlayed"]);
    const wins = intOr(raw["wins"]);

    return {
        gamesPlayed,
        wins,
        losses: intOr(raw["losses"]),
        draws: intOr(raw["draws"]),
        winRate: gamesPlayed > 0 ? wins / gamesPlayed : 0,
        totalBoxesClaimed: intOr(raw["totalBoxesClaimed"]),
        currentStreak: intOr(raw["currentStreak"]),
        longestStreak: intOr(raw["longestStreak"]),
        vsAi,
        local,
        byDifficulty,
        profiles: {
            playerOne: {
                name: "Player 1",
                totalMatches: gamesPlayed,
                wins,
                losses: intOr(raw["losses"]),
                draws: intOr(raw["draws"]),
                winRate: gamesPlayed > 0 ? wins / gamesPlayed : 0,
                totalBoxes: intOr(raw["totalBoxesClaimed"]),
                avgScore: gamesPlayed > 0 ? intOr(raw["totalBoxesClaimed"]) / gamesPlayed : 0,
                highScore: 0,
                currentStreak: intOr(raw["currentStreak"]),
                longestStreak: intOr(raw["longestStreak"]),
            },
            playerTwo: {
                name: "Player 2",
                totalMatches: local.gamesPlayed,
                wins: local.p2Wins,
                losses: local.p1Wins,
                draws: local.draws,
                winRate: local.p2WinRate ?? (local.gamesPlayed > 0 ? local.p2Wins / local.gamesPlayed : 0),
                totalBoxes: local.p2TotalBoxes,
                avgScore: local.p2AvgScore ?? (local.gamesPlayed > 0 ? local.p2TotalBoxes / local.gamesPlayed : 0),
                highScore: local.p2HighScore ?? 0,
                currentStreak: 0,
                longestStreak: 0,
                dominanceDiff: local.p2Wins - local.p1Wins,
            },
            ai: {
                name: "Computer AI",
                totalMatches: vsAi.gamesPlayed,
                wins: vsAi.aiWins,
                losses: vsAi.humanWins,
                draws: vsAi.draws,
                winRate: vsAi.aiWinRate ?? (vsAi.gamesPlayed > 0 ? vsAi.aiWins / vsAi.gamesPlayed : 0),
                totalBoxes: vsAi.aiBoxesClaimed,
                avgScore: vsAi.aiAvgScore ?? (vsAi.gamesPlayed > 0 ? vsAi.aiBoxesClaimed / vsAi.gamesPlayed : 0),
                highScore: vsAi.aiHighScore ?? 0,
                currentStreak: 0,
                longestStreak: 0,
                dominanceDiff: vsAi.aiWins - vsAi.humanWins,
            },
        },
        recentMatches: [],
    };
};

/**
 * Migration hook: bump SCHEMA_VERSION and add a case per legacy version.
 * Unknown/future versions reset to defaults rather than crashing.
 */
export const migrate = (raw: Record<string, unknown>): PersistedState => {
    const version = isFiniteNumber(raw["schemaVersion"])
        ? Math.trunc(raw["schemaVersion"])
        : -1;

    switch (version) {
        case 1:
        case 2:
            return {
                schemaVersion: SCHEMA_VERSION,
                settings: parseSettings(raw["settings"]),
                statistics: parseStatistics(raw["statistics"]),
                exportedAt:
                    typeof raw["exportedAt"] === "string"
                        ? raw["exportedAt"]
                        : undefined,
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

/** Export save data as formatted JSON string. */
export const exportSaveData = (state: PersistedState): string => {
    const exportPayload: PersistedState = {
        ...state,
        schemaVersion: SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(exportPayload, null, 2);
};

/** Validates and parses JSON save data before applying. */
export const validateAndParseSaveData = (
    rawJson: string,
): { valid: true; data: PersistedState } | { valid: false; error: string } => {
    try {
        const parsed: unknown = JSON.parse(rawJson);
        if (!isRecord(parsed)) {
            return {
                valid: false,
                error: "Invalid file format: root object is missing.",
            };
        }
        if (
            !("schemaVersion" in parsed) ||
            !isFiniteNumber(parsed["schemaVersion"])
        ) {
            return {
                valid: false,
                error: "Invalid backup file: schemaVersion is missing or invalid.",
            };
        }
        if (!("settings" in parsed) || !isRecord(parsed["settings"])) {
            return {
                valid: false,
                error: "Invalid backup file: settings payload is missing.",
            };
        }
        if (!("statistics" in parsed) || !isRecord(parsed["statistics"])) {
            return {
                valid: false,
                error: "Invalid backup file: statistics payload is missing.",
            };
        }

        const data = migrate(parsed);
        return { valid: true, data };
    } catch {
        return {
            valid: false,
            error: "Malformed JSON file. Please select a valid Doxo backup file.",
        };
    }
};

/** Triggers a browser file download for a JSON string. */
export const triggerJsonDownload = (
    filename: string,
    jsonContent: string,
): void => {
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

