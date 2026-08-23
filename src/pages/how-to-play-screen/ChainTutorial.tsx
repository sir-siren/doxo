import { useState, useCallback } from "react";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { GameBoard } from "@/features/game/components/GameBoard";
import { createGame, applyMove } from "@/features/game/engine/game-engine";
import type { GameState, EdgeId } from "@/features/game/types/game.types";

interface Scenario {
    id: number;
    title: string;
    description: string;
    instructions: string;
    setupMoves: EdgeId[];
    targetEdgeId: EdgeId;
    successMessage: string;
    failureMessage: string;
    dimensions: { rows: number; cols: number };
}

const DEFAULT_SCENARIO: Scenario = {
    id: 1,
    title: "Lesson 1: Making Safe Moves",
    description:
        "In the early game, claim edges that create the 1st or 2nd side of a box. Never make the 3rd side unless forced!",
    instructions:
        "Find and claim the safe edge that does NOT create a dangerous 3-sided box.",
    setupMoves: ["H-0-0", "V-0-0", "H-1-0", "H-0-1"],
    targetEdgeId: "V-1-1",
    successMessage:
        "Excellent! That move created only a 2nd side, leaving your opponent no easy captures.",
    failureMessage:
        "Watch out! That move created a 3rd side on a box, allowing your opponent to score immediately.",
    dimensions: { rows: 2, cols: 2 },
};

const SCENARIOS: readonly Scenario[] = [
    DEFAULT_SCENARIO,
    {
        id: 2,
        title: "Lesson 2: Seizing 3-Sided Boxes",
        description:
            "When a box has 3 sides completed, closing the 4th side scores 1 point and awards you an extra turn immediately.",
        instructions:
            "Close the open 3-sided box to claim it and keep the turn.",
        setupMoves: ["H-0-0", "V-0-0", "H-1-0"],
        targetEdgeId: "V-0-1",
        successMessage:
            "Great job! You claimed the box and gained the bonus turn to keep playing.",
        failureMessage:
            "Missed opportunity! That 3-sided box was waiting to be claimed.",
        dimensions: { rows: 2, cols: 2 },
    },
    {
        id: 3,
        title: "Lesson 3: Chain Sacrifice",
        description:
            "Sacrificing a small 2-box corridor is often better than breaking open a huge multi-box chain for your opponent.",
        instructions:
            "Play the sacrifice move on the small branch to preserve your control over the board.",
        setupMoves: ["H-0-0", "V-0-0", "V-0-2", "H-1-1", "V-1-0", "H-2-1"],
        targetEdgeId: "H-1-0",
        successMessage:
            "Masterful! By giving away a tiny 2-box sacrifice, you force your opponent to open up the remaining board for you.",
        failureMessage:
            "That opened a longer chain! Sacrificing the shorter side keeps you in control.",
        dimensions: { rows: 2, cols: 2 },
    },
    {
        id: 4,
        title: "Lesson 4: Chain Sweeping",
        description:
            "Because every completed box gives another turn, a connected series of 3-sided boxes can be swept in a single turn!",
        instructions:
            "Start the cascade by claiming the first open box edge and sweeping through.",
        setupMoves: ["H-0-0", "V-0-0", "H-1-0", "V-0-1", "H-1-1", "H-0-1"],
        targetEdgeId: "V-0-2",
        successMessage:
            "Brilliant sweep! You chained consecutive bonus turns to claim the entire section.",
        failureMessage:
            "Try starting with the open chain edge to trigger consecutive box captures!",
        dimensions: { rows: 2, cols: 2 },
    },
];

function buildScenarioState(scenario: Scenario): GameState {
    let state = createGame(scenario.dimensions, [
        { id: "p1", name: "You", kind: "human" },
        { id: "p2", name: "Coach", kind: "ai" },
    ]);

    for (const edgeId of scenario.setupMoves) {
        if (state.edges[edgeId] && state.edges[edgeId]?.owner === null) {
            state = applyMove(state, { edgeId, player: "p2" }).state;
        }
    }
    return { ...state, currentPlayer: "p1" };
}

