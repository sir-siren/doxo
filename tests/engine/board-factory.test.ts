import { describe, expect, it } from "vitest";

import {
    boxEdges,
    boxKey,
    createBoard,
    horizontalEdgeId,
    verticalEdgeId,
} from "@/features/game/engine/board-factory";
import type { BoardDimensions } from "@/features/game/types/game.types";

const countEdges = (
    edges: ReturnType<typeof createBoard>["edges"],
    orientation: "horizontal" | "vertical",
): number =>
    Object.values(edges).filter((e) => e.orientation === orientation).length;

describe("edge id helpers", () => {
    it("formats horizontal and vertical ids", () => {
        expect(horizontalEdgeId(0, 1)).toBe("H-0-1");
        expect(verticalEdgeId(2, 3)).toBe("V-2-3");
    });

    it("formats box keys", () => {
        expect(boxKey(1, 4)).toBe("1-4");
    });

    it("returns the four sides of a box", () => {
        expect(boxEdges({ row: 1, col: 2 })).toEqual([
            "H-1-2",
            "H-2-2",
            "V-1-2",
            "V-1-3",
        ]);
    });
});

describe.each([
    { dims: { rows: 2, cols: 2 } satisfies BoardDimensions },
    { dims: { rows: 3, cols: 5 } satisfies BoardDimensions },
])("createBoard($dims.rows x $dims.cols)", ({ dims }) => {
    const board = createBoard(dims);

    it("creates the right dot, edge, and box counts", () => {
        const total = Object.keys(board.edges).length;
        const horizontal = countEdges(board.edges, "horizontal");
        const vertical = countEdges(board.edges, "vertical");
        expect(horizontal).toBe((dims.rows + 1) * dims.cols);
        expect(vertical).toBe(dims.rows * (dims.cols + 1));
        expect(total).toBe(2 * dims.rows * dims.cols + dims.rows + dims.cols);
        expect(Object.keys(board.boxes).length).toBe(dims.rows * dims.cols);
        expect((dims.rows + 1) * (dims.cols + 1)).toBeGreaterThan(0);
    });

    it("creates unclaimed edges and boxes", () => {
        for (const edge of Object.values(board.edges)) {
            expect(edge.owner).toBeNull();
        }
        for (const box of Object.values(board.boxes)) {
            expect(box.owner).toBeNull();
        }
    });

    it("exposes every box side as a real edge", () => {
        for (const key of Object.keys(board.boxes)) {
            const [row, col] = key.split("-").map(Number) as [number, number];
            for (const edgeId of boxEdges({ row, col })) {
                expect(board.edges[edgeId]).toBeDefined();
            }
        }
    });
});
