import { useState } from "react";
import { Card } from "@/shared/ui/Card";
import { PageContainer } from "@/shared/layout";
import { Button } from "@/shared/ui/Button";
import { ChainTutorial } from "@/pages/how-to-play-screen/ChainTutorial";
import { cn } from "@/shared/lib/cn";

const STEPS = [
    {
        title: "Pick a line",
        body: "Tap any line between two dots to claim it.",
    },
    {
        title: "Complete boxes",
        body: "Finish all sides of a box to own it.",
    },
    { title: "Go again", body: "Completing a box earns you another turn." },
    {
        title: "Own the most",
        body: "When every line is claimed, most boxes wins.",
    },
];

export function HowToPlayScreen({ onBack }: { onBack: () => void }) {
    const [activeTab, setActiveTab] = useState<"rules" | "tutorial">("rules");

    return (
        <PageContainer className="min-h-dvh py-6">
            <h1 className="text-center text-3xl font-black uppercase tracking-widest">
                How to Play
            </h1>

            {/* Mode Switcher */}
            <div
                role="tablist"
                aria-label="How to play mode"
                className="grid grid-cols-2 gap-2"
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "rules"}
                    onClick={() => setActiveTab("rules")}
                    className={cn(
                        "min-h-11 rounded-lg border-2 border-border px-3 text-sm font-bold uppercase shadow-brutal-sm transition-all duration-200 focus:outline-none focus-visible:outline-none",
                        activeTab === "rules"
                            ? "bg-player-one"
                            : "bg-surface opacity-80 hover:opacity-100",
                    )}
                >
                    Basic Rules
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "tutorial"}
                    onClick={() => setActiveTab("tutorial")}
                    className={cn(
                        "min-h-11 rounded-lg border-2 border-border px-3 text-sm font-bold uppercase shadow-brutal-sm transition-all duration-200 focus:outline-none focus-visible:outline-none",
                        activeTab === "tutorial"
                            ? "bg-player-one"
                            : "bg-surface opacity-80 hover:opacity-100",
                    )}
                >
                    Strategy Tutorial
                </button>
            </div>

            {activeTab === "rules" ? (
                <ol className="flex flex-col gap-3">
                    {STEPS.map((step, index) => (
                        <li
                            key={step.title}
                            className={`animate-card-spring stagger-${index + 1}`}
                        >
                            <Card className="flex items-start gap-4 p-4">
                                <span
                                    aria-hidden="true"
                                    className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-border bg-player-one font-black shadow-brutal-sm"
                                >
                                    {index + 1}
                                </span>
                                <div>
                                    <h2 className="font-black uppercase tracking-wide">
                                        {step.title}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {step.body}
                                    </p>
                                </div>
                            </Card>
                        </li>
                    ))}
                </ol>
            ) : (
                <ChainTutorial />
            )}

            <Button variant="secondary" fullWidth onClick={onBack}>
                Back
            </Button>
        </PageContainer>
    );
}
