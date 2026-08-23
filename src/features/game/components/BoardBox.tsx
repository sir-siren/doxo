import { memo } from "react";
import type { PlayerId } from "@/features/game/types/game.types";
import { boxCenter, hexPolygonPoints, type BoardGeometry } from "../hooks/useGameBoard";

interface BoardBoxProps {
    row: number;
    col: number;
    owner: PlayerId | null;
    geometry: BoardGeometry;
}

const OWNER_FILL: Record<PlayerId, string> = {
    p1: "fill-player-one-soft",
    p2: "fill-player-two-soft",
};

const OWNER_TEXT: Record<PlayerId, string> = {
    p1: "fill-foreground/70",
    p2: "fill-foreground/70",
};

function BoardBoxInner({ row, col, owner, geometry }: BoardBoxProps) {
    if (owner === null) return null;
    const { cx, cy } = boxCenter(row, col, geometry);

    return (
        <g
            aria-label={`Box row ${row + 1} column ${col + 1}, owned by ${owner === "p1" ? "Player 1" : "Player 2"}`}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
            className="animate-box-spring"
        >
            {geometry.shape === "hex" ? (
                <polygon
                    points={hexPolygonPoints(row, col, geometry)}
                    className={OWNER_FILL[owner]}
                />
            ) : (
                (() => {
                    const x = geometry.padding + col * geometry.cellSize;
                    const y = geometry.padding + row * geometry.cellSize;
                    const inset = geometry.cellSize * 0.06;
                    return (
                        <rect
                            x={x + inset}
                            y={y + inset}
                            width={geometry.cellSize - inset * 2}
                            height={geometry.cellSize - inset * 2}
                            rx={Math.max(6, geometry.cellSize * 0.12)}
                            className={OWNER_FILL[owner]}
                        />
                    );
                })()
            )}
            <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                className={`${OWNER_TEXT[owner]} select-none font-black animate-badge-pop`}
                fontSize={Math.max(13, geometry.cellSize * 0.32)}
            >
                {owner === "p1" ? "P1" : "P2"}
            </text>
        </g>
    );
}

export const BoardBox = memo(BoardBoxInner);
