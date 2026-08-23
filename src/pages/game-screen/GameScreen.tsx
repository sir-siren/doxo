import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { startGame, makeMove, undo } from "@/features/game/state/game.slice";
import { getValidMoves } from "@/features/game/engine/move-validator";
import { detectCompletedBoxes } from "@/features/game/engine/box-detector";
import type {
    Difficulty,
    Player,
    BoardShape,
} from "@/features/game/types/game.types";
import { createAiStrategy, resolveAdaptiveDifficulty, type AiStrategy } from "@/features/ai";
import { GameBoard } from "@/features/game/components/GameBoard";
import { Scoreboard } from "@/features/game/components/Scoreboard";
import { TurnIndicator } from "@/features/game/components/TurnIndicator";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { Logo } from "@/shared/ui/Logo";
import { PageContainer } from "@/shared/layout";
import {
    playMoveSound,
    playBoxCompletedSound,
    playVictorySound,
    playInvalidSound,
} from "@/shared/lib/sound";

export interface GameConfig {
    rows: number;
    cols: number;
    shape?: BoardShape;
    mode: "local" | "ai";
    difficulty: Difficulty;
    playerOne: Player;
    playerTwo: Player;
}

interface GameScreenProps {
    config: GameConfig;
    soundEnabled?: boolean;
    hapticsEnabled: boolean;
    motion: "system" | "on" | "off";
    onHome?: () => void;
    onBack?: () => void;
    onNewGame: () => void;
    onReplay: () => void;
    onGameOver?: (winner: "p1" | "p2" | "draw", p1Score: number, p2Score: number) => void;
}

function vibrate(pattern: number | number[], enabled: boolean): void {
    if (
        enabled &&
        typeof window !== "undefined" &&
        typeof navigator !== "undefined" &&
        "vibrate" in navigator &&
        typeof navigator.vibrate === "function"
    ) {
        try {
            navigator.vibrate(pattern);
        } catch {
            // Ignore vibration permission failures
        }
    }
}

