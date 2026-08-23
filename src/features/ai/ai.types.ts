import type {
    Difficulty,
    EdgeId,
    GameState,
} from "@/features/game/types/game.types";

export interface AiStrategy {
    name: string;
    selectMove(state: GameState, validMoves: EdgeId[]): EdgeId | null;
}

export type Rng = () => number;

export type DifficultyMap = Record<Difficulty, string>;

export type {
    Difficulty,
    EdgeId,
    GameState,
} from "@/features/game/types/game.types";

