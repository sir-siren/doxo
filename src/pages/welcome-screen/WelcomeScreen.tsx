import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { PageContainer } from "@/shared/layout";
import { Logo } from "@/shared/ui/Logo";

interface WelcomeScreenProps {
    onPlay: () => void;
    onHowToPlay: () => void;
    onSettings: () => void;
    onStatistics: () => void;
}

export function WelcomeScreen({
    onPlay,
    onHowToPlay,
    onSettings,
    onStatistics,
}: WelcomeScreenProps) {
    return (
        <PageContainer className="min-h-dvh justify-center py-8">
            {/* Hero Section */}
            <div className="flex flex-col items-center">
                {/* Logo Icon */}
                <div className="animate-badge-pop mb-3 flex size-16 items-center justify-center rounded-2xl border-2 border-border bg-surface p-2.5 shadow-brutal sm:size-20">
                    <Logo className="size-full text-player-one" />
                </div>

                <h1 className="animate-card-spring stagger-1 text-center text-4xl font-black uppercase tracking-widest sm:text-5xl">
                    Doxo
                </h1>
                <p className="animate-card-spring stagger-2 mt-1 text-center text-base sm:text-lg font-semibold text-muted-foreground">
                    Claim the lines. Own the boxes.
                </p>
            </div>

            <Card className="animate-card-spring stagger-3 mt-2 flex flex-col gap-3 p-6">
                <Button fullWidth onClick={onPlay}>
                    Play
                </Button>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Button variant="secondary" onClick={onHowToPlay}>
                        How to Play
                    </Button>
                    <Button variant="secondary" onClick={onSettings}>
                        Settings
                    </Button>
                    <Button variant="secondary" onClick={onStatistics}>
                        Statistics
                    </Button>
                </div>
            </Card>
        </PageContainer>
    );
}
