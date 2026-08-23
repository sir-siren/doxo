import { Card } from "@/shared/ui/Card";
import { PageContainer } from "@/shared/layout";
import { Button } from "@/shared/ui/Button";

const STEPS = [
    {
        title: "Pick a line",
        body: "Tap any line between two dots to claim it.",
    },
    {
        title: "Complete boxes",
        body: "Finish all four sides of a box to own it.",
    },
    { title: "Go again", body: "Completing a box earns you another turn." },
    {
        title: "Own the most",
        body: "When every line is claimed, most boxes wins.",
    },
];

export function HowToPlayScreen({ onBack }: { onBack: () => void }) {
    return (
        <PageContainer className="min-h-dvh">
            <h1 className="text-center text-3xl font-black uppercase tracking-widest">
                How to Play
            </h1>
            <ol className="flex flex-col gap-3">
                {STEPS.map((step, index) => (
                    <li key={step.title}>
                        <Card className="flex items-start gap-4 p-4">
                            <span
                                aria-hidden="true"
                                className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-border bg-player-one font-black"
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
            <Button variant="secondary" fullWidth onClick={onBack}>
                Back
            </Button>
        </PageContainer>
    );
}
