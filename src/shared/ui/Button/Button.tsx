import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
    primary: "bg-player-one text-foreground",
    secondary: "bg-surface text-foreground",
    ghost: "bg-transparent text-foreground border-transparent shadow-none",
    danger: "bg-danger text-foreground",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    fullWidth?: boolean;
}

export function Button({
    variant = "primary",
    fullWidth = false,
    className,
    type = "button",
    ...props
}: ButtonProps) {
    return (
        <button
            type={type}
            className={cn(
                "inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-border px-5 py-2 text-base font-bold uppercase tracking-wide shadow-brutal transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:scale-100 disabled:translate-x-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none focus:outline-none focus-visible:outline-none",
                VARIANT_CLASSES[variant],
                fullWidth && "w-full",
                className,
            )}
            {...props}
        />
    );
}
