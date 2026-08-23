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
        message = `${currentPlayerName}'s turn`;
    }

    return (
        <div
            className="flex items-center justify-center rounded-2xl border-2 border-border bg-surface px-4 py-3 sm:py-3.5 shadow-brutal-sm md:shadow-brutal"
            data-player={currentPlayer}
        >
            <p className="text-center text-base sm:text-lg md:text-xl font-black uppercase tracking-wider">
                {message}
            </p>
        </div>
    );
}
