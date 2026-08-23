import { memo } from "react";
import type { BoardGeometry } from "../hooks/useGameBoard";

interface BoardDotsProps {
    dimensions: { rows: number; cols: number };
    geometry: BoardGeometry;
    onDotClick?: () => void;
}

function BoardDotsInner({ dimensions, geometry, onDotClick }: BoardDotsProps) {
    const dots: React.ReactNode[] = [];
    const hitRadius = Math.max(geometry.dotRadius + 8, 16);

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
