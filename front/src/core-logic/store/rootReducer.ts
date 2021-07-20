import { combineReducers } from "@reduxjs/toolkit";
import { todoSlice } from "src/core-logic/useCases/todoSlice";

export const rootReducer = combineReducers({
  [todoSlice.name]: todoSlice.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;
