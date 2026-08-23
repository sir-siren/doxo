import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { PageContainer } from "@/shared/layout";

export interface StatisticsData {
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    totalBoxesClaimed: number;
    winRate: number;
    currentStreak: number;
    longestStreak: number;
}

interface StatisticsScreenProps {
    statistics: StatisticsData | null;
    onReset: () => void;
    onBack: () => void;
}

const ROWS: Array<{
    key: keyof StatisticsData;
    label: string;
}> = [
    { key: "gamesPlayed", label: "Games played" },
    { key: "wins", label: "Wins" },
    { key: "losses", label: "Losses" },
    { key: "draws", label: "Draws" },
    { key: "totalBoxesClaimed", label: "Boxes claimed" },
    { key: "winRate", label: "Win rate" },
    { key: "currentStreak", label: "Current streak" },
    { key: "longestStreak", label: "Longest streak" },
];

export function StatisticsScreen({
    statistics,
    onReset,
    onBack,
}: StatisticsScreenProps) {
    return (
        <PageContainer className="min-h-dvh py-6">
            <h1 className="animate-card-spring stagger-1 text-center text-3xl font-black uppercase tracking-widest">
                Statistics
            </h1>
            {statistics === null || statistics.gamesPlayed === 0 ? (
                <Card className="animate-card-spring stagger-2 p-6 text-center font-semibold text-muted-foreground">
                    No games yet. Play your first game to start tracking stats!
                </Card>
            ) : (
                <Card className="animate-card-spring stagger-2 divide-y-2 divide-border/10 p-2">
                    {ROWS.map(({ key, label }, index) => (
                        <div
                            key={key}
                            className={`animate-card-spring stagger-${Math.min(index + 1, 8)} flex items-center justify-between px-3 py-3 transition-colors hover:bg-surface-elevated rounded-lg`}
                        >
                            <span className="font-semibold text-muted-foreground">
                                {label}
                            </span>
                            <span className="text-xl font-black">
                                {key === "winRate"
                                    ? `${Math.round(statistics[key] * 100)}%`
                                    : statistics[key]}
                            </span>
                        </div>
                    ))}
                </Card>
            )}
            <div className="animate-card-spring stagger-4 flex flex-col gap-3 sm:flex-row">
                <Button variant="danger" fullWidth onClick={onReset}>
                    Reset Statistics
                </Button>
                <Button variant="secondary" fullWidth onClick={onBack}>
                    Back
                </Button>
            </div>
        </PageContainer>
    );
}
