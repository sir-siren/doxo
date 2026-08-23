import { useMemo } from "react";
import type {
    GameState,
    EdgeId,
    PlayerId,
    Edge,
    BoardShape,
} from "@/features/game/types/game.types";

export interface BoardGeometry {
    size: number;
    cellSize: number;
    dotRadius: number;
    edgeStrokeWidth: number;
    padding: number;
    shape: BoardShape;
}

const MIN_CELL = 28;
const MAX_BOARD = 960;

export function useGameBoard(
    state: GameState,
    containerWidth: number,
): BoardGeometry {
    return useMemo(() => {
        const { cols } = state.dimensions;
        const shape = state.dimensions.shape ?? "rectangle";
        const availableWidth = containerWidth > 0 ? containerWidth : 640;
        const multiplier = shape === "hex" ? cols * 1.732 + 2 : cols + 1;
        const cellFromWidth = availableWidth / multiplier;
        const cellSize = Math.max(
            MIN_CELL,
            Math.min(MAX_BOARD / multiplier, cellFromWidth),
        );
        const size = cellSize * multiplier;
        return {
            size,
            cellSize,
            dotRadius: Math.max(3.5, Math.min(8, cellSize * 0.085)),
            edgeStrokeWidth: Math.max(4, Math.min(10, cellSize * 0.13)),
            padding: cellSize * 0.6,
            shape,
        };
    }, [state.dimensions, containerWidth]);
}

export interface EdgeCoordinates {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export function edgeCoordinates(
    edge: Edge | EdgeId,
    geometry: BoardGeometry,
    stateEdges?: Record<EdgeId, Edge>,
): EdgeCoordinates {
    const targetEdge: Edge | undefined =
        typeof edge === "string" ? stateEdges?.[edge] : edge;

    if (
        targetEdge &&
        targetEdge.x1 !== undefined &&
        targetEdge.y1 !== undefined &&
        targetEdge.x2 !== undefined &&
        targetEdge.y2 !== undefined
    ) {
        const p = geometry.padding;
        const s = geometry.cellSize;
        return {
            x1: p + targetEdge.x1 * s,
            y1: p + targetEdge.y1 * s,
            x2: p + targetEdge.x2 * s,
            y2: p + targetEdge.y2 * s,
        };
    }

    const edgeId = typeof edge === "string" ? edge : edge.id;
    const parts = edgeId.split("-");
    const orientation = parts[0];
    const row = Number(parts[1]);
    const col = Number(parts[2]);

    const p = geometry.padding;
    const x1 = p + col * geometry.cellSize;
    const y1 = p + row * geometry.cellSize;

    if (orientation === "H") {
        return { x1, y1, x2: x1 + geometry.cellSize, y2: y1 };
    }
    return { x1, y1, x2: x1, y2: y1 + geometry.cellSize };
}

export function boxCenter(
    row: number,
    col: number,
    geometry: BoardGeometry,
): { cx: number; cy: number } {
    const p = geometry.padding;
    if (geometry.shape === "hex") {
        const SQRT3 = Math.sqrt(3);
        return {
            cx: p + (col + (row % 2) * 0.5 + 0.8) * SQRT3 * geometry.cellSize,
            cy: p + (row * 1.5 + 1.0) * geometry.cellSize,
        };
    }
    return {
        cx: p + col * geometry.cellSize + geometry.cellSize / 2,
        cy: p + row * geometry.cellSize + geometry.cellSize / 2,
    };
}

export function hexPolygonPoints(
    row: number,
    col: number,
    geometry: BoardGeometry,
): string {
    const { cx, cy } = boxCenter(row, col, geometry);
    const R = geometry.cellSize * 0.92;
    const points: string[] = [];
    for (let i = 0; i < 6; i += 1) {
        const angleDeg = 30 + 60 * i;
        const angleRad = (Math.PI / 180) * angleDeg;
        const px = cx + R * Math.cos(angleRad);
        const py = cy + R * Math.sin(angleRad);
        points.push(`${px},${py}`);
    }
    return points.join(" ");
}

export function playerEdgeClass(owner: PlayerId | null): string {
    if (owner === "p1") return "stroke-player-one";
    if (owner === "p2") return "stroke-player-two";
    return "stroke-border/15";
}
