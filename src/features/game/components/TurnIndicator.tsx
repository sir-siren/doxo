import type { GameStatus, PlayerId } from "@/features/game/types/game.types";

interface TurnIndicatorProps {
    status: GameStatus;
    currentPlayerName: string;
    currentPlayer: PlayerId;
    winner: PlayerId | "draw" | null;
}

export function TurnIndicator({
    status,
    currentPlayerName,
    currentPlayer,
    winner,
}: TurnIndicatorProps) {
    let message: string;
    if (status === "finished") {
        message =
            winner === "draw"
                ? "It's a draw!"
                : `${winner === "p1" ? "Player 1" : "Player 2"} wins!`;
    } else {
        const trimmed = (currentPlayerName || "").trim();
        if (/^you$/i.test(trimmed)) {
            message = "Your turn";
        } else if (trimmed.toLowerCase().endsWith("s")) {
            message = `${trimmed}' turn`;
        } else {
            message = `${trimmed}'s turn`;
        }
    }

    return (
        <div
            className="flex w-full items-center justify-center rounded-2xl border-2 border-border bg-surface px-4 py-3 sm:py-3.5 shadow-brutal-sm md:shadow-brutal transition-all duration-300 ease-spring"
            data-player={currentPlayer}
        >
            <p
                key={message}
                className="animate-card-spring text-center text-base sm:text-lg md:text-xl font-black uppercase tracking-wider"
            >
                {message}
            </p>
        </div>
    );
}
