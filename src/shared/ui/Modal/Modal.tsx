import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/shared/ui/Button";

interface ModalProps {
    open: boolean;
    title: string;
    onClose: () => void;
    children: ReactNode;
    showCloseButton?: boolean;
    footer?: ReactNode;
}

export function Modal({
    open,
    title,
    onClose,
    children,
    showCloseButton = true,
    footer,
}: ModalProps) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    });

    useEffect(() => {
        if (!open) return;

        const originalOverflow = document.body.style.overflow;
        const originalPaddingRight = document.body.style.paddingRight;

        const scrollbarWidth =
            window.innerWidth - document.documentElement.clientWidth;

        if (scrollbarWidth > 0) {
            const computedPadding = window.getComputedStyle(
                document.body,
            ).paddingRight;
            const currentPaddingNum = parseFloat(computedPadding) || 0;
            document.body.style.paddingRight = `${currentPaddingNum + scrollbarWidth}px`;
        }

        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.paddingRight = originalPaddingRight;
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key === "Escape") {
                onCloseRef.current();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        dialogRef.current?.focus();

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 overflow-y-auto bg-foreground/40 backdrop-blur-[2px] p-4 sm:p-6 transition-opacity duration-200"
            onClick={() => onCloseRef.current()}
            role="presentation"
        >
            <div className="flex min-h-full items-center justify-center">
                <div
                    ref={dialogRef}
                    role="dialog"
                    aria-modal="true"
                    aria-label={title}
                    tabIndex={-1}
                    className="animate-modal-pop my-auto w-full max-w-sm rounded-2xl border-2 border-border bg-surface p-6 pb-7 shadow-brutal focus:outline-none sm:p-7 sm:pb-8"
                    onClick={(event) => event.stopPropagation()}
                >
                    <h2 className="mb-4 text-xl font-black uppercase tracking-wide text-foreground">
                        {title}
                    </h2>
                    <div className="max-h-[min(70dvh,32rem)] overflow-y-auto p-1 -m-1">
                        {children}
                    </div>
                    {footer !== undefined ? (
                        <div className="mt-6 flex justify-end">{footer}</div>
                    ) : showCloseButton ? (
                        <div className="mt-6 flex justify-end">
                            <Button
                                variant="secondary"
                                onClick={() => onCloseRef.current()}
                            >
                                Close
                            </Button>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
