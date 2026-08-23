import { useMemo, useState, type ReactNode } from "react";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { ConfirmationModal } from "@/shared/ui/ConfirmationModal";
import { PageContainer } from "@/shared/layout";
import { useAppSelector } from "@/app/store/hooks";
import type {
    Difficulty,
    BoardShape,
} from "@/features/game/types/game.types";
import type {
    DifficultyTally,
    MatchRecord,
    StatisticsState,
} from "@/features/statistics/state/statistics.types";
import { cn } from "@/shared/lib/cn";

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

export type StatisticsTab =
    | "overview"
    | "vs-ai"
    | "local"
    | "profiles"
    | "history";

export interface StatisticsScreenProps {
    /** Optional statistics state or data. If omitted, read directly from Redux store. */
    statistics?: StatisticsState | StatisticsData | null;
    onReset?: () => void;
    onBack?: () => void;
    onPlay?: () => void;
}

const DIFFICULTIES: Array<{ id: Difficulty; label: string; desc: string }> = [
    { id: "easy", label: "Easy", desc: "Random casual moves" },
    { id: "medium", label: "Medium", desc: "Tactical box avoid" },
    { id: "hard", label: "Hard", desc: "Strategic chain management" },
    { id: "insane", label: "Insane", desc: "Deep minimax evaluation" },
    { id: "adaptive", label: "Adaptive", desc: "Dynamic win-rate scaling" },
];

const SHAPE_LABELS: Record<BoardShape, string> = {
    rectangle: "Classic",
    triangle: "Triangle",
    "l-shape": "L-Shape",
    hex: "Hexagon",
};

function formatPercent(value: number): string {
    if (!Number.isFinite(value) || value <= 0) return "0%";
    return `${Math.round(value * 100)}%`;
}

function formatAverage(total: number, count: number): string {
    if (!count || count <= 0) return "0.0";
    return (total / count).toFixed(1);
}

function formatTimestamp(timestamp: number): {
    relative: string;
    formatted: string;
} {
    if (!timestamp || !Number.isFinite(timestamp)) {
        return { relative: "Recently", formatted: "Unknown date" };
    }

    const now = Date.now();
    const diff = Math.max(0, now - timestamp);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let relative = "Just now";
    if (days > 0) {
        relative = days === 1 ? "Yesterday" : `${days}d ago`;
    } else if (hours > 0) {
        relative = `${hours}h ago`;
    } else if (minutes > 0) {
        relative = `${minutes}m ago`;
    }

    const date = new Date(timestamp);
    const formatted = date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });

    return { relative, formatted };
}

