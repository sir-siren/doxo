import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { StatisticsScreen } from "@/pages/statistics-screen/StatisticsScreen";
import { rootReducer } from "@/app/store/root-reducer";
import type { StatisticsState } from "@/features/statistics/state/statistics.types";
import {
    emptyTallies,
    initialStatisticsState,
} from "@/features/statistics/state/statistics.slice";

const mockFullStats: StatisticsState = {
    gamesPlayed: 10,
    wins: 6,
    losses: 3,
    draws: 1,
    winRate: 0.6,
    totalBoxesClaimed: 160,
    currentStreak: 2,
    longestStreak: 4,
    vsAi: {
        gamesPlayed: 6,
        humanWins: 4,
        aiWins: 2,
        draws: 0,
        humanBoxesClaimed: 55,
        aiBoxesClaimed: 41,
        currentStreak: 1,
        longestStreak: 3,
        byDifficulty: {
            ...emptyTallies(),
            easy: {
                gamesPlayed: 2,
                wins: 2,
                losses: 0,
                draws: 0,
                humanBoxes: 20,
                aiBoxes: 10,
            },
            medium: {
                gamesPlayed: 2,
                wins: 1,
                losses: 1,
                draws: 0,
                humanBoxes: 18,
                aiBoxes: 16,
            },
            hard: {
                gamesPlayed: 2,
                wins: 1,
                losses: 1,
                draws: 0,
                humanBoxes: 17,
                aiBoxes: 15,
            },
        },
    },
    local: {
        gamesPlayed: 4,
        p1Wins: 2,
        p2Wins: 1,
        draws: 1,
        p1TotalBoxes: 34,
        p2TotalBoxes: 30,
    },
    byDifficulty: {
        ...emptyTallies(),
        easy: {
            gamesPlayed: 2,
            wins: 2,
            losses: 0,
            draws: 0,
            humanBoxes: 20,
            aiBoxes: 10,
        },
        medium: {
            gamesPlayed: 2,
            wins: 1,
            losses: 1,
            draws: 0,
            humanBoxes: 18,
            aiBoxes: 16,
        },
        hard: {
            gamesPlayed: 2,
            wins: 1,
            losses: 1,
            draws: 0,
            humanBoxes: 17,
            aiBoxes: 15,
        },
    },
    recentMatches: [
        {
            id: "match-1",
            timestamp: Date.now() - 60000,
            mode: "ai",
            difficulty: "hard",
            shape: "rectangle",
            boardSize: 6,
            playerOne: { id: "p1", name: "You", score: 10, kind: "human" },
            playerTwo: { id: "p2", name: "Computer", score: 8, kind: "ai" },
            winner: "p1",
            winnerName: "You",
        },
        {
            id: "match-2",
            timestamp: Date.now() - 3600000,
            mode: "local",
            difficulty: "medium",
            shape: "hex",
            boardSize: 5,
            playerOne: { id: "p1", name: "Player 1", score: 6, kind: "human" },
            playerTwo: { id: "p2", name: "Player 2", score: 9, kind: "human" },
            winner: "p2",
            winnerName: "Player 2",
        },
    ],
};

function renderWithStore(
    ui: React.ReactElement,
    initialStats: StatisticsState = initialStatisticsState,
) {
    const store = configureStore({
        reducer: rootReducer,
        preloadedState: {
            statistics: initialStats,
        },
    });
    return render(<Provider store={store}>{ui}</Provider>);
}

