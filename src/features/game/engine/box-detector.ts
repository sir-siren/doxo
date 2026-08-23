import { boxEdges, boxKey } from "@/features/game/engine/board-factory";
import type { EdgeId, Edge, GameState } from "@/features/game/types/game.types";

type EdgesAndBoxes = Pick<GameState, "edges" | "boxes">;

const isClaimed = (edges: EdgesAndBoxes["edges"], edgeId: EdgeId): boolean =>
    edges[edgeId]?.owner !== null && edges[edgeId] !== undefined;

const isBoxComplete = (
    state: EdgesAndBoxes,
    row: number,
    col: number,
    pendingEdgeId: EdgeId,
): boolean =>
    boxEdges({ row, col }).every(
        (edgeId) => edgeId === pendingEdgeId || isClaimed(state.edges, edgeId),
    );

export const detectCompletedBoxes = (
    state: EdgesAndBoxes,
    edgeId: EdgeId,
): string[] => {
    const edge: Edge | undefined = state.edges[edgeId];
    if (!edge) return [];
    const adjacent: [number, number][] =
        edge.orientation === "horizontal"
            ? [
                  [edge.row - 1, edge.col],
                  [edge.row, edge.col],
              ]
            : [
                  [edge.row, edge.col - 1],
                  [edge.row, edge.col],
              ];
    return adjacent
        .map(([row, col]) => boxKey(row, col))
        .filter((key) => key in state.boxes)
        .map((key) => key.split("-").map(Number))
        .filter(([row, col]) =>
            isBoxComplete(state, row ?? -1, col ?? -1, edgeId),
        )
        .map(([row, col]) => boxKey(row ?? -1, col ?? -1));
};
