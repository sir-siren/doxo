import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { PageContainer } from "@/shared/layout";
import type { BoardShape, Difficulty } from "@/features/game/types/game.types";
import { BOARD_PRESETS, findPresetBySize } from "@/features/settings/constants/presets";
import { cn } from "@/shared/lib/cn";

export type GameMode = "local" | "ai";

interface SetupScreenProps {
    mode: GameMode;
    boardSize: number;
    shape: BoardShape;
    difficulty: Difficulty;
    playerOneName: string;
    playerTwoName: string;
    onModeChange: (mode: GameMode) => void;
    onBoardSizeChange: (size: number) => void;
    onShapeChange: (shape: BoardShape) => void;
    onDifficultyChange: (difficulty: Difficulty) => void;
    onPlayerOneNameChange: (name: string) => void;
    onPlayerTwoNameChange: (name: string) => void;
    onStart: () => void;
    onBack: () => void;
}

const BOARD_SIZES = [3, 4, 5, 6, 7, 8] as const;

const DIFFICULTIES: Array<{ id: Difficulty; label: string; desc: string }> = [
    { id: "easy", label: "Easy", desc: "Random casual moves" },
    { id: "medium", label: "Medium", desc: "Avoids handing free boxes" },
    { id: "hard", label: "Hard", desc: "Strategic chain management" },
    { id: "insane", label: "Insane", desc: "Minimax depth search" },
    { id: "adaptive", label: "Adaptive", desc: "Auto-scales with your win rate" },
];

const SHAPES: Array<{ id: BoardShape; label: string }> = [
    { id: "rectangle", label: "Classic" },
    { id: "triangle", label: "Triangle" },
    { id: "l-shape", label: "L-Shape" },
    { id: "hex", label: "Hexagon" },
];

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
                        "min-h-11 rounded-lg border-2 border-border px-2 text-sm font-bold uppercase shadow-brutal-sm transition-all duration-300 ease-spring active:scale-95 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none focus:outline-none focus-visible:outline-none",
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
    const activePreset = findPresetBySize(props.boardSize);
    const [showCustomSize, setShowCustomSize] = useState(!activePreset);

    return (
        <PageContainer className="min-h-dvh justify-center py-6">
            <h1 className="animate-card-spring stagger-1 text-center text-3xl font-black uppercase tracking-widest">
                New Game
            </h1>
            <Card className="animate-card-spring stagger-2 flex flex-col gap-5 p-6">
                {/* Mode Selection */}
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

                {/* Board Shape */}
                <section aria-label="Board shape">
                    <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                        Board Shape
                    </h2>
                    <div
                        role="radiogroup"
                        aria-label="Board shape"
                        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                    >
                        {SHAPES.map((shapeOpt) => (
                            <button
                                key={shapeOpt.id}
                                type="button"
                                role="radio"
                                aria-checked={props.shape === shapeOpt.id}
                                onClick={() => props.onShapeChange(shapeOpt.id)}
                                className={cn(
                                    "min-h-10 rounded-lg border-2 border-border px-2 text-xs font-bold uppercase shadow-brutal-sm transition-all duration-200 ease-spring active:translate-x-0.5 active:translate-y-0.5 focus:outline-none focus-visible:outline-none",
                                    props.shape === shapeOpt.id
                                        ? "bg-player-one"
                                        : "bg-surface opacity-80 hover:opacity-100",
                                )}
                            >
                                {shapeOpt.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Named Presets & Board Size */}
                <section aria-label="Board size">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                            Board Size ({props.boardSize}×{props.boardSize})
                        </h2>
                        <button
                            type="button"
                            onClick={() => setShowCustomSize((prev) => !prev)}
                            className="text-xs font-bold underline text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                        >
                            {showCustomSize ? "Hide Custom" : "Custom Size"}
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {BOARD_PRESETS.map((preset) => {
                            const isSelected = !showCustomSize && props.boardSize === preset.size;
                            return (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => {
                                        setShowCustomSize(false);
                                        props.onBoardSizeChange(preset.size);
                                    }}
                                    className={cn(
                                        "flex flex-col items-center justify-center rounded-xl border-2 border-border p-3 text-center shadow-brutal-sm transition-all duration-200 ease-spring active:translate-x-0.5 active:translate-y-0.5 focus:outline-none focus-visible:outline-none",
                                        isSelected
                                            ? "bg-player-one font-black scale-[1.02]"
                                            : "bg-surface hover:bg-surface-elevated",
                                    )}
                                >
                                    <span className="text-sm font-bold uppercase">{preset.name}</span>
                                    <span className="text-[11px] font-semibold text-muted-foreground">
                                        {preset.size}×{preset.size}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {showCustomSize && (
                        <div className="animate-card-spring mt-3">
                            <Segmented
                                options={BOARD_SIZES}
                                value={props.boardSize}
                                onChange={props.onBoardSizeChange}
                                ariaLabel="Custom board size in boxes per side"
                            />
                        </div>
                    )}
                </section>

                {/* AI Difficulty */}
                {props.mode === "ai" && (
                    <section aria-label="AI difficulty">
                        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                            AI Difficulty
                        </h2>
                        <div
                            role="radiogroup"
                            aria-label="AI difficulty"
                            className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5"
                        >
                            {DIFFICULTIES.map((diff) => {
                                const isSelected = props.difficulty === diff.id;
                                return (
                                    <button
                                        key={diff.id}
                                        type="button"
                                        role="radio"
                                        aria-checked={isSelected}
                                        onClick={() => props.onDifficultyChange(diff.id)}
                                        className={cn(
                                            "min-h-10 rounded-lg border-2 border-border px-2 text-xs font-bold uppercase shadow-brutal-sm transition-all duration-200 ease-spring active:translate-x-0.5 active:translate-y-0.5 focus:outline-none focus-visible:outline-none",
                                            isSelected
                                                ? "bg-player-one scale-[1.02]"
                                                : "bg-surface opacity-80 hover:opacity-100",
                                        )}
                                    >
                                        {diff.label}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="mt-1.5 text-xs font-semibold text-muted-foreground">
                            {DIFFICULTIES.find((d) => d.id === props.difficulty)?.desc}
                        </p>
                    </section>
                )}

                {/* Player Names */}
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