export function StatisticsScreen({
    statistics: propStats,
    onReset,
    onBack,
    onPlay,
}: StatisticsScreenProps) {
    const reduxStats = useAppSelector((state) => state.statistics);
    const [activeTab, setActiveTab] = useState<StatisticsTab>("overview");
    const [showResetModal, setShowResetModal] = useState(false);

    // Filters for Match History
    const [modeFilter, setModeFilter] = useState<"all" | "ai" | "local">("all");
    const [outcomeFilter, setOutcomeFilter] = useState<
        "all" | "win" | "loss" | "draw"
    >("all");

    // Unified statistics state resolution
    const stats = useMemo<StatisticsState>(() => {
        if (propStats && "vsAi" in propStats && propStats.vsAi !== undefined) {
            return propStats as StatisticsState;
        }
        if (propStats && "gamesPlayed" in propStats) {
            // Merge legacy StatisticsData with redux state
            return {
                ...reduxStats,
                gamesPlayed: propStats.gamesPlayed,
                wins: propStats.wins,
                losses: propStats.losses,
                draws: propStats.draws,
                totalBoxesClaimed: propStats.totalBoxesClaimed,
                currentStreak: propStats.currentStreak,
                longestStreak: propStats.longestStreak,
            };
        }
        return reduxStats;
    }, [propStats, reduxStats]);

    const vsAi = stats.vsAi ?? {
        gamesPlayed: 0,
        humanWins: 0,
        aiWins: 0,
        draws: 0,
        humanBoxesClaimed: 0,
        aiBoxesClaimed: 0,
        currentStreak: 0,
        longestStreak: 0,
        byDifficulty: {} as Record<Difficulty, DifficultyTally>,
    };

    const local = stats.local ?? {
        gamesPlayed: 0,
        p1Wins: 0,
        p2Wins: 0,
        draws: 0,
        p1TotalBoxes: 0,
        p2TotalBoxes: 0,
    };

    const recentMatches = stats.recentMatches ?? [];

    // High scores derived from recent matches or recorded totals
    const { p1HighScore, p2HighScore, aiHighScore } = useMemo(() => {
        let p1High = 0;
        let p2High = 0;
        let aiHigh = 0;

        for (const match of recentMatches) {
            if (match.playerOne?.score && match.playerOne.score > p1High) {
                p1High = match.playerOne.score;
            }
            if (match.mode === "local") {
                if (match.playerTwo?.score && match.playerTwo.score > p2High) {
                    p2High = match.playerTwo.score;
                }
            } else if (match.mode === "ai") {
                if (match.playerTwo?.score && match.playerTwo.score > aiHigh) {
                    aiHigh = match.playerTwo.score;
                }
            }
        }

        return {
            p1HighScore: p1High,
            p2HighScore: p2High,
            aiHighScore: aiHigh,
        };
    }, [recentMatches]);

    // Win rates
    const overallWinRate =
        stats.gamesPlayed > 0 ? stats.wins / stats.gamesPlayed : 0;
    const aiWinRate =
        vsAi.gamesPlayed > 0 ? vsAi.humanWins / vsAi.gamesPlayed : 0;
    const localP1WinRate =
        local.gamesPlayed > 0 ? local.p1Wins / local.gamesPlayed : 0;
    const localP2WinRate =
        local.gamesPlayed > 0 ? local.p2Wins / local.gamesPlayed : 0;

    // Filtered matches
    const filteredMatches = useMemo(() => {
        return recentMatches.filter((match) => {
            if (modeFilter !== "all" && match.mode !== modeFilter) {
                return false;
            }
            if (outcomeFilter !== "all") {
                if (outcomeFilter === "win" && match.winner !== "p1")
                    return false;
                if (outcomeFilter === "loss" && match.winner !== "p2")
                    return false;
                if (outcomeFilter === "draw" && match.winner !== "draw")
                    return false;
            }
            return true;
        });
    }, [recentMatches, modeFilter, outcomeFilter]);

    const handleConfirmReset = () => {
        onReset?.();
        setShowResetModal(false);
    };

    const hasAnyGames = stats.gamesPlayed > 0;

    return (
        <PageContainer className="min-h-dvh max-w-5xl px-3 sm:px-6 lg:px-8 py-5 sm:py-7 flex flex-col gap-5">
            {/* Header with Navigation and Quick Actions */}
            <header className="animate-card-spring stagger-1 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <Button
                            variant="secondary"
                            onClick={onBack}
                            aria-label="Return to previous screen"
                            className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-black uppercase tracking-wider rounded-xl border-2 border-border shadow-brutal-sm"
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
                    )}
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                            <span>Statistics</span>
                            <span className="hidden sm:inline-block text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md border-2 border-border bg-player-one text-foreground shadow-brutal-sm">
                                Analytics
                            </span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {onPlay && (
                        <Button
                            variant="primary"
                            onClick={onPlay}
                            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-black uppercase tracking-wide rounded-xl shadow-brutal-sm"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="size-4 shrink-0"
                                aria-hidden="true"
                            >
                                <path d="M8 5v14l11-7z" />
                            </svg>
                            <span>Play Game</span>
                        </Button>
                    )}
                    <Button
                        variant="danger"
                        onClick={() => setShowResetModal(true)}
                        disabled={!hasAnyGames}
                        aria-label="Reset all statistics"
                        className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-black uppercase tracking-wider rounded-xl border-2 border-border shadow-brutal-sm"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="size-4 shrink-0"
                            aria-hidden="true"
                        >
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                        <span className="hidden sm:inline">Reset</span>
                    </Button>
                </div>
            </header>

            {!hasAnyGames ? (
                /* Inviting Empty State when 0 games played */
                <Card className="animate-card-spring stagger-2 flex flex-col items-center justify-center p-8 sm:p-12 text-center gap-5 my-auto">
                    <div className="size-20 sm:size-24 rounded-2xl border-2 border-border bg-player-one-soft text-player-one flex items-center justify-center shadow-brutal animate-float-slow">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="size-10 sm:size-12 text-foreground"
                            aria-hidden="true"
                        >
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                        </svg>
                    </div>
                    <div className="max-w-md">
                        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-foreground">
                            No Match Records Yet
                        </h2>
                        <p className="mt-2 text-sm font-semibold text-muted-foreground leading-relaxed">
                            Play a match against the AI or challenge a friend in
                            Local 2-Player mode! Your win rates, boxes scored,
                            head-to-head records, player profiles, and recent
                            matches will be tracked right here.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3 mt-2 w-full max-w-xs">
                        {onPlay ? (
                            <Button fullWidth onClick={onPlay}>
                                Start First Game
                            </Button>
                        ) : onBack ? (
                            <Button fullWidth onClick={onBack}>
                                Go to Main Menu
                            </Button>
                        ) : null}
                    </div>
                </Card>
            ) : (
                <>
                    {/* Tab Navigation */}
                    <nav
                        role="tablist"
                        aria-label="Statistics Sections"
                        className="animate-card-spring stagger-2 flex items-center gap-2 overflow-x-auto p-1.5 -m-1.5 scrollbar-none"
                    >
                        <TabButton
                            active={activeTab === "overview"}
                            onClick={() => setActiveTab("overview")}
                            icon={
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="size-4 shrink-0"
                                >
                                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                                </svg>
                            }
                            label="Overview"
                        />
                        <TabButton
                            active={activeTab === "vs-ai"}
                            onClick={() => setActiveTab("vs-ai")}
                            icon={
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="size-4 shrink-0"
                                >
                                    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.38-1 1.72V7h4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h4V5.72c-.6-.34-1-.98-1-1.72a2 2 0 0 1 2-2m-3 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m-6 5h6v1H9v-1z" />
                                </svg>
                            }
                            label="Vs AI"
                            badge={vsAi.gamesPlayed > 0 ? `${vsAi.gamesPlayed}` : undefined}
                        />
                        <TabButton
                            active={activeTab === "local"}
                            onClick={() => setActiveTab("local")}
                            icon={
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="size-4 shrink-0"
                                >
                                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                                </svg>
                            }
                            label="Local 2P"
                            badge={local.gamesPlayed > 0 ? `${local.gamesPlayed}` : undefined}
                        />
                        <TabButton
                            active={activeTab === "profiles"}
                            onClick={() => setActiveTab("profiles")}
                            icon={
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="size-4 shrink-0"
                                >
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                </svg>
                            }
                            label="Profiles"
                        />
                        <TabButton
                            active={activeTab === "history"}
                            onClick={() => setActiveTab("history")}
                            icon={
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="size-4 shrink-0"
                                >
                                    <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
                                </svg>
                            }
                            label="History"
                            badge={recentMatches.length > 0 ? `${recentMatches.length}` : undefined}
                        />
                    </nav>

                    {/* Tab Panels */}
                    <div className="flex flex-col gap-5">
                        {activeTab === "overview" && (
                            <OverviewTab
                                stats={stats}
                                vsAi={vsAi}
                                local={local}
                                overallWinRate={overallWinRate}
                                recentMatches={recentMatches}
                            />
                        )}

                        {activeTab === "vs-ai" && (
                            <VsAiTab
                                vsAi={vsAi}
                                aiWinRate={aiWinRate}
                                byDifficulty={stats.byDifficulty}
                                recentMatches={recentMatches}
                            />
                        )}

                        {activeTab === "local" && (
                            <LocalTab
                                local={local}
                                p1WinRate={localP1WinRate}
                                p2WinRate={localP2WinRate}
                                p1HighScore={p1HighScore}
                                p2HighScore={p2HighScore}
                                recentMatches={recentMatches}
                            />
                        )}

                        {activeTab === "profiles" && (
                            <ProfilesTab
                                stats={stats}
                                vsAi={vsAi}
                                local={local}
                                p1HighScore={p1HighScore}
                                p2HighScore={p2HighScore}
                                aiHighScore={aiHighScore}
                            />
                        )}

                        {activeTab === "history" && (
                            <MatchHistoryTab
                                matches={filteredMatches}
                                totalMatchesCount={recentMatches.length}
                                modeFilter={modeFilter}
                                onModeFilterChange={setModeFilter}
                                outcomeFilter={outcomeFilter}
                                onOutcomeFilterChange={setOutcomeFilter}
                            />
                        )}
                    </div>
                </>
            )}

            {/* Confirmation Modal for Reset Statistics */}
            <ConfirmationModal
                open={showResetModal}
                title="Reset Statistics"
                message="Are you sure you want to reset all your statistics?"
                warning="Resetting will erase all played games, win rates, head-to-head records, streaks, and match logs. This action cannot be reversed."
                confirmLabel="Yes, Reset Everything"
                cancelLabel="Cancel"
                variant="danger"
                icon="danger"
                onConfirm={handleConfirmReset}
                onClose={() => setShowResetModal(false)}
            />
        </PageContainer>
    );
}

