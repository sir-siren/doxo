import type { Difficulty, PlayerKind } from "@/features/game/types/game.types";

export type GameMode = "local" | "ai";

export type ReducedMotionOverride = "system" | "on" | "off";

export type PlayerNames = Record<"p1" | "p2", string>;

export interface SettingsState {
    boardSize: number;
    mode: GameMode;
    difficulty: Difficulty;
    playerNames: PlayerNames;
    playerKinds: [PlayerKind, PlayerKind];
    soundEnabled: boolean;
    hapticsEnabled: boolean;
    reducedMotionOverride: ReducedMotionOverride;
}