export function ChainTutorial() {
    const [currentStep, setCurrentStep] = useState(0);
    const scenario = SCENARIOS[currentStep] ?? DEFAULT_SCENARIO;

    const [gameState, setGameState] = useState<GameState>(() =>
        buildScenarioState(scenario),
    );
    const [feedback, setFeedback] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);

    const resetCurrent = useCallback(() => {
        setGameState(buildScenarioState(scenario));
        setFeedback(null);
    }, [scenario]);

    const handleSelectStep = (idx: number) => {
        const nextScenario = SCENARIOS[idx] ?? DEFAULT_SCENARIO;
        setCurrentStep(idx);
        setGameState(buildScenarioState(nextScenario));
        setFeedback(null);
    };

    const handleSelectEdge = useCallback(
        (edgeId: string) => {
            if (feedback?.type === "success") return;

            if (edgeId === scenario.targetEdgeId) {
                const next = applyMove(gameState, { edgeId, player: "p1" });
                setGameState(next.state);
                setFeedback({
                    type: "success",
                    message: scenario.successMessage,
                });
            } else {
                setFeedback({
                    type: "error",
                    message: scenario.failureMessage,
                });
            }
        },
        [feedback, gameState, scenario],
    );

    const isLast = currentStep === SCENARIOS.length - 1;

    return (
        <div className="flex flex-col gap-4">
            {/* Step navigation buttons */}
            <div
                role="tablist"
                aria-label="Tutorial lessons"
                className="grid grid-cols-2 gap-2 sm:grid-cols-4"
            >
                {SCENARIOS.map((sc, idx) => (
                    <button
                        key={sc.id}
                        type="button"
                        role="tab"
                        aria-selected={idx === currentStep}
                        onClick={() => handleSelectStep(idx)}
                        className={`min-h-10 rounded-lg border-2 border-border px-2 text-xs font-bold uppercase shadow-brutal-sm transition-all duration-200 focus:outline-none focus-visible:outline-none ${
                            idx === currentStep
                                ? "bg-player-one"
                                : "bg-surface opacity-80 hover:opacity-100"
                        }`}
                    >
                        Lesson {sc.id}
                    </button>
                ))}
            </div>

            {/* Scenario Card */}
            <Card className="animate-card-spring stagger-1 flex flex-col gap-4 p-5">
                <div>
                    <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                        Step {scenario.id} of {SCENARIOS.length}
                    </span>
                    <h2 className="text-lg font-black uppercase tracking-wide">
                        {scenario.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {scenario.description}
                    </p>
                </div>

                <div className="rounded-xl border-2 border-border bg-surface-elevated p-3 text-xs font-bold text-foreground">
                    🎯 <span className="font-extrabold uppercase">Goal:</span>{" "}
                    {scenario.instructions}
                </div>

                {/* Interactive Board Sandbox */}
                <div className="flex justify-center p-2">
                    <div className="w-full max-w-xs">
                        <GameBoard
                            state={gameState}
                            isPlayable={feedback?.type !== "success"}
                            onSelectEdge={handleSelectEdge}
                        />
                    </div>
                </div>

                {/* Feedback Banner */}
                {feedback && (
                    <div
                        role="alert"
                        aria-live="polite"
                        className={`animate-badge-pop rounded-xl border-2 border-border p-3 text-xs font-bold shadow-brutal-sm ${
                            feedback.type === "success"
                                ? "bg-success text-foreground"
                                : "bg-warning text-foreground"
                        }`}
                    >
                        {feedback.type === "success" ? "✅ " : "⚠️ "}
                        {feedback.message}
                    </div>
                )}

                {/* Action controls */}
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        fullWidth
                        onClick={resetCurrent}
                    >
                        Reset Lesson
                    </Button>
                    {feedback?.type === "success" && !isLast && (
                        <Button
                            fullWidth
                            onClick={() => handleSelectStep(currentStep + 1)}
                        >
                            Next Lesson →
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
}