export function GameScreen({
    config,
    soundEnabled = true,
    hapticsEnabled,
    onHome,
    onBack,
    onNewGame,
    onReplay,
    onGameOver,
}: GameScreenProps) {
    const dispatch = useAppDispatch();
    const gameSlice = useAppSelector((store) => store.game);
    const statsState = useAppSelector((store) => store.statistics);
    const state = gameSlice.current;

    const strategyRef = useRef<AiStrategy | null>(null);
    const timerRef = useRef<number | null>(null);
    const [aiThinking, setAiThinking] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const toastTimerRef = useRef<number | null>(null);
    const reportedGameOverRef = useRef(false);

    const effectiveDifficulty = useMemo<Difficulty>(() => {
        if (config.difficulty === "adaptive") {
            return resolveAdaptiveDifficulty(statsState, { boardSize: config.rows });
        }
        return config.difficulty;
    }, [config.difficulty, config.rows, statsState]);

    useEffect(() => {
        dispatch(
            startGame({
                dimensions: {
                    rows: config.rows,
                    cols: config.cols,
                    shape: config.shape ?? "rectangle",
                },
                players: [config.playerOne, config.playerTwo],
            }),
        );
    }, [dispatch, config.rows, config.cols, config.shape, config.playerOne, config.playerTwo]);

    useEffect(() => {
        return () => {
            if (toastTimerRef.current !== null)
                window.clearTimeout(toastTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (state && state.status === "finished" && state.winner !== null && !reportedGameOverRef.current) {
            reportedGameOverRef.current = true;
            playVictorySound(soundEnabled);
            vibrate([40, 60, 40, 60, 100], hapticsEnabled);
            onGameOver?.(state.winner, state.scores.p1, state.scores.p2);
        }
    }, [state, onGameOver, soundEnabled, hapticsEnabled]);

    const handleDotClick = useCallback(() => {
        if (toastTimerRef.current !== null) {
            window.clearTimeout(toastTimerRef.current);
        }
        playInvalidSound(soundEnabled);
        vibrate(40, hapticsEnabled);
        setToastMessage("Invalid move: click on a line, not a dot.");
        toastTimerRef.current = window.setTimeout(() => {
            setToastMessage(null);
            toastTimerRef.current = null;
        }, 2500);
    }, [soundEnabled, hapticsEnabled]);

    useEffect(() => {
        strategyRef.current =
            config.playerTwo.kind === "ai"
                ? createAiStrategy(effectiveDifficulty)
                : null;
        return () => {
            if (timerRef.current !== null)
                window.clearTimeout(timerRef.current);
            timerRef.current = null;
            strategyRef.current = null;
        };
    }, [config.playerTwo.kind, effectiveDifficulty]);

    const isAiTurn =
        state !== null &&
        state.status === "playing" &&
        config.mode === "ai" &&
        state.currentPlayer === "p2";

    useEffect(() => {
        if (!isAiTurn || state === null) return;
        const strategy = strategyRef.current;
        if (strategy === null) return;

        setAiThinking(true);
        timerRef.current = window.setTimeout(() => {
            setAiThinking(false);
            const validMoves = getValidMoves(state);
            const edgeId = strategy.selectMove(state, validMoves);
            if (edgeId === null) return;

            const completes = detectCompletedBoxes(
                { edges: state.edges, boxes: state.boxes },
                edgeId,
            ).length > 0;

            if (completes) {
                playBoxCompletedSound(soundEnabled);
                vibrate([30, 40, 30], hapticsEnabled);
            } else {
                playMoveSound(soundEnabled);
                vibrate(20, hapticsEnabled);
            }

            dispatch(makeMove(edgeId));
        }, 600);

        return () => {
            if (timerRef.current !== null)
                window.clearTimeout(timerRef.current);
            timerRef.current = null;
            setAiThinking(false);
        };
    }, [dispatch, isAiTurn, state, soundEnabled, hapticsEnabled]);

    const handleSelectEdge = useCallback(
        (edgeId: string) => {
            if (!state || state.status !== "playing") return;
            if (state.edges[edgeId] === undefined || state.edges[edgeId]?.owner !== null) return;
            if (config.mode === "ai" && state.currentPlayer === "p2") return;

            const completes = detectCompletedBoxes(
                { edges: state.edges, boxes: state.boxes },
                edgeId,
            ).length > 0;

            if (completes) {
                playBoxCompletedSound(soundEnabled);
                vibrate([30, 40, 30], hapticsEnabled);
            } else {
                playMoveSound(soundEnabled);
                vibrate(15, hapticsEnabled);
            }

            dispatch(makeMove(edgeId));
        },
        [dispatch, state, config.mode, soundEnabled, hapticsEnabled],
    );

    const handleUndo = useCallback(() => {
        dispatch(undo());
        playMoveSound(soundEnabled);
    }, [dispatch, soundEnabled]);

    if (!state) return null;

    const isPlayable =
        state.status === "playing" &&
        !(config.mode === "ai" && state.currentPlayer === "p2");
    const currentPlayerName =
        state.currentPlayer === "p1"
            ? (state.players[0]?.name ?? "")
            : (state.players[1]?.name ?? "");
    const winnerName =
        state.winner === null || state.winner === "draw"
            ? null
            : state.winner === "p1"
              ? state.players[0]?.name
              : state.players[1]?.name;

    const canUndo =
        gameSlice.past.length > 0 &&
        state.status === "playing" &&
        !(config.mode === "ai" && state.currentPlayer === "p2");

    const handleBackClick = onBack ?? onHome;

    return (
        <PageContainer className="min-h-dvh max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col justify-center">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 xl:gap-16 w-full my-auto">
                {/* Left Panel (Scoreboard & Controls) - 40% Width with Strict Left-Edge Alignment */}
                <div className="animate-card-spring stagger-1 w-full lg:w-[40%] lg:flex-[0_0_40%] max-w-md flex flex-col items-start gap-4">
                    {/* Top-Left Back Button */}
                    <Button
                        variant="secondary"
                        onClick={handleBackClick}
                        aria-label="Back"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-black uppercase tracking-wider shadow-brutal-sm rounded-xl border-2 border-border bg-surface"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="size-4 shrink-0"
                            aria-hidden="true"
                        >
                            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                        </svg>
                        <span>Back</span>
                    </Button>

                    {/* Scoreboard Cards */}
                    <div className="w-full">
                        <Scoreboard
                            players={state.players}
                            scores={state.scores}
                            currentPlayer={state.currentPlayer}
                        />
                    </div>

                    {/* Turn Indicator */}
                    <TurnIndicator
                        status={state.status}
                        currentPlayer={state.currentPlayer}
                        currentPlayerName={currentPlayerName}
                        winner={state.winner}
                    />

                    {/* Controls (New Game & Undo) */}
                    <div className="flex gap-3 w-full">
                        <Button variant="primary" fullWidth onClick={onReplay}>
                            New Game
                        </Button>
                        <Button
                            variant="secondary"
                            fullWidth
                            onClick={handleUndo}
                            disabled={!canUndo}
                        >
                            Undo
                        </Button>
                    </div>
                </div>

                {/* Right Panel (Game Title & Game Board) - 60% Width */}
                <div className="animate-card-spring stagger-2 w-full lg:w-[60%] lg:flex-[0_0_60%] flex flex-col items-center justify-center min-w-0">
                    {/* Game Title Centered Directly Above Grid */}
                    <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
                        <Logo className="size-7 sm:size-8 text-player-one" />
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-widest">
                            Doxo
                        </h1>
                        {aiThinking && (
                            <span className="ml-2 text-xs font-black uppercase tracking-wider text-muted-foreground bg-surface px-2.5 py-1 rounded-lg border-2 border-border shadow-brutal-sm animate-pulse">
                                AI Thinking…
                            </span>
                        )}
                    </div>

                    {/* Centered Board Grid */}
                    <div className="flex w-full items-center justify-center min-w-0">
                        <GameBoard
                            state={state}
                            isPlayable={isPlayable}
                            onSelectEdge={handleSelectEdge}
                            onDotClick={handleDotClick}
                        />
                    </div>
                </div>
            </div>

            <Modal
                open={state.status === "finished"}
                title="Game Over"
                onClose={() => undefined}
                showCloseButton={false}
            >
                <div className="mb-4 text-center">
                    <p className="text-2xl font-black uppercase">
                        {state.winner === "draw"
                            ? "It's a draw!"
                            : `${winnerName ?? ""} wins!`}
                    </p>
                    <p className="mt-2 font-semibold text-muted-foreground">
                        {state.players[0]?.name}: {state.scores.p1} ·{" "}
                        {state.players[1]?.name}: {state.scores.p2}
                    </p>
                    {config.mode === "ai" && (
                        <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            AI Level: {effectiveDifficulty}
                            {config.difficulty === "adaptive" ? " (Adaptive)" : ""}
                        </p>
                    )}
                </div>
                <div className="flex flex-col gap-3">
                    <Button fullWidth onClick={onReplay}>
                        Play Again
                    </Button>
                    <Button variant="secondary" fullWidth onClick={onNewGame}>
                        New Game
                    </Button>
                    <Button variant="ghost" fullWidth onClick={onHome}>
                        Home
                    </Button>
                </div>
            </Modal>

            {toastMessage && (
                <div
                    role="alert"
                    aria-live="assertive"
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl border-2 border-border bg-warning px-4 py-3 font-bold text-sm shadow-brutal transition-all duration-300"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="size-5 shrink-0"
                        aria-hidden="true"
                    >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    <span>{toastMessage}</span>
                </div>
            )}
        </PageContainer>
    );
}
