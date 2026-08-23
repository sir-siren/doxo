import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { ConfirmationModal } from "@/shared/ui/ConfirmationModal";
import { SettingsScreen } from "@/pages/settings-screen/SettingsScreen";
import settingsReducer from "@/features/settings/state/settings.slice";
import statisticsReducer from "@/features/statistics/state/statistics.slice";

describe("ConfirmationModal UI/UX Component", () => {
    it("renders with exactly one cancel button and one confirm button", () => {
        const onConfirm = vi.fn();
        const onClose = vi.fn();

        render(
            <ConfirmationModal
                open={true}
                title="Reset Statistics"
                message="Are you sure you want to reset?"
                warning="This action cannot be reversed."
                confirmLabel="Yes, Reset"
                cancelLabel="Keep Data"
                variant="danger"
                onConfirm={onConfirm}
                onClose={onClose}
            />,
        );

        // Exactly 2 action buttons in the modal (no duplicate 'Close' button)
        const buttons = screen.getAllByRole("button");
        expect(buttons).toHaveLength(2);

        expect(screen.getByRole("button", { name: /keep data/i })).toBeDefined();
        expect(screen.getByRole("button", { name: /yes, reset/i })).toBeDefined();
        expect(screen.queryByRole("button", { name: /^close$/i })).toBeNull();
    });

    it("triggers onConfirm when confirm button is clicked", () => {
        const onConfirm = vi.fn();
        const onClose = vi.fn();

        render(
            <ConfirmationModal
                open={true}
                title="Delete Item"
                message="Confirm deletion?"
                onConfirm={onConfirm}
                onClose={onClose}
            />,
        );

        const confirmBtn = screen.getByRole("button", { name: /confirm/i });
        fireEvent.click(confirmBtn);

        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onClose).not.toHaveBeenCalled();
    });

    it("triggers onClose when cancel button is clicked", () => {
        const onConfirm = vi.fn();
        const onClose = vi.fn();

        render(
            <ConfirmationModal
                open={true}
                title="Delete Item"
                message="Confirm deletion?"
                onConfirm={onConfirm}
                onClose={onClose}
            />,
        );

        const cancelBtn = screen.getByRole("button", { name: /cancel/i });
        fireEvent.click(cancelBtn);

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it("triggers onClose when Escape key is pressed", () => {
        const onConfirm = vi.fn();
        const onClose = vi.fn();

        render(
            <ConfirmationModal
                open={true}
                title="Delete Item"
                message="Confirm deletion?"
                onConfirm={onConfirm}
                onClose={onClose}
            />,
        );

        fireEvent.keyDown(document, { key: "Escape" });
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});

describe("SettingsScreen Confirmation Modals Integration", () => {
    const renderSettings = (propsOverride = {}) => {
        const store = configureStore({
            reducer: {
                settings: settingsReducer,
                statistics: statisticsReducer,
            },
        });

        const defaultProps = {
            theme: "default" as const,
            soundEnabled: true,
            hapticsEnabled: true,
            motion: "system" as const,
            onThemeChange: vi.fn(),
            onSoundChange: vi.fn(),
            onHapticsChange: vi.fn(),
            onMotionChange: vi.fn(),
            onResetSettings: vi.fn(),
            onResetStatistics: vi.fn(),
            onImportData: vi.fn(),
            onBack: vi.fn(),
            ...propsOverride,
        };

        return {
            ...render(
                <Provider store={store}>
                    <SettingsScreen {...defaultProps} />
                </Provider>,
            ),
            props: defaultProps,
        };
    };

    it("opens confirmation modal for Reset Statistics and triggers onResetStatistics", () => {
        const onResetStatistics = vi.fn();
        renderSettings({ onResetStatistics });

        const resetStatsBtn = screen.getByRole("button", {
            name: /reset statistics/i,
        });
        fireEvent.click(resetStatsBtn);

        // Modal is open with single Cancel and Reset Statistics buttons
        expect(screen.getByText("Are you sure you want to delete all statistics?")).toBeDefined();
        const dialog = screen.getByRole("dialog");
        const cancelBtn = within(dialog).getByRole("button", { name: /cancel/i });
        expect(cancelBtn).toBeDefined();

        const confirmBtn = within(dialog).getByRole("button", { name: /reset statistics/i });
        fireEvent.click(confirmBtn);

        expect(onResetStatistics).toHaveBeenCalledTimes(1);
    });

    it("opens confirmation modal for Reset All Settings and triggers onResetSettings", () => {
        const onResetSettings = vi.fn();
        renderSettings({ onResetSettings });

        const resetSettingsBtn = screen.getByRole("button", {
            name: /reset all settings/i,
        });
        fireEvent.click(resetSettingsBtn);

        expect(screen.getByText("Are you sure you want to restore default settings?")).toBeDefined();

        const dialog = screen.getByRole("dialog");
        const confirmBtn = within(dialog).getByRole("button", { name: /reset all settings/i });
        fireEvent.click(confirmBtn);

        expect(onResetSettings).toHaveBeenCalledTimes(1);
    });

    it("mounts backdrop as a portal on document.body covering viewport edge-to-edge", () => {
        render(
            <ConfirmationModal
                open={true}
                title="Full Viewport Test"
                message="Testing full screen backdrop overlay"
                onConfirm={vi.fn()}
                onClose={vi.fn()}
            />,
        );

        const presentationOverlay = document.body.querySelector(
            'div[role="presentation"]',
        );
        expect(presentationOverlay).not.toBeNull();
        expect(presentationOverlay?.className).toContain("fixed inset-0");
        expect(presentationOverlay?.className).toContain("bg-foreground/45");
    });
});

