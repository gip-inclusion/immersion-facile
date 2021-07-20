import type { TypedUseSelectorHook } from "react-redux";
import { useSelector } from "react-redux";
import type { RootState } from "src/core-logic/store/rootReducer";

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
