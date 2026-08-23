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
                "rounded-2xl border-2 border-border bg-surface shadow-brutal",
                className,
            )}
        >
            {children}
        </div>
    );
}
