import { describe, expect, it } from "vitest";

import { createBoard } from "@/features/game/engine/board-factory";
import { detectCompletedBoxes } from "@/features/game/engine/box-detector";
import type { EdgeId, PlayerId } from "@/features/game/types/game.types";

const claimEdges = (
    dimensions: { rows: number; cols: number },
    edgeIds: EdgeId[],
    player: PlayerId,
): Pick<ReturnType<typeof createBoard>, "edges" | "boxes"> => {
    const board = createBoard(dimensions);
    const edges = { ...board.edges };
    for (const id of edgeIds) {
        const edge = edges[id];
        if (!edge) throw new Error(`unknown edge ${id}`);
        edges[id] = { ...edge, owner: player };
    }
    return { edges, boxes: board.boxes };
};

describe("detectCompletedBoxes", () => {
    it("returns nothing when no box is complete", () => {
        const board = claimEdges({ rows: 2, cols: 2 }, ["H-0-0"], "p1");
        expect(detectCompletedBoxes(board, "V-0-0")).toEqual([]);
    });

    it("detects a box completed by its last edge", () => {
        // Box (0,0) needs only its right side V-0-1.
        const board = claimEdges(
            { rows: 2, cols: 2 },
            ["H-0-0", "H-1-0", "V-0-0"],
            "p1",
        );
        expect(detectCompletedBoxes(board, "V-0-1")).toEqual(["0-0"]);
    });

    it("detects double-box completion from one shared interior edge", () => {
        // Boxes (0,0) and (0,1) share vertical edge V-0-1; each has its other
        // three sides claimed.
        const claimed = [
            "H-0-0",
            "H-1-0",
            "V-0-0", // box (0,0) minus V-0-1
            "H-0-1",
            "H-1-1",
            "V-0-2", // box (0,1) minus V-0-1
        ];
        const board = claimEdges({ rows: 2, cols: 3 }, claimed, "p2");
        expect(detectCompletedBoxes(board, "V-0-1")).toEqual(["0-0", "0-1"]);
    });
});
