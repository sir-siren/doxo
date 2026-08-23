import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { PageContainer } from "@/shared/layout";

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
            <h1 className="text-center text-4xl font-black uppercase tracking-widest sm:text-5xl">
                Doxo
            </h1>
            <p className="text-center text-lg font-semibold text-muted-foreground">
                Claim the lines. Own the boxes.
            </p>
            <Card className="mt-2 flex flex-col gap-3 p-6">
                <Button fullWidth onClick={onPlay} autoFocus>
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
