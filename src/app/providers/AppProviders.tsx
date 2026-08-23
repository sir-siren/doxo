import { Provider } from "react-redux";
import { useEffect, type ReactNode } from "react";
import { store } from "@/app/store/store";
import { useAppSelector } from "@/app/store/hooks";

function ThemeSync({ children }: { readonly children: ReactNode }) {
    const theme = useAppSelector((state) => state.settings.theme);
    const motion = useAppSelector((state) => state.settings.reducedMotionOverride);

    useEffect(() => {
        if (typeof document !== "undefined") {
            document.documentElement.setAttribute("data-theme", theme);
            document.documentElement.setAttribute("data-reduced-motion", motion);
        }
    }, [theme, motion]);

    return <>{children}</>;
}

export function AppProviders({ children }: { readonly children: ReactNode }) {
    return (
        <Provider store={store}>
            <ThemeSync>{children}</ThemeSync>
        </Provider>
    );
}
