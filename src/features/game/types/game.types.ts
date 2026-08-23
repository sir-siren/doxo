export type PlayerId = "p1" | "p2";

export type PlayerKind = "human" | "ai";

export type Difficulty = "easy" | "medium" | "hard" | "insane" | "adaptive";

export type GameStatus = "idle" | "playing" | "finished";

export type BoardShape = "rectangle" | "triangle" | "l-shape" | "hex";

export type Orientation = "horizontal" | "vertical" | "hex-0" | "hex-1" | "hex-2";

export type EdgeId = string;

export interface Edge {
    id: EdgeId;
    orientation: Orientation;
    row: number;
    col: number;
    owner: PlayerId | null;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
}

export interface Box {
    row: number;
    col: number;
    owner: PlayerId | null;
    edgeIds?: EdgeId[];
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
    shape?: BoardShape;
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

