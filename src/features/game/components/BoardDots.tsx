import { memo } from "react";
import type { BoardDimensions, Edge, EdgeId } from "@/features/game/types/game.types";
import { edgeCoordinates, type BoardGeometry } from "../hooks/useGameBoard";

interface BoardDotsProps {
    dimensions: BoardDimensions;
    geometry: BoardGeometry;
    edges?: Record<EdgeId, Edge>;
    onDotClick?: () => void;
}

function BoardDotsInner({
    dimensions,
    geometry,
    edges,
    onDotClick,
}: BoardDotsProps) {
    const hitRadius = Math.max(geometry.dotRadius + 8, 16);

    if (geometry.shape === "hex" && edges) {
        const uniqueVertices = new Map<string, { cx: number; cy: number }>();
        for (const edge of Object.values(edges)) {
            const coords = edgeCoordinates(edge, geometry);
            const k1 = `${Math.round(coords.x1)},${Math.round(coords.y1)}`;
            const k2 = `${Math.round(coords.x2)},${Math.round(coords.y2)}`;
            uniqueVertices.set(k1, { cx: coords.x1, cy: coords.y1 });
            uniqueVertices.set(k2, { cx: coords.x2, cy: coords.y2 });
        }

        return (
            <g>
                {Array.from(uniqueVertices.entries()).map(([key, pt]) => (
                    <g
                        key={`dot-hex-${key}`}
                        className="cursor-pointer"
                        role="button"
                        aria-label="Dot node"
                        tabIndex={-1}
                        onClick={() => onDotClick?.()}
                    >
                        <circle
                            cx={pt.cx}
                            cy={pt.cy}
                            r={hitRadius}
                            className="fill-transparent"
                        />
                        <circle
                            cx={pt.cx}
                            cy={pt.cy}
                            r={geometry.dotRadius}
                            className="fill-foreground pointer-events-none"
                        />
                    </g>
                ))}
            </g>
        );
    }

    const dots: React.ReactNode[] = [];
    for (let row = 0; row <= dimensions.rows; row += 1) {
        for (let col = 0; col <= dimensions.cols; col += 1) {
            const cx = geometry.padding + col * geometry.cellSize;
            const cy = geometry.padding + row * geometry.cellSize;
            dots.push(
                <g
                    key={`d-${row}-${col}`}
                    className="cursor-pointer"
                    role="button"
                    aria-label="Dot node"
                    tabIndex={-1}
                    onClick={() => onDotClick?.()}
                >
                    <circle
                        cx={cx}
                        cy={cy}
                        r={hitRadius}
                        className="fill-transparent"
                    />
                    <circle
                        cx={cx}
                        cy={cy}
                        r={geometry.dotRadius}
                        className="fill-foreground pointer-events-none"
                    />
                </g>,
            );
        }
    }
    return <g>{dots}</g>;
}

export const BoardDots = memo(BoardDotsInner);

