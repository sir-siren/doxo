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
});
