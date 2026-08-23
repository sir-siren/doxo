import type {
    BoardDimensions,
    Box,
    Edge,
    EdgeId,
    Orientation,
} from "@/features/game/types/game.types";

export const horizontalEdgeId = (row: number, col: number): EdgeId =>
    `H-${row}-${col}`;

export const verticalEdgeId = (row: number, col: number): EdgeId =>
    `V-${row}-${col}`;

export const boxKey = (row: number, col: number): string => `${row}-${col}`;

export const boxEdges = (box: {
    row: number;
    col: number;
}): [EdgeId, EdgeId, EdgeId, EdgeId] => [
    horizontalEdgeId(box.row, box.col),
    horizontalEdgeId(box.row + 1, box.col),
    verticalEdgeId(box.row, box.col),
    verticalEdgeId(box.row, box.col + 1),
];

const buildEdge = (
    id: EdgeId,
    orientation: Orientation,
    row: number,
    col: number,
): Edge => ({
    id,
    orientation,
    row,
    col,
    owner: null,
});

export function createBoard(dimensions: BoardDimensions): {
    edges: Record<EdgeId, Edge>;
    boxes: Record<string, Box>;
} {
    const edges: Record<EdgeId, Edge> = {};
    for (let row = 0; row <= dimensions.rows; row += 1) {
        for (let col = 0; col < dimensions.cols; col += 1) {
            const id = horizontalEdgeId(row, col);
            edges[id] = buildEdge(id, "horizontal", row, col);
        }
    }
    for (let row = 0; row < dimensions.rows; row += 1) {
        for (let col = 0; col <= dimensions.cols; col += 1) {
            const id = verticalEdgeId(row, col);
            edges[id] = buildEdge(id, "vertical", row, col);
        }
    }
    const boxes: Record<string, { row: number; col: number; owner: null }> = {};
    for (let row = 0; row < dimensions.rows; row += 1) {
        for (let col = 0; col < dimensions.cols; col += 1) {
            boxes[boxKey(row, col)] = { row, col, owner: null };
        }
    }
    return { edges, boxes };
}
