import { useEffect, useRef, useState } from "react";
import type { GameState } from "@/features/game/types/game.types";
import { useGameBoard } from "../hooks/useGameBoard";
import { BoardDots } from "./BoardDots";
import { BoardBox } from "./BoardBox";
import { BoardEdge } from "./BoardEdge";

interface GameBoardProps {
    state: GameState;
    isPlayable: boolean;
    onSelectEdge: (edgeId: string) => void;
    onDotClick?: () => void;
}

export function GameBoard({
    state,
    isPlayable,
    onSelectEdge,
    onDotClick,
}: GameBoardProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const geometry = useGameBoard(state, containerWidth);

    useEffect(() => {
        const element = containerRef.current;
        if (element === null) return;
        const observer = new ResizeObserver((entries) => {
            const width = entries[0]?.contentRect.width;
            if (width !== undefined) setContainerWidth(width);
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    const edgeList = Object.values(state.edges);
    const boxList = Object.values(state.boxes);
    const currentPlayerName =
        state.currentPlayer === "p1"
            ? state.players[0]?.name
            : state.players[1]?.name;

    return (
        <div ref={containerRef} className="flex w-full items-center justify-center">
            <p className="sr-only" role="status" aria-live="polite">
                {state.status === "finished"
                    ? `Game over. Final score ${state.players[0]?.name}: ${state.scores.p1}, ${state.players[1]?.name}: ${state.scores.p2}.`
                    : `${currentPlayerName ?? "Current player"}'s turn. Score ${state.players[0]?.name}: ${state.scores.p1}, ${state.players[1]?.name}: ${state.scores.p2}.`}
            </p>
            <svg
                viewBox={`0 0 ${geometry.size} ${geometry.size}`}
                width="100%"
                role="group"
                aria-label={`Doxo board, ${state.dimensions.rows} by ${state.dimensions.cols}`}
                className="block w-full max-w-[min(82vh,860px)] h-auto mx-auto select-none"
                style={{ aspectRatio: "1 / 1" }}
            >
                {boxList.map((box) => (
                    <BoardBox
                        key={`box-${box.row}-${box.col}`}
                        row={box.row}
                        col={box.col}
                        owner={box.owner}
                        geometry={geometry}
                    />
                ))}
                {edgeList.map((edge) => (
                    <BoardEdge
                        key={edge.id}
                        edge={edge}
                        geometry={geometry}
                        isSelectable={
                            isPlayable &&
                            edge.owner === null &&
                            state.status === "playing"
                        }
                        currentPlayer={state.currentPlayer}
                        onSelect={onSelectEdge}
                    />
                ))}
                <BoardDots
                    dimensions={state.dimensions}
                    geometry={geometry}
                    onDotClick={onDotClick}
                />
            </svg>
        </div>
    );
}
