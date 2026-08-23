import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "@/app/App";

describe("full game flow", () => {
    it("welcome → setup → play a move on the board", () => {
        render(<App />);

        // Welcome screen
        expect(screen.getByText(/claim the lines/i)).toBeDefined();
        fireEvent.click(screen.getByRole("button", { name: "Play" }));

        // Setup screen
        expect(screen.getByText(/new game/i)).toBeDefined();
        fireEvent.click(screen.getByRole("button", { name: /start game/i }));

        // Game screen: board renders and first edge is claimable
        const board = screen.getByRole("group", {
            name: /doxo board/i,
        });
        expect(board).toBeDefined();

        const edge = screen.getByRole("button", {
            name: /claim horizontal edge row 1, column 1/i,
        });
        fireEvent.click(edge);
        expect(
            screen.queryByRole("button", {
                name: /claim horizontal edge row 1, column 1/i,
            }),
        ).toBeNull();
    });
});
