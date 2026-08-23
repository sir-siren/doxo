import { memo } from "react";
import type { Edge, PlayerId } from "@/features/game/types/game.types";
import { edgePreviewClass } from "@/features/game/components/edge-preview";
import {
    edgeCoordinates,
    playerEdgeClass,
    type BoardGeometry,
} from "@/features/game/hooks/useGameBoard";

interface BoardEdgeProps {
    edge: Edge;
    geometry: BoardGeometry;
    isSelectable: boolean;
    currentPlayer: PlayerId;
    onSelect: (edgeId: string) => void;
}

function BoardEdgeInner({
    edge,
    geometry,
    isSelectable,
    currentPlayer,
    onSelect,
}: BoardEdgeProps) {
    const { x1, y1, x2, y2 } = edgeCoordinates(edge.id, geometry);
    const claimed = edge.owner !== null;
    const strokeClass = claimed
        ? playerEdgeClass(edge.owner)
        : edgePreviewClass(currentPlayer);
    const isHorizontal = edge.orientation === "horizontal";

    const hitWidth = isHorizontal
        ? geometry.cellSize
        : Math.max(32, geometry.edgeStrokeWidth + 24);
    const hitHeight = isHorizontal
        ? Math.max(32, geometry.edgeStrokeWidth + 24)
        : geometry.cellSize;

    const hitX = isHorizontal ? x1 : x1 - hitWidth / 2;
    const hitY = isHorizontal ? y1 - hitHeight / 2 : y1;
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    return (
        <g className={isSelectable ? "group" : ""}>
            <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className={
                    claimed
                        ? `${strokeClass} animate-edge-spring pointer-events-none`
                        : `${strokeClass} transition-all duration-200 opacity-20 group-hover:opacity-50 hover:opacity-50 pointer-events-none`
                }
                style={
                    claimed
                        ? { transformOrigin: `${midX}px ${midY}px` }
                        : undefined
                }
                strokeWidth={geometry.edgeStrokeWidth}
                strokeLinecap="round"
            />
            {!claimed && (
                <rect
                    x={hitX}
                    y={hitY}
                    width={hitWidth}
                    height={hitHeight}
                    rx={4}
                    className={
                        isSelectable
                            ? "fill-transparent cursor-pointer focus:outline-none"
                            : "fill-transparent pointer-events-none"
                    }
                    role={isSelectable ? "button" : undefined}
                    aria-label={`Claim ${isHorizontal ? "horizontal" : "vertical"} edge row ${edge.row + 1}, column ${edge.col + 1}`}
                    aria-disabled={!isSelectable}
                    tabIndex={isSelectable ? 0 : -1}
                    onClick={() => onSelect(edge.id)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onSelect(edge.id);
                        }
                    }}
                />
            )}
        </g>
    );
}

export const BoardEdge = memo(BoardEdgeInner);
