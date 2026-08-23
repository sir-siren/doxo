import { useMemo } from "react";
import type {
    GameState,
    EdgeId,
    PlayerId,
} from "@/features/game/types/game.types";

export interface BoardGeometry {
    size: number;
    cellSize: number;
    dotRadius: number;
    edgeStrokeWidth: number;
    padding: number;
}

const MIN_CELL = 32;
const MAX_BOARD = 960;

export function useGameBoard(
    state: GameState,
    containerWidth: number,
): BoardGeometry {
    return useMemo(() => {
        const { cols } = state.dimensions;
        const availableWidth = containerWidth > 0 ? containerWidth : 640;
        const cellFromWidth = availableWidth / (cols + 1);
        const cellSize = Math.max(
            MIN_CELL,
            Math.min(MAX_BOARD / (cols + 1), cellFromWidth),
        );
        const size = cellSize * (cols + 1);
        return {
            size,
            cellSize,
            dotRadius: Math.max(4, Math.min(10, cellSize * 0.085)),
            edgeStrokeWidth: Math.max(5, Math.min(12, cellSize * 0.13)),
            padding: cellSize / 2,
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
    edgeId: EdgeId,
    geometry: BoardGeometry,
): EdgeCoordinates {
    const parts = edgeId.split("-");
    const orientation = parts[0];
    const row = Number(parts[1]);
    const col = Number(parts[2]);
    if (
        (orientation !== "H" && orientation !== "V") ||
        Number.isNaN(row) ||
        Number.isNaN(col)
    ) {
        throw new Error(`Invalid edge id: ${edgeId}`);
    }
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
    return {
        cx: p + col * geometry.cellSize + geometry.cellSize / 2,
        cy: p + row * geometry.cellSize + geometry.cellSize / 2,
    };
}

export function playerEdgeClass(owner: PlayerId | null): string {
    if (owner === "p1") return "stroke-player-one";
    if (owner === "p2") return "stroke-player-two";
    return "stroke-border/15";
}
