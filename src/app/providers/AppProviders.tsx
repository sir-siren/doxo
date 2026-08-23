import { Provider } from "react-redux";
import type { ReactNode } from "react";
import { store } from "@/app/store/store";

export function AppProviders({ children }: { readonly children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
}
