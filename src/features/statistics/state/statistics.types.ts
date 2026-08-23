import type {
    BoardShape,
    Difficulty,
    Player,
    PlayerId,
} from "@/features/game/types/game.types";

/** Outcome of a single match from the perspective of Player 1 / Human */
export type GameOutcome = "win" | "loss" | "draw";

/** Game modes supported in Doxo */
export type GameMode = "local" | "ai";

/** Match winner identifier */
export type MatchWinner = "p1" | "p2" | "draw";

/** Active tab identifier for statistics view navigation */
export type StatisticsTab =
    | "overview"
    | "vs-ai"
    | "local"
    | "profiles"
    | "history";

/** Aggregated statistics per AI difficulty level */
export interface DifficultyTally {
    /** Total games played at this difficulty */
    gamesPlayed: number;
    /** Human wins against AI at this difficulty */
    wins: number;
    /** AI wins against human at this difficulty */
    losses: number;
    /** Draws at this difficulty */
    draws: number;
    /** Total boxes claimed by human at this difficulty */
    humanBoxes: number;
    /** Total boxes claimed by AI at this difficulty */
    aiBoxes: number;
    /** Win rate percentage between 0 and 1 */
    winRate?: number;
}

/** Snapshot of player information for match history records */
export interface PlayerSummary {
    /** Player identifier (p1 or p2) */
    id: PlayerId;
    /** Display name of the player */
    name: string;
    /** Final score (boxes claimed) in this match */
    score: number;
    /** Kind of player: human or AI */
    kind: "human" | "ai";
}

/** Complete record of a single finished match */
export interface MatchRecord {
    /** Unique match record ID */
    id: string;
    /** Epoch timestamp in milliseconds when the game completed */
    timestamp: number;
    /** Game mode: 'local' (2-player pass & play) or 'ai' (vs Computer) */
    mode: GameMode;
    /** Selected difficulty (applied in AI mode) */
    difficulty: Difficulty;
    /** Board shape played */
    shape: BoardShape;
    /** Board dimension (rows/cols) */
    boardSize: number;
    /** Player 1 snapshot */
    playerOne: PlayerSummary;
    /** Player 2 snapshot (Human in local mode, AI in vs-ai mode) */
    playerTwo: PlayerSummary;
    /** Outcome winner: 'p1', 'p2', or 'draw' */
    winner: MatchWinner;
    /** Display name of the winning player or 'Draw' */
    winnerName: string;
}

/** Detailed statistics for games played against AI */
export interface VsAiStats {
    /** Total games played against AI */
    gamesPlayed: number;
    /** Total human victories against AI */
    humanWins: number;
    /** Total AI victories against human */
    aiWins: number;
    /** Total draw matches against AI */
    draws: number;
    /** Human win rate against AI between 0 and 1 */
    humanWinRate?: number;
    /** AI win rate against human between 0 and 1 */
    aiWinRate?: number;
    /** Cumulative boxes claimed by human player */
    humanBoxesClaimed: number;
    /** Cumulative boxes claimed by AI */
    aiBoxesClaimed: number;
    /** Average score per match for human */
    humanAvgScore?: number;
    /** Average score per match for AI */
    aiAvgScore?: number;
    /** Single match highest score by human */
    humanHighScore?: number;
    /** Single match highest score by AI */
    aiHighScore?: number;
    /** Current consecutive human win streak against AI */
    currentStreak: number;
    /** Best consecutive human win streak against AI */
    longestStreak: number;
    /** Per-difficulty statistics breakdown */
    byDifficulty: Record<Difficulty, DifficultyTally>;
}

/** Detailed statistics for local pass & play games */
export interface LocalStats {
    /** Total local 2-player games played */
    gamesPlayed: number;
    /** Player 1 victories */
    p1Wins: number;
    /** Player 2 victories */
    p2Wins: number;
    /** Draw matches */
    draws: number;
    /** Player 1 win rate between 0 and 1 */
    p1WinRate?: number;
    /** Player 2 win rate between 0 and 1 */
    p2WinRate?: number;
    /** Cumulative boxes claimed by Player 1 */
    p1TotalBoxes: number;
    /** Cumulative boxes claimed by Player 2 */
    p2TotalBoxes: number;
    /** Average score per match for Player 1 */
    p1AvgScore?: number;
    /** Average score per match for Player 2 */
    p2AvgScore?: number;
    /** Single match highest score by Player 1 */
    p1HighScore?: number;
    /** Single match highest score by Player 2 */
    p2HighScore?: number;
    /** Average margin of victory in decisive matches */
    avgMargin?: number;
}

/** High-level summary stats computed for a specific player profile */
export interface PlayerProfileStats {
    /** Display name */
    name: string;
    /** Total games played */
    totalMatches: number;
    /** Total wins */
    wins: number;
    /** Total losses */
    losses: number;
    /** Total draws */
    draws: number;
    /** Win rate percentage between 0 and 1 */
    winRate: number;
    /** Cumulative boxes captured */
    totalBoxes: number;
    /** Average score per match */
    avgScore: number;
    /** Highest score in a single match */
    highScore: number;
    /** Current win streak */
    currentStreak: number;
    /** Best win streak */
    longestStreak: number;
    /** Win margin / dominance differential vs rival */
    dominanceDiff?: number;
}

/** Complete derived summary metrics structure */
export interface StatisticsSummary {
    /** Overall total matches played across all modes */
    gamesPlayed: number;
    /** Overall total wins (P1 wins across modes) */
    wins: number;
    /** Overall total losses (P2/AI wins across modes) */
    losses: number;
    /** Overall total draws */
    draws: number;
    /** Overall win rate between 0 and 1 */
    winRate: number;
    /** Overall total boxes captured by all players */
    totalBoxesClaimed: number;
    /** Current overall win streak */
    currentStreak: number;
    /** All-time longest overall win streak */
    longestStreak: number;

    /** Mode-specific breakdown for AI games */
    vsAi: VsAiStats;
    /** Mode-specific breakdown for local multiplayer games */
    local: LocalStats;

    /** Direct difficulty lookup (mirrored with vsAi.byDifficulty) */
    byDifficulty: Record<Difficulty, DifficultyTally>;

    /** Per-side individual player profile records */
    profiles?: {
        playerOne: PlayerProfileStats;
        playerTwo: PlayerProfileStats;
        ai: PlayerProfileStats;
    };
}

/** Top-level statistics state stored in Redux & localStorage */
export interface StatisticsState extends StatisticsSummary {
    /** Full history of matches in LIFO order (newest first) */
    recentMatches: MatchRecord[];
}

/** Rich payload dispatched when a game finishes */
export interface RecordGamePayload {
    /** Game mode played */
    mode: GameMode;
    /** AI difficulty setting (optional in local mode) */
    difficulty?: Difficulty;
    /** Board shape */
    shape?: BoardShape;
    /** Grid dimension */
    boardSize?: number;
    /** Player objects at time of game completion */
    players?: [Player, Player];
    /** Final score map per player */
    scores?: Record<PlayerId, number>;
    /** Match winner or 'draw' */
    winner: MatchWinner;
}

/** Legacy payload format retained for backward compatibility */
export interface GameResult {
    outcome: GameOutcome;
    difficulty?: Difficulty;
    boxesClaimedByHuman?: number;
}
