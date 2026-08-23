import { Button } from "@/shared/ui/Button";
import { PageContainer } from "@/shared/layout";

interface GameOverScreenProps {
    readonly players: readonly [
        { readonly id: "p1"; readonly name: string },
        { readonly id: "p2"; readonly name: string },
    ];
    readonly scores: Readonly<Record<"p1" | "p2", number>>;
    readonly winner: "p1" | "p2" | "draw" | null;
    readonly onPlayAgain: () => void;
    readonly onNewGame: () => void;
    readonly onHome: () => void;
}

export function GameOverScreen({
    players,
    scores,
    winner,
    onPlayAgain,
    onNewGame,
    onHome,
}: GameOverScreenProps) {
    const headline =
        winner === null || winner === "draw"
            ? "It's a draw!"
            : `${players.find((p) => p.id === winner)?.name ?? "Player"} wins!`;

    return (
        <PageContainer className="min-h-dvh justify-center">
            <h1 className="text-center text-4xl font-black uppercase tracking-widest">
                Game Over
            </h1>
            <p className="text-center text-xl font-bold" role="status">
                {headline}
            </p>
            <div className="grid grid-cols-2 gap-3">
                {players.map((player) => (
                    <div
                        key={player.id}
                        className="flex flex-col items-center gap-1 rounded-xl border-2 border-border bg-surface p-4 shadow-brutal"
                    >
                        <span className="truncate font-bold">
                            {player.name}
                        </span>
                        <span className="text-4xl font-black">
                            {scores[player.id]}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            boxes
                        </span>
                    </div>
                ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button onClick={onPlayAgain}>Play Again</Button>
                <Button variant="secondary" onClick={onNewGame}>
                    New Game
                </Button>
                <Button variant="ghost" onClick={onHome}>
                    Home
                </Button>
            </div>
        </PageContainer>
    );
}