describe("StatisticsScreen Component", () => {
    it("renders empty state when no games have been played", () => {
        renderWithStore(<StatisticsScreen statistics={initialStatisticsState} />);

        expect(screen.getByText(/no match records yet/i)).toBeDefined();
        expect(
            screen.getByText(/play a match against the ai or challenge a friend/i),
        ).toBeDefined();
    });

    it("renders Overview metrics correctly when stats exist", () => {
        renderWithStore(<StatisticsScreen statistics={mockFullStats} />);

        // Hero cards
        expect(screen.getByText("Games Played")).toBeDefined();
        expect(screen.getByText("10")).toBeDefined();
        expect(screen.getByText("Overall Win Rate")).toBeDefined();
        expect(screen.getByText("60%")).toBeDefined();
        expect(screen.getByText("Boxes Claimed")).toBeDefined();
        expect(screen.getByText("160")).toBeDefined();
        expect(screen.getByText("Win Streak")).toBeDefined();

        // Mode quick cards
        expect(screen.getByText("Player vs AI")).toBeDefined();
        expect(screen.getByText("Local 2-Player")).toBeDefined();
    });

    it("switches to Vs AI tab and shows difficulty breakdown", () => {
        renderWithStore(<StatisticsScreen statistics={mockFullStats} />);

        const vsAiTab = screen.getByRole("tab", { name: /vs ai/i });
        fireEvent.click(vsAiTab);

        expect(screen.getByText("Human vs Computer AI")).toBeDefined();
        expect(screen.getByText("Difficulty Breakdown")).toBeDefined();
        expect(screen.getByText("Easy")).toBeDefined();
        expect(screen.getByText("Medium")).toBeDefined();
        expect(screen.getByText("Hard")).toBeDefined();
        expect(screen.getByText("Insane")).toBeDefined();
        expect(screen.getByText("Adaptive")).toBeDefined();
    });

    it("switches to Local 2-Player tab and shows rivalry data", () => {
        renderWithStore(<StatisticsScreen statistics={mockFullStats} />);

        const localTab = screen.getByRole("tab", { name: /local 2p/i });
        fireEvent.click(localTab);

        expect(screen.getByText("Player 1 vs Player 2")).toBeDefined();
        expect(screen.getByText(/average victory margin/i)).toBeDefined();
    });

    it("switches to Profiles tab and shows all 3 profile cards", () => {
        renderWithStore(<StatisticsScreen statistics={mockFullStats} />);

        const profilesTab = screen.getByRole("tab", { name: /profiles/i });
        fireEvent.click(profilesTab);

        expect(screen.getByText("Player 1")).toBeDefined();
        expect(screen.getByText("Primary Player / Human")).toBeDefined();
        expect(screen.getByText("Player 2")).toBeDefined();
        expect(screen.getByText("Local Challenger")).toBeDefined();
        expect(screen.getByText("Computer AI")).toBeDefined();
        expect(screen.getByText("Virtual Bot Opponent")).toBeDefined();
    });

    it("switches to History tab and displays match cards with filters", () => {
        renderWithStore(<StatisticsScreen statistics={mockFullStats} />);

        const historyTab = screen.getByRole("tab", { name: /history/i });
        fireEvent.click(historyTab);

        expect(screen.getByText("Filter by Mode")).toBeDefined();
        expect(screen.getByText("Filter by Result")).toBeDefined();
        expect(screen.getByText("VS AI")).toBeDefined();
        expect(screen.getByText("LOCAL 2P")).toBeDefined();

        // Filter by Vs AI only
        const vsAiFilter = screen.getByRole("button", { name: "Vs AI" });
        fireEvent.click(vsAiFilter);

        expect(screen.getByText("VS AI")).toBeDefined();
        expect(screen.queryByText("LOCAL 2P")).toBeNull();
    });

    it("opens Reset Statistics modal on click and confirms reset", () => {
        const onReset = vi.fn();
        renderWithStore(
            <StatisticsScreen statistics={mockFullStats} onReset={onReset} />,
        );

        const resetBtn = screen.getByRole("button", {
            name: /reset all statistics/i,
        });
        fireEvent.click(resetBtn);

        // Modal opens
        expect(screen.getByText("Permanent Action Warning")).toBeDefined();

        const confirmBtn = screen.getByRole("button", {
            name: /yes, reset everything/i,
        });
        fireEvent.click(confirmBtn);

        expect(onReset).toHaveBeenCalledTimes(1);
    });

    it("calls onBack when back button is clicked", () => {
        const onBack = vi.fn();
        renderWithStore(
            <StatisticsScreen statistics={mockFullStats} onBack={onBack} />,
        );

        const backBtn = screen.getByRole("button", {
            name: /return to previous screen/i,
        });
        fireEvent.click(backBtn);

        expect(onBack).toHaveBeenCalledTimes(1);
    });
});
