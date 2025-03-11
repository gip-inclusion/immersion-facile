import { type TypedUseSelectorHook, useSelector } from "react-redux";
import type { RootState } from "src/core-logic/storeConfig/store";

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
