import type { PlayerId } from "@/features/game/types/game.types";

export function edgePreviewClass(currentPlayer: PlayerId): string {
    return currentPlayer === "p1" ? "stroke-player-one" : "stroke-player-two";
}
