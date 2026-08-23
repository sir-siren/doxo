import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, AppStore } from "./store";
import type { RootState } from "./root-reducer";

export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();

export const useAppSelector = <TSelected>(
    selector: (state: RootState) => TSelected,
): TSelected => useSelector<RootState, TSelected>(selector);

export type { AppStore };
