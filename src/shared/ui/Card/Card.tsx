import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface CardProps {
    children: ReactNode;
    className?: string;
}

export function Card({ children, className }: CardProps) {
    return (
        <div
            className={cn(
                "rounded-2xl border-2 border-border bg-surface shadow-brutal transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                className,
            )}
        >
            {children}
        </div>
    );
}
