export type PlayerId = "p1" | "p2";

export type PlayerKind = "human" | "ai";

export type Difficulty = "easy" | "medium" | "hard";

export type GameStatus = "idle" | "playing" | "finished";

export type Orientation = "horizontal" | "vertical";

export type EdgeId = string;

export interface Edge {
    id: EdgeId;
    orientation: Orientation;
    row: number;
    col: number;
    owner: PlayerId | null;
}

export interface Box {
    row: number;
    col: number;
    owner: PlayerId | null;
}

export interface Player {
    id: PlayerId;
    name: string;
    kind: PlayerKind;
    difficulty?: Difficulty;
}

export interface BoardDimensions {
    rows: number;
    cols: number;
}

export interface Move {
    edgeId: EdgeId;
    player: PlayerId;
}

export interface GameState {
    dimensions: BoardDimensions;
    edges: Record<EdgeId, Edge>;
    boxes: Record<string, Box>;
    players: [Player, Player];
    currentPlayer: PlayerId;
    scores: Record<PlayerId, number>;
    moveHistory: Move[];
    status: GameStatus;
    winner: PlayerId | "draw" | null;
}

export interface ApplyMoveResult {
    state: GameState;
    completedBoxes: string[];
    scored: boolean;
}

