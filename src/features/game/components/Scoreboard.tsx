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
        <div className={cn("flex flex-col gap-3", className)} role="status">
            {players.map((player) => {
                const isActive = player.id === currentPlayer;
                const isP1 = player.id === "p1";
                return (
                    <div
                        key={player.id}
                        aria-current={isActive}
                        className={cn(
                            "flex items-center justify-between rounded-2xl border-2 border-border bg-surface px-4 py-3 sm:px-5 sm:py-4 md:px-6 md:py-4.5 shadow-brutal-sm md:shadow-brutal transition-all duration-300 ease-spring",
                            isActive && "ring-4 ring-player-one/40 scale-[1.03] -translate-y-0.5",
                        )}
                    >
                        <span className="flex items-center gap-3 font-bold text-base sm:text-lg md:text-xl">
                            <span
                                aria-hidden="true"
                                className={cn(
                                    "inline-block size-4 sm:size-5 rounded-full border-2 border-border shrink-0 transition-transform duration-200 ease-spring",
                                    isP1 ? "bg-player-one" : "bg-player-two",
                                    isActive && "scale-110",
                                )}
                            />
                            <span className="truncate max-w-[120px] sm:max-w-[160px] md:max-w-[200px]">{player.name}</span>
                            <span className="sr-only">
                                {isActive ? " (current player)" : ""}
                            </span>
                        </span>
                        <span
                            key={`score-${scores[player.id]}`}
                            className={cn(
                                "animate-score-bump text-2xl sm:text-3xl md:text-4xl font-black tabular-nums transition-all",
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
