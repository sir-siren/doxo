import type { GameState } from "@/features/game/types/game.types";

/** "p1"/"p2" for the higher scorer, "draw" on a tie, null while unfinished. */
export const getWinner = (state: GameState): GameState["winner"] => {
    if (state.status !== "finished") return null;
    const { p1, p2 } = state.scores;
    if (p1 === p2) return "draw";
    return p1 > p2 ? "p1" : "p2";
};
