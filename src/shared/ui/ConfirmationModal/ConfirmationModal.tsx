import type { ReactNode } from "react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { cn } from "@/shared/lib/cn";

export interface ConfirmationModalProps {
    /** Controls modal visibility */
    open: boolean;
    /** Header title */
    title: string;
    /** Primary explanation or confirmation question */
    message: ReactNode;
    /** Optional destructive / irreversible warning text */
    warning?: string;
    /** Text for the destructive / confirmation button (default: "Confirm") */
    confirmLabel?: string;
    /** Text for the safe cancel button (default: "Cancel") */
    cancelLabel?: string;
    /** Variant for the confirmation action (default: "danger") */
    variant?: "danger" | "primary" | "secondary";
    /** Visual icon style (default: "danger") */
    icon?: "danger" | "warning" | "info" | "none";
    /** Handler triggered on confirming the action */
    onConfirm: () => void;
    /** Handler triggered on dismissing / canceling */
    onClose: () => void;
    /** Optional loading state disabling buttons */
    isLoading?: boolean;
}

export function ConfirmationModal({
    open,
    title,
    message,
    warning,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "danger",
    icon = "danger",
    onConfirm,
    onClose,
    isLoading = false,
}: ConfirmationModalProps) {
    return (
        <Modal
            open={open}
            title={title}
            onClose={onClose}
            showCloseButton={false}
        >
            <div className="flex flex-col gap-4">
                {/* Outlined Icon & Message block */}
                <div className="flex items-start gap-3.5">
                    {icon !== "none" && (
                        <div
                            className={cn(
                                "flex size-10 shrink-0 items-center justify-center rounded-xl border-2 border-border shadow-brutal-sm",
                                icon === "danger"
                                    ? "bg-danger text-foreground"
                                    : icon === "warning"
                                      ? "bg-warning text-foreground"
                                      : "bg-player-one text-foreground",
                            )}
                            aria-hidden="true"
                        >
                            {icon === "danger" ? (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="size-5"
                                >
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                            ) : icon === "warning" ? (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="size-5"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                            ) : (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="size-5"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                            )}
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground leading-relaxed">
                            {message}
                        </div>
                    </div>
                </div>

                {/* Warning Callout Box (if provided) */}
                {warning && (
                    <div className="rounded-xl border-2 border-border bg-danger/15 p-3 flex gap-2.5 items-start">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="size-4 text-foreground shrink-0 mt-0.5"
                            aria-hidden="true"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <div className="text-xs font-semibold text-foreground leading-normal">
                            <span className="font-bold uppercase tracking-wider block text-foreground">
                                Permanent Action Warning
                            </span>
                            <p className="mt-0.5 text-muted-foreground font-medium">
                                {warning}
                            </p>
                        </div>
                    </div>
                )}

                {/* Single Cohesive Action Row: Cancel (Safe default) & Confirm (Destructive/Action) */}
                <div className="mt-2 flex flex-col-reverse sm:flex-row gap-2.5">
                    <Button
                        variant="secondary"
                        fullWidth
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={variant}
                        fullWidth
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