/* ========================================================================= */
/* TAB BUTTON                                                                */
/* ========================================================================= */

function TabButton({
    active,
    onClick,
    icon,
    label,
    badge,
}: {
    active: boolean;
    onClick: () => void;
    icon: ReactNode;
    label: string;
    badge?: string;
}) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border-2 border-border text-xs sm:text-sm font-black uppercase tracking-wider whitespace-nowrap transition-all duration-200 ease-spring active:translate-x-0.5 active:translate-y-0.5 focus:outline-none",
                active
                    ? "bg-player-one text-foreground shadow-brutal-sm font-black"
                    : "bg-surface text-muted-foreground hover:bg-surface-elevated hover:text-foreground shadow-none",
            )}
        >
            {icon}
            <span>{label}</span>
            {badge && (
                <span
                    className={cn(
                        "ml-0.5 px-1.5 py-0.2 rounded-md text-[10px] font-black border border-border",
                        active
                            ? "bg-surface text-foreground"
                            : "bg-player-one-soft text-foreground",
                    )}
                >
                    {badge}
                </span>
            )}
        </button>
    );
}

/* ========================================================================= */
/* TAB 1: OVERVIEW                                                           */
/* ========================================================================= */

function OverviewTab({
    stats,
    vsAi,
    local,
    overallWinRate,
    recentMatches,
}: {
    stats: StatisticsState;
    vsAi: StatisticsState["vsAi"];
    local: StatisticsState["local"];
    overallWinRate: number;
    recentMatches: MatchRecord[];
}) {
    const aiGames = vsAi.gamesPlayed;
    const localGames = local.gamesPlayed;
    const totalGames = Math.max(1, stats.gamesPlayed);

    const aiPercent = Math.round((aiGames / totalGames) * 100);
    const localPercent = 100 - aiPercent;

    const recentForm = recentMatches.slice(0, 8);

    return (
        <div className="flex flex-col gap-5 animate-card-spring">
            {/* 4 Hero Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <MetricCard
                    label="Games Played"
                    value={stats.gamesPlayed}
                    subtext={`${aiGames} Vs AI · ${localGames} Local`}
                    color="bg-player-one-soft"
                    icon={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="size-5"
                        >
                            <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                        </svg>
                    }
                />
                <MetricCard
                    label="Overall Win Rate"
                    value={formatPercent(overallWinRate)}
                    subtext={`${stats.wins}W · ${stats.losses}L · ${stats.draws}D`}
                    color="bg-success/40"
                    icon={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="size-5"
                        >
                            <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
                        </svg>
                    }
                />
                <MetricCard
                    label="Boxes Claimed"
                    value={stats.totalBoxesClaimed}
                    subtext={`${formatAverage(stats.totalBoxesClaimed, stats.gamesPlayed)} avg/game`}
                    color="bg-player-two-soft"
                    icon={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="size-5"
                        >
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
                        </svg>
                    }
                />
                <MetricCard
                    label="Win Streak"
                    value={stats.currentStreak}
                    subtext={`Best: ${stats.longestStreak} games`}
                    color="bg-warning/40"
                    icon={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="size-5"
                        >
                            <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />
                        </svg>
                    }
                />
            </div>

            {/* Recent Form Ticker */}
            {recentForm.length > 0 && (
                <Card className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                            Recent Match Form (Last {recentForm.length})
                        </h2>
                        <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                            Chronological results from your latest games
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {recentForm.map((match) => {
                            const isWin = match.winner === "p1";
                            const isLoss = match.winner === "p2";
                            const isDraw = match.winner === "draw";

                            return (
                                <div
                                    key={match.id}
                                    title={`${match.mode === "ai" ? "Vs AI" : "Local 2P"} - ${match.playerOne.name} (${match.playerOne.score}) vs ${match.playerTwo.name} (${match.playerTwo.score})`}
                                    className={cn(
                                        "size-8 sm:size-9 rounded-xl border-2 border-border flex items-center justify-center text-xs font-black uppercase shadow-brutal-sm transition-transform hover:scale-110",
                                        isWin && "bg-success text-foreground",
                                        isLoss && "bg-danger text-foreground",
                                        isDraw && "bg-warning text-foreground",
                                    )}
                                >
                                    {isWin ? "W" : isLoss ? "L" : "D"}
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* Mode Split Distribution & Quick Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vs AI Quick Summary */}
                <Card className="p-5 flex flex-col justify-between gap-4 border-2 border-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="size-10 rounded-xl border-2 border-border bg-player-one flex items-center justify-center shadow-brutal-sm">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="size-5"
                                >
                                    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.38-1 1.72V7h4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h4V5.72c-.6-.34-1-.98-1-1.72a2 2 0 0 1 2-2m-3 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m-6 5h6v1H9v-1z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base font-black uppercase tracking-wide">
                                    Player vs AI
                                </h3>
                                <p className="text-xs font-semibold text-muted-foreground">
                                    {vsAi.gamesPlayed} Matches Played
                                </p>
                            </div>
                        </div>
                        <span className="text-sm font-black px-2.5 py-1 rounded-lg border-2 border-border bg-surface-elevated shadow-brutal-sm">
                            {formatPercent(
                                vsAi.gamesPlayed > 0
                                    ? vsAi.humanWins / vsAi.gamesPlayed
                                    : 0,
                            )}{" "}
                            Win Rate
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl border-2 border-border bg-surface p-2.5 shadow-brutal-sm">
                            <span className="text-xs font-bold uppercase text-muted-foreground block">
                                Human Wins
                            </span>
                            <span className="text-lg font-black text-success">
                                {vsAi.humanWins}
                            </span>
                        </div>
                        <div className="rounded-xl border-2 border-border bg-surface p-2.5 shadow-brutal-sm">
                            <span className="text-xs font-bold uppercase text-muted-foreground block">
                                AI Wins
                            </span>
                            <span className="text-lg font-black text-danger">
                                {vsAi.aiWins}
                            </span>
                        </div>
                        <div className="rounded-xl border-2 border-border bg-surface p-2.5 shadow-brutal-sm">
                            <span className="text-xs font-bold uppercase text-muted-foreground block">
                                Draws
                            </span>
                            <span className="text-lg font-black text-warning">
                                {vsAi.draws}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground pt-1 border-t-2 border-border/10">
                        <span>
                            Human Boxes: <b>{vsAi.humanBoxesClaimed}</b>
                        </span>
                        <span>
                            AI Boxes: <b>{vsAi.aiBoxesClaimed}</b>
                        </span>
                    </div>
                </Card>

                {/* Local 2P Quick Summary */}
                <Card className="p-5 flex flex-col justify-between gap-4 border-2 border-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="size-10 rounded-xl border-2 border-border bg-player-two flex items-center justify-center shadow-brutal-sm">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="size-5"
                                >
                                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base font-black uppercase tracking-wide">
                                    Local 2-Player
                                </h3>
                                <p className="text-xs font-semibold text-muted-foreground">
                                    {local.gamesPlayed} Matches Played
                                </p>
                            </div>
                        </div>
                        <span className="text-sm font-black px-2.5 py-1 rounded-lg border-2 border-border bg-surface-elevated shadow-brutal-sm">
                            {local.p1Wins > local.p2Wins
                                ? "P1 Leading"
                                : local.p2Wins > local.p1Wins
                                  ? "P2 Leading"
                                  : "Tied Rivalry"}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl border-2 border-border bg-surface p-2.5 shadow-brutal-sm">
                            <span className="text-xs font-bold uppercase text-muted-foreground block">
                                P1 Wins
                            </span>
                            <span className="text-lg font-black text-player-one">
                                {local.p1Wins}
                            </span>
                        </div>
                        <div className="rounded-xl border-2 border-border bg-surface p-2.5 shadow-brutal-sm">
                            <span className="text-xs font-bold uppercase text-muted-foreground block">
                                P2 Wins
                            </span>
                            <span className="text-lg font-black text-player-two">
                                {local.p2Wins}
                            </span>
                        </div>
                        <div className="rounded-xl border-2 border-border bg-surface p-2.5 shadow-brutal-sm">
                            <span className="text-xs font-bold uppercase text-muted-foreground block">
                                Draws
                            </span>
                            <span className="text-lg font-black text-warning">
                                {local.draws}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground pt-1 border-t-2 border-border/10">
                        <span>
                            P1 Boxes: <b>{local.p1TotalBoxes}</b>
                        </span>
                        <span>
                            P2 Boxes: <b>{local.p2TotalBoxes}</b>
                        </span>
                    </div>
                </Card>
            </div>

            {/* Mode Distribution Bar */}
            {stats.gamesPlayed > 0 && (
                <Card className="p-4 sm:p-5 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                            <span className="size-3 rounded-full bg-player-one inline-block border border-border" />
                            Vs AI Mode ({aiPercent}%)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="size-3 rounded-full bg-player-two inline-block border border-border" />
                            Local 2-Player ({localPercent}%)
                        </span>
                    </div>
                    <div className="h-4 w-full rounded-full border-2 border-border bg-surface overflow-hidden flex shadow-brutal-sm">
                        <div
                            style={{ width: `${aiPercent}%` }}
                            className="bg-player-one h-full transition-all duration-500"
                        />
                        <div
                            style={{ width: `${localPercent}%` }}
                            className="bg-player-two h-full transition-all duration-500"
                        />
                    </div>
                </Card>
            )}
        </div>
    );
}

/* ========================================================================= */
/* TAB 2: VS AI                                                              */
/* ========================================================================= */

function VsAiTab({
    vsAi,
    aiWinRate,
    byDifficulty,
    recentMatches,
}: {
    vsAi: StatisticsState["vsAi"];
    aiWinRate: number;
    byDifficulty: Record<Difficulty, DifficultyTally>;
    recentMatches: MatchRecord[];
}) {
    const totalAiGames = vsAi.gamesPlayed;
    const humanBoxes = vsAi.humanBoxesClaimed;
    const aiBoxes = vsAi.aiBoxesClaimed;
    const totalAiBoxes = Math.max(1, humanBoxes + aiBoxes);
    const humanBoxPct = Math.round((humanBoxes / totalAiBoxes) * 100);

    const aiMatches = recentMatches.filter((m) => m.mode === "ai");
    const bestHumanScore = aiMatches.reduce(
        (max, m) => Math.max(max, m.playerOne?.score ?? 0),
        0,
    );
    const bestAiScore = aiMatches.reduce(
        (max, m) => Math.max(max, m.playerTwo?.score ?? 0),
        0,
    );

    return (
        <div className="flex flex-col gap-5 animate-card-spring">
            {/* Head-to-Head Hero Card */}
            <Card className="p-5 sm:p-6 flex flex-col gap-5 border-2 border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <span className="text-xs font-black uppercase tracking-wider text-muted-foreground block">
                            Head-to-Head Arena
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide">
                            Human vs Computer AI
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-black px-3 py-1.5 rounded-xl border-2 border-border bg-player-one shadow-brutal-sm">
                            {formatPercent(aiWinRate)} Human Win Rate
                        </span>
                    </div>
                </div>

                {/* Big Scoreboard */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center text-center bg-surface-elevated rounded-2xl border-2 border-border p-4 sm:p-5 shadow-brutal-sm">
                    <div className="flex flex-col items-center">
                        <span className="text-xs sm:text-sm font-black uppercase text-player-one mb-1">
                            Human (You)
                        </span>
                        <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground">
                            {vsAi.humanWins}
                        </span>
                        <span className="text-[11px] font-bold text-muted-foreground mt-1">
                            Victories
                        </span>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">
                            Draws
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-warning">
                            {vsAi.draws}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground mt-1">
                            {totalAiGames} Total
                        </span>
                    </div>

                    <div className="flex flex-col items-center">
                        <span className="text-xs sm:text-sm font-black uppercase text-player-two mb-1">
                            Computer AI
                        </span>
                        <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground">
                            {vsAi.aiWins}
                        </span>
                        <span className="text-[11px] font-bold text-muted-foreground mt-1">
                            Victories
                        </span>
                    </div>
                </div>

                {/* Box Dominance Bar */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider">
                        <span>
                            Human Boxes: <b>{humanBoxes}</b> ({humanBoxPct}%)
                        </span>
                        <span>
                            AI Boxes: <b>{aiBoxes}</b> ({100 - humanBoxPct}%)
                        </span>
                    </div>
                    <div className="h-4 w-full rounded-full border-2 border-border bg-surface overflow-hidden flex shadow-brutal-sm">
                        <div
                            style={{ width: `${humanBoxPct}%` }}
                            className="bg-player-one h-full transition-all duration-500"
                        />
                        <div
                            style={{ width: `${100 - humanBoxPct}%` }}
                            className="bg-player-two h-full transition-all duration-500"
                        />
                    </div>
                </div>

                {/* Score stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center">
                    <div className="rounded-xl border-2 border-border bg-surface p-3 shadow-brutal-sm">
                        <span className="text-[11px] font-bold uppercase text-muted-foreground block">
                            Human Avg Score
                        </span>
                        <span className="text-base sm:text-lg font-black text-foreground">
                            {formatAverage(humanBoxes, totalAiGames)}
                        </span>
                    </div>
                    <div className="rounded-xl border-2 border-border bg-surface p-3 shadow-brutal-sm">
                        <span className="text-[11px] font-bold uppercase text-muted-foreground block">
                            AI Avg Score
                        </span>
                        <span className="text-base sm:text-lg font-black text-foreground">
                            {formatAverage(aiBoxes, totalAiGames)}
                        </span>
                    </div>
                    <div className="rounded-xl border-2 border-border bg-surface p-3 shadow-brutal-sm">
                        <span className="text-[11px] font-bold uppercase text-muted-foreground block">
                            Human High Score
                        </span>
                        <span className="text-base sm:text-lg font-black text-foreground">
                            {bestHumanScore}
                        </span>
                    </div>
                    <div className="rounded-xl border-2 border-border bg-surface p-3 shadow-brutal-sm">
                        <span className="text-[11px] font-bold uppercase text-muted-foreground block">
                            AI High Score
                        </span>
                        <span className="text-base sm:text-lg font-black text-foreground">
                            {bestAiScore}
                        </span>
                    </div>
                </div>
            </Card>

            {/* AI Difficulty Breakdown */}
            <Card className="p-5 sm:p-6 flex flex-col gap-4 border-2 border-border">
                <div>
                    <h2 className="text-lg sm:text-xl font-black uppercase tracking-wide">
                        Difficulty Breakdown
                    </h2>
                    <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                        Performance metrics categorized by AI difficulty level
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    {DIFFICULTIES.map((diff) => {
                        const tally =
                            byDifficulty?.[diff.id] ??
                            vsAi.byDifficulty?.[diff.id] ?? {
                                gamesPlayed: 0,
                                wins: 0,
                                losses: 0,
                                draws: 0,
                                humanBoxes: 0,
                                aiBoxes: 0,
                            };

                        const diffWinRate =
                            tally.gamesPlayed > 0
                                ? tally.wins / tally.gamesPlayed
                                : 0;

                        return (
                            <div
                                key={diff.id}
                                className="rounded-xl border-2 border-border bg-surface-elevated p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-brutal-sm hover:translate-x-0.5 transition-transform"
                            >
                                <div className="min-w-32">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black uppercase">
                                            {diff.label}
                                        </span>
                                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded border border-border bg-surface">
                                            {tally.gamesPlayed} Matches
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground font-semibold">
                                        {diff.desc}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 sm:gap-6 text-center sm:text-right">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                                            Record (W-L-D)
                                        </span>
                                        <span className="text-sm font-black">
                                            {tally.wins} - {tally.losses} -{" "}
                                            {tally.draws}
                                        </span>
                                    </div>

                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                                            Boxes (You:AI)
                                        </span>
                                        <span className="text-sm font-black">
                                            {tally.humanBoxes} : {tally.aiBoxes}
                                        </span>
                                    </div>

                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                                            Win Rate
                                        </span>
                                        <span
                                            className={cn(
                                                "inline-block px-2 py-0.5 rounded-md text-xs font-black border border-border shadow-brutal-sm",
                                                tally.gamesPlayed === 0
                                                    ? "bg-surface text-muted-foreground"
                                                    : diffWinRate >= 0.5
                                                      ? "bg-success text-foreground"
                                                      : "bg-danger text-foreground",
                                            )}
                                        >
                                            {formatPercent(diffWinRate)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
}

/* ========================================================================= */
/* TAB 3: LOCAL 2-PLAYER                                                     */
/* ========================================================================= */

function LocalTab({
    local,
    p1WinRate,
    p2WinRate,
    p1HighScore,
    p2HighScore,
    recentMatches,
}: {
    local: StatisticsState["local"];
    p1WinRate: number;
    p2WinRate: number;
    p1HighScore: number;
    p2HighScore: number;
    recentMatches: MatchRecord[];
}) {
    const totalLocalGames = local.gamesPlayed;
    const p1Boxes = local.p1TotalBoxes;
    const p2Boxes = local.p2TotalBoxes;
    const totalBoxes = Math.max(1, p1Boxes + p2Boxes);
    const p1BoxPct = Math.round((p1Boxes / totalBoxes) * 100);

    const localMatches = recentMatches.filter((m) => m.mode === "local");

    // Average victory margin
    const margins = localMatches
        .filter((m) => m.winner !== "draw")
        .map((m) => Math.abs(m.playerOne.score - m.playerTwo.score));
    const avgMargin =
        margins.length > 0
            ? (margins.reduce((a, b) => a + b, 0) / margins.length).toFixed(1)
            : "0.0";

    return (
        <div className="flex flex-col gap-5 animate-card-spring">
            {/* Local Rivalry Card */}
            <Card className="p-5 sm:p-6 flex flex-col gap-5 border-2 border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <span className="text-xs font-black uppercase tracking-wider text-muted-foreground block">
                            Local Multiplayer Rivalry
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide">
                            Player 1 vs Player 2
                        </h2>
                    </div>
                    <span className="text-xs sm:text-sm font-black px-3 py-1.5 rounded-xl border-2 border-border bg-player-two shadow-brutal-sm">
                        {local.p1Wins > local.p2Wins
                            ? "🏆 Player 1 Leads"
                            : local.p2Wins > local.p1Wins
                              ? "🏆 Player 2 Leads"
                              : "🤝 Even Rivalry"}
                    </span>
                </div>

                {/* Scoreboard */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center text-center bg-surface-elevated rounded-2xl border-2 border-border p-4 sm:p-5 shadow-brutal-sm">
                    <div className="flex flex-col items-center">
                        <span className="text-xs sm:text-sm font-black uppercase text-player-one mb-1">
                            Player 1
                        </span>
                        <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground">
                            {local.p1Wins}
                        </span>
                        <span className="text-[11px] font-bold text-muted-foreground mt-1">
                            {formatPercent(p1WinRate)} Win Rate
                        </span>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">
                            Draws
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-warning">
                            {local.draws}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground mt-1">
                            {totalLocalGames} Total
                        </span>
                    </div>

                    <div className="flex flex-col items-center">
                        <span className="text-xs sm:text-sm font-black uppercase text-player-two mb-1">
                            Player 2
                        </span>
                        <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground">
                            {local.p2Wins}
                        </span>
                        <span className="text-[11px] font-bold text-muted-foreground mt-1">
                            {formatPercent(p2WinRate)} Win Rate
                        </span>
                    </div>
                </div>

                {/* Box Share Bar */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider">
                        <span>
                            P1 Boxes: <b>{p1Boxes}</b> ({p1BoxPct}%)
                        </span>
                        <span>
                            P2 Boxes: <b>{p2Boxes}</b> ({100 - p1BoxPct}%)
                        </span>
                    </div>
                    <div className="h-4 w-full rounded-full border-2 border-border bg-surface overflow-hidden flex shadow-brutal-sm">
                        <div
                            style={{ width: `${p1BoxPct}%` }}
                            className="bg-player-one h-full transition-all duration-500"
                        />
                        <div
                            style={{ width: `${100 - p1BoxPct}%` }}
                            className="bg-player-two h-full transition-all duration-500"
                        />
                    </div>
                </div>

                {/* Scoring metrics row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center">
                    <div className="rounded-xl border-2 border-border bg-surface p-3 shadow-brutal-sm">
                        <span className="text-[11px] font-bold uppercase text-muted-foreground block">
                            P1 Avg Score
                        </span>
                        <span className="text-base sm:text-lg font-black text-foreground">
                            {formatAverage(p1Boxes, totalLocalGames)}
                        </span>
                    </div>
                    <div className="rounded-xl border-2 border-border bg-surface p-3 shadow-brutal-sm">
                        <span className="text-[11px] font-bold uppercase text-muted-foreground block">
                            P2 Avg Score
                        </span>
                        <span className="text-base sm:text-lg font-black text-foreground">
                            {formatAverage(p2Boxes, totalLocalGames)}
                        </span>
                    </div>
                    <div className="rounded-xl border-2 border-border bg-surface p-3 shadow-brutal-sm">
                        <span className="text-[11px] font-bold uppercase text-muted-foreground block">
                            P1 High Score
                        </span>
                        <span className="text-base sm:text-lg font-black text-foreground">
                            {p1HighScore}
                        </span>
                    </div>
                    <div className="rounded-xl border-2 border-border bg-surface p-3 shadow-brutal-sm">
                        <span className="text-[11px] font-bold uppercase text-muted-foreground block">
                            P2 High Score
                        </span>
                        <span className="text-base sm:text-lg font-black text-foreground">
                            {p2HighScore}
                        </span>
                    </div>
                </div>

                {/* Victory Differential Card */}
                <div className="rounded-xl border-2 border-border bg-surface-elevated p-4 flex items-center justify-between shadow-brutal-sm">
                    <div>
                        <span className="text-xs font-black uppercase text-muted-foreground block">
                            Average Victory Margin
                        </span>
                        <span className="text-lg font-black text-foreground">
                            {avgMargin} boxes per decisive match
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="text-xs font-black uppercase text-muted-foreground block">
                            Score Differential
                        </span>
                        <span className="text-lg font-black text-foreground">
                            {Math.abs(p1Boxes - p2Boxes)} total boxes
                        </span>
                    </div>
                </div>
            </Card>
        </div>
    );
}

/* ========================================================================= */
/* TAB 4: PLAYERS & AI PROFILES                                              */
/* ========================================================================= */

function ProfilesTab({
    stats,
    vsAi,
    local,
    p1HighScore,
    p2HighScore,
    aiHighScore,
}: {
    stats: StatisticsState;
    vsAi: StatisticsState["vsAi"];
    local: StatisticsState["local"];
    p1HighScore: number;
    p2HighScore: number;
    aiHighScore: number;
}) {
    const p1TotalBoxes = vsAi.humanBoxesClaimed + local.p1TotalBoxes;
    const p1WinRate =
        stats.gamesPlayed > 0 ? (stats.wins / stats.gamesPlayed) * 100 : 0;

    const p2Games = local.gamesPlayed;
    const p2WinRate = p2Games > 0 ? (local.p2Wins / p2Games) * 100 : 0;

    const aiGames = vsAi.gamesPlayed;
    const aiWinRate = aiGames > 0 ? (vsAi.aiWins / aiGames) * 100 : 0;

    return (
        <div className="flex flex-col gap-5 animate-card-spring">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                {/* Profile 1: Player 1 (You) */}
                <ProfileCard
                    title="Player 1"
                    subtitle="Primary Player / Human"
                    accentColor="border-player-one bg-player-one-soft"
                    badge="User Profile"
                    avatar={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="size-7"
                        >
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                    }
                    stats={[
                        { label: "Total Matches", value: stats.gamesPlayed },
                        {
                            label: "Record (W-L-D)",
                            value: `${stats.wins} - ${stats.losses} - ${stats.draws}`,
                        },
                        {
                            label: "Win Rate",
                            value: `${Math.round(p1WinRate)}%`,
                        },
                        { label: "Total Boxes Scored", value: p1TotalBoxes },
                        {
                            label: "Avg Score / Match",
                            value: formatAverage(
                                p1TotalBoxes,
                                stats.gamesPlayed,
                            ),
                        },
                        { label: "Single Match Best", value: p1HighScore },
                        {
                            label: "Current Streak",
                            value: `${stats.currentStreak} wins`,
                        },
                        {
                            label: "Best Win Streak",
                            value: `${stats.longestStreak} wins`,
                        },
                    ]}
                />

                {/* Profile 2: Player 2 (Local Rival) */}
                <ProfileCard
                    title="Player 2"
                    subtitle="Local Challenger"
                    accentColor="border-player-two bg-player-two-soft"
                    badge="Local 2P"
                    avatar={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="size-7"
                        >
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                        </svg>
                    }
                    stats={[
                        { label: "Local Matches", value: p2Games },
                        {
                            label: "Record (W-L-D)",
                            value: `${local.p2Wins} - ${local.p1Wins} - ${local.draws}`,
                        },
                        {
                            label: "Win Rate",
                            value: `${Math.round(p2WinRate)}%`,
                        },
                        {
                            label: "Total Boxes Scored",
                            value: local.p2TotalBoxes,
                        },
                        {
                            label: "Avg Score / Match",
                            value: formatAverage(local.p2TotalBoxes, p2Games),
                        },
                        { label: "Single Match Best", value: p2HighScore },
                        {
                            label: "Dominance vs P1",
                            value:
                                local.p2Wins >= local.p1Wins
                                    ? `+${local.p2Wins - local.p1Wins}`
                                    : `-${local.p1Wins - local.p2Wins}`,
                        },
                    ]}
                />

                {/* Profile 3: AI / Computer */}
                <ProfileCard
                    title="Computer AI"
                    subtitle="Virtual Bot Opponent"
                    accentColor="border-border bg-warning/20"
                    badge="5 Difficulties"
                    avatar={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="size-7"
                        >
                            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.38-1 1.72V7h4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h4V5.72c-.6-.34-1-.98-1-1.72a2 2 0 0 1 2-2m-3 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m-6 5h6v1H9v-1z" />
                        </svg>
                    }
                    stats={[
                        { label: "AI Matches", value: aiGames },
                        {
                            label: "Record (W-L-D)",
                            value: `${vsAi.aiWins} - ${vsAi.humanWins} - ${vsAi.draws}`,
                        },
                        {
                            label: "AI Win Rate",
                            value: `${Math.round(aiWinRate)}%`,
                        },
                        {
                            label: "Total Boxes Claimed",
                            value: vsAi.aiBoxesClaimed,
                        },
                        {
                            label: "Avg Boxes / Match",
                            value: formatAverage(vsAi.aiBoxesClaimed, aiGames),
                        },
                        { label: "Single Match Best", value: aiHighScore },
                        {
                            label: "Human Dominance",
                            value:
                                vsAi.humanWins >= vsAi.aiWins
                                    ? `+${vsAi.humanWins - vsAi.aiWins} Human`
                                    : `+${vsAi.aiWins - vsAi.humanWins} AI`,
                        },
                    ]}
                />
            </div>
        </div>
    );
}

function ProfileCard({
    title,
    subtitle,
    accentColor,
    badge,
    avatar,
    stats,
}: {
    title: string;
    subtitle: string;
    accentColor: string;
    badge: string;
    avatar: ReactNode;
    stats: Array<{ label: string; value: string | number }>;
}) {
    return (
        <Card className="p-5 flex flex-col justify-between gap-4 border-2 border-border shadow-brutal">
            <div>
                <div className="flex items-center justify-between mb-3">
                    <div
                        className={cn(
                            "size-12 rounded-2xl border-2 border-border flex items-center justify-center shadow-brutal-sm text-foreground",
                            accentColor,
                        )}
                    >
                        {avatar}
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-border bg-surface shadow-brutal-sm">
                        {badge}
                    </span>
                </div>

                <h3 className="text-lg font-black uppercase tracking-wide">
                    {title}
                </h3>
                <p className="text-xs font-semibold text-muted-foreground">
                    {subtitle}
                </p>
            </div>

            <div className="flex flex-col divide-y-2 divide-border/10 border-t-2 border-border/10 pt-2">
                {stats.map((item) => (
                    <div
                        key={item.label}
                        className="flex items-center justify-between py-2 text-xs"
                    >
                        <span className="font-bold text-muted-foreground">
                            {item.label}
                        </span>
                        <span className="font-black text-foreground">
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>
        </Card>
    );
}

/* ========================================================================= */
/* TAB 5: MATCH HISTORY                                                      */
/* ========================================================================= */

function MatchHistoryTab({
    matches,
    totalMatchesCount,
    modeFilter,
    onModeFilterChange,
    outcomeFilter,
    onOutcomeFilterChange,
}: {
    matches: MatchRecord[];
    totalMatchesCount: number;
    modeFilter: "all" | "ai" | "local";
    onModeFilterChange: (mode: "all" | "ai" | "local") => void;
    outcomeFilter: "all" | "win" | "loss" | "draw";
    onOutcomeFilterChange: (outcome: "all" | "win" | "loss" | "draw") => void;
}) {
    return (
        <div className="flex flex-col gap-4 animate-card-spring">
            {/* Filter Controls Card */}
            <Card className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-2 border-border">
                {/* Mode Filter */}
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                        Filter by Mode
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <FilterButton
                            active={modeFilter === "all"}
                            onClick={() => onModeFilterChange("all")}
                            label="All"
                        />
                        <FilterButton
                            active={modeFilter === "ai"}
                            onClick={() => onModeFilterChange("ai")}
                            label="Vs AI"
                        />
                        <FilterButton
                            active={modeFilter === "local"}
                            onClick={() => onModeFilterChange("local")}
                            label="Local 2P"
                        />
                    </div>
                </div>

                {/* Outcome Filter */}
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                        Filter by Result
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <FilterButton
                            active={outcomeFilter === "all"}
                            onClick={() => onOutcomeFilterChange("all")}
                            label="All"
                        />
                        <FilterButton
                            active={outcomeFilter === "win"}
                            onClick={() => onOutcomeFilterChange("win")}
                            label="Wins (P1)"
                        />
                        <FilterButton
                            active={outcomeFilter === "loss"}
                            onClick={() => onOutcomeFilterChange("loss")}
                            label="Losses"
                        />
                        <FilterButton
                            active={outcomeFilter === "draw"}
                            onClick={() => onOutcomeFilterChange("draw")}
                            label="Draws"
                        />
                    </div>
                </div>
            </Card>

            {/* Match List */}
            {matches.length === 0 ? (
                <Card className="p-8 text-center flex flex-col items-center justify-center gap-3">
                    <div className="size-12 rounded-xl border-2 border-border bg-surface-elevated flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="size-6 text-muted-foreground"
                        >
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-base font-black uppercase">
                            No Matching Matches
                        </h3>
                        <p className="text-xs font-semibold text-muted-foreground mt-1">
                            {totalMatchesCount === 0
                                ? "No games have been recorded yet. Play a game to see it here!"
                                : "No matches match the selected filters. Try changing your filters."}
                        </p>
                    </div>
                    {(modeFilter !== "all" || outcomeFilter !== "all") && (
                        <Button
                            variant="secondary"
                            onClick={() => {
                                onModeFilterChange("all");
                                onOutcomeFilterChange("all");
                            }}
                            className="text-xs px-3 py-1.5 mt-2"
                        >
                            Clear Filters
                        </Button>
                    )}
                </Card>
            ) : (
                <div className="flex flex-col gap-3">
                    {matches.map((match) => (
                        <MatchRecordCard key={match.id} match={match} />
                    ))}
                </div>
            )}
        </div>
    );
}

function FilterButton({
    active,
    onClick,
    label,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "px-3 py-1.5 rounded-lg border-2 border-border text-xs font-black uppercase tracking-wider transition-all duration-200 ease-spring active:translate-x-0.5 active:translate-y-0.5 focus:outline-none",
                active
                    ? "bg-player-one text-foreground shadow-brutal-sm"
                    : "bg-surface text-muted-foreground hover:bg-surface-elevated hover:text-foreground",
            )}
        >
            {label}
        </button>
    );
}

function MatchRecordCard({ match }: { match: MatchRecord }) {
    const { formatted, relative } = formatTimestamp(match.timestamp);
    const p1Score = match.playerOne.score;
    const p2Score = match.playerTwo.score;
    const isP1Win = match.winner === "p1";
    const isP2Win = match.winner === "p2";
    const isDraw = match.winner === "draw";

    const shapeLabel = SHAPE_LABELS[match.shape] ?? "Classic";

    return (
        <Card className="p-4 sm:p-5 flex flex-col gap-3 border-2 border-border shadow-brutal-sm hover:translate-x-0.5 transition-transform">
            {/* Match Header Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                        className={cn(
                            "px-2 py-0.5 rounded-md border border-border text-[10px] font-black uppercase shadow-brutal-sm",
                            match.mode === "ai"
                                ? "bg-player-one text-foreground"
                                : "bg-player-two text-foreground",
                        )}
                    >
                        {match.mode === "ai" ? "VS AI" : "LOCAL 2P"}
                    </span>

                    {match.mode === "ai" && (
                        <span className="px-2 py-0.5 rounded-md border border-border bg-surface text-[10px] font-black uppercase">
                            {match.difficulty}
                        </span>
                    )}

                    <span className="px-2 py-0.5 rounded-md border border-border bg-surface text-[10px] font-semibold text-muted-foreground">
                        {match.boardSize}×{match.boardSize} {shapeLabel}
                    </span>
                </div>

                <div
                    className="text-xs text-muted-foreground font-semibold"
                    title={formatted}
                >
                    {relative} · {formatted}
                </div>
            </div>

            {/* Scoreboard Arena */}
            <div className="grid grid-cols-3 items-center gap-2 rounded-xl border-2 border-border bg-surface-elevated p-3 text-center shadow-brutal-sm">
                {/* Player 1 */}
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1">
                        <span className="text-xs sm:text-sm font-black uppercase text-player-one truncate max-w-[100px] sm:max-w-none">
                            {match.playerOne.name || "Player 1"}
                        </span>
                        {isP1Win && (
                            <span
                                title="Winner"
                                className="text-xs"
                                aria-label="Winner"
                            >
                                👑
                            </span>
                        )}
                    </div>
                    <span
                        className={cn(
                            "text-2xl sm:text-3xl font-black mt-0.5",
                            isP1Win ? "text-foreground" : "text-muted-foreground",
                        )}
                    >
                        {p1Score}
                    </span>
                </div>

                {/* Versus / Outcome Pill */}
                <div className="flex flex-col items-center justify-center">
                    <span
                        className={cn(
                            "px-2.5 py-0.5 rounded-full border-2 border-border text-[11px] font-black uppercase shadow-brutal-sm",
                            isP1Win && "bg-success text-foreground",
                            isP2Win && "bg-danger text-foreground",
                            isDraw && "bg-warning text-foreground",
                        )}
                    >
                        {isDraw
                            ? "DRAW"
                            : match.mode === "ai"
                              ? isP1Win
                                  ? "VICTORY"
                                  : "DEFEAT"
                              : isP1Win
                                ? `${match.playerOne.name} WON`
                                : `${match.playerTwo.name} WON`}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground mt-1">
                        {p1Score + p2Score} Total Boxes
                    </span>
                </div>

                {/* Player 2 / AI */}
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1">
                        <span className="text-xs sm:text-sm font-black uppercase text-player-two truncate max-w-[100px] sm:max-w-none">
                            {match.playerTwo.name ||
                                (match.mode === "ai" ? "Computer" : "Player 2")}
                        </span>
                        {isP2Win && (
                            <span
                                title="Winner"
                                className="text-xs"
                                aria-label="Winner"
                            >
                                👑
                            </span>
                        )}
                    </div>
                    <span
                        className={cn(
                            "text-2xl sm:text-3xl font-black mt-0.5",
                            isP2Win ? "text-foreground" : "text-muted-foreground",
                        )}
                    >
                        {p2Score}
                    </span>
                </div>
            </div>
        </Card>
    );
}

/* ========================================================================= */
/* METRIC CARD HELPER                                                        */
/* ========================================================================= */

function MetricCard({
    label,
    value,
    subtext,
    color,
    icon,
}: {
    label: string;
    value: string | number;
    subtext: string;
    color: string;
    icon: ReactNode;
}) {
    return (
        <Card className="p-4 sm:p-5 flex flex-col justify-between gap-3 border-2 border-border shadow-brutal">
            <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    {label}
                </span>
                <div
                    className={cn(
                        "size-8 rounded-xl border-2 border-border flex items-center justify-center shadow-brutal-sm text-foreground",
                        color,
                    )}
                >
                    {icon}
                </div>
            </div>
            <div>
                <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                    {value}
                </span>
                <p className="text-[11px] font-bold text-muted-foreground mt-0.5">
                    {subtext}
                </p>
            </div>
        </Card>
    );
}

