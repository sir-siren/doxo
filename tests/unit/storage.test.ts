import { describe, expect, it } from "vitest";
import {
    exportSaveData,
    validateAndParseSaveData,
    migrate,
    SCHEMA_VERSION,
    type PersistedState,
} from "@/shared/lib/persistence/storage";
import { initialSettingsState } from "@/features/settings/state/settings.slice";
import { initialStatisticsState } from "@/features/statistics/state/statistics.slice";

describe("save data export and import", () => {
    const mockState: PersistedState = {
        schemaVersion: SCHEMA_VERSION,
        settings: {
            ...initialSettingsState,
            theme: "dark",
            soundEnabled: false,
        },
        statistics: {
            ...initialStatisticsState,
            gamesPlayed: 5,
            wins: 4,
            losses: 1,
        },
    };

    it("serializes save data to valid JSON containing version and timestamp", () => {
        const json = exportSaveData(mockState);
        const parsed = JSON.parse(json);
        expect(parsed.schemaVersion).toBe(SCHEMA_VERSION);
        expect(parsed.settings.theme).toBe("dark");
        expect(parsed.statistics.wins).toBe(4);
        expect(parsed.exportedAt).toBeDefined();
    });

    it("validates and parses correct save data", () => {
        const json = exportSaveData(mockState);
        const result = validateAndParseSaveData(json);
        expect(result.valid).toBe(true);
        if (result.valid) {
            expect(result.data.settings.theme).toBe("dark");
            expect(result.data.statistics.wins).toBe(4);
        }
    });

    it("gracefully rejects invalid/corrupted JSON with informative error", () => {
        const result = validateAndParseSaveData("not valid json");
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.error).toContain("Malformed JSON");
        }
    });

    it("gracefully rejects JSON with missing required fields", () => {
        const result = validateAndParseSaveData(
            JSON.stringify({ someKey: "value" }),
        );
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.error).toContain("Invalid backup file");
        }
    });

    it("migrates unknown schema versions back to safe defaults", () => {
        const migrated = migrate({ schemaVersion: 999 });
        expect(migrated.schemaVersion).toBe(SCHEMA_VERSION);
        expect(migrated.settings).toEqual(initialSettingsState);
        expect(migrated.statistics).toEqual(initialStatisticsState);
    });

    it("safely parses statistics with match records retaining up to 50 recent matches", () => {
        const rawMatches = Array.from({ length: 60 }, (_, i) => ({
            id: `match-${i + 1}`,
            timestamp: 1700000000000 + i * 1000,
            mode: "ai",
            difficulty: "hard",
            shape: "rectangle",
            boardSize: 5,
            playerOne: { id: "p1", name: `Player ${i + 1}`, score: 10, kind: "human" },
            playerTwo: { id: "p2", name: "Computer", score: 5, kind: "ai" },
            winner: i < 50 ? "p1" : "p2",
            winnerName: i < 50 ? `Player ${i + 1}` : "Computer",
        }));

        const rawState = {
            schemaVersion: SCHEMA_VERSION,
            settings: initialSettingsState,
            statistics: {
                gamesPlayed: 60,
                wins: 50,
                losses: 10,
                draws: 0,
                totalBoxesClaimed: 900,
                currentStreak: 5,
                longestStreak: 12,
                vsAi: {
                    gamesPlayed: 60,
                    humanWins: 50,
                    aiWins: 10,
                    draws: 0,
                    humanBoxesClaimed: 600,
                    aiBoxesClaimed: 300,
                    currentStreak: 5,
                    longestStreak: 12,
                    byDifficulty: {
                        hard: {
                            gamesPlayed: 60,
                            wins: 50,
                            losses: 10,
                            draws: 0,
                            humanBoxes: 600,
                            aiBoxes: 300,
                        },
                    },
                },
                local: {
                    gamesPlayed: 0,
                    p1Wins: 0,
                    p2Wins: 0,
                    draws: 0,
                    p1TotalBoxes: 0,
                    p2TotalBoxes: 0,
                },
                recentMatches: rawMatches,
            },
        };

        const migrated = migrate(rawState);
        expect(migrated.statistics.gamesPlayed).toBe(60);
        expect(migrated.statistics.wins).toBe(50);
        expect(migrated.statistics.recentMatches).toHaveLength(50);
        expect(migrated.statistics.recentMatches[0]!.id).toBe("match-1");
        expect(migrated.statistics.recentMatches[49]!.id).toBe("match-50");
        expect(migrated.statistics.vsAi.byDifficulty.hard.wins).toBe(50);
    });
});

