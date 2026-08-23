import { Button } from "@/shared/ui/Button";
import { PageContainer } from "@/shared/layout";
import { cn } from "@/shared/lib/cn";

interface GameOverScreenProps {
    readonly players: readonly [
        { readonly id: "p1"; readonly name: string },
        { readonly id: "p2"; readonly name: string },
    ];
    readonly scores: Readonly<Record<"p1" | "p2", number>>;
    readonly winner: "p1" | "p2" | "draw" | null;
    readonly difficultyLabel?: string;
    readonly onPlayAgain: () => void;
    readonly onNewGame: () => void;
    readonly onHome: () => void;
}

export function GameOverScreen({
    players,
    scores,
    winner,
    difficultyLabel,
    onPlayAgain,
    onNewGame,
    onHome,
}: GameOverScreenProps) {
    const headline =
        winner === null || winner === "draw"
            ? "It's a draw!"
            : `${players.find((p) => p.id === winner)?.name ?? "Player"} wins!`;

    return (
        <PageContainer className="min-h-dvh justify-center py-8">
            <h1 className="animate-card-spring stagger-1 text-center text-4xl font-black uppercase tracking-widest">
                Game Over
            </h1>
            <div className="animate-badge-pop flex flex-col items-center gap-1">
                <p
                    className="text-center text-2xl font-black uppercase"
                    role="status"
                >
                    {headline}
                </p>
                {difficultyLabel && (
                    <p className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {difficultyLabel}
                    </p>
                )}
            </div>
            <div className="animate-card-spring stagger-2 grid grid-cols-2 gap-3">
                {players.map((player) => (
                    <div
                        key={player.id}
                        className={cn(
                            "flex flex-col items-center gap-1 rounded-xl border-2 border-border p-4 shadow-brutal transition-all duration-300 ease-spring",
                            winner === player.id
                                ? "bg-surface-elevated ring-2 ring-foreground"
                                : "bg-surface",
                        )}
                    >
                        <span className="truncate font-bold">
                            {player.name}
                        </span>
                        <span className="animate-score-bump text-4xl font-black tabular-nums">
                            {scores[player.id]}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            boxes
                        </span>
                    </div>
                ))}
            </div>
            <div className="animate-card-spring stagger-3 flex flex-col gap-3 sm:flex-row sm:justify-center">
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
