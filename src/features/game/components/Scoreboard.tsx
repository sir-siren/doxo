import { cn } from "@/shared/lib/cn";
import type { Player } from "@/features/game/types/game.types";

interface ScoreboardProps {
    players: [Player, Player];
    scores: Record<"p1" | "p2", number>;
    currentPlayer: "p1" | "p2";
    className?: string;
}

export function Scoreboard({
    players,
    scores,
    currentPlayer,
    className,
}: ScoreboardProps) {
    return (
        <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-1 md:gap-4", className)} role="status">
            {players.map((player) => {
                const isActive = player.id === currentPlayer;
                const isP1 = player.id === "p1";
                return (
                    <div
                        key={player.id}
                        aria-current={isActive}
                        className={cn(
                            "flex items-center justify-between rounded-2xl border-2 border-border bg-surface px-4 py-3 sm:px-5 sm:py-4 md:px-6 md:py-4.5 shadow-brutal-sm md:shadow-brutal transition-all duration-200",
                            isActive && "ring-4 ring-player-one/40 scale-[1.02]",
                        )}
                    >
                        <span className="flex items-center gap-3 font-bold text-base sm:text-lg md:text-xl">
                            <span
                                aria-hidden="true"
                                className={cn(
                                    "inline-block size-4 sm:size-5 rounded-full border-2 border-border shrink-0",
                                    isP1 ? "bg-player-one" : "bg-player-two",
                                )}
                            />
                            <span className="truncate max-w-[120px] sm:max-w-[160px] md:max-w-[200px]">{player.name}</span>
                            <span className="sr-only">
                                {isActive ? " (current player)" : ""}
                            </span>
                        </span>
                        <span
                            className={cn(
                                "text-2xl sm:text-3xl md:text-4xl font-black tabular-nums",
                                isP1 ? "text-player-one" : "text-player-two",
                            )}
                        >
                            {scores[player.id]}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
