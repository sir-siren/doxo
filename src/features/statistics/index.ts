export {
    recordGameResult,
    resetStatistics,
    setStatisticsState,
    initialStatisticsState,
    initialStatisticsSummary,
    deriveStatisticsFromMatches,
    calculateStreaks,
    emptyDifficultyTally,
    emptyTallies,
    emptyVsAiStats,
    emptyLocalStats,
    emptyProfileStats,
} from "./state/statistics.slice";
export type {
    DifficultyTally,
    GameMode,
    GameOutcome,
    GameResult,
    LocalStats,
    MatchRecord,
    MatchWinner,
    PlayerProfileStats,
    PlayerSummary,
    RecordGamePayload,
    StatisticsState,
    StatisticsSummary,
    StatisticsTab,
    VsAiStats,
} from "./state/statistics.types";


