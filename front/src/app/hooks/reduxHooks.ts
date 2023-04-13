import { TypedUseSelectorHook, useSelector } from "react-redux";

import { RootState } from "src/core-logic/storeConfig/store";

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
