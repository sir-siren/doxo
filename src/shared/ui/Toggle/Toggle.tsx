import { cn } from "@/shared/lib/cn";

interface ToggleProps {
    id?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
}

export function Toggle({
    id,
    checked,
    onChange,
    disabled = false,
    className,
}: ToggleProps) {
    return (
        <button
            id={id}
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn(
                // Track: perfectly centered knob via flex, symmetric padding
                "group relative flex h-8 w-14 shrink-0 items-center overflow-hidden rounded-full border-2 border-border bg-surface-elevated p-1",
                "focus-visible:outline-offset-4",
                "transition-all duration-300 ease-spring active:scale-95 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50",
                disabled && "cursor-not-allowed opacity-50",
                className,
            )}
        >
            {/* Active track background fade layer */}
            <span
                aria-hidden="true"
                className={cn(
                    "absolute inset-0 bg-player-one transition-opacity duration-300 ease-in-out",
                    checked ? "opacity-100" : "opacity-0",
                )}
            />

            {/* Knob: spring overshoot on travel + squash on press */}
            <span
                aria-hidden="true"
                className={cn(
                    "relative flex size-5 items-center justify-center rounded-full border-2 border-border bg-surface shadow-brutal-sm",
                    "transition-transform duration-300 ease-spring",
                    "group-active:scale-x-90 group-active:scale-y-110",
                    checked ? "translate-x-6" : "translate-x-0",
                )}
            >
                {/* Inner indicator dot/accent */}
                <span
                    aria-hidden="true"
                    className={cn(
                        "size-1.5 rounded-full bg-player-one transition-all duration-300 ease-spring",
                        checked ? "scale-100 opacity-100" : "scale-0 opacity-0",
                    )}
                />
            </span>
        </button>
    );
}
