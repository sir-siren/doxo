import type {
    BoardDimensions,
    BoardShape,
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
    edgeIds?: EdgeId[];
}): EdgeId[] => {
    if (box.edgeIds && box.edgeIds.length > 0) {
        return box.edgeIds;
    }
    return [
        horizontalEdgeId(box.row, box.col),
        horizontalEdgeId(box.row + 1, box.col),
        verticalEdgeId(box.row, box.col),
        verticalEdgeId(box.row, box.col + 1),
    ];
};

const buildEdge = (
    id: EdgeId,
    orientation: Orientation,
    row: number,
    col: number,
    coords?: { x1: number; y1: number; x2: number; y2: number },
): Edge => ({
    id,
    orientation,
    row,
    col,
    owner: null,
    ...(coords ?? {}),
});

function isBoxInShape(row: number, col: number, dimensions: BoardDimensions): boolean {
    const shape: BoardShape = dimensions.shape ?? "rectangle";
    if (shape === "rectangle" || shape === "hex") {
        return true;
    }
    if (shape === "triangle") {
        // Lower-left triangle: row + col < rows
        return row + col < dimensions.rows;
    }
    if (shape === "l-shape") {
        // Exclude upper-right quadrant
        const cutRow = Math.ceil(dimensions.rows / 2);
        const cutCol = Math.floor(dimensions.cols / 2);
        return !(row < cutRow && col >= cutCol);
    }
    return true;
}

function createSquareBoard(dimensions: BoardDimensions): {
    edges: Record<EdgeId, Edge>;
    boxes: Record<string, Box>;
} {
    const boxes: Record<string, Box> = {};
    const activeEdgeIds = new Set<EdgeId>();

    for (let row = 0; row < dimensions.rows; row += 1) {
        for (let col = 0; col < dimensions.cols; col += 1) {
            if (isBoxInShape(row, col, dimensions)) {
                const key = boxKey(row, col);
                const edgesOfBox: EdgeId[] = [
                    horizontalEdgeId(row, col),
                    horizontalEdgeId(row + 1, col),
                    verticalEdgeId(row, col),
                    verticalEdgeId(row, col + 1),
                ];
                boxes[key] = { row, col, owner: null, edgeIds: edgesOfBox };
                for (const edgeId of edgesOfBox) {
                    activeEdgeIds.add(edgeId);
                }
            }
        }
    }

    const edges: Record<EdgeId, Edge> = {};
    for (let row = 0; row <= dimensions.rows; row += 1) {
        for (let col = 0; col < dimensions.cols; col += 1) {
            const id = horizontalEdgeId(row, col);
            if (activeEdgeIds.has(id)) {
                edges[id] = buildEdge(id, "horizontal", row, col);
            }
        }
    }
    for (let row = 0; row < dimensions.rows; row += 1) {
        for (let col = 0; col <= dimensions.cols; col += 1) {
            const id = verticalEdgeId(row, col);
            if (activeEdgeIds.has(id)) {
                edges[id] = buildEdge(id, "vertical", row, col);
            }
        }
    }

    return { edges, boxes };
}

function createHexBoard(dimensions: BoardDimensions): {
    edges: Record<EdgeId, Edge>;
    boxes: Record<string, Box>;
} {
    const boxes: Record<string, Box> = {};
    const edges: Record<EdgeId, Edge> = {};

    const R = 1.0;
    const SQRT3 = Math.sqrt(3);

    for (let row = 0; row < dimensions.rows; row += 1) {
        for (let col = 0; col < dimensions.cols; col += 1) {
            const cx = (col + (row % 2) * 0.5 + 0.8) * SQRT3 * R;
            const cy = (row * 1.5 + 1.0) * R;

            const vertIds: string[] = [];
            const vertCoords: Array<{ x: number; y: number }> = [];

            for (let i = 0; i < 6; i += 1) {
                const angleDeg = 30 + 60 * i;
                const angleRad = (Math.PI / 180) * angleDeg;
                const vx = Math.round((cx + R * Math.cos(angleRad)) * 1000) / 1000;
                const vy = Math.round((cy + R * Math.sin(angleRad)) * 1000) / 1000;
                vertCoords.push({ x: vx, y: vy });
                vertIds.push(`(${vx},${vy})`);
            }

            const boxEdgeIds: EdgeId[] = [];
            for (let i = 0; i < 6; i += 1) {
                const v1 = vertIds[i]!;
                const v2 = vertIds[(i + 1) % 6]!;
                const c1 = vertCoords[i]!;
                const c2 = vertCoords[(i + 1) % 6]!;

                const [startV, endV, startC, endC] =
                    v1 < v2 ? [v1, v2, c1, c2] : [v2, v1, c2, c1];

                const edgeId: EdgeId = `HEX_${startV}_${endV}`;
                boxEdgeIds.push(edgeId);

                if (!edges[edgeId]) {
                    const orientation: Orientation =
                        i % 3 === 0 ? "hex-0" : i % 3 === 1 ? "hex-1" : "hex-2";
                    edges[edgeId] = buildEdge(edgeId, orientation, row, col, {
                        x1: startC.x,
                        y1: startC.y,
                        x2: endC.x,
                        y2: endC.y,
                    });
                }
            }

            boxes[boxKey(row, col)] = {
                row,
                col,
                owner: null,
                edgeIds: boxEdgeIds,
            };
        }
    }

    return { edges, boxes };
}

export function createBoard(dimensions: BoardDimensions): {
    edges: Record<EdgeId, Edge>;
    boxes: Record<string, Box>;
} {
    if (dimensions.shape === "hex") {
        return createHexBoard(dimensions);
    }
    return createSquareBoard(dimensions);
}
