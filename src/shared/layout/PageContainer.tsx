import { cn } from "@/shared/lib/cn";

interface PageContainerProps {
    children: React.ReactNode;
    className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
    return (
        <div
            className={cn(
                "mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-6",
                className,
            )}
        >
            {children}
        </div>
    );
}
