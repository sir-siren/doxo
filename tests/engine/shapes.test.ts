import { describe, expect, it } from "vitest";
import { createBoard, boxEdges } from "@/features/game/engine/board-factory";
import { detectCompletedBoxes } from "@/features/game/engine/box-detector";
import {
    applyMove,
    createGame,
    getValidMoves,
} from "@/features/game/engine/game-engine";
import type { Player } from "@/features/game/types/game.types";

const players: [Player, Player] = [
    { id: "p1", name: "P1", kind: "human" },
    { id: "p2", name: "P2", kind: "human" },
];

describe("board shapes", () => {
    it("creates standard rectangle board by default", () => {
        const board = createBoard({ rows: 3, cols: 3, shape: "rectangle" });
        expect(Object.keys(board.boxes).length).toBe(9);
        expect(Object.keys(board.edges).length).toBe(24);
    });

    it("creates triangle shaped board with masked boxes and edges", () => {
        // In a 3x3 triangle: (0,0), (0,1), (0,2), (1,0), (1,1), (2,0) = 6 boxes
        const board = createBoard({ rows: 3, cols: 3, shape: "triangle" });
        expect(Object.keys(board.boxes).length).toBe(6);
        expect(board.boxes["0-0"]).toBeDefined();
        expect(board.boxes["2-2"]).toBeUndefined();
    });

    it("detects completed boxes correctly on triangle board", () => {
        let state = createGame(
            { rows: 3, cols: 3, shape: "triangle" },
            players,
        );
        state = applyMove(state, { edgeId: "H-0-0", player: "p1" }).state;
        state = applyMove(state, { edgeId: "H-1-0", player: "p2" }).state;
        state = applyMove(state, { edgeId: "V-0-0", player: "p1" }).state;

        const completed = detectCompletedBoxes(
            { edges: state.edges, boxes: state.boxes },
            "V-0-1",
        );
        expect(completed).toContain("0-0");
    });

    it("creates L-shaped board excluding top-right quadrant", () => {
        const board = createBoard({ rows: 4, cols: 4, shape: "l-shape" });
        // Excludes row < 2 and col >= 2 (4 boxes excluded out of 16 -> 12 boxes)
        expect(Object.keys(board.boxes).length).toBe(12);
        expect(board.boxes["0-0"]).toBeDefined();
        expect(board.boxes["0-3"]).toBeUndefined();
        expect(board.boxes["1-3"]).toBeUndefined();
        expect(board.boxes["3-3"]).toBeDefined();
    });

    it("creates hex board where each hex box has 6 edges", () => {
        const board = createBoard({ rows: 2, cols: 2, shape: "hex" });
        expect(Object.keys(board.boxes).length).toBe(4);

        for (const box of Object.values(board.boxes)) {
            const sides = boxEdges(box);
            expect(sides.length).toBe(6);
            for (const edgeId of sides) {
                expect(board.edges[edgeId]).toBeDefined();
            }
        }
    });

    it("handles moves and box completion on hex board", () => {
        let state = createGame({ rows: 2, cols: 2, shape: "hex" }, players);
        const validMoves = getValidMoves(state);
        expect(validMoves.length).toBeGreaterThan(0);

        const firstBox = state.boxes["0-0"];
        expect(firstBox).toBeDefined();
        const sides = boxEdges(firstBox!);
        expect(sides.length).toBe(6);

        // Claim 5 edges of the hex box
        for (let i = 0; i < 5; i += 1) {
            state = applyMove(state, { edgeId: sides[i]!, player: "p1" }).state;
        }

        // 6th edge completes the hex box!
        const result = applyMove(state, { edgeId: sides[5]!, player: "p1" });
        expect(result.scored).toBe(true);
        expect(result.completedBoxes).toContain("0-0");
        expect(result.state.scores.p1).toBe(1);
    });
});
