import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { PageContainer } from "@/shared/layout";
import type { Difficulty } from "@/features/game/types/game.types";
import { cn } from "@/shared/lib/cn";

export type GameMode = "local" | "ai";

interface SetupScreenProps {
    mode: GameMode;
    boardSize: number;
    difficulty: Difficulty;
    playerOneName: string;
    playerTwoName: string;
    onModeChange: (mode: GameMode) => void;
    onBoardSizeChange: (size: number) => void;
    onDifficultyChange: (difficulty: Difficulty) => void;
    onPlayerOneNameChange: (name: string) => void;
    onPlayerTwoNameChange: (name: string) => void;
    onStart: () => void;
    onBack: () => void;
}

const BOARD_SIZES = [3, 4, 5, 6, 7, 8] as const;
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

function Segmented<T extends string | number>({
    options,
    value,
    onChange,
    ariaLabel,
}: {
    options: readonly T[];
    value: T;
    onChange: (value: T) => void;
    ariaLabel: string;
}) {
    return (
        <div
            role="radiogroup"
            aria-label={ariaLabel}
            className="grid grid-flow-col auto-cols-fr gap-2"
        >
            {options.map((option) => (
                <button
                    key={String(option)}
                    type="button"
                    role="radio"
                    aria-checked={option === value}
                    onClick={() => onChange(option)}
                    className={cn(
                        "min-h-11 rounded-lg border-2 border-border px-2 text-sm font-bold uppercase shadow-brutal-sm transition-all duration-300 ease-spring active:scale-95 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
                        option === value ? "bg-player-one" : "bg-surface",
                    )}
                >
                    {option}
                </button>
            ))}
        </div>
    );
}

function NameField({
    id,
    label,
    value,
    onChange,
}: {
    readonly id: string;
    readonly label: string;
    readonly value: string;
    readonly onChange: (value: string) => void;
}) {
    return (
        <label
            htmlFor={id}
            className="flex flex-col gap-1 text-sm font-bold uppercase tracking-wide"
        >
            {label}
            <input
                id={id}
                type="text"
                value={value}
                maxLength={20}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Player name"
                className="min-h-11 rounded-lg border-2 border-border bg-surface-elevated px-3 py-2 font-medium normal-case tracking-normal outline-none focus:outline-none focus-visible:outline-none focus-visible:outline-transparent"
            />
        </label>
    );
}

export function SetupScreen(props: SetupScreenProps) {
    return (
        <PageContainer className="min-h-dvh justify-center">
            <h1 className="text-center text-3xl font-black uppercase tracking-widest">
                New Game
            </h1>
            <Card className="flex flex-col gap-5 p-6">
                <section aria-label="Game mode">
                    <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                        Mode
                    </h2>
                    <Segmented
                        options={["local", "ai"] as const}
                        value={props.mode}
                        onChange={props.onModeChange}
                        ariaLabel="Game mode"
                    />
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">
                        {props.mode === "local"
                            ? "Local 2 Player"
                            : "Player vs AI"}
                    </p>
                </section>

                <section aria-label="Board size">
                    <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                        Board size
                    </h2>
                    <Segmented
                        options={BOARD_SIZES}
                        value={props.boardSize}
                        onChange={props.onBoardSizeChange}
                        ariaLabel="Board size in boxes per side"
                    />
                </section>

                {props.mode === "ai" && (
                    <section aria-label="AI difficulty">
                        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                            AI difficulty
                        </h2>
                        <Segmented
                            options={DIFFICULTIES}
                            value={props.difficulty}
                            onChange={props.onDifficultyChange}
                            ariaLabel="AI difficulty"
                        />
                    </section>
                )}

                <section
                    aria-label="Player names"
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                    <NameField
                        id="player-one-name"
                        label={props.mode === "ai" ? "You" : "Player 1"}
                        value={props.playerOneName}
                        onChange={props.onPlayerOneNameChange}
                    />
                    <NameField
                        id="player-two-name"
                        label={props.mode === "ai" ? "Computer" : "Player 2"}
                        value={props.playerTwoName}
                        onChange={props.onPlayerTwoNameChange}
                    />
                </section>

                <div className="grid grid-cols-1 gap-3 min-[425px]:grid-cols-2">
                    <Button fullWidth onClick={props.onStart}>
                        Start Game
                    </Button>
                    <Button
                        variant="secondary"
                        fullWidth
                        onClick={props.onBack}
                    >
                        Back
                    </Button>
                </div>
            </Card>
        </PageContainer>
    );
}
